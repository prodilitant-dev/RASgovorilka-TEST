// src/components/common/VerticalEditor/fields/SelectField.js
import { createElement, on } from '@utils/dom';

/**
 * Рендерит выпадающий список (select).
 */
export function renderSelectField(entity, field, fieldId, callbacks) {
  const select = createElement('select', { id: fieldId, name: fieldId });

  if (field.options) {
    field.options.forEach((opt) => {
      const option = createElement(
        'option',
        { value: typeof opt === 'string' ? opt : opt.value },
        typeof opt === 'string' ? opt : opt.label
      );
      if (entity[field.id] === option.value) option.selected = true;
      select.appendChild(option);
    });
  }

  on(select, 'change', (e) => callbacks.onFieldChange(field.id, e.target.value));
  return select;
}
