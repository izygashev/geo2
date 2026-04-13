import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getPlanLimits } from "@/lib/plan-limits";

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|blob):/i;

const BrandSchema = z.object({
  brandLogoUrl: z
    .string()
    .max(2048, "URL слишком длинный")
    .refine(
      (url) => !DANGEROUS_PROTOCOLS.test(url.trim()),
      "Недопустимый протокол URL"
    )
    .refine(
      (url) => {
        try {
          const parsed = new URL(url.trim());
          // Only allow https (and http for dev/local environments)
          if (!["https:", "http:"].includes(parsed.protocol)) return false;
          // Block internal / loopback IPs to prevent SSRF
          const hostname = parsed.hostname.toLowerCase();
          if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "[::1]" ||
            hostname.startsWith("10.") ||
            hostname.startsWith("172.") ||
            hostname.startsWith("192.168.") ||
            hostname === "0.0.0.0" ||
            hostname.endsWith(".local") ||
            hostname.endsWith(".internal")
          ) {
            return false;
          }
          return true;
        } catch {
          return false;
        }
      },
      "URL логотипа должен быть валидным https:// адресом"
    )
    .nullable()
    .optional(),
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
