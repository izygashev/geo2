# Асинхронность и Event Loop — Аудит Geo Studio

**Дата:** 2026-04-16  
**Стек:** Next.js 15 (App Router), Prisma + `@prisma/adapter-pg`, BullMQ + Redis, Playwright, OpenRouter API  
**Автор аудита:** Senior Node.js / Next.js Performance Architect

---

## 1. Critical Bottlenecks (Make Async / Move to Queue)

### 1.1 🔴 `GET /api/reports/[id]/pdf/route.ts` — Playwright PDF in API Route

**Файл:** `src/app/api/reports/[id]/pdf/route.ts`, вся функция `GET()`  
**Проблема:** Полный цикл Playwright (`chromium.launch()` → `page.goto()` → `page.pdf()` → `browser.close()`) выполняется **синхронно внутри API route**. Это занимает 5–15 секунд, в течение которых:
- HTTP-соединение висит (клиент ждёт).
- Один из ограниченного числа serverless/Edge workers Next.js заблокирован.
- `chromium.launch()` потребляет ~200–400 МБ RAM на каждый запрос.
- При 3+ параллельных PDF-запросах — OOM или deadlock Node.js process.

**Текущий поток:**
```
Client → GET /api/reports/:id/pdf → launch browser → goto → pdf() → respond (5-15s)
```

**Рекомендация:** Offload в BullMQ очередь `pdf-generation`:
```
Client → POST /api/reports/:id/pdf → add job to queue → respond 202 { jobId }
Client → GET /api/reports/:id/pdf/status?jobId=... → poll until done
Worker → chromium.launch → pdf → save to S3/disk → mark job done
Client → GET /api/reports/:id/pdf/download → stream from S3/disk
```

Альтернатива (проще, если нагрузка мала): оставить синхронным, но добавить **глобальный Playwright пул** (singleton browser с `browserContext`), чтобы не запускать `chromium.launch()` на каждый запрос. Это уменьшит время с ~10s до ~3s.

**Приоритет:** P0 — при масштабировании это первое, что упадёт.

---

### 1.2 🔴 `POST /api/analyze/route.ts` — LLM Call Blocks API Route

**Файл:** `src/app/api/analyze/route.ts`, строки 115–185  
**Проблема:** Синхронный `await fetch()` к OpenRouter API с fallback-chain из 2 моделей + retry при 429. В худшем случае (все модели 429, retry с 3s delay) — запрос висит **до 20 секунд**:
```
Model 1 fail → Model 1 retry (3s wait) → Model 2 fail → Model 2 retry (3s wait)
```
Всё это время API route заблокирован.

**Текущий поток:**
```
Client → POST /api/analyze → fetch model1 → 429 → sleep(3000) → retry → fetch model2 → respond
```

**Рекомендация:** Для landing-page hero-формы это приемлемо (пользователь ждёт результат inline), но:
1. Уменьшить retry delay с 3000ms до 1500ms.
2. Добавить `AbortController` с общим timeout 15s, чтобы гарантировать ответ клиенту.
3. Запросы к моделям можно делать **параллельно** (`Promise.any()`), а не последовательно — первый успешный ответ выигрывает:
```ts
const result = await Promise.any(
  FREE_MODELS.map(model => fetchModel(model, systemPrompt, userPrompt))
);
```
Это сократит worst-case с ~20s до ~6s.

**Приоритет:** P1 — landing page responsiveness.

---

### 1.3 🟡 `POST /api/reports/generate-content/route.ts` — LLM Call Blocks API Route

**Файл:** `src/app/api/reports/generate-content/route.ts`, строки 160–170  
**Проблема:** `await client.chat.completions.create()` к Claude Sonnet — одиночный вызов, блокирует route на 3–10 секунд. Нет timeout, нет streaming.

**Рекомендация:**
1. Использовать **streaming response** (`stream: true` в OpenAI SDK + `ReadableStream` в response), чтобы клиент видел прогресс, а route не висел молча.
2. Добавить `timeout` через OpenAI SDK option или `AbortController`.
3. Для очереди — overkill (результат нужен inline).

**Приоритет:** P2 — UX improvement.

---

### 1.4 🟡 `report.processor.ts` — Sequential SoV Checks with 1.5s Delays

**Файл:** `src/workers/report.processor.ts`, строки 107–130  
**Проблема:** SoV-проверки по ключевым словам выполняются **строго последовательно** с `await sleep(1500)` между каждым:
```ts
for (let i = 0; i < keywords.length; i++) {
  const result = await checkShareOfVoice(kw.query, ...);
  sovResults.push(result);
  if (i < keywords.length - 1) await sleep(1500);
}
```
При 10 ключевых словах это ~15s только на паузы + ~3s × 10 = ~30s на API-вызовы = **~45s total**.

