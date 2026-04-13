import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Dual-layer rate limiting for password change brute-force protection:
// 1) Per-user: 3 attempts per 5 min (prevents brute-force via stolen session)
// 2) Per-IP:  10 attempts per 15 min (prevents distributed brute-force)
const PWD_USER_LIMIT = { maxRequests: 3, windowSeconds: 300 };
const PWD_IP_LIMIT = { maxRequests: 10, windowSeconds: 900 };

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z
    .string()
    .min(8, "Минимум 8 символов")
    .max(128, "Не более 128 символов")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Пароль должен содержать строчную, заглавную букву и цифру"
    ),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- IP-based rate limit ---
    const clientIp = getClientIp(req.headers);
    const ipRl = checkRateLimit(`pwd-ip:${clientIp}`, PWD_IP_LIMIT);
    if (!ipRl.allowed) {
      const retryAfter = Math.ceil((ipRl.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Слишком много попыток. Попробуйте позже." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    // --- Per-user rate limit ---
    const userRl = checkRateLimit(`pwd-change:${session.user.id}`, PWD_USER_LIMIT);
    if (!userRl.allowed) {
      const retryAfter = Math.ceil((userRl.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Слишком много попыток. Подождите 5 минут." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Невалидные данные" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "Невозможно сменить пароль" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
