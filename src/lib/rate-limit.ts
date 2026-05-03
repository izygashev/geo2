/**
 * Redis-backed Rate Limiter — Fixed Window.
 *
 * Использует ioredis + Lua-скрипт (INCR + EXPIRE) для атомарного счётчика.
 * При недоступности Redis — пропускает запрос (fail-open).
 *
 * Переменная окружения: REDIS_URL (по умолчанию redis://localhost:6379)
 */

import Redis from "ioredis";

// ── Singleton Redis connection ──────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  try {
    _redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      lazyConnect: false,
      enableOfflineQueue: false,
    });

    _redis.on("error", () => {
      // silently absorb — we fall back to allow
    });

    return _redis;
  } catch {
    return null;
  }
}

// ── Lua: atomic INCR + EXPIRE on first call within window ──────────────────

const FIXED_WINDOW_SCRIPT = `
local key     = KEYS[1]
local window  = tonumber(ARGV[1])
local current = redis.call("INCR", key)
if current == 1 then
  redis.call("EXPIRE", key, window)
end
local ttl = redis.call("TTL", key)
return { current, ttl }
`;

// ── Public types (unchanged) ────────────────────────────────────────────────

interface RateLimitConfig {
  /** Максимум запросов за окно */
  maxRequests: number;
  /** Размер окна в секундах */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // timestamp в ms
}

// ── In-memory fallback (used when Redis is unavailable) ─────────────────────

interface FallbackEntry {
  count: number;
  resetAt: number;
}

const fallbackStore = new Map<string, FallbackEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fallbackStore) {
    if (entry.resetAt <= now) fallbackStore.delete(key);
  }
}, 60_000);

function checkFallback(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1_000;
  const existing = fallbackStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    fallbackStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (existing.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

// ── Main export ─────────────────────────────────────────────────────────────

/**
 * Проверяет rate limit по ключу.
 * Возвращает { allowed, remaining, resetAt }.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();

  if (!redis || redis.status === "end" || redis.status === "close") {
    // Redis недоступен — fail-open с in-memory fallback
    return checkFallback(key, config);
  }

  try {
    const result = (await redis.eval(
      FIXED_WINDOW_SCRIPT,
      1,
      key,
      String(config.windowSeconds)
    )) as [number, number];

    const [current, ttl] = result;
    const resetAt = Date.now() + Math.max(ttl, 0) * 1_000;
    const allowed = current <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - current);

    return { allowed, remaining, resetAt };
  } catch {
    // Redis вернул ошибку — fail-open
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowSeconds * 1_000 };
  }
}

/** Извлечение IP из заголовков запроса */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}
