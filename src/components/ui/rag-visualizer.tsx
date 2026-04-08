"use client";

import { useState } from "react";
import { AlertTriangle, Layers, Hash, ChevronDown, ChevronUp } from "lucide-react";

/* ── Token estimation helpers ── */

const CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_TOKENS = 800;
const TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN;

/** Rough token count: 1 token ≈ 4 characters */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Header pattern: lines that look like markdown headings or HTML h1-h6 */
const HEADER_RE = /^(?:#{1,6}\s|<h[1-6][\s>])/i;

function startsWithHeader(text: string): boolean {
  const firstLine = text.trimStart().split("\n")[0] ?? "";
  return HEADER_RE.test(firstLine.trim());
}

interface Chunk {
  id: number;
  text: string;
  tokens: number;
  hasHeader: boolean;
}

/**
 * Split text into chunks of ≈800 tokens each.
 * Tries to break on paragraph boundaries (\n\n) to keep content coherent.
 */
function chunkText(text: string): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  const paragraphs = text.split(/\n{2,}/);
  const chunks: Chunk[] = [];
  let buffer = "";
  let id = 0;

  for (const para of paragraphs) {
    const combined = buffer ? `${buffer}\n\n${para}` : para;

    if (combined.length > TARGET_CHUNK_CHARS && buffer.length > 0) {
      // flush the buffer as a chunk
      id++;
      chunks.push({
        id,
        text: buffer.trim(),
        tokens: estimateTokens(buffer.trim()),
        hasHeader: startsWithHeader(buffer.trim()),
      });
      buffer = para;
    } else {
      buffer = combined;
    }
  }

  // remaining buffer
  if (buffer.trim().length > 0) {
    id++;
    chunks.push({
      id,
      text: buffer.trim(),
      tokens: estimateTokens(buffer.trim()),
      hasHeader: startsWithHeader(buffer.trim()),
    });
  }

  return chunks;
}

/* ── Sub-components ── */

function ChunkCard({ chunk, index }: { chunk: Chunk; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const preview = chunk.text.slice(0, 220);
  const isLong = chunk.text.length > 220;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border p-4 transition-all duration-200 ${
        chunk.hasHeader
          ? "border-[#E5E5E3] bg-white hover:border-[#D5D5D5] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          : "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)]"
      }`}
    >
      {/* Top row: chunk number + token badge + warning */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F5F5F4] text-[10px] font-bold text-[#787774]">
            {index + 1}
          </span>
          <span className="rounded-md bg-[#F5F5F4] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#787774]">
            ~{chunk.tokens} токенов
          </span>
        </div>

        {!chunk.hasHeader && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            Нет заголовка
          </span>
        )}

        {chunk.hasHeader && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            <Hash className="h-3 w-3" />
            Заголовок
          </span>
        )}
      </div>

      {/* Text preview */}
      <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-[#444]">
        {expanded ? chunk.text : preview}
        {!expanded && isLong && <span className="text-[#BBBBBB]">…</span>}
      </pre>

      {/* Expand/collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 inline-flex items-center gap-1 self-start text-[12px] font-medium text-[#787774] transition-colors hover:text-[#1a1a1a]"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Свернуть
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Показать полностью
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ── Main component ── */

interface RagVisualizerProps {
  text: string;
}

export function RagVisualizer({ text }: RagVisualizerProps) {
  const chunks = chunkText(text);
  const totalTokens = estimateTokens(text);
  const warningCount = chunks.filter((c) => !c.hasHeader).length;

  if (chunks.length === 0) {
    return (
      <div className="rounded-xl border border-[#EAEAEA] bg-[#FAFAF9] p-8 text-center">
        <Layers className="mx-auto mb-3 h-8 w-8 text-[#D5D5D5]" />
        <p className="text-sm text-[#787774]">Нет текста для анализа чанков.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EAEAEA] bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#787774]" />
          <span className="text-sm font-semibold text-[#1a1a1a]">RAG-чанки</span>
        </div>

        <div className="h-4 w-px bg-[#EAEAEA]" />

        <span className="rounded-md bg-[#F5F5F4] px-2.5 py-1 text-xs font-medium tabular-nums text-[#555]">
          {chunks.length} {chunks.length === 1 ? "блок" : chunks.length < 5 ? "блока" : "блоков"}
        </span>

        <span className="rounded-md bg-[#F5F5F4] px-2.5 py-1 text-xs font-medium tabular-nums text-[#555]">
          ~{totalTokens.toLocaleString("ru-RU")} токенов
        </span>

        {warningCount > 0 && (
          <>
            <div className="h-4 w-px bg-[#EAEAEA]" />
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {warningCount} без заголовка
            </span>
          </>
        )}
      </div>

      {/* Info banner */}
      {warningCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-3">
          <p className="text-[13px] leading-relaxed text-amber-800">
            <strong>Совет:</strong> Чанки без заголовка теряют контекст при RAG-парсинге.
            Добавьте H2/H3 перед каждым смысловым блоком, чтобы ИИ точнее понимал тему раздела.
          </p>
        </div>
      )}

      {/* Chunk grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {chunks.map((chunk, i) => (
          <ChunkCard key={chunk.id} chunk={chunk} index={i} />
        ))}
      </div>
    </div>
  );
}
