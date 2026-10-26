// src/components/common/VerticalEditor/BankPickerModal.js
import { Modal } from '@components/common/Modal/Modal';
import { createElement, on } from '@utils/dom';
import { CARD_BANK } from '@config/cardBank';
import { normalizeText } from '@utils/cardBank';

export function openBankPicker(onSelect) {
  const modal = new Modal({
    title: 'Выбрать картинку из банка',
    body: () => {
      const wrap = createElement('div', { className: 'bank-picker' });

      const input = createElement('input', {
        type: 'text',
        placeholder: 'Поиск карточки...',
        className: 'bank-picker__input',
      });

      const grid = createElement('div', { className: 'bank-picker__grid' });

      const renderGrid = (items) => {
        grid.innerHTML = '';
        items.forEach((item) => {
          const base = import.meta.env.BASE_URL || '/';
          const url = base.endsWith('/')
            ? `${base}cards/${item.category}/${item.filename || item.word + '.webp'}`
            : `${base}/cards/${item.category}/${item.filename || item.word + '.webp'}`;

          const card = createElement('div', { className: 'bank-picker__item' });
          const img = createElement('img', {
            src: url,
            alt: item.word,
            className: 'bank-picker__img',
          });

          img.addEventListener('error', () => {
            img.style.display = 'none';
          });

          const label = createElement('span', { className: 'bank-picker__label' }, item.word);

          card.appendChild(img);
          card.appendChild(label);

          on(card, 'click', () => {
            onSelect(item);
            modal.close();
          });

          grid.appendChild(card);
        });
      };

      on(input, 'input', (e) => {
        const query = normalizeText(e.target.value);
        const filtered = CARD_BANK.filter((item) => normalizeText(item.word).includes(query));
        renderGrid(filtered.slice(0, 50)); // Ограничим для скорости
      });

      renderGrid(CARD_BANK.slice(0, 50));

      wrap.appendChild(input);
      wrap.appendChild(grid);
      return wrap;
    },
    buttons: [{ label: 'Отмена', action: () => modal.close() }],
  });
  modal.open();
}
