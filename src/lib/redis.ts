import type { ConnectionOptions } from "bullmq";

/**
 * Конфигурация подключения к Redis для BullMQ.
 * Передаём объект-конфиг, а не инстанс IORedis —
 * BullMQ сам создаст подключение с правильной версией ioredis.
 */
function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null, // Обязательно для BullMQ Worker
  };
}

export const redisConnection: ConnectionOptions = parseRedisUrl(
  process.env.REDIS_URL ?? "redis://localhost:6379"
);
