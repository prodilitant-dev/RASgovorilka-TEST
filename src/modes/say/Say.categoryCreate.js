// src/modes/say/Say.categoryCreate.js
import { Modal } from '@components/common/Modal/Modal';
import { createElement, on } from '@utils/dom';
import { toast } from '@utils/toast';
import { uid } from '@utils/id';
import { saveProfile } from '@storage/appStorage';
import { setState } from '@state/store';
import { openImageCropper } from '@components/common/ImageCropper';
import { uploadImage, getImageUrl, deleteImage } from '@services/image';
import { findCardImage } from '@utils/cardBank';
import { logger } from '@utils/logger';

// Импортируем справочник и банк
import { KNOWN_CATEGORIES } from '@config/defaultData/categories';
import { CARD_BANK } from '@config/cardBank';
import { autoDetectCard } from '@utils/inflect';
import { confirm } from '@utils/dialog';

export function openCategoryCreateModal(profile, onCreated) {
  let nameInput = null;
  let wordTypeSelect = null;
  let imageId = null;
  let imagePath = null;
  let previewAvatar = null;
  let removeBtn = null;

  const wordTypeOptions = [
    { value: 'noun', label: 'Существительное' },
    { value: 'verb', label: 'Глагол' },
    { value: 'adjective', label: 'Прилагательное' },
    { value: 'pronoun', label: 'Местоимение' },
    { value: 'preposition', label: 'Предлог' },
    { value: 'other', label: 'Другое' },
  ];

  async function updatePreviewAvatar() {
    if (!previewAvatar) return;

    const name = nameInput?.value?.trim() || '';
    const letter = name.charAt(0).toUpperCase() || '?';

    previewAvatar.innerHTML = '';
    previewAvatar.classList.remove('cat-avatar--fallback');

    if (imageId) {
      try {
        const url = await getImageUrl(imageId);
        if (url) {
          const img = createElement('img', {
            src: url,
            alt: '',
            className: 'cat-avatar__img',
            draggable: 'false',
          });
          previewAvatar.appendChild(img);
          if (removeBtn) removeBtn.style.display = 'inline-flex';
          return;
        }
      } catch (err) {
        logger.warn('categoryCreate: getImageUrl failed', err);
      }
    }

    if (imagePath) {
      const base = import.meta.env.BASE_URL || '/';
      const url = base.endsWith('/') ? `${base}${imagePath}` : `${base}/${imagePath}`;
      const img = createElement('img', {
        src: url,
        alt: '',
        className: 'cat-avatar__img',
        draggable: 'false',
      });
      previewAvatar.appendChild(img);
      if (removeBtn) removeBtn.style.display = 'inline-flex';
      return;
    }

    previewAvatar.classList.add('cat-avatar--fallback');
    previewAvatar.textContent = name ? letter : '📷';
    if (removeBtn) removeBtn.style.display = 'none';
  }

  async function handleFileSelected(file) {
    try {
      const croppedBlob = await openImageCropper(file, { size: 256 });
      if (!croppedBlob) return;

      if (imageId) {
        try {
          await deleteImage(imageId);
        } catch {
          /* ignore */
        }
      }

      imageId = await uploadImage(croppedBlob, { size: 256, showToast: false });
      imagePath = null;
      await updatePreviewAvatar();
    } catch (err) {
      logger.error('categoryCreate: upload failed', err);
      toast('Не удалось загрузить изображение', 'error');
    }
  }

  const modal = new Modal({
    title: 'Новая категория',
    body: () => {
      const wrap = createElement('div', { className: 've-fields' });

      const avatarRow = createElement('div', {
        className: 've-field',
        style: 'align-items: center;',
      });
      const avatarLabel = createElement('label', { className: 've-field-label' }, 'Изображение');

      previewAvatar = createElement('div', {
        className: 'cat-avatar cat-avatar--upload',
        style: 'width: 72px; height: 72px; cursor: pointer; font-size: 24px;',
        title: 'Нажмите, чтобы выбрать изображение',
      });
      previewAvatar.textContent = '📷';

      const fileInput = createElement('input', {
        type: 'file',
        accept: 'image/*',
        style: 'display: none;',
      });
      on(fileInput, 'change', async (e) => {
        const file = e.target.files?.[0];
        if (file) await handleFileSelected(file);
        fileInput.value = '';
      });

      on(previewAvatar, 'click', () => fileInput.click());

      removeBtn = createElement(
        'button',
        {
          type: 'button',
          className: 'cat-action-btn',
          style: 'margin-left: 8px; display: none;',
          'aria-label': 'Удалить изображение',
          title: 'Удалить',
        },
        '✕'
      );
      on(removeBtn, 'click', async (e) => {
        e.stopPropagation();
        if (imageId) {
          try {
            await deleteImage(imageId);
          } catch {
            /* ignore */
          }
          imageId = null;
        }
        imagePath = null;
        await updatePreviewAvatar();
      });

      const avatarRowInner = createElement('div', {
        style: 'display: flex; align-items: center;',
      });
      avatarRowInner.appendChild(previewAvatar);
      avatarRowInner.appendChild(removeBtn);
      avatarRowInner.appendChild(fileInput);

      avatarRow.appendChild(avatarLabel);
      avatarRow.appendChild(avatarRowInner);
      wrap.appendChild(avatarRow);

      const nameRow = createElement('div', { className: 've-field' });
      const nameLabel = createElement('label', { className: 've-field-label' }, 'Название');
      nameInput = createElement('input', {
        type: 'text',
        placeholder: 'Например: Одежда',
        autofocus: true,
      });

      on(nameInput, 'input', () => {
        if (!imageId) {
          const found = findCardImage(nameInput.value);
          imagePath = found || null;
        }
        updatePreviewAvatar();
      });

      nameRow.appendChild(nameLabel);
      nameRow.appendChild(nameInput);
      wrap.appendChild(nameRow);

      const typeRow = createElement('div', { className: 've-field' });
      const typeLabel = createElement('label', { className: 've-field-label' }, 'Тип слова');
      wordTypeSelect = createElement('select', {});
      wordTypeOptions.forEach(({ value, label }) => {
        const option = createElement('option', { value }, label);
        wordTypeSelect.appendChild(option);
      });
      typeRow.appendChild(typeLabel);
      typeRow.appendChild(wordTypeSelect);
      wrap.appendChild(typeRow);

      setTimeout(() => nameInput && nameInput.focus(), 100);
      on(nameInput, 'keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCreate();
        }
      });

      return wrap;
    },
    buttons: [
      {
        label: 'Отмена',
        action: () => modal.close(),
      },
      {
        label: 'Создать',
        primary: true,
        action: () => handleCreate(),
      },
    ],
    onClose: async () => {
      if (imageId) {
        try {
          await deleteImage(imageId);
        } catch {
          /* ignore */
        }
      }
    },
  });

  async function handleCreate() {
    if (!nameInput || !wordTypeSelect) return;

    const name = nameInput.value.trim();
    if (!name) {
      toast('Введите название категории', 'error');
      nameInput.focus();
      return;
    }

    const exists = profile.categories.some(
      (c) => c.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      toast('Категория с таким названием уже есть', 'error');
      nameInput.focus();
      nameInput.select();
      return;
    }

    const newCategory = {
      id: uid(),
      name,
      wordType: wordTypeSelect.value,
      hidden: false,
      imageId: imageId || null,
      imagePath: imagePath || null,
    };

    // --- ПРОВЕРКА НА СТАНДАРТНЫЕ КАРТОЧКИ ---
    let cardsAdded = false;

    // Ищем совпадение в справочнике KNOWN_CATEGORIES
    const matchedCategory = KNOWN_CATEGORIES.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (matchedCategory) {
      // Ищем карточки в банке (без учета регистра ID, чтобы Semiy и semiy совпали)
      const stockCards = CARD_BANK.filter(
        (item) => item.category.toLowerCase() === matchedCategory.id.toLowerCase()
      );

      if (stockCards.length > 0) {
        const ok = await confirm(
          `В приложении есть готовые карточки для категории «${matchedCategory.name}» (${stockCards.length} шт.). Добавить их?`,
          'Стандартные карточки'
        );

        if (ok) {
          profile.cards[newCategory.id] = stockCards.map((raw) => {
            const card = {
              id: uid(),
              text: raw.word.charAt(0).toUpperCase() + raw.word.slice(1),
              emoji: raw.emoji || '🖼️',
              wordType: raw.wordType || newCategory.wordType,
              gender: raw.gender || null,
              animate: false,
              imageId: null,
              imagePath: `cards/${raw.category}/${raw.filename || raw.word + '.webp'}`,
              forms: null,
              variants: raw.variants || [],
            };

            if (['noun', 'pronoun', 'adjective'].includes(card.wordType)) {
              autoDetectCard(card);
            }
            return card;
          });
          cardsAdded = true;
        }
      }
    }

    if (!cardsAdded) {
      profile.cards[newCategory.id] = [];
    }
    // --- КОНЕЦ ПРОВЕРКИ ---

    profile.categories.push(newCategory);
    saveProfile(profile);
    setState({ currentCategoryId: newCategory.id });

    toast(cardsAdded ? 'Категория создана с карточками' : 'Категория создана');

    imageId = null;
    modal.close();
    if (onCreated) onCreated(newCategory.id);
  }

  modal.open();
  return modal;
}
