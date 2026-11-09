// src/modes/stories/components/editor/SlideNavigation.js
import { createElement, on } from '@utils/dom';
import { createIcon } from '@utils/icon';
import { confirm } from '@utils/dialog';

export function createSlideNavigation(workingStory, currentSlideIndex, onUpdate, onDeleteSlide) {
  const topBar = createElement('div', { className: 'story-slide-top-bar' });

  // Точки навигации
  const dotsWrap = createElement('div', { className: 'story-slide-dots' });
  workingStory.slides.forEach((_, idx) => {
    const dot = createElement('div', {
      className: `story-slide-dot ${idx === currentSlideIndex ? 'active' : ''}`,
    });
    on(dot, 'click', () => onUpdate(idx));
    dotsWrap.appendChild(dot);
  });
  topBar.appendChild(dotsWrap);

  // Кнопка удаления (крестик)
  const btnDel = createElement('button', {
    className: 'story-slide-del-btn',
    type: 'button',
    'aria-label': 'Удалить слайд',
  });
  
  // Используем наш общий хелпер: подтянет иконку close.webp, а если её нет — покажет ✕
  btnDel.appendChild(createIcon('close', { fallback: '✕' }));

  on(btnDel, 'click', () => {
    confirm('Удалить этот слайд?', 'Подтверждение').then((ok) => {
      if (ok) onDeleteSlide();
    });
  });
  
  topBar.appendChild(btnDel);

  return topBar;
}