**Рекомендация:** Запускать SoV-проверки **пакетами по 3** (batch parallelism) с delay между пакетами:
```ts
const BATCH_SIZE = 3;
for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
  const batch = keywords.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(
    batch.map(kw => checkShareOfVoice(kw.query, projectUrl, acc))
  );
  sovResults.push(...results);
  if (i + BATCH_SIZE < keywords.length) await sleep(1500);
}
```
Это сократит SoV-фазу с ~45s до ~20s при 10 keywords.

**Приоритет:** P1 — прямое ускорение отчётов на 40–50%.

---

### 1.5 🟡 `report.processor.ts` — Sequential Steps 4 + 4.5 + 5

**Файл:** `src/workers/report.processor.ts`, строки 145–180  
**Проблема:** Digital PR, llms.txt generation, и Recommendations выполняются строго последовательно, хотя Digital PR и llms.txt generation **не зависят друг от друга**:
```
Step 4: checkDigitalPr()        ← 3-5s
Step 4.5: generateLlmsTxt()     ← 3-5s  (зависит от siteData + sovResults, НЕ от digitalPr)
Step 5: generateRecommendations() ← 5-10s (зависит от siteData + sovResults, НЕ от digitalPr/llmsTxt)
```

**Рекомендация:** Steps 4 и 4.5 можно запустить параллельно:
```ts
const [digitalPrResults, generatedLlmsTxt] = await Promise.all([
  checkDigitalPr(projectUrl, brandName, usageAccumulator),
  generateLlmsTxt(siteData, sovResults, usageAccumulator),
]);
```
Экономия: ~3–5 секунд на каждый отчёт.

Step 5 (`generateRecommendations`) зависит только от `siteData` и `sovResults` (не от digitalPr/llmsTxt), поэтому теоретически тоже можно параллелить с 4+4.5, **но** это создаст 3 параллельных LLM-вызова, что может hit rate limits у OpenRouter. Оставить последовательным после параллельного 4+4.5.

**Приоритет:** P2 — простая оптимизация, низкий риск.

---

## 2. Prisma & Database Optimizations (Parallelize)

### 2.1 🟡 `dashboard/reports/[id]/page.tsx` — 3 Sequential DB Queries

**Файл:** `src/app/dashboard/reports/[id]/page.tsx`, строки 52–95  
**Проблема:** Три независимых запроса выполняются последовательно:
```ts
const report = await prisma.report.findUnique({ ... });      // Query 1: ~5-20ms
// ... проверка доступа ...
const scoreHistory = await prisma.report.findMany({ ... });   // Query 2: ~5-15ms
const currentUser = await prisma.user.findUnique({ ... });    // Query 3: ~3-5ms
```
Query 2 и Query 3 **не зависят** от результата Query 1 (кроме `report.projectId` для scoreHistory и `session.user.id` для user).

**Рекомендация:** Запросить всё одним `Promise.all()` после получения `report` (из-за зависимости `report.projectId`):
```ts
const report = await prisma.report.findUnique({ ... });
if (!report || report.project.userId !== session.user.id) redirect("/dashboard");

const [scoreHistory, currentUser] = await Promise.all([
  prisma.report.findMany({ where: { projectId: report.projectId, ... } }),
  prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
]);
```
**Экономия:** ~5–15ms (незначительно для SSR, но good practice).

---

### 2.2 🟡 `dashboard/billing/page.tsx` — 3 Sequential DB Queries

**Файл:** `src/app/dashboard/billing/page.tsx`, строки 16–38  
**Проблема:** Три запроса выполняются последовательно:
```ts
const user = await prisma.user.findUnique({ ... });           // Query 1
const activeSubscription = await prisma.subscription.findFirst({ ... }); // Query 2
const payments = await prisma.payment.findMany({ ... });      // Query 3
```
Все три зависят только от `session.user.id` — полностью независимы.

**Рекомендация:**
```ts
const [user, activeSubscription, payments] = await Promise.all([
  prisma.user.findUnique({ ... }),
  prisma.subscription.findFirst({ ... }),
  prisma.payment.findMany({ ... }),
]);
```
**Экономия:** ~10–20ms.

---

### 2.3 🟡 `dashboard/projects/[id]/settings/page.tsx` — 2 Sequential DB Queries

