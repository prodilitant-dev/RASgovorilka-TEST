// src/components/common/VerticalEditor/preview/index.js
import { createElement, on } from '@utils/dom';
import { getImageUrl } from '@services/image';
import { iconUrl, isIconName } from '@utils/icon';
import { openImageSourcePopup } from './ImageSourcePopup.js';
import { findBankItem } from '@utils/cardBank'; // <-- Импорт для поиска в банке

let idCounter = 0;
function generateId() {
  return `ve-file-${++idCounter}`;
}

export function renderPreview(entity, callbacks) {
  const block = createElement('div', { className: 've-preview-block' });

  // 1. Если карточка старая и у неё нет variants, пробуем найти их в банке по тексту
  // НО только если у нее еще нет явно заданного файла (чтобы не перезаписывать ручной выбор)
  if (entity.text && !entity.filename && (!entity.variants || entity.variants.length === 0)) {
    const bankItem = findBankItem(entity.text);
    if (bankItem) {
      entity.variants = bankItem.variants || [];
      entity.filename = bankItem.filename || entity.filename;
      entity.category = bankItem.category || entity.category;
      // Если у старой карточки не было картинки, подставим первую из банка
      if (!entity.imagePath && !entity.imageId) {
        entity.imagePath = `cards/${entity.category}/${entity.filename || bankItem.word + '.webp'}`;
      }
    }
  }

  const box = createElement('div', {
    className: 've-preview-box',
    'data-has-image': !!(entity.imageId || entity.imagePath),
  });

  const applyImageUrl = (url) => {
    box.style.backgroundImage = `url(${url})`;
    box.style.backgroundSize = 'contain';
    box.style.backgroundPosition = 'center';
    box.style.backgroundRepeat = 'no-repeat';
    const textEl = box.querySelector('.ve-preview-text');
    if (textEl) textEl.textContent = '';
    const existingImg = box.querySelector('.ve-preview-img');
    if (existingImg) existingImg.remove();
  };

  const showFallback = (boxEl, ent) => {
    const emoji = ent.emoji || ent.icon || '';
    const text = ent.text || ent.name || '';

    boxEl.style.backgroundImage = 'none';
    boxEl.style.background = 'var(--bg)';

    const existingImg = boxEl.querySelector('.ve-preview-img');
    if (existingImg) existingImg.remove();

    let textEl = boxEl.querySelector('.ve-preview-text');
    if (!textEl) {
      textEl = createElement('div', { className: 've-preview-text' });
      boxEl.appendChild(textEl);
    }

    if (emoji && isIconName(emoji)) {
      textEl.textContent = '';
      const img = createElement('img', {
        src: iconUrl(emoji),
        alt: '',
        className: 've-preview-img',
        draggable: 'false',
      });
      img.style.maxWidth = '70%';
      img.style.maxHeight = '70%';
      img.style.objectFit = 'contain';
      img.addEventListener('error', () => {
        img.remove();
        textEl.textContent = text ? text.charAt(0).toUpperCase() : '➕';
      });
      boxEl.appendChild(img);
      return;
    }

    const isLetterFallback = !emoji && !!text;
    textEl.textContent = emoji || (text ? text.charAt(0).toUpperCase() : '➕');
    textEl.style.color = isLetterFallback ? 'var(--text-muted)' : '';
    textEl.style.opacity = isLetterFallback ? '0.4' : '';
    textEl.style.fontSize = isLetterFallback ? '3em' : '';
  };

  const loadStockImage = (imagePath, boxEl, onLoad, onError) => {
    const base = import.meta.env.BASE_URL || '/';
    const url = base.endsWith('/') ? `${base}${imagePath}` : `${base}/${imagePath}`;
    const probe = new Image();
    probe.onload = () => {
      boxEl.classList.remove('loading');
      onLoad(url);
    };
    probe.onerror = () => {
      boxEl.classList.remove('loading');
      onError();
    };
    probe.src = url;
  };

  // Первичная отрисовка
  if (entity.imageId) {
    box.classList.add('loading');
    getImageUrl(entity.imageId).then((url) => {
      box.classList.remove('loading');
      if (url) applyImageUrl(url);
      else if (entity.imagePath)
        loadStockImage(entity.imagePath, box, applyImageUrl, () => showFallback(box, entity));
      else showFallback(box, entity);
    });
  } else if (entity.imagePath) {
    box.classList.add('loading');
    loadStockImage(entity.imagePath, box, applyImageUrl, () => showFallback(box, entity));
  } else {
    showFallback(box, entity);
  }

  // Скрытые инпуты
  const cleanupPopup = () => document.querySelector('.ve-image-source-popup')?.remove();

  const fileInputId = generateId();
  const fileInput = createElement('input', {
    type: 'file',
    accept: 'image/*',
    id: fileInputId,
    name: fileInputId,
    style: 'display:none;',
  });
  on(fileInput, 'change', async (e) => {
    cleanupPopup();
    const file = e.target.files[0];
    if (file) await callbacks.onUploadImage(file);
    fileInput.value = '';
  });
  box.appendChild(fileInput);

  const cameraInputId = generateId();
  const cameraInput = createElement('input', {
    type: 'file',
    accept: 'image/*',
    capture: 'environment',
    id: cameraInputId,
    name: cameraInputId,
    style: 'display:none;',
  });
  on(cameraInput, 'change', async (e) => {
    cleanupPopup();
    const file = e.target.files[0];
    if (file) await callbacks.onUploadImage(file);
    cameraInput.value = '';
  });
  box.appendChild(cameraInput);

  // Клик по превью — открываем меню (на всех устройствах)
  on(box, 'click', (e) => {
    if (e.target.closest('.ve-preview-remove')) return;
    if (e.target.closest('.ve-image-source-popup')) return;

    openImageSourcePopup(box, {
      fileInput,
      cameraInput,
      onSelectFromBank: () => {
        // Динамически импортируем модалку банка, чтобы не грузить её без надобности
        import('../BankPickerModal.js').then(({ openBankPicker }) => {
          openBankPicker((item) => {
            // Обновляем данные карточки
            entity.imageId = null; // Сбрасываем пользовательское фото
            entity.imagePath = `cards/${item.category}/${item.filename || item.word + '.webp'}`;
            entity.emoji = item.emoji || '';
            entity.filename = item.filename;
            entity.category = item.category;
            entity.variants = item.variants || [];

            // Перерисовываем весь блок превью, чтобы обновились картинки и кружочки
            const newBlock = renderPreview(entity, callbacks);
            block.replaceWith(newBlock);

            // Сообщаем модалке, что данные изменились
            if (callbacks.onFieldChange) {
              callbacks.onFieldChange('imagePath', entity.imagePath);
              callbacks.onFieldChange('variants', entity.variants);
            }
          });
        });
      },
    });
  });

  if (entity.imageId || entity.imagePath) {
    const removeBtn = createElement('button', { className: 've-preview-remove' }, '✕');
    on(removeBtn, 'click', (e) => {
      e.stopPropagation();
      callbacks.onRemoveImage();
    });
    box.appendChild(removeBtn);
  }

  block.appendChild(box);

  // Блок с вариантами
  if (!entity.imageId && entity.variants && entity.variants.length > 0 && entity.category) {
    // Берем главную + максимум 3 варианта (итого 4 кружочка)
    const allImages = [entity.filename, ...(entity.variants || []).slice(0, 3)].filter(Boolean);

    // Если картинка не выбрана, ставим первую
    if (!entity.imagePath || !allImages.some((f) => entity.imagePath.endsWith(f))) {
      entity.imagePath = `cards/${entity.category}/${allImages[0]}`;
      loadStockImage(entity.imagePath, box, applyImageUrl, () => showFallback(box, entity));
    }

    const variantsRow = createElement('div', { className: 've-variants-row' });

    allImages.forEach((imgName) => {
      const fullPath = `cards/${entity.category}/${imgName}`;
      const base = import.meta.env.BASE_URL || '/';
      const url = base.endsWith('/') ? `${base}${fullPath}` : `${base}/${fullPath}`;

      const thumb = createElement('div', {
        className: `ve-variant-thumb${entity.imagePath.endsWith(imgName) ? ' active' : ''}`,
        style: `background-image: url(${url});`,
      });

      on(thumb, 'click', (e) => {
        e.stopPropagation();
        entity.imagePath = fullPath;

        loadStockImage(entity.imagePath, box, applyImageUrl, () => showFallback(box, entity));

        variantsRow
          .querySelectorAll('.ve-variant-thumb')
          .forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');

        if (callbacks.onFieldChange) callbacks.onFieldChange('imagePath', fullPath);
      });

      variantsRow.appendChild(thumb);
    });

    block.appendChild(variantsRow);
  }

  return block;
}

