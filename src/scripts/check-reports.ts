import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      overallScore: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(reports, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
