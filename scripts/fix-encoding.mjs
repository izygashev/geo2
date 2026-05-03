import { readFileSync, writeFileSync } from 'fs';

const path = 'd:/saastest/GEO/src/app/dashboard/reports/[id]/page.tsx';
let content = readFileSync(path, 'utf8');

// Helper: detect if string contains mojibake (Latin chars that should be Cyrillic)
// We'll do targeted replacements of known corrupted sequences

const fixes = [
  // "no data" message
  [/Р"Р°РЅРЅС‹С… РѕР± СѓРїРѕРјРёРЅР°РЅРёСЏС… РїРѕРєР° РЅРµС‚/g, 'Данных об упоминаниях пока нет'],
  // Platform labels
  [/РҐР°Р±СЂ/g, 'Хабр'],
  [/РџРёРєР°Р±Сѓ/g, 'Пикабу'],
  [/РћС‚Р·РѕРІРёРє/g, 'Отзовик'],
  [/РЇРЅРґРµРєСЃ РљР°СЂС‚С‹/g, 'Яндекс Карты'],
  [/2Р"РРЎ/g, '2ГИС'],
  // localizeContext return strings
  [/Р'СЂРµРЅРґ СѓРїРѕРјРёРЅР°РµС‚СЃСЏ РЅР°/g, 'Бренд упоминается на'],
  [/РЈРїРѕРјРёРЅР°РЅРёСЏ РЅР°/g, 'Упоминания на'],
  [/РћСЂРіР°РЅРёС‡РµСЃРєРёРµ СѓРїРѕРјРёРЅР°РЅРёСЏ РЅР°/g, 'Органические упоминания на'],
  [/РЅРµ РЅР°Р№РґРµРЅС‹/g, 'не найдены'],
  // Corrupted regex character class
  [/\[Р°-СЏРђ-РЇС'РЃ\]/g, '[а-яА-ЯёЁ]'],
  // Digital PR heading (mojibake for em-dash)
  [/Digital PR вЂ" РіРґРµ Рѕ РІР°СЃ РіРѕРІРѕСЂСЏС‚/g, 'Digital PR — где о вас говорят'],
  // "Open ->" link
  [/РћС‚РєСЂС‹С‚СЊ в†'/g, 'Открыть →'],
  // Sentiment labels
  [/РџРѕР·РёС‚РёРІРЅРѕ/g, 'Позитивно'],
  [/РќРµРіР°С‚РёРІРЅРѕ/g, 'Негативно'],
  [/РќРµР№С‚СЂР°Р»СЊРЅРѕ/g, 'Нейтрально'],
  // Tab 3 comment header
  [/TAB 3 вЂ" РџР»Р°РЅ СЂР°Р±РѕС‚/g, 'TAB 3 — План работ'],
  // Box-drawing chars in comments (╒╒... etc corrupted)
  [/в•ђ/g, '─'],
];

for (const [pattern, replacement] of fixes) {
  content = content.replace(pattern, replacement);
}

writeFileSync(path, content, 'utf8');
console.log('Done. File size:', content.length, 'chars');
// Show lines around the fixed area
const lines = content.split('\n');
lines.slice(530, 605).forEach((l, i) => console.log(530 + i + 1, l));
