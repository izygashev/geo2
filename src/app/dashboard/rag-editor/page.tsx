"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Highlighter,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RotateCcw,
  FileText,
  ArrowRight,
  Clock,
  Trash2,
  CornerUpLeft,
} from "lucide-react";

// ─── History types ──────────────────────────────────────
interface HistoryEntry {
  id: string;
  text: string;          // first 200 chars preview
  fullText: string;
  score: number;
  criticals: number;
  warnings: number;
  date: string;          // ISO
}

const HISTORY_KEY = "rag-editor-history";
const MAX_HISTORY = 20;

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

// ─── Mock analysis data ─────────────────────────────────
interface RagIssue {
  severity: "critical" | "warning" | "ok";
  text: string;
  detail: string;
}

const MOCK_ISSUES: RagIssue[] = [
  {
    severity: "critical",
    text: "Слишком длинные абзацы",
    detail: "Абзацы > 150 слов снижают точность chunk-эмбеддингов на 40%. Рекомендуем разбить на блоки по 80–120 слов.",
  },
  {
    severity: "critical",
    text: "Отсутствует структура «Вопрос — Ответ»",
    detail: "RAG-системы на 60% лучше находят информацию в Q&A-формате. Добавьте секцию FAQ.",
  },
  {
    severity: "warning",
    text: "Сложные деепричастные обороты",
    detail: "Обнаружено 12 конструкций, затрудняющих токенизацию. Упростите для повышения recall.",
  },
  {
    severity: "warning",
    text: "Нет явного определения терминов",
    detail: "Ключевые термины используются без определений. LLM может неверно интерпретировать контекст.",
  },
  {
    severity: "ok",
    text: "Заголовки H2/H3 структурированы",
    detail: "Иерархия заголовков корректна — это помогает chunking-алгоритмам.",
  },
  {
    severity: "ok",
    text: "Длина текста в пределах нормы",
    detail: "Общая длина ~1200 слов — оптимально для одностраничного RAG-индекса.",
  },
];

const MOCK_OPTIMIZED_TEXT = `# Что такое GEO-оптимизация?

**GEO-оптимизация (Generative Engine Optimization)** — это процесс адаптации контента сайта для упоминания в ответах AI-систем: ChatGPT, Perplexity, Claude и Gemini.

## Зачем это нужно?

AI-поисковики формируют ответы на основе проиндексированных данных. Если ваш контент не оптимизирован для RAG-пайплайнов, нейросети будут рекомендовать конкурентов.

## Часто задаваемые вопросы

**Вопрос: Чем GEO отличается от SEO?**
Ответ: SEO фокусируется на ранжировании в Google. GEO фокусируется на упоминании бренда в ответах AI-чатботов.

**Вопрос: Как быстро виден результат?**
Ответ: Первые изменения в AI-выдаче заметны через 2–4 недели после оптимизации контента и добавления llms.txt.

**Вопрос: Какой формат контента лучше для AI?**
Ответ: Короткие абзацы (80–120 слов), Q&A-структура, явные определения терминов и Schema.org разметка.`;

