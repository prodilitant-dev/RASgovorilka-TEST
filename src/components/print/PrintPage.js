// src/components/print/PrintPage.js
import { createElement, on } from '@utils/dom';

export function buildPageDOM({
  _categoryName,
  displayName,
  pageCards,
  cols,
  rows,
  isExport,
  settings,
  onDeleteCard,
  onRenameCategory,
}) {
  const page = createElement('div', { className: 'print-page' });
  page.style.fontFamily = settings.font;

  if (isExport) {
    page.style.position = 'relative';
    page.style.transform = 'none';
    page.style.margin = '0';
    page.style.left = 'auto';
    page.style.top = 'auto';
  }

  // --- Шапка ---
  const header = createElement('div', { className: 'print-header' });
  header.innerHTML = `<div class="print-logo"><span class="brand-ras">РАС</span><span class="brand-talk">говорилка</span></div>`;

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

  const catNameEl = createElement(
    'div',
    {
      className: 'print-category',
      contenteditable: 'true',
      spellcheck: 'false',
    },
    displayName
  );

  if (!isExport && onRenameCategory) {
    on(catNameEl, 'input', (e) => onRenameCategory(e.target.textContent.trim()));
  }

  header.appendChild(catNameEl);
  page.appendChild(header);

  // --- Сетка ---
  // Оборачиваем сетку во flex-контейнер. Это гарантирует идеальное центрирование.
  const gridWrapper = createElement('div', {
    style:
      'display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;',
  });

  const grid = createElement('div', { className: 'print-grid' });
  grid.style.position = 'relative';

  const gap = 8;
  const availableW = 794 - 30;
  const availableH = 1123 - 30 - 80 - 40;

  let cardW = (availableW - gap * (cols - 1)) / cols;
  let cardH = cardW * 1.25;
  const maxCardH = (availableH - gap * (rows - 1)) / rows;

  if (cardH > maxCardH) {
    cardH = maxCardH;
    cardW = cardH / 1.25;
  }

  const gridW = cols * cardW + (cols - 1) * gap;
  const gridH = rows * cardH + (rows - 1) * gap;

  grid.style.gridTemplateColumns = `repeat(${cols}, ${cardW}px)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${cardH}px)`;
  grid.style.gap = `${gap}px`;
  grid.style.width = `${gridW}px`;
  grid.style.height = `${gridH}px`;

  pageCards.forEach((card) => {
    const cardEl = createElement('div', { className: 'print-card' });

    // Возвращаем скругление рамкам
    cardEl.style.borderRadius = '12px';

    applyCardFrame(cardEl, settings);

    applyCardContent(cardEl, card, settings);

    if (!isExport && onDeleteCard) {
      const btnDel = createElement('div', { className: 'print-delete-btn' }, '✕');
      on(btnDel, 'click', (e) => {
        e.stopPropagation();
        onDeleteCard(card.id);
      });
      cardEl.appendChild(btnDel);
    }

    grid.appendChild(cardEl);
  });

  // --- Перекрестия ---
  if (settings.cutLines) {
    const marksLayer = createElement('div', { className: 'print-cut-marks-layer' });

    const xCoords = [];
    for (let i = 0; i <= cols; i++) {
      if (i === 0) xCoords.push(-gap / 2);
      else if (i === cols) xCoords.push(gridW + gap / 2);
      else xCoords.push(i * cardW + (i - 0.5) * gap);
    }

    const yCoords = [];
    for (let j = 0; j <= rows; j++) {
      if (j === 0) yCoords.push(-gap / 2);
      else if (j === rows) yCoords.push(gridH + gap / 2);
      else yCoords.push(j * cardH + (j - 0.5) * gap);
    }

    xCoords.forEach((x) => {
      yCoords.forEach((y) => {
        const mark = createElement('div', { className: 'print-cut-mark' });
        mark.style.left = `${x}px`;
        mark.style.top = `${y}px`;
        marksLayer.appendChild(mark);
      });
    });

    grid.appendChild(marksLayer);
  }

  gridWrapper.appendChild(grid);
  page.appendChild(gridWrapper);

  // --- Подвал ---
  const footer = createElement('div', { className: 'print-footer' });
  footer.innerHTML = `
    <div class="print-footer-line"></div>
    <div class="print-footer-text">https://prodilitant-dev.github.io/RASgovorilka</div>
  `;
  page.appendChild(footer);

  return page;
}

function applyCardFrame(cardEl, settings) {
  if (settings.frame === 'black') cardEl.style.border = '1.5px solid #333';
  else if (settings.frame === 'gray') cardEl.style.border = '1.5px solid #888';
  else if (settings.frame === 'green') cardEl.style.border = '1.5px solid #4caf50';
  else if (settings.frame === 'dotted') cardEl.style.border = '2px dotted #777';
  else cardEl.style.border = 'none';
}

function applyCardContent(cardEl, card, settings) {
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
