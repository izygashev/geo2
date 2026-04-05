"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Sparkles,
  FileText,
  Wrench,
  Bot,
  Copy,
  Check,
  AlertTriangle,
  Settings,
  TrendingUp,
  ClipboardList,
  Flame,
  Zap,
  Target,
  Database,
  MessageSquare,
  Globe,
  Table,
  ThumbsUp,
  HelpCircle,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

/* ────────────────────────────────────────────────── */
/*  Config & Types                                    */
/* ────────────────────────────────────────────────── */

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    actionLabel: string;
    actionIcon: "code" | "article" | "task" | "file";
    /** Impact weight for priority sorting (higher = more critical) */
    impactWeight: number;
    /** Lucide icon component for visual distinction */
    typeIcon: typeof Sparkles;
  }
> = {
  "schema-org": {
    label: "Schema.org",
    color: "bg-[#F3EEFF] text-[#6B46C1] border-[#E2D5F8]",
    actionLabel: "Сгенерировать код",
    actionIcon: "code",
    impactWeight: 8,
    typeIcon: ShieldCheck,
  },
  "schema-faq": {
    label: "FAQ Schema",
    color: "bg-[#F3EEFF] text-[#6B46C1] border-[#E2D5F8]",
    actionLabel: "Сгенерировать JSON-LD",
    actionIcon: "code",
    impactWeight: 8,
    typeIcon: HelpCircle,
  },
  content: {
    label: "Контент",
    color: "bg-[#E1F3FE] text-[#1A6FBF] border-[#C8E1FE]",
    actionLabel: "Создать ТЗ для статьи",
    actionIcon: "article",
    impactWeight: 7,
    typeIcon: FileText,
  },
  "rag-content": {
    label: "RAG-контент",
    color: "bg-[#E1F3FE] text-[#1A6FBF] border-[#C8E1FE]",
    actionLabel: "Сгенерировать Q&A блок",
    actionIcon: "code",
    impactWeight: 9,
    typeIcon: MessageSquare,
  },
  technical: {
    label: "Техническое",
    color: "bg-[#FBF3DB] text-[#B08D19] border-[#FBE5A8]",
    actionLabel: "Создать задачу",
    actionIcon: "task",
    impactWeight: 6,
    typeIcon: Settings,
  },
  "semantic-tables": {
    label: "Таблицы",
    color: "bg-[#FBF3DB] text-[#B08D19] border-[#FBE5A8]",
    actionLabel: "Сгенерировать разметку",
    actionIcon: "code",
    impactWeight: 7,
    typeIcon: Table,
  },
  "llms-txt": {
    label: "llms.txt",
    color: "bg-[#EDF3EC] text-[#2D6A4F] border-[#D1E7DD]",
    actionLabel: "Сгенерировать файл",
    actionIcon: "file",
    impactWeight: 9,
    typeIcon: Bot,
  },
  authority: {
    label: "Авторитет",
    color: "bg-[#FDEBEC] text-[#B02A37] border-[#F5C2C7]",
    actionLabel: "Составить план",
    actionIcon: "article",
    impactWeight: 5,
    typeIcon: TrendingUp,
  },
  entity: {
    label: "Entity",
    color: "bg-[#F0E8FF] text-[#5B21B6] border-[#DDD6FE]",
    actionLabel: "Создать профиль",
    actionIcon: "article",
    impactWeight: 8,
    typeIcon: Database,
  },
  "platform-seeding": {
    label: "Платформы",
    color: "bg-[#FFF3E6] text-[#B5651D] border-[#FFDDB5]",
    actionLabel: "Составить план посева",
    actionIcon: "article",
    impactWeight: 6,
    typeIcon: Globe,
  },
  sentiment: {
    label: "Репутация",
    color: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    actionLabel: "Создать план реагирования",
    actionIcon: "article",
    impactWeight: 7,
    typeIcon: ThumbsUp,
  },
  competitors: {
    label: "Конкуренты",
    color: "bg-[#FFF3E6] text-[#B5651D] border-[#FFDDB5]",
    actionLabel: "Анализировать конкурента",
    actionIcon: "task",
    impactWeight: 4,
    typeIcon: Wrench,
  },
  "robots-txt": {
    label: "Robots.txt",
    color: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
    actionLabel: "Сгенерировать правила",
    actionIcon: "code",
    impactWeight: 10,
    typeIcon: ShieldCheck,
  },
  "semantic-html": {
    label: "Семантика",
    color: "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]",
    actionLabel: "Создать шаблон",
    actionIcon: "code",
    impactWeight: 7,
    typeIcon: Code2,
  },
};

