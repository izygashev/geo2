import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      project: {
        select: { name: true, url: true, userId: true },
      },
    },
  });

  if (!report || report.project.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const statusConfig = {
    COMPLETED: {
      label: "Завершён",
      variant: "default" as const,
      className: "bg-emerald-600 hover:bg-emerald-600",
    },
    PROCESSING: {
      label: "В обработке",
      variant: "secondary" as const,
      className: "bg-blue-600 hover:bg-blue-600",
    },
    FAILED: {
      label: "Ошибка",
      variant: "destructive" as const,
      className: "",
    },
  };

  const sc = statusConfig[report.status];

  return (
    <div>
      {/* Навигация назад */}
      <Link
        href="/dashboard/reports"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Все отчёты
      </Link>

      {/* Шапка */}
      <div className="mb-8 rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {report.project.name}
              </h1>
              <Badge className={sc.className}>{sc.label}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {report.project.url}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {report.createdAt.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score */}
      {report.status === "COMPLETED" && report.overallScore !== null && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <TrendingUp className="h-4 w-4" />
              AI Visibility Score
            </div>
            <p className="mt-2 text-4xl font-bold text-white">
              {report.overallScore}
              <span className="text-lg text-slate-500">/100</span>
            </p>
          </div>

          {/* Заглушки для будущих метрик */}
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6">
            <p className="text-sm text-slate-500">Share of Voice</p>
            <p className="mt-2 text-sm text-slate-600">
              Скоро здесь появятся данные
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6">
            <p className="text-sm text-slate-500">Рекомендации</p>
            <p className="mt-2 text-sm text-slate-600">
              Скоро здесь появятся данные
            </p>
          </div>
        </div>
      )}

      {/* Заглушка для детальных данных */}
      {report.status === "COMPLETED" && (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <p className="text-slate-500">
            Детальная аналитика, графики и рекомендации будут отображаться здесь
          </p>
        </div>
      )}

      {report.status === "PROCESSING" && (
        <div className="rounded-xl border border-blue-800/30 bg-blue-950/20 p-12 text-center">
          <p className="text-blue-300">
            Отчёт ещё обрабатывается. Результаты появятся автоматически.
          </p>
        </div>
      )}

      {report.status === "FAILED" && (
        <div className="rounded-xl border border-red-800/30 bg-red-950/20 p-12 text-center">
          <p className="text-red-300">
            При генерации отчёта произошла ошибка. Попробуйте запустить анализ
            ещё раз.
          </p>
        </div>
      )}
    </div>
  );
}
