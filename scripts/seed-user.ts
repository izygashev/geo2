import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@example.com",
      password: hash,
      credits: 10,
      plan: "FREE",
    },
  });

  console.log(`✅ User: ${user.id} | ${user.email} | Credits: ${user.credits}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
