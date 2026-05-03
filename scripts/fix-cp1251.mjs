// Декодирует CP1251-in-UTF8 mojibake обратно в правильный UTF-8
// Цепочка порчи: UTF-8 Cyrillic → PowerShell прочитал как CP1251 → записал как UTF-8
// Обратная цепочка: читаем UTF-8, берём кодпоинты как байты CP1251, декодируем как UTF-8

import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Таблица CP1251: Unicode codepoint → байт
// Для 0x00-0x7F: codepoint == byte
// Для 0x80-0xFF: нестандартные маппинги
const CP1251_UNICODE = [
  // 0x80-0x9F (Windows-1251 special range)
  0x0402, 0x0403, 0x201A, 0x0453, 0x201E, 0x2026, 0x2020, 0x2021,
  0x20AC, 0x2030, 0x0409, 0x2039, 0x040A, 0x040C, 0x040B, 0x040F,
  0x0452, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014,
  0x0000, 0x2122, 0x045A, 0x203A, 0x045C, 0x045D, 0x045B, 0x045F,
  // 0xA0-0xFF (Windows-1251 second half)
  0x00A0, 0x040E, 0x045E, 0x0408, 0x00A4, 0x0490, 0x00A6, 0x00A7,
  0x0401, 0x00A9, 0x0404, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x0407,
  0x00B0, 0x00B1, 0x0406, 0x0456, 0x0491, 0x00B5, 0x00B6, 0x00B7,
  0x0451, 0x2116, 0x0454, 0x00BB, 0x0458, 0x0405, 0x0455, 0x0457,
  // 0xC0-0xFF: Cyrillic А-Я а-я
  0x0410, 0x0411, 0x0412, 0x0413, 0x0414, 0x0415, 0x0416, 0x0417,
  0x0418, 0x0419, 0x041A, 0x041B, 0x041C, 0x041D, 0x041E, 0x041F,
  0x0420, 0x0421, 0x0422, 0x0423, 0x0424, 0x0425, 0x0426, 0x0427,
  0x0428, 0x0429, 0x042A, 0x042B, 0x042C, 0x042D, 0x042E, 0x042F,
  0x0430, 0x0431, 0x0432, 0x0433, 0x0434, 0x0435, 0x0436, 0x0437,
  0x0438, 0x0439, 0x043A, 0x043B, 0x043C, 0x043D, 0x043E, 0x043F,
  0x0440, 0x0441, 0x0442, 0x0443, 0x0444, 0x0445, 0x0446, 0x0447,
  0x0448, 0x0449, 0x044A, 0x044B, 0x044C, 0x044D, 0x044E, 0x044F,
];

// Строим обратную таблицу: Unicode codepoint → byte value
const unicodeToCP1251 = new Map();
for (let b = 0; b <= 0x7F; b++) unicodeToCP1251.set(b, b);
for (let i = 0; i < CP1251_UNICODE.length; i++) {
  const cp = CP1251_UNICODE[i];
  if (cp !== 0) unicodeToCP1251.set(cp, 0x80 + i);
}

function tryDecodeCP1251(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const cp = str.charCodeAt(i);
    const byte = unicodeToCP1251.get(cp);
    if (byte === undefined) return null; // не можем декодировать — не трогаем строку
    bytes.push(byte);
  }
  try {
    const decoded = Buffer.from(bytes).toString('utf8');
    // Проверяем: декодирование успешно если нет replacement chars и есть кириллица
    if (decoded.includes('\uFFFD')) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Детектор мусорных строк: содержит Р+нелатин или С+нелатин
function hasMojibake(str) {
  return /[\u0420-\u0421][\u0080-\u25FF]/.test(str);
}

const path = 'd:/saastest/GEO/src/app/dashboard/reports/[id]/page.tsx';
const content = readFileSync(path, 'utf8');
const lines = content.split('\n');

let fixed = 0;
let failed = 0;

const result = lines.map((line, i) => {
  if (!hasMojibake(line)) return line;
  
  // Пробуем декодировать всю строку целиком
  const decoded = tryDecodeCP1251(line);
  if (decoded !== null && /[\u0400-\u04FF]/.test(decoded)) {
    fixed++;
    return decoded;
  }
  
  // Строка содержит смесь — декодируем посегментно
  // Разбиваем на "мусорные" и "чистые" части
  let result = '';
  let i2 = 0;
  while (i2 < line.length) {
    // Собираем "мусорный" сегмент
    if (hasMojibake(line.slice(i2, i2 + 2))) {
      let end = i2;
      // Находим конец мусорного сегмента
      while (end < line.length) {
        const cp = line.charCodeAt(end);
        if (unicodeToCP1251.has(cp)) {
          end++;
        } else {
          break;
        }
      }
      const segment = line.slice(i2, end);
      const decodedSeg = tryDecodeCP1251(segment);
      if (decodedSeg !== null) {
        result += decodedSeg;
        fixed++;
      } else {
        result += segment;
        failed++;
      }
      i2 = end;
    } else {
      result += line[i2];
      i2++;
    }
  }
  return result;
});

writeFileSync(path, result.join('\n'), 'utf8');

console.log(`Fixed segments: ${fixed}, failed: ${failed}`);

// Verify
const verify = readFileSync(path, 'utf8').split('\n');
let remaining = 0;
verify.forEach((l, idx) => {
  if (hasMojibake(l)) {
    remaining++;
    if (remaining <= 10) console.log(`Still broken line ${idx+1}:`, l.trim().slice(0, 100));
  }
});
console.log(`Remaining broken lines: ${remaining}`);