export function updatePreviewText(entity) {
  const box = document.querySelector('.ve-preview-box');
  if (!box) return;
  if (entity.imageId) return;

  if (entity.imagePath) {
    const base = import.meta.env.BASE_URL || '/';
    const url = base.endsWith('/') ? `${base}${entity.imagePath}` : `${base}/${entity.imagePath}`;
    box.style.backgroundImage = `url(${url})`;
    box.style.backgroundSize = 'contain';
    box.style.backgroundPosition = 'center';
    box.style.backgroundRepeat = 'no-repeat';
    box.setAttribute('data-has-image', 'true');

    const textEl = box.querySelector('.ve-preview-text');
    if (textEl) textEl.textContent = '';
    const existingImg = box.querySelector('.ve-preview-img');
    if (existingImg) existingImg.remove();
    return;
  }

  const emoji = entity.emoji || entity.icon || '';
  const text = entity.text || entity.name || '';
  let textEl = box.querySelector('.ve-preview-text');
  const existingImg = box.querySelector('.ve-preview-img');

  if (emoji && isIconName(emoji)) {
    if (existingImg) return;
    if (textEl) textEl.textContent = '';
    const img = createElement('img', {
      src: iconUrl(emoji),
      alt: '',
      className: 've-preview-img',
      draggable: 'false',
    });
    img.style.maxWidth = '70%';
    img.style.maxHeight = '70%';
    img.style.objectFit = 'contain';
    img.addEventListener('error', () => {
      img.remove();
      if (textEl) textEl.textContent = text ? text.charAt(0).toUpperCase() : '➕';
    });
    box.appendChild(img);
    return;
  }

  if (existingImg) existingImg.remove();
  if (!textEl) {
    textEl = createElement('div', { className: 've-preview-text' });
    box.appendChild(textEl);
  }

  const isLetterFallback = !emoji && !!text;
  textEl.textContent = emoji || (text ? text.charAt(0).toUpperCase() : '➕');
  textEl.style.color = isLetterFallback ? 'var(--text-muted)' : '';
  textEl.style.opacity = isLetterFallback ? '0.4' : '';
  textEl.style.fontSize = isLetterFallback ? '3em' : '';
}
