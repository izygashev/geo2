import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reports: true } },
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Проекты</h1>
          <p className="mt-1 text-sm text-slate-400">
            Управляйте сайтами и запускайте аналитику
          </p>
        </div>
        <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-500">
          <Plus className="h-4 w-4" />
          Новый проект
        </Button>
      </div>

      {/* Content */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
            <FolderOpen className="h-7 w-7 text-slate-500" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">
            Нет проектов
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
            Создайте первый проект, чтобы начать отслеживать упоминания вашего
            бренда в ответах ИИ.
          </p>
          <Button className="mt-6 gap-2 bg-blue-600 text-white hover:bg-blue-500">
            <Plus className="h-4 w-4" />
            Создать проект
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-5 transition-colors hover:border-slate-700/50"
            >
              <h3 className="font-semibold text-white">{project.name}</h3>
              <p className="mt-1 truncate text-sm text-slate-500">
                {project.url}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {project._count.reports}{" "}
                  {project._count.reports === 1 ? "отчёт" : "отчётов"}
                </span>
                <span className="text-xs text-slate-600">
                  {project.createdAt.toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
