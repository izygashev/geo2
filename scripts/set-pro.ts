import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const before = await prisma.user.findUnique({
    where: { email: "igordg@bk.ru" },
    select: { email: true, plan: true, credits: true },
  });
  console.log("Before:", before);

  await prisma.user.update({
    where: { email: "igordg@bk.ru" },
    data: { plan: "PRO" },
  });

  const after = await prisma.user.findUnique({
    where: { email: "igordg@bk.ru" },
    select: { email: true, plan: true, credits: true },
  });
  console.log("✅ Updated:", after);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
