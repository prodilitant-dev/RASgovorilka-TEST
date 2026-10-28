// src/components/print/PrintExportModal.js
import { Modal } from '@components/common/Modal/Modal';
import { createElement, on } from '@utils/dom';
import { getActiveProfile } from '@state/actions';
import { getImageUrl } from '@services/imageService';
import { toast } from '@utils/toast';
import { logger } from '@utils/logger';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function openPrintExport() {
  const profile = getActiveProfile();
  if (!profile) return;

  let selectedCategories = new Set(profile.categories.map((c) => c.id));
  let settings = { grid: '4x5', cutLines: false, showLabels: true };

  const modal = new Modal({
    title: 'Печать карточек',
    body: () => {
      const wrap = createElement('div', { style: 'display:flex; flex-direction:column; gap:16px; width:100%; max-height: 65vh; overflow-y: auto; padding-right: 4px;' });

      // 1. Категории
      wrap.appendChild(createElement('h4', { style: 'margin:0; font-size:16px;' }, 'Что печатаем:'));
      const catList = createElement('div', { style: 'display:flex; flex-direction:column; gap:8px;' });
      profile.categories.forEach((cat) => {
        const row = createElement('label', { style: 'display:flex; align-items:center; gap:10px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; cursor:pointer;' });
        const cb = createElement('input', { type: 'checkbox', checked: selectedCategories.has(cat.id) });
        on(cb, 'change', (e) => {
          if (e.target.checked) selectedCategories.add(cat.id);
          else selectedCategories.delete(cat.id);
        });
        row.appendChild(cb);
        row.appendChild(createElement('span', { style: 'font-weight:500;' }, cat.name));
        catList.appendChild(row);
      });
      wrap.appendChild(catList);

      // 2. Настройки
      wrap.appendChild(createElement('h4', { style: 'margin:10px 0 0; font-size:16px;' }, 'Настройки:'));
      
      const gridRow = createElement('div', { className: 'form-row' });
      gridRow.appendChild(createElement('label', {}, 'Размер сетки:'));
      const gridOptions = createElement('div', { style: 'display:flex; gap:8px;' });
      const grids = [{ id: '3x4', label: '3 × 4' }, { id: '4x5', label: '4 × 5' }, { id: '5x6', label: '5 × 6' }];
      
      grids.forEach(g => {
        const btn = createElement('div', { className: `category ${settings.grid === g.id ? 'active' : ''}` }, g.label);
        on(btn, 'click', () => {
          settings.grid = g.id;
          Array.from(gridOptions.children).forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
        });
        gridOptions.appendChild(btn);
      });
      gridRow.appendChild(gridOptions);
      wrap.appendChild(gridRow);

      const cutRow = createElement('div', { className: 'form-row', style: 'margin-top: 8px;' });
      cutRow.appendChild(createElement('label', {}, 'Линии разреза:'));
      const cutToggle = createElement('label', { className: 'toggle-switch' });
      const cutInput = createElement('input', { type: 'checkbox', checked: settings.cutLines });
      cutToggle.appendChild(cutInput); cutToggle.appendChild(createElement('span', { className: 'slider' }));
      on(cutInput, 'change', (e) => { settings.cutLines = e.target.checked; });
      cutRow.appendChild(cutToggle);
      wrap.appendChild(cutRow);

      const labelRow = createElement('div', { className: 'form-row', style: 'margin-top: 8px;' });
      labelRow.appendChild(createElement('label', {}, 'Подписи:'));
      const labelToggle = createElement('label', { className: 'toggle-switch' });
      const labelInput = createElement('input', { type: 'checkbox', checked: settings.showLabels });
      labelToggle.appendChild(labelInput); labelToggle.appendChild(createElement('span', { className: 'slider' }));
      on(labelInput, 'change', (e) => { settings.showLabels = e.target.checked; });
      labelRow.appendChild(labelToggle);
      wrap.appendChild(labelRow);

      return wrap;
    },
    buttons: [
      { label: 'Отмена', action: () => modal.close() },
      {
        label: '📄 Скачать PDF',
        primary: true,
        action: async () => {
          const cats = Array.from(selectedCategories);
          if (cats.length === 0) { toast('Выберите категорию', 'error'); return; }
          modal.close();
          await generatePDF(profile, cats, settings);
        },
      },
    ],
  });

  modal.open();
}

