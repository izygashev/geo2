import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Удаляем зависимые данные
  await prisma.recommendation.deleteMany({});
  await prisma.shareOfVoice.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.project.deleteMany({});

  // Сбрасываем кредиты
  await prisma.user.updateMany({
    where: { email: "test@example.com" },
    data: { credits: 50 },
  });

  const users = await prisma.user.findMany({
    select: { email: true, credits: true },
  });
  console.log("Users after reset:", users);

  await prisma.$disconnect();
}

main().catch(console.error);
