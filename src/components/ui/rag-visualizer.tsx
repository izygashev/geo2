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

/**
 * Strip residual JS/CSS artifacts that may have leaked into scrapedBody
 * from older reports stored before the scraper fix.
 * Must be aggressive — B2B users should never see raw code.
 */
function sanitizeText(raw: string): string {
  let text = raw
    // Remove inline <script>…</script>, <style>…</style>, <noscript>, <svg>, <template> leftovers
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<template[\s\S]*?<\/template>/gi, "")
    // Strip stray HTML tags
    .replace(/<[^>]+>/g, " ")
    // Common minified JS patterns (Next.js, Webpack, Vite, Nuxt)
    .replace(/!function\s*\([^)]*\)\s*\{[\s\S]{0,2000}?\}/g, "")
    .replace(/\(function\s*\([^)]*\)\s*\{[\s\S]{0,2000}?\}\)/g, "")
    .replace(/var\s+__[A-Z_]+=[\s\S]{0,1000}?;/g, "")
    .replace(/\(self\.__next_f=self\.__next_f[\s\S]{0,1000}?\)/g, "")
    .replace(/self\.__next_f\.push[\s\S]{0,1000}?\)/g, "")
    // Webpack/Vite chunk hashes: e.g. "static/chunks/abc123-def456.js"
    .replace(/static\/chunks\/[\w\-\.]+\.js/g, "")
    // Stray JSON blobs (e.g. {"prop":"value",...})
    .replace(/\{(?:"[\w]+":\s*(?:"[^"]*"|[\d.]+|true|false|null|(?:\{[^}]*\}))\s*,?\s*){3,}\}/g, "")
    // CSS-like property blocks: display:flex;justify-content:center;…
    .replace(/(?:[a-z-]+\s*:\s*[^;]{1,40};\s*){3,}/gi, "")
    // Base64 data URIs
    .replace(/data:[a-z]+\/[a-z+.-]+;base64,[A-Za-z0-9+/=]{20,}/g, "")
    // Long hex/hash strings (>20 chars) — likely asset hashes or tokens
    .replace(/[0-9a-f]{20,}/gi, "")
    // Escaped unicode sequences (e.g. \u003c, \x3c)
    .replace(/(?:\\u[0-9a-f]{4}|\\x[0-9a-f]{2}){3,}/gi, "")
    // Collapse excessive whitespace
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Final pass: if a "paragraph" still looks like code (high density of {, }, ;, =, =>)
  // remove it entirely
  const lines = text.split("\n\n");
  const cleaned = lines.filter((para) => {
    const codeChars = (para.match(/[{};=()]/g) || []).length;
    const ratio = codeChars / Math.max(para.length, 1);
    // If >15% of characters are code syntax AND the paragraph is short-ish, drop it
    return ratio < 0.15 || para.length > 500;
  });
  text = cleaned.join("\n\n");

  return text;
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
  const preview = chunk.text.slice(0, 320);
  const isLong = chunk.text.length > 320;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border transition-all duration-200 ${
        chunk.hasHeader
          ? "border-[#E5E5E3] bg-white hover:border-[#D5D5D5] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          : "border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:shadow-[0_4px_20px_rgba(245,158,11,0.06)]"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 border-b border-[#F0F0EE] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#EEEEED] text-[10px] font-bold tabular-nums text-[#787774]">
            {index + 1}
          </span>
          <span className="rounded-full bg-[#F5F5F4] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#999]">
            ~{chunk.tokens.toLocaleString("ru-RU")} токенов
          </span>
        </div>

        {!chunk.hasHeader ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600">
            <AlertTriangle className="h-2.5 w-2.5" />
            Нет заголовка
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600">
            <Hash className="h-2.5 w-2.5" />
            Заголовок
          </span>
        )}
      </div>

      {/* Text preview — constrained, scrollable, premium mono look */}
      <div className="px-4 py-3">
        <div
          className={`rounded-lg bg-[#FAFAF9] border border-[#F0F0EE] p-3 text-[12px] leading-[1.7] text-[#666] font-mono ${
            expanded
              ? "max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D5D5D5]"
              : "line-clamp-6"
          }`}
        >
          <p className="m-0 whitespace-pre-wrap break-words">
            {expanded ? chunk.text : preview}
            {!expanded && isLong && <span className="text-[#C5C5C5]"> …</span>}
          </p>
        </div>

        {/* Expand/collapse toggle */}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#999] transition-colors hover:text-[#555]"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Свернуть
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Показать полностью
              </>
            )}
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
  const totalTokens = estimateTokens(clean);
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
