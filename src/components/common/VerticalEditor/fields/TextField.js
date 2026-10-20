// src/components/common/VerticalEditor/fields/TextField.js
import { createElement, on } from '@utils/dom';
import { updatePreviewText } from '../preview/index.js';
import { searchCardBank } from '@utils/cardBank';

/**
 * Рендерит текстовое поле (text, number, time).
 * Поддерживает автокомплит для карточек.
 */
export function renderTextField(entity, field, fieldId, callbacks) {
  const input = createElement('input', {
    type: field.type || 'text',
    id: fieldId,
    name: fieldId,
    value: entity[field.id] || '',
    placeholder: field.placeholder || '',
  });

  // Если автокомплит не нужен — просто возвращаем инпут
  if (!field.autocomplete) {
    on(input, 'input', (e) => {
      const value = e.target.value;
      entity[field.id] = value;
      if (field.onChange) field.onChange(value, entity);
      updatePreviewText(entity);
    });
    on(input, 'change', (e) => {
      callbacks.onFieldChange(field.id, e.target.value);
    });
    return input;
  }

  // === Логика с автокомплитом ===
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

      if (item.imagePath) {
        const base = import.meta.env.BASE_URL || '/';
        const url = base.endsWith('/') ? `${base}${item.imagePath}` : `${base}/${item.imagePath}`;
        const img = createElement('img', { src: url, className: 've-autocomplete-img' });
        li.appendChild(img);
      }

      li.appendChild(document.createTextNode(item.text));

      li.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Предотвращаем blur, чтобы модалка не перерендерилась
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
    renderList(searchCardBank(value));
  });

  on(input, 'change', (e) => callbacks.onFieldChange(field.id, e.target.value));

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) list.style.display = 'none';
  });

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
