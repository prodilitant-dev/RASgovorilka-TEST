// src/components/print/PrintView.js
import { createElement, clear, on } from '@utils/dom';
import { getActiveProfile } from '@state/actions';
import { getImageUrl } from '@services/imageService';
import { toast } from '@utils/toast';
import { Modal } from '@components/common/Modal/Modal';
import { logger } from '@utils/logger';
import { toPng } from 'html-to-image'; // <-- Новая библиотека
import JSZip from 'jszip';
import '@styles/components/print.css';

const SETTINGS_KEY = 'ras_print_settings';

const DEFAULT_SETTINGS = {
  grid: '4x5',
  cutLines: false,
  showLabels: true,
  font: 'system-ui',
  frame: 'black',
};

export function openPrintView(onClose) {
  const profile = getActiveProfile();
  if (!profile) return;

  const activeCategoryIds = new Set([profile.categories[0]?.id]);
  const deletedCardIds = new Set();
  let settings = { ...DEFAULT_SETTINGS };
  let resizeObserver = null;

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
  } catch (e) {
    logger.warn('Ошибка загрузки настроек', e);
  }

  const printView = createElement('div', { className: 'print-view-fullscreen' });
  document.body.appendChild(printView);
  document.body.style.overflow = 'hidden';

  const topBar = createElement('div', { className: 'categories-wrap' });
  const categoriesEl = createElement('div', { className: 'categories' });
  topBar.appendChild(categoriesEl);

  const scrollArea = createElement('div', { className: 'print-scroll-area' });
  const bottomBar = createElement('div', { className: 'print-bottom-bar' });

  printView.appendChild(topBar);
  printView.appendChild(scrollArea);
  printView.appendChild(bottomBar);

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      logger.warn('Не удалось сохранить настройки печати', e);
    }
  }

  function closeView() {
    if (resizeObserver) resizeObserver.disconnect();
    document.body.style.overflow = '';
    if (printView.parentNode) printView.parentNode.removeChild(printView);
    if (onClose) onClose();
  }

  function render() {
    renderTopBar();
    renderPages();
    renderBottomBar();
  }

  function renderTopBar() {
    clear(categoriesEl);

    profile.categories.forEach((cat) => {
      const isActive = activeCategoryIds.has(cat.id);
      const el = createElement('div', { className: `category ${isActive ? 'active' : ''}` });

      el.appendChild(createElement('span', { className: 'cat-name' }, cat.name));

      const toggle = createElement('label', {
        className: 'toggle-switch',
        style: 'margin-left: 8px; transform: scale(0.8); transform-origin: right center;',
      });
      const input = createElement('input', { type: 'checkbox', checked: isActive });
      toggle.appendChild(input);
      toggle.appendChild(createElement('span', { className: 'slider' }));

      on(input, 'change', (e) => {
        if (e.target.checked) {
          activeCategoryIds.add(cat.id);
          profile.cards[cat.id]?.forEach((c) => deletedCardIds.delete(c.id));
        } else {
          activeCategoryIds.delete(cat.id);
        }
        renderPages();
        renderTopBar();
      });

      el.appendChild(toggle);

      on(el, 'click', (e) => {
        if (e.target.closest('.toggle-switch')) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change'));
      });

      categoriesEl.appendChild(el);
    });
  }

  async function renderPages() {
    clear(scrollArea);

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    const cardsToPrint = [];
    profile.categories.forEach((cat) => {
      if (!activeCategoryIds.has(cat.id)) return;
      const cards = (profile.cards[cat.id] || []).filter(
        (c) => (c.imageId || c.imagePath) && !deletedCardIds.has(c.id)
      );
      cards.forEach((c) => cardsToPrint.push({ ...c, categoryName: cat.name }));
    });

    if (cardsToPrint.length === 0) {
      scrollArea.appendChild(
        createElement(
          'div',
          { style: 'text-align:center; padding:40px; color:#888; width:100%;' },
          'Нет карточек с картинками для печати'
        )
      );
      return;
    }

    const [cols, rows] = settings.grid.split('x').map(Number);
    const itemsPerPage = cols * rows;

    const groupedByCategory = {};
    cardsToPrint.forEach((card) => {
      if (!groupedByCategory[card.categoryName]) groupedByCategory[card.categoryName] = [];
      groupedByCategory[card.categoryName].push(card);
    });

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const scale = width / 794;
        const pageEl = entry.target.querySelector('.print-page');
        if (pageEl) {
          pageEl.style.transform = `scale(${scale})`;
        }
      }
    });

    for (const [catName, cards] of Object.entries(groupedByCategory)) {
      for (let i = 0; i < cards.length; i += itemsPerPage) {
        const pageCards = cards.slice(i, i + itemsPerPage);
        const pageEl = buildPageDOM(catName, pageCards, cols, rows, false);

        const wrapper = createElement('div', { className: 'print-page-wrapper' });
        wrapper.appendChild(pageEl);
        scrollArea.appendChild(wrapper);

        resizeObserver.observe(wrapper);
      }
    }

    const dbImages = scrollArea.querySelectorAll('img[data-img-id]');
    await Promise.all(
      Array.from(dbImages).map(async (img) => {
        const url = await getImageUrl(img.getAttribute('data-img-id'));
        if (url) img.src = url;
        else img.style.display = 'none';
      })
    );
  }

  function renderBottomBar() {
    clear(bottomBar);
    const btnBack = createElement('div', { className: 'btn btn-secondary' }, 'Вернуться');
    on(btnBack, 'click', closeView);
    const btnSettings = createElement('div', { className: 'btn btn-secondary' }, 'Настройки');
    on(btnSettings, 'click', openSettings);
    const btnExport = createElement(
      'div',
      { className: 'btn btn-primary' },
      '📦 Скачать PNG (ZIP)'
    );
    on(btnExport, 'click', generateZip);
    bottomBar.appendChild(btnBack);
    bottomBar.appendChild(btnSettings);
    bottomBar.appendChild(btnExport);
  }

  function buildPageDOM(categoryName, pageCards, cols, rows, isExport) {
    const page = createElement('div', { className: 'print-page' });
    page.style.fontFamily = settings.font;

    // Для экспорта жестко сбрасываем все трансформации и позиционирование
    if (isExport) {
      page.style.position = 'relative';
      page.style.transform = 'none';
      page.style.margin = '0';
      page.style.left = 'auto';
      page.style.top = 'auto';
    }

    const header = createElement('div', { className: 'print-header' });
    header.innerHTML = `<div class="print-logo">РАСговорилка</div>`;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 10');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('print-arch');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 0 10 Q 50 -5 100 10');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#888');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);
    header.appendChild(svg);

    header.appendChild(createElement('div', { className: 'print-category' }, categoryName));
    page.appendChild(header);

    const grid = createElement('div', { className: 'print-grid' });

    const gap = 16;
    const availableW = 794 - 40;
    const availableH = 1123 - 40 - 90 - 50;

    let cardW = (availableW - gap * (cols - 1)) / cols;
    let cardH = cardW * 1.25;
    const maxCardH = (availableH - gap * (rows - 1)) / rows;

    if (cardH > maxCardH) {
      cardH = maxCardH;
      cardW = cardH / 1.25;
    }

    grid.style.gridTemplateColumns = `repeat(${cols}, ${cardW}px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, ${cardH}px)`;
    grid.style.gap = `${gap}px`;

    pageCards.forEach((card) => {
      const cardEl = createElement('div', { className: 'print-card' });

      applyCardFrame(cardEl);

      if (settings.cutLines) {
        cardEl.style.borderRadius = '0';
        const cutLine = createElement('div', { className: 'print-cut-line' });
        cardEl.appendChild(cutLine);
      } else {
        cardEl.style.borderRadius = '12px';
      }

      applyCardContent(cardEl, card);

      if (!isExport) {
        const btnDel = createElement('div', { className: 'print-delete-btn' }, '✕');
        on(btnDel, 'click', (e) => {
          e.stopPropagation();
          deletedCardIds.add(card.id);
          renderPages();
        });
        cardEl.appendChild(btnDel);
      }

      grid.appendChild(cardEl);
    });

    page.appendChild(grid);

    const footer = createElement('div', { className: 'print-footer' });
    footer.innerHTML = `
      <div class="print-footer-line"></div>
      <div class="print-footer-text">https://prodilitant-dev.github.io/RASgovorilka</div>
    `;
    page.appendChild(footer);

    return page;
  }

  function applyCardFrame(cardEl) {
    if (settings.frame === 'black') cardEl.style.border = '1.5px solid #333';
    else if (settings.frame === 'gray') cardEl.style.border = '1.5px solid #888';
    else if (settings.frame === 'green') cardEl.style.border = '1.5px solid #4caf50';
    else if (settings.frame === 'dotted') cardEl.style.border = '2px dotted #777';
    else cardEl.style.border = 'none';
  }

  function applyCardContent(cardEl, card) {
    const imgWrap = createElement('div', { className: 'print-card-img' });
    if (card.imageId) {
      imgWrap.innerHTML = `<img src="" data-img-id="${card.imageId}" />`;
    } else if (card.imagePath) {
      const base = import.meta.env.BASE_URL || '/';
      imgWrap.innerHTML = `<img src="${base}${card.imagePath}" />`;
    }
    cardEl.appendChild(imgWrap);

    if (settings.showLabels && card.text) {
      const label = createElement('div', { className: 'print-card-label' });
      label.appendChild(document.createTextNode(card.text));
      cardEl.appendChild(label);
    }
  }

  function openSettings() {
    const modal = new Modal({
      title: 'Настройки печати',
      body: () => {
        const form = createElement('div', { className: 'print-settings-form' });
        const addRow = (label, content) => {
          const row = createElement('div', { className: 'print-setting-row' });
          row.appendChild(createElement('span', {}, label));
          row.appendChild(content);
          form.appendChild(row);
        };

        const gridOpts = createElement('div', { className: 'print-options-group' });
        ['2x2', '2x3', '3x4', '4x5', '5x6'].forEach((g) => {
          const btn = createElement(
            'div',
            { className: `btn btn-sm ${settings.grid === g ? 'btn-primary' : 'btn-secondary'}` },
            g.replace('x', ' × ')
          );
          on(btn, 'click', () => {
            settings.grid = g;
            saveSettings();
            modal.close();
            openSettings();
            renderPages();
          });
          gridOpts.appendChild(btn);
        });
        addRow('Сетка:', gridOpts);

        const cutToggle = createElement('label', { className: 'toggle-switch' });
        const cutInput = createElement('input', { type: 'checkbox', checked: settings.cutLines });
        cutToggle.appendChild(cutInput);
        cutToggle.appendChild(createElement('span', { className: 'slider' }));
        on(cutInput, 'change', (e) => {
          settings.cutLines = e.target.checked;
          saveSettings();
          renderPages();
        });
        addRow('Линии разреза:', cutToggle);

        const labelToggle = createElement('label', { className: 'toggle-switch' });
        const labelInput = createElement('input', {
          type: 'checkbox',
          checked: settings.showLabels,
        });
        labelToggle.appendChild(labelInput);
        labelToggle.appendChild(createElement('span', { className: 'slider' }));
        on(labelInput, 'change', (e) => {
          settings.showLabels = e.target.checked;
          saveSettings();
          renderPages();
        });
        addRow('Подписи:', labelToggle);

        const fontSelect = createElement('select', { className: 'print-select' });
        [
          { v: 'system-ui', l: 'Системный' },
          { v: 'Arial, sans-serif', l: 'Arial' },
          { v: '"Times New Roman", serif', l: 'Times New Roman' },
          { v: '"Courier New", monospace', l: 'Courier' },
        ].forEach((opt) =>
          fontSelect.appendChild(
            createElement('option', { value: opt.v, selected: settings.font === opt.v }, opt.l)
          )
        );
        on(fontSelect, 'change', (e) => {
          settings.font = e.target.value;
          saveSettings();
          renderPages();
        });
        addRow('Шрифт подписей:', fontSelect);

        const frameOpts = createElement('div', { className: 'print-options-group' });
        [
          { v: 'black', l: 'Черный' },
          { v: 'gray', l: 'Серый' },
          { v: 'green', l: 'Зеленый' },
          { v: 'dotted', l: 'Пунктир' },
          { v: 'none', l: 'Без рамки' },
        ].forEach((opt) => {
          const btn = createElement(
            'div',
            {
              className: `btn btn-sm ${settings.frame === opt.v ? 'btn-primary' : 'btn-secondary'}`,
            },
            opt.l
          );
          on(btn, 'click', () => {
            settings.frame = opt.v;
            saveSettings();
            modal.close();
            openSettings();
            renderPages();
          });
          frameOpts.appendChild(btn);
        });
        addRow('Цвет рамки:', frameOpts);

        return form;
      },
      buttons: [{ label: 'Готово', primary: true, action: () => modal.close() }],
    });
    modal.open();
  }

  async function generateZip() {
    toast('Готовим PNG...', 'info', 3000);

    const cardsToPrint = [];
    profile.categories.forEach((cat) => {
      if (!activeCategoryIds.has(cat.id)) return;
      const cards = (profile.cards[cat.id] || []).filter(
        (c) => (c.imageId || c.imagePath) && !deletedCardIds.has(c.id)
      );
      cards.forEach((c) => cardsToPrint.push({ ...c, categoryName: cat.name }));
    });

    if (cardsToPrint.length === 0) {
      toast('Нет карточек для печати', 'error');
      return;
    }

    const [cols, rows] = settings.grid.split('x').map(Number);
    const itemsPerPage = cols * rows;
    const groupedByCategory = {};
    cardsToPrint.forEach((card) => {
      if (!groupedByCategory[card.categoryName]) groupedByCategory[card.categoryName] = [];
      groupedByCategory[card.categoryName].push(card);
    });

    // Контейнер для захвата. Делаем его невидимым, но он находится в DOM.
    const hiddenContainer = createElement('div', {
      style:
        'position: fixed; top: 0; left: 0; width: 794px; z-index: -9999; opacity: 0; pointer-events: none;',
    });
    document.body.appendChild(hiddenContainer);

    const pages = [];
    for (const [catName, cards] of Object.entries(groupedByCategory)) {
      for (let i = 0; i < cards.length; i += itemsPerPage) {
        const pageCards = cards.slice(i, i + itemsPerPage);
        const pageEl = buildPageDOM(catName, pageCards, cols, rows, true);
        hiddenContainer.appendChild(pageEl);
        pages.push({ el: pageEl, name: catName });
      }
    }

    const dbImages = hiddenContainer.querySelectorAll('img[data-img-id]');
    await Promise.all(
      Array.from(dbImages).map(async (img) => {
        const url = await getImageUrl(img.getAttribute('data-img-id'));
        if (url) img.src = url;
        else img.style.display = 'none';
      })
    );

    const allImgs = hiddenContainer.querySelectorAll('img');
    await Promise.all(
      Array.from(allImgs).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
      })
    );

    if (document.fonts) {
      await document.fonts.ready;
    }
    // Небольшая пауза, чтобы браузер 100% пересчитал Grid-сетку
    await new Promise((r) => setTimeout(r, 300));

    try {
      const zip = new JSZip();

      for (let i = 0; i < pages.length; i++) {
        // html-to-image отрисовывает страницу идеально, 1:1 как в браузере
        const dataUrl = await toPng(pages[i].el, {
          pixelRatio: 2, // Аналог scale: 2 (высокое качество)
          backgroundColor: '#ffffff',
          style: {
            opacity: '1', // Перебиваем opacity: 0 у контейнера
            transform: 'none',
            margin: '0',
          },
        });

        // Переводим dataUrl в Blob для JSZip
        const res = await fetch(dataUrl);
        const blob = await res.blob();

        const safeCatName = pages[i].name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
        zip.file(`${safeCatName}_лист_${i + 1}.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RASgovorilka_печать_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast('PNG сохранены в ZIP!', 'success');
    } catch (e) {
      logger.error('ZIP error:', e);
      toast('Ошибка при создании архива', 'error');
    } finally {
      document.body.removeChild(hiddenContainer);
    }
  }

  render();
}
