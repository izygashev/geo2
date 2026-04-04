import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ─── Zod-схема регистрации ──────────────────────────────
const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(100, "Имя слишком длинное")
    .trim(),
  email: z
    .string()
    .email("Некорректный формат email")
    .max(255, "Email слишком длинный")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Пароль должен содержать минимум 6 символов")
    .max(128, "Пароль слишком длинный"),
});

// Rate limit: 5 регистраций в 10 минут по IP
const REGISTER_RATE_LIMIT = { maxRequests: 5, windowSeconds: 600 };

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`register:${ip}`, REGISTER_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток регистрации. Попробуйте позже." },
        { status: 429 }
      );
    }

    // Валидация через Zod
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues ?? [];
      const firstError = issues[0]?.message ?? "Невалидные данные";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          credits: user.credits,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
