import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        overallScore: true,
        createdAt: true,
        project: {
          select: {
            userId: true,
            name: true,
            url: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Отчёт не найден" },
        { status: 404 }
      );
    }

    // Проверяем, что отчёт принадлежит пользователю
    if (report.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Нет доступа к отчёту" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: report.id,
      status: report.status,
      overallScore: report.overallScore,
      projectName: report.project.name,
      projectUrl: report.project.url,
      createdAt: report.createdAt,
    });
  } catch (error) {
    console.error("[API /reports/[id]/status] Ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
