/**
 * Prisma Client — синглтон с настройкой пула соединений.
 *
 * Синглтон нужен чтобы при hot-reload в dev и при множественных
 * инстансах в production не создавались лишние PG-соединения.
 *
 * DATABASE_URL задаётся в .env:
 *   postgresql://user:pass@postgres:5432/geo?schema=public
 *
 * Размер пула задаётся через DB_POOL_SIZE (по умолчанию 10).
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Pool configuration ────────────────────────────────────────────────────
// Keep the pool small in serverless environments (each instance = 1 connection,
// PgBouncer/Accelerate multiplexes them).  In a traditional long-running server
// you can increase MAX_POOL_SIZE (e.g. 10).
const IS_SERVERLESS =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.RUNTIME === "edge";

const MAX_POOL_SIZE = IS_SERVERLESS ? 1 : Number(process.env.DB_POOL_SIZE ?? 10);
const IDLE_TIMEOUT_MS = 30_000; // close idle connections after 30 s
const CONNECTION_TIMEOUT_MS = 10_000; // fail-fast if DB unreachable

// ─── Singleton registry ─────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("[Prisma] DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({
    connectionString,
    max: MAX_POOL_SIZE,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

  return client;
}

// ─── Export ─────────────────────────────────────────────────────────────────
// In production: a fresh client per module load (long-running server process).
// In development: persist across hot-reloads via global to avoid connection leaks.
export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
