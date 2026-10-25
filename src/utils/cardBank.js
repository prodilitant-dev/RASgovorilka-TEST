// src/utils/cardBank.js
import { CARD_BANK } from '@config/cardBank';

export function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/ё/g, 'е').trim();
}

/**
 * Ищет совпадения для автокомплита (по тексту и синонимам).
 */
export function searchCardBank(query) {
  const norm = normalizeText(query);
  if (!norm) return [];

  const results = CARD_BANK.filter((item) => {
    if (normalizeText(item.word).includes(norm)) return true;
    return item.synonyms?.some((a) => normalizeText(a).includes(norm));
  });

  results.sort((a, b) => {
    const aWord = normalizeText(a.word);
    const bWord = normalizeText(b.word);
    const aExact = aWord === norm || a.synonyms?.some((al) => normalizeText(al) === norm);
    const bExact = bWord === norm || b.synonyms?.some((al) => normalizeText(al) === norm);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    const aStarts = aWord.startsWith(norm);
    const bStarts = bWord.startsWith(norm);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return aWord.localeCompare(bWord);
  });

  return results.slice(0, 10).map((item) => ({
    text: item.word.charAt(0).toUpperCase() + item.word.slice(1),
    rawWord: item.word,
    imagePath: `cards/${item.category}/${item.filename || item.word + '.webp'}`,
    emoji: item.emoji,
    wordType: item.wordType,
    gender: item.gender,
    category: item.category, // <--- ВАЖНО: добавили
    filename: item.filename, // <--- ВАЖНО: добавили
    variants: item.variants || [],
  }));
}

/**
 * Точное совпадение (когда пользователь полностью ввел слово).
 */
export function findCardImage(text) {
  const norm = normalizeText(text);
  const found = CARD_BANK.find(
    (item) =>
      normalizeText(item.word) === norm || item.synonyms?.some((a) => normalizeText(a) === norm)
  );
  return found ? `cards/${found.category}/${found.filename || found.word + '.webp'}` : null;
}
