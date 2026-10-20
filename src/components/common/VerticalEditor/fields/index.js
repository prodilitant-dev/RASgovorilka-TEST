// src/components/common/VerticalEditor/fields/index.js
import { createElement } from '@utils/dom';
import { renderTextField } from './TextField.js';
import { renderSelectField } from './SelectField.js';
import { renderToggleField } from './ToggleField.js';

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

    let inputEl;
    switch (field.type) {
      case 'text':
      case 'number':
      case 'time':
        inputEl = renderTextField(entity, field, fieldId, callbacks);
        break;
      case 'select':
        inputEl = renderSelectField(entity, field, fieldId, callbacks);
        break;
      case 'toggle':
        inputEl = renderToggleField(entity, field, fieldId, callbacks);
        break;
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