const ACTION_ICONS = {
  code: Sparkles,
  article: FileText,
  task: Wrench,
  file: Bot,
};

/** Which category a type falls into */
const CRITICAL_TYPES = new Set(["robots-txt", "llms-txt", "schema-org", "schema-faq", "rag-content", "entity"]);
const TECHNICAL_TYPES = new Set(["technical", "semantic-html", "semantic-tables"]);
// Everything else → "growth" (content, authority, competitors, platform-seeding, sentiment)

type Category = "critical" | "technical" | "growth";

const CATEGORY_META: Record<
  Category,
  {
    label: string;
    icon: typeof Flame;
    emptyText: string;
    color: string;
    badgeBg: string;
  }
> = {
  critical: {
    label: "Критические",
    icon: Flame,
    emptyText: "Критических проблем не найдено — отличная работа!",
    color: "text-[#B02A37]",
    badgeBg: "bg-[#FDEBEC] text-[#B02A37]",
  },
  technical: {
    label: "Технические",
    icon: Settings,
    emptyText: "Технических замечаний нет — инфраструктура в порядке.",
    color: "text-[#B08D19]",
    badgeBg: "bg-[#FBF3DB] text-[#B08D19]",
  },
  growth: {
    label: "Стратегия роста",
    icon: TrendingUp,
    emptyText: "Стратегических рекомендаций пока нет.",
    color: "text-[#2D6A4F]",
    badgeBg: "bg-[#EDF3EC] text-[#2D6A4F]",
  },
};

function categorize(type: string): Category {
  if (CRITICAL_TYPES.has(type)) return "critical";
  if (TECHNICAL_TYPES.has(type)) return "technical";
  return "growth";
}

/** Estimated impact label from weight */
function impactLabel(type: string): { text: string; color: string } {
  const w = TYPE_CONFIG[type]?.impactWeight ?? 5;
  if (w >= 9) return { text: "Критичный", color: "text-[#B02A37] bg-[#FDEBEC]" };
  if (w >= 7) return { text: "Высокий", color: "text-[#B08D19] bg-[#FBF3DB]" };
  if (w >= 5) return { text: "Средний", color: "text-[#1A6FBF] bg-[#E1F3FE]" };
  return { text: "Низкий", color: "text-[#787774] bg-[#F7F6F3]" };
}

/* ────────────────────────────────────────────────── */
/*  Public interfaces                                  */
/* ────────────────────────────────────────────────── */

export interface RecommendationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  generatedCode: string;
}

interface RecommendationsPanelProps {
  recommendations: RecommendationItem[];
  projectUrl?: string;
}

/* ────────────────────────────────────────────────── */
/*  GEO Audit Factors (canonical checklist)            */
/* ────────────────────────────────────────────────── */

/** The 7 canonical GEO factors we track for the progress bar */
const GEO_FACTORS = [
  { key: "entity",            label: "Entity-профили (Wikidata/Crunchbase)" },
  { key: "rag-content",       label: "Q&A / RAG-структура контента" },
  { key: "llms-txt",          label: "Файл llms.txt для AI-ботов" },
  { key: "platform-seeding",  label: "Упоминания на Reddit/Quora" },
  { key: "semantic-tables",   label: "Табличная разметка данных" },
  { key: "sentiment",         label: "Контроль тональности отзывов" },
  { key: "schema-faq",        label: "FAQPage JSON-LD разметка" },
] as const;

