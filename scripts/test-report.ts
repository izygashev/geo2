/**
 * Тестовый скрипт — отправляет URL на анализ через очередь.
 * Запуск: npx tsx src/test-report.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Queue } from "bullmq";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

const queue = new Queue("report-generation", {
  connection: parseRedisUrl(process.env.REDIS_URL ?? "redis://localhost:6379"),
});

async function main() {
  // Находим тестового пользователя
  const user = await prisma.user.findUnique({
    where: { email: "test@example.com" },
    select: { id: true, credits: true },
  });

  if (!user) {
    console.error("❌ Тестовый пользователь не найден");
    process.exit(1);
  }

  console.log(`👤 User: ${user.id}, credits: ${user.credits}`);

  // Создаём проект
  const testUrl = "https://vercel.com";
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      url: testUrl,
      name: "Vercel",
    },
  });
  console.log(`📁 Project created: ${project.id}`);

  // Создаём отчёт
  const report = await prisma.report.create({
    data: {
      projectId: project.id,
      status: "PROCESSING",
    },
  });
  console.log(`📊 Report created: ${report.id}`);

  // Добавляем в очередь
  const job = await queue.add("generate-report", {
    reportId: report.id,
    projectId: project.id,
    projectUrl: testUrl,
    userId: user.id,
  });

  console.log(`🚀 Job added: ${job.id}`);
  console.log(`\n⏳ Следите за логами worker'a...`);

  await queue.close();
  await prisma.$disconnect();
}

main().catch(console.error);
