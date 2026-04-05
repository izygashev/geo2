import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.update({
    where: { email: "igordg@bk.ru" },
    data: { credits: 10000 },
  });

  const u = await prisma.user.findUnique({
    where: { email: "igordg@bk.ru" },
    select: { email: true, credits: true },
  });
  console.log("✅ Updated:", u);
  await prisma.$disconnect();
}

main().catch(console.error);