// ─── Component ──────────────────────────────────────────
export default function RagEditorPage() {
  const [inputText, setInputText] = useState("");
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState<string | null>(null);
  const [mockScore] = useState(42);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addToHistory = useCallback((text: string, score: number, criticals: number, warnings: number) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      text: text.slice(0, 200),
      fullText: text,
      score,
      criticals,
      warnings,
      date: new Date().toISOString(),
    };
    const updated = [entry, ...history.filter((h) => h.fullText !== text)].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveHistory(updated);
  }, [history]);

  const removeFromHistory = useCallback((id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const restoreFromHistory = useCallback((entry: HistoryEntry) => {
    setInputText(entry.fullText);
    setIsAnalyzed(false);
    setOptimizedText(null);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function handleAnalyze() {
    if (!inputText.trim()) return;
    setIsAnalyzed(true);
    setOptimizedText(null);
    // Save to history
    const criticals = MOCK_ISSUES.filter((i) => i.severity === "critical").length;
    const warnings = MOCK_ISSUES.filter((i) => i.severity === "warning").length;
    addToHistory(inputText, mockScore, criticals, warnings);
  }

  function handleOptimize() {
    setIsOptimizing(true);
    // Simulate AI processing
    setTimeout(() => {
      setOptimizedText(MOCK_OPTIMIZED_TEXT);
      setIsOptimizing(false);
    }, 2000);
  }

  function handleReset() {
    setInputText("");
    setIsAnalyzed(false);
    setOptimizedText(null);
  }

  function handleCopy() {
    if (optimizedText) {
      navigator.clipboard.writeText(optimizedText);
    }
  }

  const criticalCount = MOCK_ISSUES.filter((i) => i.severity === "critical").length;
  const warningCount = MOCK_ISSUES.filter((i) => i.severity === "warning").length;
  const okCount = MOCK_ISSUES.filter((i) => i.severity === "ok").length;

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F4]">
            <Highlighter className="h-4 w-4 text-[#787774]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">
              RAG-Редактор
            </h1>
            <p className="text-xs text-[#787774]">LLM Readability Optimizer</p>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#787774]">
          Адаптируйте ваш контент для идеального парсинга нейросетями.
          Инструмент анализирует текст на совместимость с RAG-пайплайнами и предлагает оптимизацию.
        </p>
      </div>

      {/* Split-screen workspace */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Input ── */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-xl border border-[#EAEAEA] bg-white">
            {/* Editor header */}
            <div className="flex items-center justify-between border-b border-[#F0EFEB] px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#BBBBBB]" />
                <span className="text-xs font-medium text-[#787774]">Исходный текст</span>
              </div>
              {inputText.length > 0 && (
                <span className="text-[10px] tabular-nums text-[#BBBBBB]">
                  {inputText.split(/\s+/).filter(Boolean).length} слов
                </span>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (isAnalyzed) setIsAnalyzed(false);
                setOptimizedText(null);
              }}
              placeholder="Вставьте текст вашей статьи или страницы сюда… Например, текст с главной страницы вашего сайта, статью из блога или описание продукта."
              className="min-h-[420px] w-full resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-[#1a1a1a] placeholder:text-[#CCCCCC] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1a1a1a] px-5 text-sm font-medium text-white transition-all hover:bg-[#333] disabled:bg-[#EAEAEA] disabled:text-[#BBBBBB]"
            >
              <Highlighter className="h-3.5 w-3.5" />
              Проанализировать текст
            </button>
            {isAnalyzed && (
              <button
                onClick={handleReset}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#EAEAEA] bg-white px-4 text-sm font-medium text-[#787774] transition-colors hover:bg-[#FAFAF9] hover:text-[#1a1a1a]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Сброс
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Analysis Panel ── */}
        <div className="flex flex-col gap-4">
          {!isAnalyzed ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E5E3] bg-[#FAFAF9] px-8 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EFEB]">
                <Highlighter className="h-5 w-5 text-[#BBBBBB]" />
              </div>
              <p className="text-sm font-medium text-[#999]">
                Вставьте текст и нажмите «Проанализировать»
              </p>
              <p className="mt-1.5 max-w-xs text-xs text-[#CCCCCC]">
                Инструмент оценит совместимость контента с RAG-пайплайнами и предложит улучшения
              </p>
            </div>
          ) : (
            <>
              {/* Score card */}
              <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
                      RAG Readability Score
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tighter text-[#1a1a1a]">
                        {mockScore}
                      </span>
                      <span className="text-lg text-[#BBBBBB]">/100</span>
                    </div>
                    <p className="mt-1 text-xs text-[#787774]">
                      Требует доработки для AI-индексации
                    </p>
                  </div>

                  {/* Score ring */}
                  <div className="relative h-20 w-20 shrink-0">
                    <svg className="-rotate-90 h-full w-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#F0EFEB" strokeWidth="2.5" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={mockScore >= 70 ? "#2D6A4F" : mockScore >= 40 ? "#D97706" : "#B02A37"}
                        strokeWidth="2.5"
                        strokeDasharray={`${(mockScore / 100) * 94.2} 94.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold ${mockScore >= 70 ? "text-[#2D6A4F]" : mockScore >= 40 ? "text-amber-600" : "text-[#B02A37]"}`}>
                        {mockScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Severity summary */}
                <div className="mt-4 flex gap-4 border-t border-[#F0EFEB] pt-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full bg-[#B02A37]" />
                    <span className="text-[#787774]">{criticalCount} критично</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-[#787774]">{warningCount} внимание</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full bg-[#2D6A4F]" />
                    <span className="text-[#787774]">{okCount} в порядке</span>
                  </div>
                </div>
              </div>

              {/* Issues list */}
              <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
                  Проблемы и рекомендации
                </p>
                <div className="space-y-2.5">
                  {MOCK_ISSUES.map((issue, i) => (
                    <div
                      key={i}
                      className="group rounded-lg border border-[#F0EFEB] px-4 py-3 transition-colors hover:bg-[#FAFAF9]"
                    >
                      <div className="flex items-start gap-3">
                        {issue.severity === "critical" ? (
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B02A37]" />
                        ) : issue.severity === "warning" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a]">{issue.text}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[#787774]">{issue.detail}</p>
                        </div>
                        <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          issue.severity === "critical"
                            ? "bg-red-50 text-[#B02A37]"
                            : issue.severity === "warning"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-[#2D6A4F]"
                        }`}>
                          {issue.severity === "critical" ? "FIX" : issue.severity === "warning" ? "WARN" : "OK"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Magic optimize button */}
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="group relative flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#1a1a1a] text-sm font-medium text-white transition-all hover:bg-[#333] hover:shadow-lg disabled:opacity-70"
              >
                {isOptimizing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Оптимизирую текст…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Переписать под формат ИИ
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
                {/* Subtle glow */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-amber-500/10 via-transparent to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>

              {/* Optimized result */}
              <div className="rounded-xl border border-[#EAEAEA] bg-white">
                <div className="flex items-center justify-between border-b border-[#F0EFEB] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-[#787774]">Результат оптимизации</span>
                  </div>
                  {optimizedText && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-md border border-[#EAEAEA] px-2.5 py-1 text-[10px] font-medium text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#1a1a1a]"
                    >
                      <Copy className="h-3 w-3" />
                      Скопировать
                    </button>
                  )}
                </div>

                {optimizedText ? (
                  <div className="max-h-[400px] overflow-y-auto px-5 py-4">
                    <div className="prose-sm text-sm leading-relaxed text-[#1a1a1a] whitespace-pre-wrap">
                      {optimizedText}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EFEB]">
                      <Sparkles className="h-4 w-4 text-[#CCCCCC]" />
                    </div>
                    <p className="text-xs text-[#BBBBBB]">
                      Нажмите «Переписать под формат ИИ», чтобы получить оптимизированный текст
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── History Section ── */}
      {history.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#BBBBBB]" />
              <h2 className="text-sm font-semibold text-[#1a1a1a]">
                История запросов
              </h2>
              <span className="rounded-md bg-[#F0EFEB] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#787774]">
                {history.length}
              </span>
            </div>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#BBBBBB] transition-colors hover:bg-red-50 hover:text-[#B02A37]"
            >
              <Trash2 className="h-3 w-3" />
              Очистить
            </button>
          </div>

          <div className="space-y-2">
            {history.map((entry) => {
              const date = new Date(entry.date);
              const timeStr = date.toLocaleString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={entry.id}
                  className="group flex items-start gap-4 rounded-xl border border-[#F0EFEB] bg-white px-5 py-4 transition-colors hover:border-[#EAEAEA] hover:bg-[#FAFAF9]"
                >
                  {/* Score mini-ring */}
                  <div className="relative h-10 w-10 shrink-0">
                    <svg className="-rotate-90 h-full w-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#F0EFEB" strokeWidth="2.5" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={entry.score >= 70 ? "#2D6A4F" : entry.score >= 40 ? "#D97706" : "#B02A37"}
                        strokeWidth="2.5"
                        strokeDasharray={`${(entry.score / 100) * 94.2} 94.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[10px] font-bold ${entry.score >= 70 ? "text-[#2D6A4F]" : entry.score >= 40 ? "text-amber-600" : "text-[#B02A37]"}`}>
                        {entry.score}
                      </span>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-[#1a1a1a]">
                      {entry.text}
                      {entry.fullText.length > 200 && "…"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-[10px] text-[#BBBBBB]">{timeStr}</span>
                      {entry.criticals > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#B02A37]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#B02A37]" />
                          {entry.criticals} крит.
                        </span>
                      )}
                      {entry.warnings > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {entry.warnings} внимание
                        </span>
                      )}
                      <span className="text-[10px] tabular-nums text-[#BBBBBB]">
                        {entry.fullText.split(/\s+/).filter(Boolean).length} сл.
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => restoreFromHistory(entry)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#787774] transition-colors hover:bg-[#F0EFEB] hover:text-[#1a1a1a]"
                      title="Загрузить в редактор"
                    >
                      <CornerUpLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromHistory(entry.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#BBBBBB] transition-colors hover:bg-red-50 hover:text-[#B02A37]"
                      title="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
