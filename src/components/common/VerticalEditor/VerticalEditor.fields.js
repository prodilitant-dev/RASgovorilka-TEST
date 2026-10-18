// src/components/common/VerticalEditor/VerticalEditor.fields.js
import { createElement, on } from '@utils/dom';
import { iconUrl, isIconName } from '@utils/icon';

let idCounter = 0;
function generateId() {
  return `ve-field-${++idCounter}`;
}

export function renderFields(entity, fields, callbacks) {
  const container = createElement('div', { className: 've-fields' });

  fields.forEach((field) => {
    const isVisible = typeof field.visible === 'function' ? field.visible(entity) : true;
    if (!isVisible) return;

    const fieldWrap = createElement('div', { className: `ve-field ve-field-${field.type}` });
    const fieldId = generateId();
    const label = createElement(
      'label',
      { className: 've-field-label', for: fieldId },
      field.label
    );
    fieldWrap.appendChild(label);

    let inputEl = null;

    switch (field.type) {
      case 'text':
      case 'number':
      case 'time': {
        const input = createElement('input', {
          type: field.type || 'text',
          id: fieldId,
          name: fieldId,
          value: entity[field.id] || '',
          placeholder: field.placeholder || '',
        });

        if (field.autocomplete) {
          const wrapper = createElement('div', { className: 've-autocomplete-wrapper' });
          const list = createElement('ul', { className: 've-autocomplete-list' });
          list.style.display = 'none';
          wrapper.appendChild(input);
          wrapper.appendChild(list);
          inputEl = wrapper;

          let activeIndex = -1;

          const renderList = (items) => {
            list.innerHTML = '';
            activeIndex = -1;
            if (!items.length) {
              list.style.display = 'none';
              return;
            }
            items.forEach((item, index) => {
              const li = createElement('li', { 'data-index': index });
              if (item.imagePath) {
                const base = import.meta.env.BASE_URL || '/';
                const url = base.endsWith('/')
                  ? `${base}${item.imagePath}`
                  : `${base}/${item.imagePath}`;
                const img = createElement('img', { src: url, className: 've-autocomplete-img' });
                li.appendChild(img);
              }
              li.appendChild(document.createTextNode(item.text));

              li.addEventListener('click', () => {
                input.value = item.text;
                entity[field.id] = item.text;
                list.style.display = 'none';
                if (field.onChange) field.onChange(item.text, entity);
                updatePreviewText(entity);
                callbacks.onFieldChange(field.id, item.text);
              });
              list.appendChild(li);
            });
            list.style.display = 'block';
          };

          on(input, 'input', (e) => {
            const value = e.target.value;
            entity[field.id] = value;
            if (field.onChange) field.onChange(value, entity);
            updatePreviewText(entity);
            // Автокомплит
            import('@utils/cardBank').then(({ searchCardBank }) => {
              const results = searchCardBank(value);
              renderList(results);
            });
          });

          on(input, 'change', (e) => {
            callbacks.onFieldChange(field.id, e.target.value);
          });

          // Скрытие списка при клике вне
          document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
              list.style.display = 'none';
            }
          });

          // Клавиатурная навигация
          on(input, 'keydown', (e) => {
            if (list.style.display === 'none') return;
            const items = list.querySelectorAll('li');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              activeIndex = Math.min(activeIndex + 1, items.length - 1);
              updateActive();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              activeIndex = Math.max(activeIndex - 1, 0);
              updateActive();
            } else if (e.key === 'Enter' && activeIndex >= 0) {
              e.preventDefault();
              items[activeIndex].click();
            } else if (e.key === 'Escape') {
              list.style.display = 'none';
            }
          });

          const updateActive = () => {
            const items = list.querySelectorAll('li');
            items.forEach((li, idx) => {
              li.classList.toggle('active', idx === activeIndex);
              if (idx === activeIndex) li.scrollIntoView({ block: 'nearest' });
            });
          };
        } else {
          inputEl = input;
          on(input, 'input', (e) => {
            const value = e.target.value;
            entity[field.id] = value;
            if (field.onChange) field.onChange(value, entity);
            updatePreviewText(entity);
          });
          on(input, 'change', (e) => {
            callbacks.onFieldChange(field.id, e.target.value);
          });
        }
        break;
      }

      case 'select':
        inputEl = createElement('select', { id: fieldId, name: fieldId });
        if (field.options) {
          field.options.forEach((opt) => {
            const option = createElement(
              'option',
              { value: typeof opt === 'string' ? opt : opt.value },
              typeof opt === 'string' ? opt : opt.label
            );
            if (entity[field.id] === option.value) option.selected = true;
            inputEl.appendChild(option);
          });
        }
        on(inputEl, 'change', (e) => callbacks.onFieldChange(field.id, e.target.value));
        break;

      case 'toggle': {
        const toggleWrapper = createElement('div', {
          className: 'toggle-wrapper',
          style: 'display:flex; justify-content:flex-end; pointer-events:auto;',
        });
        const toggleLabel = createElement('label', {
          className: 'toggle-switch',
          style: 'pointer-events:auto; cursor:pointer;',
        });
        const checkbox = createElement('input', {
          type: 'checkbox',
          id: fieldId,
          name: fieldId,
          checked: !!entity[field.id],
          style: 'pointer-events:auto;',
        });
        const slider = createElement('span', { className: 'slider' });
        toggleLabel.appendChild(checkbox);
        toggleLabel.appendChild(slider);
        toggleWrapper.appendChild(toggleLabel);

        checkbox.addEventListener('change', (e) => {
          const value = e.target.checked;
          entity[field.id] = value;
          if (field.onChange) field.onChange(value, entity);
          callbacks.onFieldChange(field.id, value);
        });

        inputEl = toggleWrapper;
        break;
      }

      default:
        inputEl = createElement('div', {}, 'Неизвестный тип поля');
    }

    if (inputEl) {
      fieldWrap.appendChild(inputEl);
      container.appendChild(fieldWrap);
    }
  });

  return container;
}

function updatePreviewText(entity) {
  const box = document.querySelector('.ve-preview-box');
  if (!box) return;
  if (entity.imageId) return; // Загруженная пользователем картинка в приоритете

  // Если есть imagePath (из банка карточек) — показываем его
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

  // Иначе — старый код (эмодзи / иконка / буква)
  const emoji = entity.emoji || entity.icon || '';
  const text = entity.text || entity.name || '';

  let textEl = box.querySelector('.ve-preview-text');
  const existingImg = box.querySelector('.ve-preview-img');

  // Если стало именем иконки — рендерим картинку
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

  // Иначе — эмодзи/буква
  if (existingImg) existingImg.remove();
  if (!textEl) {
    textEl = createElement('div', { className: 've-preview-text' });
    box.appendChild(textEl);
  }

  const isLetterFallback = !emoji && !!text;
  textEl.textContent = emoji || (text ? text.charAt(0).toUpperCase() : '➕');

  if (isLetterFallback) {
    textEl.style.color = 'var(--text-muted)';
    textEl.style.opacity = '0.4';
    textEl.style.fontSize = '3em';
  } else {
    textEl.style.color = '';
    textEl.style.opacity = '';
    textEl.style.fontSize = '';
  }
}
