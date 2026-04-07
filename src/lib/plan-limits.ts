/**
 * Лимиты по тарифным планам.
 *
 * Централизованное место для всех ограничений — используется
 * в API-роутах, дашборде и worker'е.
 */

export interface PlanLimits {
  /** Макс. количество проектов */
  maxProjects: number;
  /** Макс. одновременных PROCESSING отчётов */
  maxConcurrentReports: number;
  /** Макс. scheduled-проектов (0 = нельзя) */
  maxScheduledProjects: number;
  /** Cooldown между отчётами одного проекта (секунды) */
  projectCooldownSeconds: number;
  /** Стоимость обычного отчёта в кредитах */
  reportCost: number;
  /** Доступен ли конкурентный бенчмарк */
  competitorBenchmark: boolean;
  /** Стоимость конкурентного бенчмарка в кредитах */
  benchmarkCost: number;
  /** Доступен ли multi-LLM */
  multiLlm: boolean;
  /** Доступен ли white-label PDF */
  whiteLabel: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    maxProjects: 3,
    maxConcurrentReports: 1,
    maxScheduledProjects: 0,
    projectCooldownSeconds: 5 * 60, // 5 минут
    reportCost: 10,
    competitorBenchmark: false,
    benchmarkCost: 25,
    multiLlm: false,
    whiteLabel: false,
  },
  PRO: {
    maxProjects: 20,
    maxConcurrentReports: 3,
    maxScheduledProjects: 5,
    projectCooldownSeconds: 2 * 60, // 2 минуты
    reportCost: 30, // Multi-LLM: 3 модели × ~10 = 30
    competitorBenchmark: true,
    benchmarkCost: 25,
    multiLlm: true,
    whiteLabel: true,
  },
  AGENCY: {
    maxProjects: 100,
    maxConcurrentReports: 5, // Playwright RAM safety cap
    maxScheduledProjects: 100,
    projectCooldownSeconds: 60, // 1 минута
    reportCost: 30, // Multi-LLM: 3 модели × ~10 = 30
    competitorBenchmark: true,
    benchmarkCost: 25,
    multiLlm: true,
    whiteLabel: true,
  },
};

/**
 * Получить лимиты для плана. Если план неизвестен — возвращает FREE.
 */
export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}
