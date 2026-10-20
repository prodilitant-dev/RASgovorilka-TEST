// src/components/common/VerticalEditor/fields/ToggleField.js
import { createElement } from '@utils/dom';

/**
 * Рендерит переключатель (toggle).
 */
export function renderToggleField(entity, field, fieldId, callbacks) {
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

  return toggleWrapper;
}
