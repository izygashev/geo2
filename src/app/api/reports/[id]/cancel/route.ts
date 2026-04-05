import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportQueue } from "@/lib/queue";

/**
 * POST /api/reports/[id]/cancel
 * Отменяет генерацию отчёта: удаляет задачу из BullMQ и ставит FAILED.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reportId } = await params;

    // Проверяем, что отчёт существует и принадлежит пользователю
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        status: true,
        project: { select: { userId: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Отчёт не найден" }, { status: 404 });
    }

    if (report.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    if (report.status !== "PROCESSING") {
      return NextResponse.json(
        { error: "Отчёт уже завершён" },
        { status: 409 }
      );
    }

    // Пытаемся удалить/отменить задачу в BullMQ
    try {
      // Ищем job по reportId (jobId совпадает с reportId при добавлении в очередь)
      const job = await reportQueue.getJob(reportId);
      if (job) {
        // Если задача в ожидании — удаляем из очереди
        const state = await job.getState();
        if (state === "waiting" || state === "delayed") {
          await job.remove();
        }
        // Если задача активна — она завершится с ошибкой при следующем
        // обращении к БД, т.к. мы меняем статус на FAILED
      }
    } catch (queueErr) {
      // Если Redis недоступен или job не найден — не критично,
      // главное поменять статус в БД
      console.error("[Cancel] Ошибка при удалении job из очереди:", queueErr);
    }

    // Ставим статус FAILED (отменён пользователем)
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "FAILED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel report error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
