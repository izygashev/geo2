import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/** POST — сгенерировать shareId для отчёта */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      shareId: true,
      project: { select: { userId: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Отчёт не найден" }, { status: 404 });
  }
  if (report.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  // Если уже есть shareId — возвращаем его
  if (report.shareId) {
    return NextResponse.json({ shareId: report.shareId });
  }

  // Генерируем новый
  const shareId = randomBytes(12).toString("base64url");

  await prisma.report.update({
    where: { id },
    data: { shareId },
  });

  return NextResponse.json({ shareId });
}

/** DELETE — отключить публичную ссылку */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    select: { project: { select: { userId: true } } },
  });

  if (!report) {
    return NextResponse.json({ error: "Отчёт не найден" }, { status: 404 });
  }
  if (report.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  await prisma.report.update({
    where: { id },
    data: { shareId: null },
  });

  return NextResponse.json({ success: true });
}
