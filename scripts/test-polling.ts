/**
 * E2E тест поллинга: авторизация → POST /api/reports/start (url) → поллинг статуса → проверка COMPLETED
 * Запуск: npx tsx scripts/test-polling.ts
 */
import "dotenv/config";

const BASE = "http://localhost:3000";

async function main() {
  // 1. CSRF
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.getSetCookie?.() ?? [];
  console.log("✅ CSRF token получен");

  // 2. Авторизация
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

  const allCookies = [
    ...cookies,
    ...(loginRes.headers.getSetCookie?.() ?? []),
  ];
  const cookieHeader = allCookies.map((c) => c.split(";")[0]).join("; ");
  console.log("✅ Авторизация:", loginRes.status);

  // 3. POST /api/reports/start с URL
  const startRes = await fetch(`${BASE}/api/reports/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ url: "https://test-polling.com" }),
  });

  const startData = await startRes.json();
  console.log(`✅ POST /api/reports/start → ${startRes.status}`);
  console.log("   Response:", JSON.stringify(startData, null, 2));

  if (!startData.reportId) {
    console.error("❌ Нет reportId, прерываемся");
    return;
  }

  // 4. Поллинг /api/reports/[id]/status каждые 2 секунды
  console.log("\n⏳ Поллинг статуса...");
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(
      `${BASE}/api/reports/${startData.reportId}/status`,
      { headers: { Cookie: cookieHeader } }
    );
    const statusData = await statusRes.json();
    console.log(
      `   [${i + 1}] Status: ${statusData.status} | Score: ${statusData.overallScore ?? "—"}`
    );

    if (statusData.status === "COMPLETED") {
      console.log("\n🎉 Отчёт завершён!");
      console.log("   Project:", statusData.projectName);
      console.log("   URL:", statusData.projectUrl);
      console.log("   Score:", statusData.overallScore);
      return;
    }

    if (statusData.status === "FAILED") {
      console.log("\n❌ Отчёт упал");
      return;
    }
  }

  console.log("⏱️ Timeout — отчёт не завершился за 20 секунд");
}

main().catch(console.error);
