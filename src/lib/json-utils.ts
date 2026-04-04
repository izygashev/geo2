/**
 * Утилиты для безопасного извлечения и починки JSON из ответов LLM.
 *
 * Используется в:
 * - src/services/llm.ts (полный анализ)
 * - src/app/api/analyze/route.ts (экспресс-анализ)
 */

/** Извлечение JSON из ответа LLM (убирает markdown fences и прочий мусор) */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text.trim();
}

/** Починка обрезанного JSON (незакрытые скобки, строки) */
export function repairJson(raw: string): string {
  let s = raw.trim();
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of s) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }

  if (inString) s += '"';
  while (brackets > 0) { s += "]"; brackets--; }
  while (braces > 0) { s += "}"; braces--; }
  return s;
}

/** Нормализация URL (добавляет https:// если нет) */
export function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}
