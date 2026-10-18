// src/modes/general/components/UISizeSettingsModal.js
import { Modal } from '@components/common/Modal/Modal';
import { createElement, on } from '@utils/dom';
import { applyUISize } from '@utils/uiSize';

/**
 * Модалка выбора размера интерфейса.
 * При клике на опцию — применяется сразу (preview).
 * При отмене — откатывается к исходному размеру.
 * При сохранении — вызывает onSave(size) и закрывается.
 *
 * @param {Object} currentSettings - globalSettings
 * @param {(size: 'small'|'medium'|'large') => void} onSave
 */
export function openUISizeSettings(currentSettings, onSave) {
  const originalSize = currentSettings?.uiSize || 'small';
  const working = { uiSize: originalSize };

  const options = [
    { value: 'small', text: 'Мелкий', hint: 'Компактно, больше элементов на экране' },
    { value: 'medium', text: 'Средний', hint: 'Крупнее текст и кнопки' },
    { value: 'large', text: 'Крупный', hint: 'Максимальный размер для моторики и зрения' },
  ];

  const buttons = [];
  const group = createElement('div', { className: 'interface-settings__group' });

  options.forEach((opt) => {
    const btn = createElement('button', {
      type: 'button',
      className: `interface-settings__option${working.uiSize === opt.value ? ' active' : ''}`,
      'data-value': opt.value,
    });

    const title = createElement('div', { className: 'interface-settings__option-title' }, opt.text);
    const hint = createElement('div', { className: 'interface-settings__option-hint' }, opt.hint);

    btn.appendChild(title);
    btn.appendChild(hint);

    on(btn, 'click', () => {
      working.uiSize = opt.value;
      buttons.forEach((b) => {
        b.classList.toggle('active', b.dataset.value === opt.value);
      });
      // Preview — применяем сразу
      applyUISize(opt.value);
    });

    buttons.push(btn);
    group.appendChild(btn);
  });

  const root = createElement('div', { className: 'interface-settings' });
  const label = createElement(
    'div',
    { className: 'interface-settings__label' },
    'Размер интерфейса'
  );
  root.appendChild(label);
  root.appendChild(group);

  const modal = new Modal({
    title: 'Размер интерфейса',
    body: () => root,
    buttons: [
      {
        label: 'Отмена',
        action: () => {
          // Откат preview
          applyUISize(originalSize);
          modal.close();
        },
      },
      {
        label: 'Сохранить',
        primary: true,
        action: () => {
          onSave(working.uiSize);
          modal.close();
        },
      },
    ],
  });

  modal.open();
}
