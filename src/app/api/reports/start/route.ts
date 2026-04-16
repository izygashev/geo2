import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportQueue } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPlanLimits } from "@/lib/plan-limits";
import { ensureWorkerRunning } from "@/lib/worker-manager";

// Rate limit: 3 запроса в минуту по userId
const REPORT_RATE_LIMIT = { maxRequests: 3, windowSeconds: 60 };

// ─── SSRF Protection ─────────────────────────────────────
function isSafeUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost variants
  if (hostname === "localhost" || hostname === "localhost.localdomain") {
    return false;
  }

  // Block IPv6 loopback
  if (hostname === "[::1]" || hostname === "::1") {
    return false;
  }

  // Check IPv4 private/reserved ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c] = ipv4Match.map(Number);
    if (
      a === 127 ||                            // 127.0.0.0/8 loopback
      a === 10 ||                             // 10.0.0.0/8 private
      (a === 172 && b >= 16 && b <= 31) ||    // 172.16.0.0/12 private
      (a === 192 && b === 168) ||             // 192.168.0.0/16 private
      (a === 169 && b === 254) ||             // 169.254.0.0/16 link-local + cloud metadata
      a === 0                                 // 0.0.0.0/8
    ) {
      return false;
    }
  }

  return true;
}

interface StartReportBody {
  url: string;
  fingerprintId?: string;
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

    // SSRF Protection — блокируем внутренние адреса
    if (!isSafeUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "Недопустимый URL-адрес. Использование локальных или приватных IP-адресов запрещено." },
        { status: 400 }
      );
    }

    // 3. Проверяем баланс кредитов (НЕ списываем — списание при COMPLETED)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, plan: true, authProvider: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const limits = getPlanLimits(user.plan);

    // ─── Hybrid Anti-Abuse (FREE tier only) ───────────────
    if (user.plan === "FREE") {
      // Rule 1: Max 1 completed/processing report per userId (universal)
      const existingReportCount = await prisma.report.count({
        where: {
          project: { userId: session.user.id },
          status: { in: ["COMPLETED", "PROCESSING"] },
        },
      });

      if (existingReportCount >= 1) {
        return NextResponse.json(
          {
            error: "Бесплатный аудит уже использован. Перейдите на тариф PRO для неограниченных отчётов.",
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }

      // Rule 2: For Credentials users — check device fingerprint
      if (user.authProvider === "credentials") {
        const fingerprintId = body.fingerprintId;

        if (!fingerprintId) {
          return NextResponse.json(
            { error: "Не удалось определить устройство. Попробуйте обновить страницу." },
            { status: 400 }
          );
        }

        // Check if this fingerprint already generated a report
        const fingerprintUsed = await prisma.report.findFirst({
          where: {
            fingerprintId,
            status: { in: ["COMPLETED", "PROCESSING"] },
          },
          select: { id: true },
        });

        if (fingerprintUsed) {
          return NextResponse.json(
            {
              error: "Бесплатный аудит уже был сгенерирован с этого устройства. Пожалуйста, перейдите на тариф PRO.",
              upgradeRequired: true,
            },
            { status: 403 }
          );
        }
      }
      // Google OAuth users: only userId check above (Google's anti-spam is sufficient)
    }

    if (user.credits < limits.reportCost) {
      return NextResponse.json(
        { error: `Недостаточно кредитов. Требуется: ${limits.reportCost}, доступно: ${user.credits}` },
        { status: 402 }
      );
    }

    // 3.5 Проверяем лимит проектов + concurrent reports + существующий проект (параллельно)
    const [projectCount, existingProject, processingCount] = await Promise.all([
      prisma.project.count({
        where: { userId: session.user.id },
      }),
      prisma.project.findFirst({
        where: { userId: session.user.id, url: normalizedUrl },
        select: { id: true, url: true, name: true },
      }),
      prisma.report.count({
        where: {
          project: { userId: session.user.id },
          status: "PROCESSING",
        },
      }),
    ]);

    if (!existingProject && projectCount >= limits.maxProjects) {
      return NextResponse.json(
        { error: `Лимит проектов для вашего плана: ${limits.maxProjects}. Удалите неиспользуемые проекты или повысьте тариф.` },
        { status: 403 }
      );
    }

    // 3.6 Проверяем concurrent PROCESSING отчётов
    if (processingCount >= limits.maxConcurrentReports) {
      return NextResponse.json(
        { error: `Вы уже обрабатываете ${processingCount} отчёт(ов). Дождитесь завершения.` },
        { status: 429 }
      );
    }

    // 3.7 Cooldown для проекта — нельзя спамить rerun
    if (existingProject) {
      const recentReport = await prisma.report.findFirst({
        where: {
          projectId: existingProject.id,
          createdAt: {
            gte: new Date(Date.now() - limits.projectCooldownSeconds * 1000),
          },
        },
        select: { id: true },
      });

      if (recentReport) {
        const minutes = Math.ceil(limits.projectCooldownSeconds / 60);
        return NextResponse.json(
          { error: `Подождите ${minutes} мин. между отчётами для одного проекта.` },
          { status: 429 }
        );
      }
    }

    // 4. Находим или создаём проект для этого URL
    let project = existingProject;

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

    // 5. Создаём Report + оптимистично списываем кредиты (атомарно)
    const reportCost = limits.reportCost;

    const [report] = await prisma.$transaction([
      prisma.report.create({
        data: {
          projectId: project.id,
          status: "PROCESSING",
          fingerprintId: body.fingerprintId || null,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: reportCost } },
      }),
    ]);

    // 6. Добавляем задачу в очередь BullMQ (воркер стартует автоматически)
    ensureWorkerRunning();

    await reportQueue.add(
      "generate-report",
      {
        reportId: report.id,
        projectId: project.id,
        projectUrl: project.url,
        userId: session.user.id,
        multiLlm: limits.multiLlm,
        reportCost,
      },
      {
        jobId: report.id,
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 }, // 10s, 20s, 40s
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
