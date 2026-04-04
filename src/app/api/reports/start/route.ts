import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportQueue } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";

const REPORT_COST = 10; // Стоимость одного отчёта в кредитах

// Rate limit: 3 запроса в минуту по userId
const REPORT_RATE_LIMIT = { maxRequests: 3, windowSeconds: 60 };

interface StartReportBody {
  url: string;
}

/**
 * Извлекает читаемое имя из URL (домен без www).
 * Например: "https://www.example.com/page" → "example.com"
 */
function extractProjectName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return url;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Проверяем авторизацию
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      );
    }

    // 1.5 Rate limit по userId
    const rl = checkRateLimit(`reports:${session.user.id}`, REPORT_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите минуту." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // 2. Валидируем тело запроса
    const body = (await request.json()) as StartReportBody;
    if (!body.url) {
      return NextResponse.json(
        { error: "url обязателен" },
        { status: 400 }
      );
    }

    // Нормализуем URL
    let normalizedUrl = body.url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // 3. Проверяем баланс кредитов (НЕ списываем — списание при COMPLETED)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user || user.credits < REPORT_COST) {
      return NextResponse.json(
        { error: `Недостаточно кредитов. Требуется: ${REPORT_COST}, доступно: ${user?.credits ?? 0}` },
        { status: 402 }
      );
    }

    // 4. Находим или создаём проект для этого URL
    let project = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        url: normalizedUrl,
      },
      select: { id: true, url: true, name: true },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          userId: session.user.id,
          url: normalizedUrl,
          name: extractProjectName(normalizedUrl),
        },
        select: { id: true, url: true, name: true },
      });
    }

    // 5. Создаём Report со статусом PROCESSING
    const report = await prisma.report.create({
      data: {
        projectId: project.id,
        status: "PROCESSING",
      },
    });

    // 6. Добавляем задачу в очередь BullMQ
    await reportQueue.add(
      "generate-report",
      {
        reportId: report.id,
        projectId: project.id,
        projectUrl: project.url,
        userId: session.user.id,
      },
      {
        jobId: report.id,
      }
    );

    return NextResponse.json(
      {
        reportId: report.id,
        projectName: project.name,
        status: "PROCESSING",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API /reports/start] Ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