**Файл:** `src/app/dashboard/projects/[id]/settings/page.tsx`, строки 18–38  
**Проблема:**
```ts
const project = await prisma.project.findUnique({ ... });    // Query 1
// ... access check ...
const user = await prisma.user.findUnique({ ... });          // Query 2
```
Query 2 не зависит от Query 1.

**Рекомендация:**
```ts
const [project, user] = await Promise.all([
  prisma.project.findUnique({ ... }),
  prisma.user.findUnique({ ... }),
]);
if (!project || project.userId !== session.user.id) notFound();
```
**Экономия:** ~3–5ms.

---

### 2.4 🟡 `POST /api/reports/start/route.ts` — 5+ Sequential Validation Queries

**Файл:** `src/app/api/reports/start/route.ts`, строки 130–245  
**Проблема:** Серия валидационных запросов выполняется строго последовательно:
```ts
const user = await prisma.user.findUnique({ ... });               // 1
const existingReportCount = await prisma.report.count({ ... });    // 2 (FREE only)
const fingerprintUsed = await prisma.report.findFirst({ ... });    // 3 (FREE + credentials only)
const projectCount = await prisma.project.count({ ... });          // 4
const existingProject = await prisma.project.findFirst({ ... });   // 5
const processingCount = await prisma.report.count({ ... });        // 6
const recentReport = await prisma.report.findFirst({ ... });       // 7 (if existingProject)
```

**Рекомендация:** Группировать независимые запросы после первого (user нужен для plan checks):
```ts
const user = await prisma.user.findUnique({ ... }); // Нужен первым (plan → limits)

// Все остальные запросы зависят только от session.user.id и normalizedUrl
const [existingReportCount, projectCount, existingProject, processingCount] = await Promise.all([
  user.plan === "FREE" ? prisma.report.count({ ... }) : Promise.resolve(0),
  prisma.project.count({ ... }),
  prisma.project.findFirst({ ... }),
  prisma.report.count({ where: { ..., status: "PROCESSING" } }),
]);
```
**Экономия:** ~15–30ms на каждый запуск отчёта. При высокой нагрузке — значимо.

---

### 2.5 🟢 `report.processor.ts` — Transaction is Already Optimal

**Файл:** `src/workers/report.processor.ts`, строки 195–265  
**Наблюдение:** `$transaction` с `report.update`, `shareOfVoice.createMany`, `recommendation.createMany` — **правильно**. Все три операции внутри одной транзакции, что гарантирует атомарность. `createMany` вместо loop — оптимально.

---

## 3. Over-engineered (Keep Synchronous)

### 3.1 ✅ `GET /api/reports/[id]/status/route.ts` — Правильно синхронный

**Файл:** `src/app/api/reports/[id]/status/route.ts`  
**Оценка:** Polling endpoint: один `prisma.report.findUnique()` + `reportQueue.getJob()`. Обе операции — fast reads (~5ms). Перемещение в очередь или добавление сложного caching было бы overkill. **Оставить как есть.**

### 3.2 ✅ `POST /api/reports/[id]/cancel/route.ts` — Правильно синхронный

**Файл:** `src/app/api/reports/[id]/cancel/route.ts`  
**Оценка:** `prisma.report.findUnique()` + `reportQueue.getJob()` + `prisma.report.update()`. Быстрые операции, результат нужен немедленно. **Оставить как есть.**

### 3.3 ✅ `DELETE /api/projects/[id]/route.ts` — Правильно синхронный

**Файл:** `src/app/api/projects/[id]/route.ts`  
**Оценка:** Один `findUnique` + один `delete`. Fast, atomic. **Оставить как есть.**

### 3.4 ✅ `POST /api/settings/password/route.ts`, `POST /api/settings/profile/route.ts`

**Оценка:** Быстрые CRUD-операции с bcrypt (password) или prisma update (profile). bcrypt ~100ms — допустимо для user-initiated action. **Оставить как есть.**

### 3.5 ✅ `POST /api/billing/subscribe/route.ts` — Правильно синхронный

**Оценка:** Один запрос к ЮKassa API + один `prisma.subscription.create`. Результат (`confirmation_url`) нужен клиенту немедленно для redirect. **Оставить как есть.**

### 3.6 ✅ `POST /api/billing/webhook/route.ts` — Правильно синхронный

**Оценка:** Webhook от ЮKassa — должен ответить 200 OK быстро. Внутри — `$transaction` с upsert/update. Всё правильно. Единственное замечание: в `handlePaymentCancelled` есть 3 sequential DB queries без `Promise.all`, но это webhook (не user-facing), и запросы зависят друг от друга. **Оставить как есть.**

