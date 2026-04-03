/**
 * E2E тест: авторизуемся → POST /api/reports/start → проверяем ответ
 * Запуск: npx tsx scripts/test-queue.ts
 */

const BASE = "http://localhost:3000";

async function main() {
  // 1. Получаем CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.getSetCookie?.() ?? [];
  console.log("✅ CSRF token получен");

  // 2. Авторизуемся
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies.join("; "),
    },
    body: new URLSearchParams({
      email: "test@example.com",
      password: "password123",
      csrfToken,
    }),
    redirect: "manual",
  });

  // Собираем все cookies (session token)
  const allCookies = [
    ...cookies,
    ...(loginRes.headers.getSetCookie?.() ?? []),
  ];
  const cookieHeader = allCookies
    .map((c) => c.split(";")[0])
    .join("; ");
  console.log("✅ Авторизация прошла, status:", loginRes.status);

  // 3. POST /api/reports/start
  const projectId = "2f9a771d-58eb-4439-83d5-aafe9bb81e9f";
  const startRes = await fetch(`${BASE}/api/reports/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ projectId }),
  });

  const data = await startRes.json();
  console.log(`✅ POST /api/reports/start → ${startRes.status}`);
  console.log("   Response:", JSON.stringify(data, null, 2));

  if (data.reportId) {
    console.log("\n⏳ Ждём 8 секунд, пока Worker обработает задачу...");
    await new Promise((r) => setTimeout(r, 8000));

    // 4. Проверяем статус отчёта в БД
    const { PrismaClient } = await import("../src/generated/prisma/client.js");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const adapter = new PrismaPg({
      connectionString: "postgresql://postgres:postgres@localhost:5433/geo_saas",
    });
    const prisma = new PrismaClient({ adapter });

    const report = await prisma.report.findUnique({
      where: { id: data.reportId },
    });
    console.log("\n📊 Статус отчёта в БД:");
    console.log(`   ID: ${report?.id}`);
    console.log(`   Status: ${report?.status}`);
    console.log(`   Score: ${report?.overallScore}`);

    const user = await prisma.user.findFirst({
      where: { email: "test@example.com" },
      select: { credits: true },
    });
    console.log(`   Credits after: ${user?.credits}`);

    await prisma.$disconnect();
  }
}

main().catch(console.error);
