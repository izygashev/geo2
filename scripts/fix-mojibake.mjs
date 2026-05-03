// Декодирует Windows-1252→UTF-8 mojibake обратно в кириллицу
import { readFileSync, writeFileSync } from 'fs';

const path = 'd:/saastest/GEO/src/app/dashboard/reports/[id]/page.tsx';
let content = readFileSync(path, 'utf8');

// Mojibake таблица: Windows-1252 → UTF-8 → Cyrillic
// Когда UTF-8 кириллица была прочитана как Windows-1252 и снова записана как UTF-8,
// каждый кириллический символ превращается в 2 символа Latin-1/Windows-1252
function decodeMojibake(str) {
  // Конвертируем строку обратно через Buffer
  // Mojibake = UTF-8 байты были неправильно интерпретированы как latin1/cp1252
  try {
    const bytes = Buffer.from(str, 'latin1');
    const decoded = bytes.toString('utf8');
    // Проверяем что декодирование дало кириллицу (не мусор)
    if (/[\u0400-\u04FF]/.test(decoded) && !/\uFFFD/.test(decoded)) {
      return decoded;
    }
  } catch {}
  return str;
}

// Разбиваем на строки и обрабатываем каждую строку-кандидата на mojibake
const lines = content.split('\n');
const fixed = lines.map(line => {
  // Строка содержит mojibake если в ней есть Р + [А-Я] или С + [а-я] паттерны
  if (/\u0420[\u0020-\u00ff]|\u0421[\u0020-\u00ff]/.test(line)) {
    return decodeMojibake(line);
  }
  return line;
});

const result = fixed.join('\n');
writeFileSync(path, result, 'utf8');

// Проверка
const verify = readFileSync(path, 'utf8').split('\n');
let remaining = 0;
verify.forEach((l, i) => {
  if (/\u0420[\u0041-\u00ff]|\u0421[\u0041-\u00ff]/.test(l)) {
    remaining++;
    if (remaining <= 5) console.log('Still broken:', i+1, l.trim().slice(0,80));
  }
});
console.log(`Done. Remaining broken lines: ${remaining}`);
