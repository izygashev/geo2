import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getPlanLimits } from "@/lib/plan-limits";

const BrandSchema = z.object({
  brandLogoUrl: z.string().max(5000).nullable().optional(),
  brandAccentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Некорректный HEX-цвет")
    .nullable()
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    // Проверяем доступ по плану
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const limits = getPlanLimits(user?.plan ?? "FREE");

    if (!limits.whiteLabel) {
      return NextResponse.json(
        { error: "White-label доступен на тарифах Pro и Agency" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = BrandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Невалидные данные" },
        { status: 400 }
      );
    }

    const data: Record<string, string | null> = {};
    if (parsed.data.brandLogoUrl !== undefined) {
      data.brandLogoUrl = parsed.data.brandLogoUrl;
    }
    if (parsed.data.brandAccentColor !== undefined) {
      data.brandAccentColor = parsed.data.brandAccentColor;
    }

    await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
