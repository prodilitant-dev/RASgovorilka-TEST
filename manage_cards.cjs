// manage_cards.cjs
const fs = require('fs');
const path = require('path');

const CARDS_DIR = 'src/public/cards';
const JSON_FILE = 'src/config/cards_data.json';
const JS_DIR = 'src/config/cardBank';

// 1. Загружаем базу
let db = { words: {} };
if (fs.existsSync(JSON_FILE)) {
  db = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
}

// 2. Сканируем папки и собираем реально существующие слова
const foundWords = {};
const categories = fs.readdirSync(CARDS_DIR).filter(f => {
  return fs.statSync(path.join(CARDS_DIR, f)).isDirectory();
});

categories.forEach(cat => {
  const catPath = path.join(CARDS_DIR, cat);
  const files = fs.readdirSync(catPath).filter(f => f.endsWith('.webp'));
  
  files.forEach(file => {
    // Проверяем, является ли это вариантом (заканчивается на _2, _3 и т.д.)
    const match = file.match(/^(.*)_(\d+)\.webp$/);
    let baseName, isVariant = false;
    
    if (match) {
      baseName = match[1]; // Например, "больно" из "больно_2.webp"
      isVariant = true;
    } else {
      baseName = file.replace('.webp', ''); // Например, "спортивные_штаны"
    }
    
    // Красивое отображение для текста карточки (заменяем подчеркивания на пробелы)
    const displayWord = baseName.replace(/_/g, ' ');
    
    if (foundWords[displayWord]) {
      // Если слово уже найдено в другой папке — предупреждаем и оставляем первое
      if (isVariant) {
        foundWords[displayWord].variants.push(file);
      } else {
        console.warn(`⚠️ Дубликат: "${displayWord}" найден в "${cat}" и "${foundWords[displayWord].category}". Оставляем в "${foundWords[displayWord].category}"`);
      }
      return;
    }
    
    foundWords[displayWord] = {
      word: displayWord,
      filename: baseName + '.webp', // Сохраняем реальное имя файла!
      category: cat,
      variants: []
    };
    
    if (isVariant) {
      foundWords[displayWord].variants.push(file);
    }
  });
});

// 3. Синхронизируем базу (добавляем новые, обновляем старые, УДАЛЯЕМ отсутствующие)
const newWords = {};
let addedCount = 0;
let updatedCount = 0;
let removedCount = 0;

Object.keys(foundWords).forEach(key => {
  const found = foundWords[key];
  
  if (db.words[key]) {
    // Слово уже есть — обновляем пути и варианты, сохраняем ручные эмодзи/синонимы
    db.words[key].category = found.category;
    db.words[key].filename = found.filename;
    db.words[key].variants = found.variants.sort();
    newWords[key] = db.words[key];
    updatedCount++;
  } else {
    // Новое слово — добавляем с заглушками
    newWords[key] = {
      word: found.word,
      filename: found.filename,
      category: found.category,
      emoji: '🖼️',
      wordType: 'noun',
      gender: 'm',
      synonyms: [],
      variants: found.variants.sort()
    };
    addedCount++;
  }
});

// Считаем удаленные (те, что были в JSON, но пропали с диска)
Object.keys(db.words).forEach(key => {
  if (!foundWords[key]) {
    removedCount++;
  }
});

db.words = newWords;

// 4. Сохраняем JSON
fs.writeFileSync(JSON_FILE, JSON.stringify(db, null, 2), 'utf-8');
console.log(`\n💾 База данных синхронизирована`);
console.log(`➕ Добавлено новых: ${addedCount}`);
console.log(`🔄 Обновлено: ${updatedCount}`);
console.log(`🗑️ Удалено (нет на диске): ${removedCount}`);

// 5. Генерируем JS-файлы для Vite
if (!fs.existsSync(JS_DIR)) fs.mkdirSync(JS_DIR, { recursive: true });

const jsFilesData = {};
Object.values(db.words).forEach(item => {
  if (!jsFilesData[item.category]) jsFilesData[item.category] = [];
  jsFilesData[item.category].push(item);
});

let indexImports = '';
let indexExports = '';

Object.keys(jsFilesData).forEach(cat => {
  const catData = jsFilesData[cat];
  const varName = cat.toUpperCase(); // EDA, ODEZHDA...
  
  const jsArray = catData.map(item => {
    return `  { word: '${item.word}', filename: '${item.filename}', category: '${item.category}', emoji: '${item.emoji}', wordType: '${item.wordType}', gender: '${item.gender}', synonyms: ${JSON.stringify(item.synonyms)}, variants: ${JSON.stringify(item.variants)} }`;
  }).join(',\n');

  const fileContent = `// Сгенерировано автоматически. Редактируйте cards_data.json\n\nexport const ${varName} = [\n${jsArray}\n];\n`;
  fs.writeFileSync(path.join(JS_DIR, `${cat}.js`), fileContent, 'utf-8');
  
  indexImports += `import { ${varName} } from './${cat}';\n`;
  indexExports += `  ...${varName},\n`;
});

const indexContent = `// Сгенерировано автоматически\n${indexImports}\nexport const CARD_BANK = [\n${indexExports}];\n`;
fs.writeFileSync(path.join(JS_DIR, 'index.js'), indexContent, 'utf-8');

console.log(`⚙️ JS-файлы перегенерированы (найдено категорий: ${Object.keys(jsFilesData).length})\n`);