"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

/* ── Sanitize helpers ── */

function sanitizeText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/@[\w-]+\s*[\s\S]*?\{[\s\S]*?\}\s*\}?/g, " ")
    .replace(/[.#][\w-]+\s*\{[^}]*\}/g, " ")
    .replace(/(?:[a-z-]+\s*:\s*[^;]{1,60};\s*){2,}/gi, " ")
    .replace(/data:[a-z]+\/[a-z+.-]+;base64,[A-Za-z0-9+/=]{20,}/g, " ")
    .replace(/[0-9a-f]{20,}/gi, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_CHARS = 800 * CHARS_PER_TOKEN;
const HEADER_RE = /^(?:#{1,6}\s|<h[1-6][\s>])/i;

function startsWithHeader(text: string): boolean {
  return HEADER_RE.test((text.trimStart().split("\n")[0] ?? "").trim());
}

interface Chunk {
  id: number;
  text: string;
  hasHeader: boolean;
}

function chunkText(text: string): Chunk[] {
  if (!text.trim()) return [];
  const paragraphs = text.split(/\n{2,}/);
  const chunks: Chunk[] = [];
  let buffer = "";
  let id = 0;

  for (const para of paragraphs) {
    const combined = buffer ? `${buffer}\n\n${para}` : para;
    if (combined.length > TARGET_CHUNK_CHARS && buffer.length > 0) {
      chunks.push({ id: ++id, text: buffer.trim(), hasHeader: startsWithHeader(buffer.trim()) });
      buffer = para;
    } else {
      buffer = combined;
    }
  }
  if (buffer.trim()) {
    chunks.push({ id: ++id, text: buffer.trim(), hasHeader: startsWithHeader(buffer.trim()) });
  }
  return chunks;
}

/* ── Single chunk row ── */

function ChunkRow({ chunk }: { chunk: Chunk }) {
  const [expanded, setExpanded] = useState(false);
  const preview = chunk.text.slice(0, 320);
  const isLong = chunk.text.length > 320;

  return (
    <div className="border-b border-[#EAEAEA] last:border-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#F7F6F3]">
        <span className="font-mono text-[10px] text-[#BBBBBB] select-none">
          [{String(chunk.id).padStart(2, "0")}]
        </span>
        {!chunk.hasHeader && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            нет заголовка
          </span>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="font-mono text-[12px] leading-[1.8] text-[#444] whitespace-pre-wrap break-words">
          {expanded ? chunk.text : preview}
          {!expanded && isLong && <span className="text-[#C5C5C5]"> …</span>}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#999] hover:text-[#555] transition-colors"
          >
            {expanded
              ? <><ChevronUp className="h-3 w-3" /> Свернуть</>
              : <><ChevronDown className="h-3 w-3" /> Развернуть</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main component ── */

interface RagVisualizerProps {
  text: string;
}

export function RagVisualizer({ text }: RagVisualizerProps) {
  const clean = sanitizeText(text);
  const chunks = chunkText(clean);
  const warningCount = chunks.filter((c) => !c.hasHeader).length;

  if (chunks.length === 0) {
    return (
      <div className="rounded-xl border border-[#EAEAEA] bg-[#FBFBFA] p-8 text-center">
        <p className="font-mono text-[13px] text-[#BBBBBB]">
          // контент не найден — нейросеть видит пустую страницу
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14px] font-semibold text-[#1a1a1a]">Рентген контента (глазами ИИ)</h3>
        <p className="mt-0.5 text-[12px] text-[#BBBBBB]">
          Так нейросети видят ваш сайт после очистки от дизайна и анимаций.
        </p>
      </div>

      {/* Instruction block */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 space-y-4 mb-6">
        <div>
          <p className="text-[13px] font-bold text-[#1a1a1a] mb-1">💡 Зачем мы это показываем?</p>
          <p className="text-[13px] text-[#444] leading-relaxed">
            Это точная копия вашего сайта так, как его видят поисковые роботы ChatGPT, Claude и Perplexity. Они не видят красивый дизайн и анимации — они читают только голый текст и HTML-теги.
          </p>
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#1a1a1a] mb-1">� Как понять, что есть проблема?</p>
          <p className="text-[13px] text-[#444] leading-relaxed">
            Если в тексте ниже вы видите системный код, всплывающие окна про Cookies, меню или сплошную кашу без заголовков — нейросеть не сможет понять суть вашего бизнеса и порекомендует конкурентов.
          </p>
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#1a1a1a] mb-1">🛠 Что нужно сделать?</p>
          <p className="text-[13px] text-[#444] leading-relaxed">
            Сделайте скриншот этого экрана и отправьте вашему веб-мастеру с задачей: <span className="font-semibold text-[#222]">«Скрыть технические скрипты от парсеров и структурировать текст услуг с помощью тегов H2 и H3. Либо загрузить готовую структуру через файл llms.txt».</span>
          </p>
        </div>
      </div>

      {warningCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="text-[12px] leading-relaxed text-amber-800">
            <strong>Проблема:</strong> {warningCount} из {chunks.length} фрагментов без заголовков. ИИ не понимает структуру текста.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-[#EAEAEA] bg-[#FBFBFA] overflow-hidden">
        {chunks.map((chunk) => (
          <ChunkRow key={chunk.id} chunk={chunk} />
        ))}
      </div>
    </div>
  );
}
