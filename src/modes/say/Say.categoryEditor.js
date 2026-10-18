// src/modes/say/Say.categoryEditor.js
import { openVerticalEditor } from '@components/common/VerticalEditor';
import { toast } from '@utils/toast';
import { findCardImage } from '@utils/cardBank';

export function openCategoryEditor(category, onSave) {
  const entity = { ...category };

  openVerticalEditor({
    title: 'Редактировать категорию',
    entity,
    editorType: 'category',
    preview: true,
    onSave: (updated, done) => {
      if (!updated.name || !updated.name.trim()) {
        toast('Введите название', 'error');
        done();
        return;
      }
      Object.assign(category, updated);
      onSave(category, done);
    },
    fields: [
      {
        id: 'name',
        label: 'Название',
        type: 'text',
        required: true,
        placeholder: 'Например: Еда',
        onChange: (value, ent) => {
          if (ent.imageId) return;
          const found = findCardImage(value);
          if (found) {
            ent.imagePath = found;
          } else {
            ent.imagePath = null;
          }
        },
      },
      {
        id: 'hidden',
        label: 'Скрыть в основном режиме',
        type: 'toggle',
      },
    ],
    buttons: [
      {
        id: 'save',
        label: '💾 Сохранить',
        variant: 'primary',
      },
    ],
  });
}
