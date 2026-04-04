import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FileBarChart } from "lucide-react";
import Link from "next/link";
import { ReportListItemProcessing } from "@/components/report-list-item";
import { DeleteButton } from "@/components/delete-button";

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
        <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">Отчёты</h1>
        <p className="mt-1 text-sm text-[#787774]">
          История всех аналитических отчётов
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#EAEAEA] bg-white py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#EAEAEA] bg-[#FBFBFA]">
            <FileBarChart className="h-5 w-5 text-[#BBBBBB]" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[#1a1a1a]">
            Нет отчётов
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[#787774]">
            Отчёты появятся здесь после запуска анализа в одном из проектов.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) =>
            report.status === "PROCESSING" ? (
              <ReportListItemProcessing
                key={report.id}
                reportId={report.id}
                projectName={report.project.name}
                projectUrl={report.project.url}
                createdAt={report.createdAt.toLocaleDateString("ru-RU")}
              />
            ) : (
            <div
              key={report.id}
              className="flex items-center rounded-xl border border-[#EAEAEA] bg-white transition-colors hover:bg-[#FBFBFA]"
            >
              <Link
                href={`/dashboard/reports/${report.id}`}
                className="flex flex-1 items-center justify-between p-4"
              >
                <div>
                  <h3 className="text-sm font-medium text-[#1a1a1a]">
                    {report.project.name}
                  </h3>
                  <p className="text-sm text-[#787774]">{report.project.url}</p>
                </div>
                <div className="flex items-center gap-4">
                  {report.overallScore !== null && (
                    <span className="text-base font-bold tracking-tighter text-[#1a1a1a]">
                      {Math.round(report.overallScore)}
                      <span className="text-sm text-[#BBBBBB]">/100</span>
                    </span>
                  )}
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                      report.status === "COMPLETED"
                        ? "border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F]"
                        : "border-[#F5C2C7] bg-[#FDEBEC] text-[#B02A37]"
                    }`}
                  >
                    {report.status === "COMPLETED" ? "Готов" : "Ошибка"}
                  </span>
                  <span className="text-xs text-[#BBBBBB]">
                    {report.createdAt.toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </Link>
              <div className="pr-3">
                <DeleteButton
                  entityType="report"
                  entityId={report.id}
                  entityName={report.project.name}
                />
              </div>
            </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
