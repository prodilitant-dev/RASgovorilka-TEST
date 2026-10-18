// src/utils/uiSize.js
import { logger } from './logger';

const VALID_SIZES = ['small', 'medium', 'large'];
const DEFAULT_SIZE = 'small';

/**
 * Применяет класс ui-* к <html>.
 * @param {'small'|'medium'|'large'} size
 */
export function applyUISize(size) {
  const safeSize = VALID_SIZES.includes(size) ? size : DEFAULT_SIZE;
  const html = document.documentElement;
  html.classList.remove('ui-small', 'ui-medium', 'ui-large');
  html.classList.add(`ui-${safeSize}`);
  logger.debug(`UI size applied: ${safeSize}`);
}
