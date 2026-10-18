// src/utils/cardBank.js
import { CARD_BANK } from '@config/cardBank';

/**
 * Нормализует текст для поиска: нижний регистр, ё->е, обрезка пробелов.
 */
export function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/ё/g, 'е').trim();
}

/**
 * Ищет картинку в банке по точному совпадению.
 */
export function findCardImage(text) {
  const normalized = normalizeText(text);
  return CARD_BANK[normalized] || null;
}

/**
 * Ищет совпадения для автокомплита.
 * Возвращает массив { text, imagePath }.
 */
export function searchCardBank(query) {
  const normalized = normalizeText(query);
  if (!normalized || normalized.length < 1) return [];

  const results = [];
  for (const [key, path] of Object.entries(CARD_BANK)) {
    if (key.includes(normalized)) {
      results.push({ text: key, imagePath: path });
    }
  }

  // Сортировка: сначала те, что начинаются с query
  results.sort((a, b) => {
    const aStarts = a.text.startsWith(normalized);
    const bStarts = b.text.startsWith(normalized);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.text.localeCompare(b.text);
  });

  return results.slice(0, 10); // Ограничим 10 вариантами
}
