// src/config/defaultData/cards.js
export const CARDS_BY_CATEGORY = {
  // ----- Потребности -----
  needs: [
    { text: 'Пить', emoji: '🚰', wordType: 'verb', imagePath: 'cards/drink.webp' },
    { text: 'Есть', emoji: '🍽️', wordType: 'verb', imagePath: 'cards/eat.webp' },
    { text: 'Спать', emoji: '😴', wordType: 'verb', imagePath: 'cards/sleep.webp' },
    { text: 'Туалет', emoji: '🚽', wordType: 'noun', imagePath: 'cards/toilet.webp' },
    { text: 'Помоги', emoji: '🆘', wordType: 'verb', imagePath: 'cards/help-request.webp' },
    { text: 'Больно', emoji: '🤕', wordType: 'other', imagePath: 'cards/pain.webp' },
    { text: 'Устал', emoji: '😩', wordType: 'other', imagePath: 'cards/tired.webp' },
    { text: 'Обнимашки', emoji: '🤗', wordType: 'noun', imagePath: 'cards/hug.webp' },
    { text: 'Играть', emoji: '🎮', wordType: 'verb', imagePath: 'cards/game.webp' },
  ],

  // ----- Эмоции -----
  emotions: [
    { text: 'Радость', emoji: '😊', wordType: 'noun', imagePath: 'cards/joy.webp' },
    { text: 'Грусть', emoji: '😢', wordType: 'noun', imagePath: 'cards/sadness.webp' },
    { text: 'Злость', emoji: '😡', wordType: 'noun', imagePath: 'cards/anger.webp' },
    { text: 'Страх', emoji: '😨', wordType: 'noun', imagePath: 'cards/fear.webp' },
    { text: 'Спокойно', emoji: '😌', wordType: 'other', imagePath: 'cards/calm.webp' },
    { text: 'Скучно', emoji: '😐', wordType: 'other', imagePath: 'cards/bored.webp' },
  ],

  // ----- Просьбы -----
  requests: [
    { text: 'Дай', emoji: '🤲', wordType: 'verb', imagePath: 'cards/give.webp' },
    { text: 'Помоги', emoji: '🆘', wordType: 'verb', imagePath: 'cards/help-request.webp' },
    { text: 'Покажи', emoji: '👀', wordType: 'verb', imagePath: 'cards/show.webp' },
  ],

  // ----- Еда (существительные) -----
  food: [
    { text: 'Хлеб', emoji: '🍞', wordType: 'noun', imagePath: 'cards/bread.webp' },
    { text: 'Яблоко', emoji: '🍎', wordType: 'noun', imagePath: 'cards/apple.webp' },
    { text: 'Банан', emoji: '🍌', wordType: 'noun', imagePath: 'cards/banana.webp' },
    { text: 'Суп', emoji: '🍲', wordType: 'noun', imagePath: 'cards/soup.webp' },
    { text: 'Каша', emoji: '🥣', wordType: 'noun', imagePath: 'cards/porridge.webp' },
    { text: 'Печенье', emoji: '🍪', wordType: 'noun', imagePath: 'cards/cookie.webp' },
    { text: 'Сыр', emoji: '🧀', wordType: 'noun', imagePath: 'cards/cheese.webp' },
  ],

  // ----- Напитки (существительные) -----
  drinks: [
    { text: 'Вода', emoji: '💧', wordType: 'noun', imagePath: 'cards/water.webp' },
    { text: 'Молоко', emoji: '🥛', wordType: 'noun', imagePath: 'cards/milk.webp' },
    { text: 'Сок', emoji: '🧃', wordType: 'noun', imagePath: 'cards/juice.webp' },
    { text: 'Чай', emoji: '🍵', wordType: 'noun', imagePath: 'cards/tea.webp' },
  ],

  // ----- Игры -----
  games: [
    { text: 'Конструктор', emoji: '🧩', wordType: 'noun', imagePath: 'cards/lego.webp' },
    { text: 'Кубики', emoji: '🎲', wordType: 'noun', imagePath: 'cards/blocks.webp' },
    { text: 'Машинка', emoji: '🚗', wordType: 'noun', imagePath: 'cards/car.webp' },
  ],

  // ----- Цвета (прилагательные) -----
  colors: [
    { text: 'Красный', emoji: '🔴', wordType: 'adjective', imagePath: 'cards/red.webp' },
    { text: 'Оранжевый', emoji: '🟠', wordType: 'adjective', imagePath: 'cards/orange.webp' },
    { text: 'Жёлтый', emoji: '🟡', wordType: 'adjective', imagePath: 'cards/yellow.webp' },
    { text: 'Зелёный', emoji: '🟢', wordType: 'adjective', imagePath: 'cards/green.webp' },
    { text: 'Синий', emoji: '🔵', wordType: 'adjective', imagePath: 'cards/blue.webp' },
    { text: 'Фиолетовый', emoji: '🟣', wordType: 'adjective', imagePath: 'cards/purple.webp' },
    { text: 'Коричневый', emoji: '🟤', wordType: 'adjective', imagePath: 'cards/brown.webp' },
    { text: 'Белый', emoji: '⚪', wordType: 'adjective', imagePath: 'cards/white.webp' },
    { text: 'Чёрный', emoji: '⚫', wordType: 'adjective', imagePath: 'cards/black.webp' },
  ],
};
