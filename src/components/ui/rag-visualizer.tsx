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
 * Strip residual JS/CSS artifacts that may have leaked into scrapedBody
 * from older reports stored before the scraper fix.
 * Must be aggressive — B2B users should never see raw code.
 * Covers: Next.js, Webpack, Vite, Nuxt, Tilda, Webflow, Wix.
 */
function sanitizeText(raw: string): string {
  let text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<template[\s\S]*?<\/template>/gi, "")
    .replace(/<[^>]+>/g, " ")

    // JS framework patterns
    .replace(/!function\s*\([^)]*\)\s*\{[\s\S]{0,3000}?\}/g, "")
    .replace(/\(function\s*\([^)]*\)\s*\{[\s\S]{0,3000}?\}\)/g, "")
    .replace(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{0,3000}?\}/g, "")
    .replace(/(?:var|let|const)\s+\w+\s*=\s*[\s\S]{0,500}?;/g, "")
    .replace(/\(self\.__next_f=self\.__next_f[\s\S]{0,1000}?\)/g, "")
    .replace(/self\.__next_f\.push[\s\S]{0,1000}?\)/g, "")
    .replace(/static\/chunks\/[\w\-.]+\.js/g, "")

    // Tilda-specific
    .replace(/\bt_\w+_init\b[^.]*?\./g, "")
    .replace(/\bt\d{3,}[_.][\w.]+/g, "")
    .replace(/\.t-[\w-]+/g, "")
    .replace(/\$\(\s*["'][^"']+["']\s*\)[^;]{0,200};/g, "")

    // CSS leaks
    .replace(/(?:[a-z-]+\s*:\s*[^;]{1,40};\s*){2,}/gi, "")
    .replace(/\.[\w-]+\s*\{[^}]*\}/g, "")

    // Data/binary leaks
    .replace(/\{(?:"[\w]+":\s*(?:"[^"]*"|[\d.]+|true|false|null|(?:\{[^}]*\}))\s*,?\s*){3,}\}/g, "")
    .replace(/\{[^}]{0,300}\}/g, " ")
    .replace(/data:[a-z]+\/[a-z+.-]+;base64,[A-Za-z0-9+/=]{20,}/g, "")
    .replace(/[0-9a-f]{20,}/gi, "")
    .replace(/(?:\\u[0-9a-f]{4}|\\x[0-9a-f]{2}){3,}/gi, "")
    .replace(/data-[\w-]+=["'][^"']*["']/g, "")
    .replace(/\b(?:function|return|typeof|undefined|null|window\.|document\.)\b[^.!?\n]{0,100}/g, "")

    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Line-level filter — destroy any CSS/JS lines that survived
  text = text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (t.includes("{") || t.includes("}")) return false;
      if (/^[a-z-]+\s*:\s*.+;$/i.test(t)) return false;
      if (/^[.#][\w-]+|^\w+:(?:hover|focus|active|nth|first|last|before|after)/.test(t)) return false;
      if (/^@(?:keyframes|media|import|font-face|charset|supports)\b/.test(t)) return false;
      if (/^(?:var|let|const|function|return|if|else|for|while|switch)\b/.test(t)) return false;
      const symbolChars = (t.match(/[{};:=()[\]<>]/g) || []).length;
      if (t.length > 5 && symbolChars / t.length > 0.25) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Paragraph-level filter
  const paragraphs = text.split("\n\n");
  const cleaned = paragraphs.filter((para) => {
    const trimmed = para.trim();
    if (!trimmed || trimmed.length < 3) return false;
    const codeChars = (trimmed.match(/[{};=()]/g) || []).length;
    const ratio = codeChars / trimmed.length;
    if (ratio > 0.12 && trimmed.length < 600) return false;
    if (/\w+\.\w+\([^)]*\)\.\w+\(/.test(trimmed)) return false;
    if (/^\s*(?:if|else|for|while|switch|case|try|catch)\s*[\({]/.test(trimmed)) return false;
    return true;
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

/* ── Chunk Card — "AI Vision" terminal aesthetic ── */

function ChunkCard({ chunk, index }: { chunk: Chunk; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const preview = chunk.text.slice(0, 280);
  const isLong = chunk.text.length > 280;

  return (
    <div className="group relative flex flex-col rounded-xl border border-[#E5E5E3] bg-white transition-all duration-200 hover:border-[#D5D5D5] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* Terminal-style header bar */}
      <div className="flex items-center justify-between gap-2 rounded-t-xl bg-[#1a1a1a] px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Fake terminal dots */}
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#B02A37]/80" />
            <span className="h-2 w-2 rounded-full bg-[#B08D19]/80" />
            <span className="h-2 w-2 rounded-full bg-[#2D6A4F]/80" />
          </div>
          <span className="ml-1 text-[11px] font-medium text-white/50">
            Блок {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] tabular-nums text-white/40">
            ~{chunk.tokens.toLocaleString("ru-RU")} токенов
          </span>
          {!chunk.hasHeader ? (
            <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              Без заголовка
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
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

      {/* Text content — raw data aesthetic */}
      <div className="px-4 py-3">
        <div
          className={`rounded-lg bg-[#FAFAF9] border border-[#EEEEED] p-3.5 font-mono text-[13px] leading-[1.7] text-[#444] ${
            expanded
              ? "max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D5D5D5]"
              : "max-h-48 overflow-hidden"
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
              RAG-анализ
            </p>
          </div>
        </div>

        <p className="text-[13.5px] leading-[1.75] text-[#555]">
          LLM-модели (ChatGPT, Claude, Яндекс.Нейро) не&nbsp;видят ваш красивый дизайн.
          Они сканируют сайт и&nbsp;разрезают его на&nbsp;смысловые текстовые блоки
          (чанки). Если ИИ видит здесь сплошной код или текст без заголовков&nbsp;—
          он&nbsp;не&nbsp;сможет понять, чем занимается ваш бизнес, и&nbsp;порекомендует конкурентов.
        </p>

        {/* Value proposition callout */}
        <Alert className="border-[#2D6A4F]/20 bg-[#2D6A4F]/[0.04]">
          <Sparkles className="h-4 w-4 text-[#2D6A4F]" />
          <AlertTitle className="text-[13px] font-semibold text-[#2D6A4F]">
            Ценность
          </AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed text-[#2D6A4F]/80">
            Чистая структура чанков = попадание в&nbsp;ответы нейросетей и&nbsp;бесплатные лиды.
            Мы&nbsp;оптимизируем контент так, чтобы ИИ мог точно процитировать ваш бизнес.
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

      {/* ── Warning banner for chunks without headers ── */}
      {warningCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50/50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-[13px] font-semibold text-amber-800">
            Проблема: блоки без заголовков
          </AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed text-amber-700">
            {warningCount} из {chunks.length} блоков не&nbsp;содержат заголовка.
            Когда нейросеть выбирает, какой фрагмент процитировать, блоки без&nbsp;H2/H3
            теряют контекст и&nbsp;уступают конкурентам с&nbsp;чётко размеченным контентом.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Chunk grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {chunks.map((chunk, i) => (
          <ChunkCard key={chunk.id} chunk={chunk} index={i} />
        ))}
      </div>
    </div>
  );
}
