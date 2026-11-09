// src/components/common/Button/Button.js
import { createElement } from '@utils/dom';
import { createIcon } from '@utils/icon';

/**
 * Универсальная кнопка.
 * Если передан iconName — рендерится как прозрачная кнопка-иконка.
 * Если нет — как текстовая кнопка (пилюля).
 */
export function createButton({
  label,
  iconName,
  fallbackEmoji,
  onClick,
  variant = 'default', // 'default' | 'primary' | 'danger'
  className = '',
}) {
  const isIconOnly = !!iconName;

  const btn = createElement('button', {
    type: 'button',
    className:
      `ui-btn ${variant !== 'default' ? 'ui-btn--' + variant : ''} ${isIconOnly ? 'ui-btn--icon' : ''} ${className}`.trim(),
    title: label, // Подсказка при наведении на ПК
    'aria-label': label,
  });

  if (isIconOnly) {
    // Размер 40px — крупные иконки
    btn.appendChild(createIcon(iconName, { fallback: fallbackEmoji, size: 40 }));
  } else {
    btn.textContent = label;
  }

  if (onClick) {
    btn.addEventListener('click', onClick);
  }

  return btn;
}
