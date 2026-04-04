import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

export default async function DiffPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { a, b } = await searchParams;
  if (!a || !b) {
    return (
      <div className="flex flex-col items-center py-20 text-sm text-[#787774]">
        <p>Укажите два отчёта для сравнения: ?a=ID1&b=ID2</p>
      </div>
    );
  }

  const [reportA, reportB] = await Promise.all([
    prisma.report.findUnique({
      where: { id: a },
      include: {
        project: { select: { name: true, url: true, userId: true } },
        shareOfVoices: true,
      },
    }),
    prisma.report.findUnique({
      where: { id: b },
      include: {
        project: { select: { name: true, url: true, userId: true } },
        shareOfVoices: true,
      },
    }),
  ]);

  if (!reportA || !reportB) notFound();
  if (
    reportA.project.userId !== session.user.id ||
    reportB.project.userId !== session.user.id
  ) {
    redirect("/dashboard");
  }

  // Оба отчёта должны быть завершены
  if (reportA.status !== "COMPLETED" || reportB.status !== "COMPLETED") {
    return (
      <div className="flex flex-col items-center py-20 text-sm text-[#787774]">
        <p>Оба отчёта должны быть в статусе «Завершён» для сравнения.</p>
        <Link href="/dashboard/reports" className="mt-4 text-[#1a1a1a] underline">
          ← Назад к отчётам
        </Link>
      </div>
    );
  }

  // Проверяем, что оба отчёта принадлежат одному проекту
  if (reportA.projectId !== reportB.projectId) {
    return (
      <div className="flex flex-col items-center py-20 text-sm text-[#787774]">
        <p>Сравнивать можно только отчёты одного проекта.</p>
        <Link href="/dashboard/reports" className="mt-4 text-[#1a1a1a] underline">
          ← Назад к отчётам
        </Link>
      </div>
    );
  }

  const scoreA = reportA.overallScore ? Math.round(reportA.overallScore) : 0;
  const scoreB = reportB.overallScore ? Math.round(reportB.overallScore) : 0;
  const scoreDelta = scoreB - scoreA;

  // Breakdown comparison
  const breakdowns = [
    { label: "Share of Voice", a: reportA.scoreSov ?? 0, b: reportB.scoreSov ?? 0 },
    { label: "Schema.org", a: reportA.scoreSchema ?? 0, b: reportB.scoreSchema ?? 0 },
    { label: "llms.txt", a: reportA.scoreLlmsTxt ?? 0, b: reportB.scoreLlmsTxt ?? 0 },
    { label: "Контент", a: reportA.scoreContent ?? 0, b: reportB.scoreContent ?? 0 },
    { label: "Авторитет", a: reportA.scoreAuthority ?? 0, b: reportB.scoreAuthority ?? 0 },
  ];

  // SoV keyword diff
  const sovA = new Set(
    reportA.shareOfVoices.filter((s) => s.isMentioned).map((s) => s.keyword)
  );
  const sovB = new Set(
    reportB.shareOfVoices.filter((s) => s.isMentioned).map((s) => s.keyword)
  );
  const allKeywords = new Set([
    ...reportA.shareOfVoices.map((s) => s.keyword),
    ...reportB.shareOfVoices.map((s) => s.keyword),
  ]);

  const gained: string[] = [];
  const lost: string[] = [];
  const kept: string[] = [];

  for (const kw of allKeywords) {
    const inA = sovA.has(kw);
    const inB = sovB.has(kw);
    if (!inA && inB) gained.push(kw);
    else if (inA && !inB) lost.push(kw);
    else if (inA && inB) kept.push(kw);
  }

  function DeltaBadge({ delta }: { delta: number }) {
    if (delta === 0) {
      return (
        <span className="flex items-center gap-0.5 text-xs text-[#787774]">
          <Minus className="h-3 w-3" /> 0
        </span>
      );
    }
    return (
      <span
        className={`flex items-center gap-0.5 text-xs font-medium ${
          delta > 0 ? "text-[#2D6A4F]" : "text-[#B02A37]"
        }`}
      >
        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {delta > 0 ? "+" : ""}
        {Math.round(delta)}
      </span>
    );
  }

  return (
    <div className="pb-12">
      <Link
        href="/dashboard/reports"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#787774] transition-colors hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Все отчёты
      </Link>

      <h1 className="mb-6 text-lg font-bold tracking-tighter text-[#1a1a1a]">
        Сравнение отчётов
      </h1>

      {/* Overall Score */}
      <div className="mb-6 rounded-xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          Overall Score
        </h2>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-xs text-[#BBBBBB]">
              {reportA.createdAt.toLocaleDateString("ru-RU")}
            </p>
            <p className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">{scoreA}</p>
          </div>
          <div className="text-center">
            <DeltaBadge delta={scoreDelta} />
          </div>
          <div className="text-center">
            <p className="text-xs text-[#BBBBBB]">
              {reportB.createdAt.toLocaleDateString("ru-RU")}
            </p>
            <p className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">{scoreB}</p>
          </div>
        </div>
      </div>

      {/* Breakdown diff */}
      <div className="mb-6 rounded-xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          Компоненты Score
        </h2>
        <div className="space-y-3">
          {breakdowns.map((item) => {
            const delta = item.b - item.a;
            return (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-[#787774]">{item.label}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="w-10 text-right text-[#BBBBBB]">{Math.round(item.a)}</span>
                  <span className="text-[#EAEAEA]">→</span>
                  <span className="w-10 text-right font-medium text-[#1a1a1a]">
                    {Math.round(item.b)}
                  </span>
                  <div className="w-14">
                    <DeltaBadge delta={delta} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyword changes */}
      <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          Изменения в упоминаниях
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Gained */}
          <div>
            <p className="mb-2 text-xs font-medium text-[#2D6A4F]">
              + Новые ({gained.length})
            </p>
            {gained.length === 0 ? (
              <p className="text-xs text-[#BBBBBB]">—</p>
            ) : (
              <div className="space-y-1">
                {gained.map((kw) => (
                  <div
                    key={kw}
                    className="rounded-md bg-[#EDF3EC] px-2 py-1 text-xs text-[#2D6A4F]"
                  >
                    {kw}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lost */}
          <div>
            <p className="mb-2 text-xs font-medium text-[#B02A37]">
              − Утеряны ({lost.length})
            </p>
            {lost.length === 0 ? (
              <p className="text-xs text-[#BBBBBB]">—</p>
            ) : (
              <div className="space-y-1">
                {lost.map((kw) => (
                  <div
                    key={kw}
                    className="rounded-md bg-[#FDEBEC] px-2 py-1 text-xs text-[#B02A37]"
                  >
                    {kw}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kept */}
          <div>
            <p className="mb-2 text-xs font-medium text-[#787774]">
              = Сохранены ({kept.length})
            </p>
            {kept.length === 0 ? (
              <p className="text-xs text-[#BBBBBB]">—</p>
            ) : (
              <div className="space-y-1">
                {kept.map((kw) => (
                  <div
                    key={kw}
                    className="rounded-md bg-[#F7F6F3] px-2 py-1 text-xs text-[#787774]"
                  >
                    {kw}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