### 3.7 ✅ Rate Limiter (`src/lib/rate-limit.ts`) — Правильно in-memory

**Оценка:** `Map`-based rate limiter — O(1) lookup, нет I/O. Для single-instance deployment — идеально. Перемещение в Redis (upstash-ratelimit) имеет смысл только при multi-instance scaling. **Оставить как есть для текущей архитектуры.**

---

## 4. Already Optimized (Good Job)

### 4.1 ✅ `POST /api/reports/start/route.ts` + BullMQ Queue Architecture

**Файл:** `src/app/api/reports/start/route.ts` + `src/lib/queue.ts` + `src/lib/worker-manager.ts`  
**Оценка:** Образцовая реализация:
- API route **не выполняет тяжёлую работу** — только валидация + `reportQueue.add()`.
- Оптимистичное списание кредитов в `$transaction` (report create + credits decrement).
- BullMQ job с `attempts: 3`, `backoff: exponential`.
- Worker с `concurrency: 1`, `lockDuration: 600_000` — правильно для Playwright.
- Refund при финальном failure — отлично.

### 4.2 ✅ `src/lib/worker-manager.ts` — Lazy Singleton Worker

**Оценка:** Singleton worker через `globalThis` (hot-reload safe) + lazy init. Telegram alerts на `failed` и `stalled` events. **Отлично.**

### 4.3 ✅ `src/workers/report.processor.ts` — LLM Usage Accumulator

**Оценка:** Mutable accumulator pattern — собирает token usage по всему pipeline без дополнительных DB-запросов. Сохраняется один раз в конце в `$transaction`. **Отлично.**

### 4.4 ✅ `src/services/scraper.ts` — Playwright with Resource Blocking

**Оценка:**
- Блокирует images, fonts, video через `page.route()` — ускоряет загрузку.
- `waitUntil: "domcontentloaded"` вместо `"networkidle"` — быстрее.
- Fetch fallback при Playwright failure — graceful degradation.
- Запускается **только в Worker**, не в API route. **Правильно.**

### 4.5 ✅ `src/services/llm.ts` — Lazy OpenRouter Client + Model Cache

**Оценка:**
- `getClient()` с lazy init — не создаёт connection до первого использования.
- `fetchTopModel()` с 1-hour TTL cache — не бьёт API на каждый запрос.
- `callWithFallback()` — fallback chain с free models. **Правильно.**

### 4.6 ✅ `scripts/cron-scheduled-reports.ts` — Standalone Script

**Оценка:** Запускается из системного cron, использует собственный Prisma client + BullMQ Queue. Не блокирует Next.js process. **Правильно.**

### 4.7 ✅ `src/lib/email.ts` — Fire-and-forget Email

**Оценка:** `sendReportReadyEmail()` вызывается в worker с `try/catch` — ошибка email не ломает pipeline отчёта. **Правильно.**

---

## Summary Matrix

| # | Файл / Модуль | Проблема | Приоритет | Действие |
|---|---|---|---|---|
| 1.1 | `api/reports/[id]/pdf/route.ts` | Playwright в API route — 5-15s block | **P0** | Очередь или browser pool |
| 1.2 | `api/analyze/route.ts` | Sequential LLM fallback — до 20s | **P1** | `Promise.any()` параллельно |
| 1.3 | `api/reports/generate-content/route.ts` | LLM без streaming/timeout | **P2** | Streaming response |
| 1.4 | `report.processor.ts` SoV loop | Sequential + 1.5s delays | **P1** | Batch parallelism (3) |
| 1.5 | `report.processor.ts` Steps 4+4.5 | Sequential independent steps | **P2** | `Promise.all()` |
| 2.1 | `dashboard/reports/[id]/page.tsx` | 3 sequential DB queries | **P3** | `Promise.all()` |
| 2.2 | `dashboard/billing/page.tsx` | 3 sequential DB queries | **P3** | `Promise.all()` |
| 2.3 | `dashboard/projects/.../settings` | 2 sequential DB queries | **P3** | `Promise.all()` |
| 2.4 | `api/reports/start/route.ts` | 5+ sequential validation queries | **P2** | `Promise.all()` groups |

**Estimated Impact:**
- P0 (PDF): Prevents server crashes under load
- P1 (SoV batch + analyze): Report generation ~40% faster, landing page ~60% faster
- P2 (Promise.all in processor + start): ~5-10s faster per report
- P3 (SSR page queries): ~10-30ms per page load (minor, but good practice)
