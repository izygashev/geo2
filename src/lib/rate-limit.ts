/**
 * In-memory Rate Limiter (для MVP).
 *
 * Хранит счётчики запросов по ключу (IP или userId).
 * Автоочистка старых записей каждые 60 секунд.
 *
 * Для production с несколькими инстансами заменить на upstash-ratelimit + Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp в ms
}

const store = new Map<string, RateLimitEntry>();

// Автоочистка каждые 60 секунд
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

interface RateLimitConfig {
  /** Максимум запросов за окно */
  maxRequests: number;
  /** Размер окна в секундах */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Проверяет rate limit по ключу.
 * Возвращает { allowed, remaining, resetAt }.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const existing = store.get(key);

  // Окно истекло — сброс
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Окно ещё активно
  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Извлечение IP из заголовков запроса */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}