/**
 * Determines which GEO factors are "completed" (i.e. NOT in recommendations).
 * If a factor type is present in recommendations, it means it still needs to be done.
 */
function computeAuditProgress(recommendations: RecommendationItem[]) {
  const pendingTypes = new Set(recommendations.map((r) => r.type));
  const factors = GEO_FACTORS.map((f) => ({
    ...f,
    done: !pendingTypes.has(f.key),
  }));
  const completed = factors.filter((f) => f.done).length;
  return { factors, completed, total: GEO_FACTORS.length };
}

/* ────────────────────────────────────────────────── */
/*  GEO Audit Progress Card                            */
/* ────────────────────────────────────────────────── */

function AuditProgressCard({ recommendations }: { recommendations: RecommendationItem[] }) {
  const { factors, completed, total } = computeAuditProgress(recommendations);
  const pct = Math.round((completed / total) * 100);
  const projectedSovGain = Math.min(50, (total - completed) * 5 + 10);

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-gradient-to-br from-white via-white to-[#F7F6F3] p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#333]">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Индекс GEO-готовности
            </h3>
            <p className="text-[11px] text-[#BBBBBB]">
              Факторы AI-видимости вашего сайта
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold tracking-tight text-[#1a1a1a]">{completed}</span>
          <span className="text-sm text-[#BBBBBB]"> / {total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <Progress value={pct} className="h-2.5 bg-[#F0EFEB]" />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium text-[#BBBBBB]">{pct}% выполнено</span>
          {completed < total && (
            <span className="text-[10px] font-medium text-[#2D6A4F]">
              +{projectedSovGain}% прогноз SoV при полном внедрении
            </span>
          )}
        </div>
      </div>

      {/* Factor checklist */}
      <div className="grid gap-1.5">
        {factors.map((f) => (
          <div
            key={f.key}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
              f.done ? "bg-[#EDF3EC]/60" : "bg-white"
            }`}
          >
            {f.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-[#DDDCDA]" />
            )}
            <span
              className={`text-xs ${
                f.done
                  ? "text-[#2D6A4F] font-medium line-through decoration-[#2D6A4F]/30"
                  : "text-[#555] font-medium"
              }`}
            >
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {/* Encouragement */}
      {completed < total && (
        <div className="mt-4 rounded-lg bg-[#F7F6F3] px-4 py-3">
          <p className="text-[11px] leading-relaxed text-[#787774]">
            💡 <span className="font-medium text-[#555]">Совет:</span> Выполните критические
            рекомендации, чтобы увеличить Share of Voice на прогнозируемые{" "}
            <span className="font-bold text-[#2D6A4F]">+{projectedSovGain}%</span>.
            AI-системы приоритизируют сайты с полным GEO-стеком.
          </p>
        </div>
      )}
      {completed === total && (
        <div className="mt-4 rounded-lg bg-[#EDF3EC] px-4 py-3">
          <p className="text-[11px] leading-relaxed text-[#2D6A4F] font-medium">
            🎉 Отличная работа! Все ключевые GEO-факторы внедрены.
            Ваш сайт максимально подготовлен к AI-поисковикам.
          </p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────── */
/*  Single Recommendation Card                         */
/* ────────────────────────────────────────────────── */

function RecCard({ rec, globalIndex }: { rec: RecommendationItem; globalIndex: number }) {
  const [showCode, setShowCode] = useState(false);
  const [actionClicked, setActionClicked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedTz, setCopiedTz] = useState(false);

  const config = TYPE_CONFIG[rec.type] ?? {
    label: rec.type,
    color: "bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]",
    actionLabel: "Применить",
    actionIcon: "task" as const,
    impactWeight: 5,
    typeIcon: Sparkles,
  };
  const hasCode = rec.generatedCode && rec.generatedCode.trim().length > 0;
  const ActionIcon = ACTION_ICONS[config.actionIcon] ?? Sparkles;
  const TypeIcon = config.typeIcon;
  const impact = impactLabel(rec.type);

  const handleAction = () => {
    setActionClicked(true);
    if (hasCode) setShowCode(true);
    setTimeout(() => setActionClicked(false), 2000);
  };

  const handleCopyCode = async () => {
    if (!rec.generatedCode) return;
    await navigator.clipboard.writeText(rec.generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTz = async () => {
    const tzText = [
      `# Задача: ${rec.title}`,
      ``,
      `## Тип: ${config.label}`,
      `## Приоритет: ${impact.text}`,
      ``,
      `## Описание`,
      rec.description,
      ...(hasCode
        ? [``, `## Пример кода`, "```", rec.generatedCode, "```"]
        : []),
      ``,
      `---`,
      `Сгенерировано GEO SaaS · ${new Date().toLocaleDateString("ru-RU")}`,
    ].join("\n");
    await navigator.clipboard.writeText(tzText);
    setCopiedTz(true);
    setTimeout(() => setCopiedTz(false), 2000);
  };

  return (
    <div className="group relative rounded-xl border border-[#EAEAEA] bg-white transition-all hover:border-[#D5D4D0] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Top accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] rounded-t-xl transition-opacity ${
          impact.text === "Критичный"
            ? "bg-[#B02A37]"
            : impact.text === "Высокий"
              ? "bg-[#B08D19]"
              : impact.text === "Средний"
                ? "bg-[#1A6FBF]"
                : "bg-[#BBBBBB]"
        } opacity-60 group-hover:opacity-100`}
      />

      <div className="p-5 pt-6">
        {/* Header row */}
        <div className="flex items-start gap-4">
          {/* Type icon + Number */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-[#EAEAEA] ${
              impact.text === "Критичный" ? "bg-[#FDEBEC]" :
              impact.text === "Высокий" ? "bg-[#FBF3DB]" :
              "bg-[#F7F6F3]"
            }`}>
              <TypeIcon className={`h-4 w-4 ${
                impact.text === "Критичный" ? "text-[#B02A37]" :
                impact.text === "Высокий" ? "text-[#B08D19]" :
                "text-[#787774]"
              }`} />
            </div>
            <span className="text-[10px] font-bold text-[#BBBBBB]">#{globalIndex}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${config.color}`}
              >
                {config.label}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${impact.color}`}
              >
                <Zap className="h-2.5 w-2.5" />
                {impact.text}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-[15px] font-semibold leading-snug text-[#1a1a1a] mb-2">
              {rec.title}
            </h3>

            {/* Description — styled as "why this matters" */}
            <p className="text-[13px] text-[#787774] leading-[1.7]">
              {rec.description}
            </p>

            {/* ── Action bar ────────────────────────── */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F0EFEB] pt-4">
              {/* Primary AI action */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                className={`h-8 gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-all ${
                  actionClicked
                    ? "border-[#2D6A4F] bg-[#EDF3EC] text-[#2D6A4F]"
                    : "border-[#1a1a1a] bg-[#1a1a1a] text-white hover:bg-[#333] shadow-sm"
                }`}
              >
                <ActionIcon className="h-3.5 w-3.5" />
                {actionClicked ? "✓ Готово" : config.actionLabel}
              </Button>

              {/* Copy as TZ */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTz}
                className={`h-8 gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
                  copiedTz
                    ? "border-[#2D6A4F] bg-[#EDF3EC] text-[#2D6A4F]"
                    : "border-[#EAEAEA] text-[#787774] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                {copiedTz ? "✓ Скопировано" : "Скопировать ТЗ"}
              </Button>

              {/* Show code toggle */}
              {hasCode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCode((v) => !v)}
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-[#787774] hover:text-[#1a1a1a] hover:bg-[#F7F6F3]"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showCode ? "Скрыть" : "Код"}
                  {showCode ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              )}
            </div>

            {/* ── Code block ────────────────────────── */}
            {showCode && hasCode && (
              <div className="mt-3 relative overflow-hidden rounded-lg border border-[#E5E4E0] bg-[#1a1a1a]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#333] px-4 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-[#666]">
                    Пример реализации
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-[#888] transition-all hover:bg-[#333] hover:text-white"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-[#4ADE80]" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Копировать
                      </>
                    )}
                  </button>
                </div>
                {/* Code */}
                <div className="overflow-x-auto p-4">
                  <pre className="text-[12px] leading-[1.7] text-[#E0E0E0] font-mono whitespace-pre-wrap break-words">
                    {rec.generatedCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── */
/*  Main Panel                                         */
/* ────────────────────────────────────────────────── */

export function RecommendationsPanel({
  recommendations,
  projectUrl,
}: RecommendationsPanelProps) {
  // Bucket recommendations into categories
  const buckets: Record<Category, RecommendationItem[]> = {
    critical: [],
    technical: [],
    growth: [],
  };

  for (const rec of recommendations) {
    buckets[categorize(rec.type)].push(rec);
  }

  // Sort each bucket by impact weight desc
  for (const cat of Object.keys(buckets) as Category[]) {
    buckets[cat].sort(
      (a, b) =>
        (TYPE_CONFIG[b.type]?.impactWeight ?? 5) -
        (TYPE_CONFIG[a.type]?.impactWeight ?? 5)
    );
  }

  const total = recommendations.length;

  // Determine default tab: first non-empty category, preferring critical
  const defaultTab: Category =
    buckets.critical.length > 0
      ? "critical"
      : buckets.technical.length > 0
        ? "technical"
        : "growth";

  // Global index counter for numbering across tabs
  let globalIdx = 0;
  const globalIndexMap = new Map<string, number>();
  for (const cat of ["critical", "technical", "growth"] as Category[]) {
    for (const rec of buckets[cat]) {
      globalIdx++;
      globalIndexMap.set(rec.id, globalIdx);
    }
  }

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a]">
            <Target className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1a1a1a]">
              План GEO-оптимизации
            </h2>
            <p className="text-[11px] text-[#BBBBBB]">
              Персональная стратегия на основе аудита
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {buckets.critical.length > 0 && (
            <span className="rounded-full bg-[#FDEBEC] px-2.5 py-0.5 text-[11px] font-semibold text-[#B02A37]">
              {buckets.critical.length} критич.
            </span>
          )}
          <span className="rounded-full bg-[#F7F6F3] px-2.5 py-0.5 text-[11px] font-medium text-[#787774]">
            {total} рекомендаций
          </span>
        </div>
      </div>

      {/* GEO Audit Progress Card — gamified */}
      <AuditProgressCard recommendations={recommendations} />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {(["critical", "technical", "growth"] as Category[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const count = buckets[cat].length;
          return (
            <div
              key={cat}
              className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-3 text-center"
            >
              <Icon className={`mx-auto h-4 w-4 mb-1.5 ${meta.color}`} />
              <p className="text-lg font-bold text-[#1a1a1a]">{count}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#BBBBBB]">
                {meta.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full bg-[#F7F6F3] p-1 h-auto rounded-lg gap-1">
          {(["critical", "technical", "growth"] as Category[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const count = buckets[cat].length;
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="flex-1 gap-1.5 rounded-md py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
                {count > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0 text-[10px] font-bold ${meta.badgeBg}`}
                  >
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(["critical", "technical", "growth"] as Category[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const items = buckets[cat];
          return (
            <TabsContent key={cat} value={cat} className="mt-4">
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((rec) => (
                    <RecCard
                      key={rec.id}
                      rec={rec}
                      globalIndex={globalIndexMap.get(rec.id) ?? 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white px-8 py-12 text-center">
                  <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${meta.badgeBg}`}>
                    <Check className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-[#787774]">{meta.emptyText}</p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
