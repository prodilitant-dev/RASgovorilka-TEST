// src/components/common/VerticalEditor/VerticalEditor.footer.js
import { createElement } from '@utils/dom';
import { createButton } from '../Button/Button';

// Маппинг стандартных действий на иконки
const ICON_MAP = {
  save: { name: 'save', fallback: '💾' },
  delete: { name: 'trash', fallback: '🗑' },
  copy: { name: 'copy', fallback: '📋' },
};

export function renderFooter(entity, buttons, callbacks) {
  const footer = createElement('div', { className: 've-footer' });

  buttons.forEach((btn) => {
    // Пропускаем кнопку отмены, так как есть крестик в шапке модалки
    if (btn.id === 'cancel') return;

    const isVisible = typeof btn.visible === 'function' ? btn.visible(entity) : true;
    if (!isVisible) return;

    const iconConfig = ICON_MAP[btn.id] || { name: 'settings', fallback: '⚙️' };

    let onClick = null;
    if (btn.id === 'save') onClick = callbacks.onSave;
    else if (btn.id === 'delete') onClick = callbacks.onDelete;
    else if (btn.action) onClick = () => btn.action(entity, callbacks.onClose);

    const actionBtn = createButton({
      label: btn.label,
      iconName: iconConfig.name,
      fallbackEmoji: iconConfig.fallback,
      onClick,
    });

    footer.appendChild(actionBtn);
  });

  return footer;
}
