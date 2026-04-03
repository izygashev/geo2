/**
 * Вспомогательный скрипт: создаёт тестовый проект для test@example.com
 * Запуск: npx tsx scripts/seed-project.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "test@example.com" },
  });

  if (!user) {
    console.log("❌ Пользователь test@example.com не найден");
    return;
  }

  console.log(`✅ User: ${user.id} | Credits: ${user.credits}`);

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      url: "https://example.com",
      name: "Test Project",
    },
  });

  console.log(`✅ Project created: ${project.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
