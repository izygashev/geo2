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
          <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">Проекты</h1>
          <p className="mt-1 text-sm text-[#787774]">
            Управляйте сайтами и запускайте аналитику
          </p>
        </div>
        <Button className="btn-tactile gap-2 rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]">
          <Plus className="h-4 w-4" />
          Новый проект
        </Button>
      </div>

      {/* Content */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#EAEAEA] bg-white py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#EAEAEA] bg-[#FBFBFA]">
            <FolderOpen className="h-5 w-5 text-[#BBBBBB]" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[#1a1a1a]">
            Нет проектов
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[#787774]">
            Создайте первый проект, чтобы начать отслеживать упоминания вашего
            бренда в ответах ИИ.
          </p>
          <Button className="btn-tactile mt-6 gap-2 rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]">
            <Plus className="h-4 w-4" />
            Создать проект
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-[#EAEAEA] bg-white p-5 transition-colors hover:bg-[#FBFBFA]"
            >
              <h3 className="text-sm font-medium text-[#1a1a1a]">{project.name}</h3>
              <p className="mt-1 truncate text-sm text-[#787774]">
                {project.url}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[#787774]">
                  {project._count.reports}{" "}
                  {project._count.reports === 1 ? "отчёт" : "отчётов"}
                </span>
                <span className="text-xs text-[#BBBBBB]">
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
