// src/components/print/PrintView.settings.js
import { createElement, on } from '@utils/dom';
import { Modal } from '@components/common/Modal/Modal';

export function openPrintSettings({ settings, onSave, onUpdate }) {
  const modal = new Modal({
    title: 'Настройки печати',
    body: () => {
      const form = createElement('div', { className: 'print-settings-form' });
      const addRow = (label, content) => {
        const row = createElement('div', { className: 'print-setting-row' });
        row.appendChild(createElement('span', {}, label));
        row.appendChild(content);
        form.appendChild(row);
      };

      const gridOpts = createElement('div', { className: 'print-options-group' });
      // Добавили '4x4' в конец списка
      ['2x2', '2x3', '3x3', '3x4', '4x4'].forEach((g) => {
        const btn = createElement(
          'div',
          { className: `btn btn-sm ${settings.grid === g ? 'btn-primary' : 'btn-secondary'}` },
          g.replace('x', ' × ')
        );
        on(btn, 'click', () => {
          settings.grid = g;
          onSave();
          modal.close();
          openPrintSettings({ settings, onSave, onUpdate }); // Рекурсивный вызов для перерисовки
          onUpdate();
        });
        gridOpts.appendChild(btn);
      });
      addRow('Сетка:', gridOpts);

      const cutToggle = createElement('label', { className: 'toggle-switch' });
      const cutInput = createElement('input', { type: 'checkbox', checked: settings.cutLines });
      cutToggle.appendChild(cutInput);
      cutToggle.appendChild(createElement('span', { className: 'slider' }));
      on(cutInput, 'change', (e) => {
        settings.cutLines = e.target.checked;
        onSave();
        onUpdate();
      });
      addRow('Перекрестия для разреза:', cutToggle);

      const labelToggle = createElement('label', { className: 'toggle-switch' });
      const labelInput = createElement('input', {
        type: 'checkbox',
        checked: settings.showLabels,
      });
      labelToggle.appendChild(labelInput);
      labelToggle.appendChild(createElement('span', { className: 'slider' }));
      on(labelInput, 'change', (e) => {
        settings.showLabels = e.target.checked;
        onSave();
        onUpdate();
      });
      addRow('Подписи:', labelToggle);

      const fontSelect = createElement('select', { className: 'print-select' });
      [
        { v: 'system-ui', l: 'Системный' },
        { v: 'Arial, sans-serif', l: 'Arial' },
        { v: '"Times New Roman", serif', l: 'Times New Roman' },
        { v: '"Courier New", monospace', l: 'Courier' },
      ].forEach((opt) =>
        fontSelect.appendChild(
          createElement('option', { value: opt.v, selected: settings.font === opt.v }, opt.l)
        )
      );
      on(fontSelect, 'change', (e) => {
        settings.font = e.target.value;
        onSave();
        onUpdate();
      });
      addRow('Шрифт подписей:', fontSelect);

      const frameOpts = createElement('div', { className: 'print-options-group' });
      [
        { v: 'black', l: 'Черный' },
        { v: 'gray', l: 'Серый' },
        { v: 'green', l: 'Зеленый' },
        { v: 'dotted', l: 'Пунктир' },
        { v: 'none', l: 'Без рамки' },
      ].forEach((opt) => {
        const btn = createElement(
          'div',
          {
            className: `btn btn-sm ${settings.frame === opt.v ? 'btn-primary' : 'btn-secondary'}`,
          },
          opt.l
        );
        on(btn, 'click', () => {
          settings.frame = opt.v;
          onSave();
          modal.close();
          openPrintSettings({ settings, onSave, onUpdate });
          onUpdate();
        });
        frameOpts.appendChild(btn);
      });
      addRow('Цвет рамки:', frameOpts);

      return form;
    },
    buttons: [{ label: 'Готово', primary: true, action: () => modal.close() }],
  });
  modal.open();
}
