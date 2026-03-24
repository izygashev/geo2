import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FileBarChart } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const reports = await prisma.report.findMany({
    where: {
      project: { userId: session.user.id },
    },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true, url: true } },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Отчёты</h1>
        <p className="mt-1 text-sm text-slate-400">
          История всех аналитических отчётов
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
            <FileBarChart className="h-7 w-7 text-slate-500" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">
            Нет отчётов
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
            Отчёты появятся здесь после запуска анализа в одном из проектов.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/reports/${report.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-900/50 p-4 transition-colors hover:border-slate-700/50"
            >
              <div>
                <h3 className="font-medium text-white">
                  {report.project.name}
                </h3>
                <p className="text-sm text-slate-500">{report.project.url}</p>
              </div>
              <div className="flex items-center gap-4">
                {report.overallScore !== null && (
                  <span className="text-lg font-bold text-white">
                    {report.overallScore}
                    <span className="text-sm text-slate-500">/100</span>
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    report.status === "COMPLETED"
                      ? "bg-emerald-600/10 text-emerald-400"
                      : report.status === "PROCESSING"
                        ? "bg-amber-600/10 text-amber-400"
                        : "bg-red-600/10 text-red-400"
                  }`}
                >
                  {report.status === "COMPLETED"
                    ? "Готов"
                    : report.status === "PROCESSING"
                      ? "В процессе"
                      : "Ошибка"}
                </span>
                <span className="text-xs text-slate-600">
                  {report.createdAt.toLocaleDateString("ru-RU")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
