// src/utils/cardBank.js
import { CARD_BANK } from '@config/cardBank';

export function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/ё/g, 'е').trim();
}

export function searchCardBank(query) {
  const norm = normalizeText(query);
  if (!norm) return [];

  const results = CARD_BANK.filter((item) => {
    return (
      normalizeText(item.word).includes(norm) ||
      item.synonyms?.some((a) => normalizeText(a).includes(norm))
    );
  });

  results.sort((a, b) => {
    const aWord = normalizeText(a.word);
    const bWord = normalizeText(b.word);
    const aExact = aWord === norm || a.synonyms?.some((al) => normalizeText(al) === norm);
    const bExact = bWord === norm || b.synonyms?.some((al) => normalizeText(al) === norm);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return aWord.localeCompare(bWord);
  });

  return results.slice(0, 10).map((item) => {
    const isWordMatch = normalizeText(item.word).includes(norm);
    let displayText, inputValue;

    if (!isWordMatch) {
      // Совпадение по синониму
      const matchedSyn = item.synonyms.find((s) => normalizeText(s).includes(norm));
      const capSyn = matchedSyn.charAt(0).toUpperCase() + matchedSyn.slice(1);
      const capWord = item.word.charAt(0).toUpperCase() + item.word.slice(1);

      displayText = `${capSyn} (${capWord})`; // "Пёс (Собака)"
      inputValue = capSyn; // В поле подставим "Пёс"
    } else {
      // Совпадение по главному слову
      displayText = item.word.charAt(0).toUpperCase() + item.word.slice(1);
      inputValue = displayText;
    }

    return {
      text: displayText,
      inputValue: inputValue,
      rawWord: item.word,
      imagePath: `cards/${item.category}/${item.filename || item.word + '.webp'}`,
      emoji: item.emoji,
      wordType: item.wordType,
      gender: item.gender,
      category: item.category,
      filename: item.filename,
      variants: item.variants || [],
    };
  });
}

export function findCardImage(text) {
  const norm = normalizeText(text);
  // Ищем по слову или синониму
  const found = CARD_BANK.find(
    (item) =>
      normalizeText(item.word) === norm || item.synonyms?.some((a) => normalizeText(a) === norm)
  );
  return found ? `cards/${found.category}/${found.filename || found.word + '.webp'}` : null;
}

// Добавим функцию для поиска карточки в базе (для редактора)
export function findBankItem(text) {
  const norm = normalizeText(text);
  return CARD_BANK.find(
    (item) =>
      normalizeText(item.word) === norm || item.synonyms?.some((a) => normalizeText(a) === norm)
  );
}