async function generatePDF(profile, categoriesToPrint, settings) {
  toast('Готовим PDF...', 'info', 3000);

  const hiddenContainer = document.createElement('div');
  hiddenContainer.className = 'print-generator-container';
  document.body.appendChild(hiddenContainer);

  const [cols, rows] = settings.grid.split('x').map(Number);
  const itemsPerPage = cols * rows;

  const printData = categoriesToPrint
    .map((catId) => {
      const cat = profile.categories.find((c) => c.id === catId);
      const cards = (profile.cards[catId] || []).filter((c) => !c.isDeleted);
      return { categoryName: cat ? cat.name : '', cards };
    })
    .filter((group) => group.cards.length > 0);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210, pageHeight = 297;
  let isFirstPage = true;

  // Математика для жестких размеров карточек
  const W = 794, H = 1123, padding = 40, gap = 12;
  const headerHeight = 130, footerHeight = 50;
  const availableW = W - padding * 2;
  const availableH = H - padding * 2 - headerHeight - footerHeight;
  const cardW = (availableW - gap * (cols - 1)) / cols;
  const cardH = (availableH - gap * (rows - 1)) / rows;

  for (const group of printData) {
    for (let i = 0; i < group.cards.length; i += itemsPerPage) {
      const pageCards = group.cards.slice(i, i + itemsPerPage);

      const pageEl = document.createElement('div');
      pageEl.className = 'print-page';

      // Шапка
      pageEl.innerHTML = `
        <div class="print-header">
          <div class="print-header-title">РАСговорилка</div>
          <div class="print-header-category">${group.categoryName}</div>
          <div class="print-header-arch"></div>
        </div>
      `;

      // Сетка
      const gridEl = document.createElement('div');
      gridEl.className = `print-grid ${settings.cutLines ? 'cut-lines' : ''}`;

      for (const card of pageCards) {
        const cardEl = document.createElement('div');
        cardEl.className = 'print-card';
        // Жестко задаем размеры в пикселях прямо здесь для html2canvas
        cardEl.style.width = `${cardW}px`;
        cardEl.style.height = `${cardH}px`;

        const imgWrap = document.createElement('div');
        imgWrap.className = 'print-card-image';

        if (card.imageId) {
          imgWrap.innerHTML = `<img src="" data-img-id="${card.imageId}" />`;
        } else if (card.imagePath) {
          const base = import.meta.env.BASE_URL || '/';
          const prefix = base.endsWith('/') ? base : `${base}/`;
          imgWrap.innerHTML = `<img src="${prefix}${card.imagePath}" />`;
        } else {
          imgWrap.innerHTML = `<span>${card.emoji || '🖼️'}</span>`;
        }
        cardEl.appendChild(imgWrap);

        if (settings.showLabels) {
          const label = document.createElement('div');
          label.className = 'print-card-label';
          label.textContent = card.text;
          cardEl.appendChild(label);
        }

        gridEl.appendChild(cardEl);
      }
      pageEl.appendChild(gridEl);

      // Подвал
      const footer = document.createElement('div');
      footer.className = 'print-footer';
      footer.innerHTML = `
        <div class="print-footer-line"></div>
        <div class="print-footer-text">РАСговорилка — карточки для коммуникации</div>
      `;
      pageEl.appendChild(footer);

      hiddenContainer.appendChild(pageEl);
    }
  }

  // Загрузка картинок
  const dbImages = hiddenContainer.querySelectorAll('img[data-img-id]');
  await Promise.all(Array.from(dbImages).map(async (img) => {
    const url = await getImageUrl(img.getAttribute('data-img-id'));
    if (url) img.src = url; else img.replaceWith(document.createTextNode('🖼️'));
  }));

  const allImgs = hiddenContainer.querySelectorAll('img');
  await Promise.all(Array.from(allImgs).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(res => { img.onload = res; img.onerror = res; });
  }));

  // Рендер в PDF
  const pages = hiddenContainer.children;
  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, logging: false });
    if (!isFirstPage) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
    isFirstPage = false;
  }

  pdf.save(`RASgovorilka_${new Date().toISOString().slice(0,10)}.pdf`);
  toast('PDF сохранен!', 'success');
  hiddenContainer.remove();
}