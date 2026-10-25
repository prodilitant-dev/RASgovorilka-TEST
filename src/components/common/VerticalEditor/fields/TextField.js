// src/components/common/VerticalEditor/fields/TextField.js
import { createElement, on } from '@utils/dom';
import { updatePreviewText } from '../preview/index.js';
import { searchCardBank } from '@utils/cardBank';

export function renderTextField(entity, field, fieldId, callbacks) {
  const input = createElement('input', {
    type: field.type || 'text',
    id: fieldId,
    name: fieldId,
    value: entity[field.id] || '',
    placeholder: field.placeholder || '',
  });

  if (!field.autocomplete) {
    on(input, 'input', (e) => {
      const value = e.target.value;
      entity[field.id] = value;
      if (field.onChange) field.onChange(value, entity);
      updatePreviewText(entity);
    });
    on(input, 'change', (e) => callbacks.onFieldChange(field.id, e.target.value));
    return input;
  }

  // === Автокомплит ===
  const wrapper = createElement('div', { className: 've-autocomplete-wrapper' });
  const list = createElement('ul', { className: 've-autocomplete-list' });
  list.style.display = 'none';
  wrapper.appendChild(input);
  wrapper.appendChild(list);

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

      // Показываем миниатюру картинки в списке (если она есть)
      if (item.imagePath) {
        const base = import.meta.env.BASE_URL || '/';
        const url = base.endsWith('/') ? `${base}${item.imagePath}` : `${base}/${item.imagePath}`;
        const img = createElement('img', { src: url, className: 've-autocomplete-img' });

        // Если картинка не загрузилась, показываем эмодзи
        img.addEventListener('error', () => {
          img.remove();
          if (item.emoji) {
            const spanEmoji = createElement(
              'span',
              { className: 've-autocomplete-emoji' },
              item.emoji
            );
            li.insertBefore(spanEmoji, li.firstChild);
          }
        });

        li.appendChild(img);
      } else if (item.emoji) {
        const spanEmoji = createElement('span', { className: 've-autocomplete-emoji' }, item.emoji);
        li.appendChild(spanEmoji);
      }
      li.appendChild(document.createTextNode(item.text));

      li.addEventListener('mousedown', (e) => {
        e.preventDefault();

        // Подставляем данные
        input.value = item.text;
        entity[field.id] = item.text;

        entity.imagePath = item.imagePath;
        entity.emoji = item.emoji || '';

        // НОВОЕ: сохраняем данные для вариантов
        entity.filename = item.filename;
        entity.category = item.category;
        entity.variants = item.variants || [];

        if (item.wordType) entity.wordType = item.wordType;
        if (item.gender) entity.gender = item.gender;

        list.style.display = 'none';
        updatePreviewText(entity);
        callbacks.onFieldChange(field.id, item.text);
        if (entity.wordType) callbacks.onFieldChange('wordType', entity.wordType);
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
    renderList(searchCardBank(value));
  });

  on(input, 'change', (e) => callbacks.onFieldChange(field.id, e.target.value));

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) list.style.display = 'none';
  });

  // Управление стрелками
  on(input, 'keydown', (e) => {
    if (list.style.display === 'none') return;
    const items = list.querySelectorAll('li');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      return;
    } else if (e.key === 'Escape') {
      list.style.display = 'none';
      return;
    }

    items.forEach((li, idx) => {
      li.classList.toggle('active', idx === activeIndex);
      if (idx === activeIndex) li.scrollIntoView({ block: 'nearest' });
    });
  });

  return wrapper;
}
