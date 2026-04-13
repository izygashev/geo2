"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Layers,
  Hash,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
  Info,
  Bot,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/* ── Token estimation helpers ── */

const CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_TOKENS = 800;
const TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

const HEADER_RE = /^(?:#{1,6}\s|<h[1-6][\s>])/i;

function startsWithHeader(text: string): boolean {
  const firstLine = text.trimStart().split("\n")[0] ?? "";
  return HEADER_RE.test(firstLine.trim());
}

/**
 * Lightweight safety net for residual artifacts in scrapedBody.
 * The backend now uses @mozilla/readability with pre-stripped <style>/<script>,
 * but old reports stored before this fix may still contain CSS/JS code.
 */
function sanitizeText(raw: string): string {
  return raw
    // Strip any leftover HTML tags
    .replace(/<[^>]+>/g, " ")
    // Remove entire CSS blocks: @keyframes ..., @media ..., .class { ... }
    .replace(/@[\w-]+\s*[\s\S]*?\{[\s\S]*?\}\s*\}?/g, " ")
    // Remove stray CSS rule blocks: .foo { ... }
    .replace(/[.#][\w-]+\s*\{[^}]*\}/g, " ")
    // Remove CSS property chains: "display:flex;margin:0;..."
    .replace(/(?:[a-z-]+\s*:\s*[^;]{1,60};\s*){2,}/gi, " ")
    // Remove base64 data URIs
    .replace(/data:[a-z]+\/[a-z+.-]+;base64,[A-Za-z0-9+/=]{20,}/g, " ")
    // Remove long hex hashes (asset hashes, tokens)
    .replace(/[0-9a-f]{20,}/gi, " ")
    // Collapse whitespace
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface Chunk {
  id: number;
  text: string;
  tokens: number;
  hasHeader: boolean;
}

function chunkText(text: string): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  const paragraphs = text.split(/\n{2,}/);
  const chunks: Chunk[] = [];
  let buffer = "";
  let id = 0;

  for (const para of paragraphs) {
    const combined = buffer ? `${buffer}\n\n${para}` : para;

    if (combined.length > TARGET_CHUNK_CHARS && buffer.length > 0) {
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

/* ── Chunk Card — Quiet Luxury sans-serif design ── */

function ChunkCard({ chunk }: { chunk: Chunk }) {
  const [expanded, setExpanded] = useState(false);
  const preview = chunk.text.slice(0, 280);
  const isLong = chunk.text.length > 280;

  return (
    <div className="group relative flex flex-col rounded-xl border border-[#E5E5E3] bg-white transition-all duration-200 hover:border-[#D5D5D5] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-[#EAEAEA] bg-[#FAFAF9] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-[#BBBBBB]" />
          <span className="text-[12px] font-semibold text-[#787774]">
            Прочитанный фрагмент
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!chunk.hasHeader ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5" />
              Без заголовка
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              <Hash className="h-2.5 w-2.5" />
              Заголовок
            </span>
          )}
        </div>
      </div>

      {/* "AI vision" badge */}
      <div className="flex items-center gap-1.5 border-b border-[#F0F0EE] px-4 py-1.5">
        <Eye className="h-3 w-3 text-[#BBBBBB]" />
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#BBBBBB]">
          То, что видит ИИ
        </span>
      </div>

      {/* Text content — clean sans-serif */}
      <div className="px-4 py-3">
        <div
          className={`max-h-48 rounded-lg border border-[#EEEEED] bg-[#FAFAF9] p-3.5 text-[13px] leading-[1.75] text-[#555] ${
            expanded
              ? "overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D5D5D5]"
              : "overflow-hidden"
          }`}
        >
          <p className="m-0 whitespace-pre-wrap break-words">
            {expanded ? chunk.text : preview}
            {!expanded && isLong && <span className="text-[#C5C5C5]"> …</span>}
          </p>
        </div>

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
  const warningCount = chunks.filter((c) => !c.hasHeader).length;

  if (chunks.length === 0) {
    return (
      <div className="rounded-xl border border-[#EAEAEA] bg-[#FAFAF9] p-8 text-center">
        <Layers className="mx-auto mb-3 h-8 w-8 text-[#D5D5D5]" />
        <p className="mx-auto max-w-md text-sm leading-relaxed text-[#787774]">
          {"Текст не\u00A0найден. Нейросеть видит пустую страницу. Это часто бывает, если сайт полностью сделан на\u00A0картинках или скриптах без\u00A0правильной HTML-разметки."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Educational Header ── */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a]">
            <Bot className="h-4.5 w-4.5 text-white/80" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[#1a1a1a]">
              Как нейросети читают ваш сайт
            </h3>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#BBBBBB]">
              Анализ структуры
            </p>
          </div>
        </div>

        <p className="text-[13.5px] leading-[1.75] text-[#555]">
          {"Искусственный интеллект не\u00A0видит ваш красивый дизайн. Он\u00A0читает сайт как набор текстовых карточек. Если вместо понятного текста с\u00A0заголовками ИИ видит программный код или кашу из\u00A0слов\u00A0\u2014 он\u00A0не\u00A0поймет ваш бизнес и\u00A0посоветует клиентам ваших конкурентов."}
        </p>

        {/* Value proposition callout */}
        <Alert className="border-[#2D6A4F]/20 bg-[#2D6A4F]/[0.04]">
          <Sparkles className="h-4 w-4 text-[#2D6A4F]" />
          <AlertTitle className="text-[13px] font-semibold text-[#2D6A4F]">
            Ценность
          </AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed text-[#2D6A4F]/80">
            {"Понятный текст для ИИ = попадание в\u00A0ответы нейросетей = бесплатные клиенты."}
          </AlertDescription>
        </Alert>
      </div>

      {/* ── Summary metrics bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EAEAEA] bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#787774]" />
          <span className="text-sm font-semibold text-[#1a1a1a]">Результат разбиения</span>
        </div>

        <div className="h-4 w-px bg-[#EAEAEA]" />

        <span className="rounded-md bg-[#F5F5F4] px-2.5 py-1 text-xs font-medium tabular-nums text-[#555]">
          {chunks.length} {chunks.length === 1 ? "фрагмент" : chunks.length < 5 ? "фрагмента" : "фрагментов"}
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

      {/* ── Warning banner for chunks without headers ── */}
      {warningCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50/50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-[13px] font-semibold text-amber-800">
            Проблема: нет заголовков
          </AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed text-amber-700">
            {warningCount} из {chunks.length} фрагментов не{"\u00A0"}содержат заголовка.
            Нейросеть не{"\u00A0"}может понять, к{"\u00A0"}какому разделу относится этот текст,
            и{"\u00A0"}пропускает его в{"\u00A0"}пользу конкурентов с{"\u00A0"}понятной структурой.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Chunk grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {chunks.map((chunk) => (
          <ChunkCard key={chunk.id} chunk={chunk} />
        ))}
      </div>
    </div>
  );
}
