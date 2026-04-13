# Geo Studio — Architecture Export (Part 2 of 2)

> **Generated:** 2026-04-13  
> **Repo:** `izygashev/geo2` / branch `master`  
> **Continues from:** Part 1 (Project Structure, DB Schema, Core Configs)  

---

## 4. API ROUTE INVENTORY

### 4.1 Authentication (`/api/auth/`)

| Method | Endpoint | Auth | Rate Limit | Summary |
|--------|----------|------|------------|---------|
| `POST` | `/api/auth/register` | ❌ Public | ✅ 5 req / 10 min per IP | User registration. Validates with Zod (name, email, password). Hashes password with bcrypt (cost 12). Returns user object (no auto-login). |
| `*` | `/api/auth/[...nextauth]` | ❌ Public | ✅ Dual-layer (see §5) | NextAuth v5 catch-all. Handles Credentials sign-in with built-in brute-force protection: 5 attempts/60s per email + 20 attempts/300s per IP. Constant-time comparison on non-existent users to prevent user enumeration. |

### 4.2 Billing (`/api/billing/`)

| Method | Endpoint | Auth | Rate Limit | Summary |
|--------|----------|------|------------|---------|
| `POST` | `/api/billing/subscribe` | ✅ `auth()` session | ✅ 3 req / 10 min per userId | Creates a YooKassa payment for PRO or AGENCY plan. Creates `Subscription` in PENDING status. Redirects user to YooKassa checkout. Saves `Payment` record. Blocks if user already has ACTIVE/PENDING/PAST_DUE subscription (409). |
| `POST` | `/api/billing/cancel` | ✅ `auth()` session | ❌ None | Cancels active subscription. Sets `Subscription.status = CANCELLED`, downgrades `User.plan` to FREE immediately. Credits are NOT clawed back. **Note:** No rate limit. |
| `POST` | `/api/billing/webhook` | ✅ IP allowlist + HMAC-SHA256 | ❌ N/A (server-to-server) | YooKassa webhook receiver. Validates sender IP against YooKassa CIDR ranges. Verifies HMAC signature if `YOOKASSA_WEBHOOK_SECRET` is set. Handles `payment.succeeded` (PENDING→ACTIVE via `$transaction`, credits + plan upgrade) and `payment.canceled` (cleanup PENDING subscriptions). Idempotent — checks if payment already processed. Always returns 200 to prevent YooKassa retries on internal errors. |

### 4.3 Projects (`/api/projects/`)

| Method | Endpoint | Auth | Rate Limit | Summary |
|--------|----------|------|------------|---------|
| `DELETE` | `/api/projects/[id]` | ✅ `auth()` + ownership | ❌ None | Deletes a project. Validates that `project.userId === session.user.id`. Cascade deletes all related reports, SoV data, and recommendations. |
| `PATCH` | `/api/projects/[id]/brand` | ✅ `auth()` + ownership + plan gate | ❌ None | Updates white-label settings (logo URL, accent color). Requires PRO/AGENCY plan (`limits.whiteLabel`). Zod validation with SSRF protection on logo URL (blocks `javascript:`, `data:`, localhost, private IPs, `.local`, `.internal`). |
| `PATCH` | `/api/projects/[id]/competitors` | ✅ `auth()` + ownership + plan gate | ❌ None | Sets competitor URLs (max 3). Requires PRO/AGENCY plan (`limits.competitorBenchmark`). Zod array validation. |
| `PATCH` | `/api/projects/[id]/schedule` | ✅ `auth()` + ownership + plan gate | ❌ None | Configures auto-report schedule (`weekly` / `monthly` / `null`). Checks `maxScheduledProjects` limit per plan. Calculates `scheduleNextRun` timestamp. |

### 4.4 Reports (`/api/reports/`)

| Method | Endpoint | Auth | Rate Limit | Summary |
|--------|----------|------|------------|---------|
| `POST` | `/api/reports/start` | ✅ `auth()` session | ✅ 3 req / 60s per userId | **Main report generation entry point.** Multi-layer validation: (1) rate limit, (2) SSRF protection on URL (blocks private IPs, loopback, link-local, cloud metadata), (3) credit balance check, (4) FREE tier anti-abuse (1 report per userId + fingerprint check for Credentials users), (5) project count limit, (6) concurrent PROCESSING report limit, (7) per-project cooldown. Creates/reuses `Project`, creates `Report(PROCESSING)`, enqueues BullMQ job, auto-starts inline worker. |
| `DELETE` | `/api/reports/[id]` | ✅ `auth()` + ownership | ❌ None | Deletes a completed/failed report. Blocks deletion of PROCESSING reports (409). |
| `GET` | `/api/reports/[id]/status` | ✅ `auth()` + ownership | ❌ None | Polls report status + real-time progress. Reads BullMQ job progress (`{ percent, step }`) for PROCESSING reports. Used by SWR on the client for live progress bar. |
| `POST` | `/api/reports/[id]/cancel` | ✅ `auth()` + ownership | ❌ None | Cancels in-flight report. Removes BullMQ job (if waiting/delayed) and sets `Report.status = FAILED`. Active jobs will self-terminate on next DB status check. |
| `GET` | `/api/reports/[id]/pdf` | ✅ `auth()` + ownership | ❌ None | Generates PDF export via Playwright. Launches headless Chromium, navigates to `/r/[shareId]`, prints to PDF with custom header/footer. Creates temp `shareId` if needed and cleans up after. |
| `POST/DELETE` | `/api/reports/[id]/share` | ✅ `auth()` + ownership | ❌ None | Toggles public share link. POST generates `shareId` via `crypto.randomBytes(12).toString('base64url')`. DELETE sets `shareId = null`. |
| `POST` | `/api/reports/generate-content` | ✅ `auth()` session | ✅ Triple-layer: 5/min per user + 30/day per user + 10/min per IP | AI content generation (articles, llms.txt, FAQ). Uses Claude Sonnet via OpenRouter. Three content types: `content` (article draft), `llms-txt` (llms.txt file), `faq` (FAQ + JSON-LD schema). |

### 4.5 Settings (`/api/settings/`)

| Method | Endpoint | Auth | Rate Limit | Summary |
|--------|----------|------|------------|---------|
| `PATCH` | `/api/settings/profile` | ✅ `auth()` session | ❌ None | Updates user display name. Zod validation (2–100 chars). |
| `PATCH` | `/api/settings/password` | ✅ `auth()` session | ✅ Dual-layer: 3/5min per user + 10/15min per IP | Password change. Validates current password via bcrypt. New password requires 8+ chars, uppercase, lowercase, digit. |

### 4.6 Public / Unauthenticated

| Method | Endpoint | Auth | Rate Limit | Summary |
|--------|----------|------|------------|---------|
| `POST` | `/api/analyze` | ❌ Public | ✅ 1 req / 10s per IP + 3 req / day per IP | Free express GEO audit (landing page hero form). Uses free OpenRouter models with fallback chain (`step-3.5-flash:free` → `qwen3-4b:free`). Returns summary, pros, cons, score. JSON extraction + repair for flaky LLM output. |
| `GET` | `/llms.txt` | ❌ Public | ❌ None | Serves `/llms.txt` for AI crawlers. |

---

## 5. AUTH & SECURITY STATE

### 5.1 Authentication Architecture

**Framework:** NextAuth v5 (`next-auth@5.0.0-beta.30`) with JWT strategy (no database sessions).

**Providers:**
- **Credentials** — email/password with bcrypt (cost factor 12). The `authorize()` function lives in `src/lib/auth.ts` (Node.js runtime), while a skeleton config in `src/lib/auth.config.ts` is used by the Edge middleware for JWT verification only.
- **Google OAuth** — indicated by `authProvider` field on User model, but provider not yet wired in `auth.ts` (only Credentials is active).

**Session flow:**
1. Edge middleware (`middleware.ts`) calls `getToken()` to verify JWT on every non-public route. If missing → redirect to `/sign-in?callbackUrl=...`.
2. API routes call `auth()` (server-side) to get the full session with `user.id`. Each route then performs ownership checks (`project.userId === session.user.id`).
3. JWT contains `{ id, name, email }`. Token ↔ session mapping is done via `callbacks.jwt` and `callbacks.session` in `auth.config.ts`.

**Type augmentation:** `src/types/next-auth.d.ts` extends the NextAuth `Session` and `JWT` types to include `user.id`.

### 5.2 Brute-Force Protection

All rate limiting uses an **in-memory sliding window** (`src/lib/rate-limit.ts`) — a `Map<string, { count, resetAt }>` with 60s auto-cleanup.

| Attack Vector | Protection | Config |
|---|---|---|
| **Sign-in brute-force (single account)** | Per-email rate limit | 5 attempts / 60s per email |
| **Credential stuffing / spraying** | Per-IP rate limit | 20 attempts / 300s per IP |
| **Registration spam** | Per-IP rate limit | 5 registrations / 10 min per IP |
| **Password change brute-force** | Dual-layer: per-user + per-IP | 3/5min per user, 10/15min per IP |
| **Report generation abuse** | Per-userId rate limit | 3 req / 60s |
| **Free tier abuse (multi-account)** | Device fingerprint (`@fingerprintjs/fingerprintjs`) | 1 free report per fingerprintId (Credentials users only) |
| **Express analysis abuse** | Dual per-IP rate limit | 1/10s burst + 3/day cap |
| **Content generation abuse** | Triple-layer | 5/min per user + 30/day per user + 10/min per IP |
| **User enumeration on login** | Constant-time bcrypt hash on non-existent users | `await bcrypt.hash(password, 12)` dummy call |

### 5.3 XSS & Injection Protection

| Measure | Implementation |
|---|---|
| **Content-Security-Policy** | Full CSP in `next.config.ts`: `default-src 'self'`, `frame-src 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`. `unsafe-inline`/`unsafe-eval` in `script-src` required by Next.js App Router. |
| **X-Frame-Options** | `DENY` |
| **X-Content-Type-Options** | `nosniff` |
| **HSTS** | `max-age=63072000; includeSubDomains; preload` (2 years) |
| **Referrer-Policy** | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=()` |
| **Input validation** | Zod schemas on all mutation endpoints (register, profile, password, brand, competitors, schedule) |
| **SSRF protection** | `isSafeUrl()` in `/reports/start` blocks private IPs, loopback, link-local (169.254.x.x / cloud metadata), `0.0.0.0`. Brand logo URL also blocks `javascript:`, `data:`, `vbscript:`, `blob:` protocols and internal hostnames. |
| **Webhook integrity** | IP allowlist (YooKassa CIDRs) + optional HMAC-SHA256 with timing-safe comparison |
| **SQL injection** | Prisma ORM — parameterized queries throughout. No raw SQL. |

### 5.4 Known Limitations (Documented)

1. **Rate limiter is in-memory** — resets on deploy, not shared across multiple app instances. Production multi-instance requires migration to Redis-based rate limiting (e.g., `@upstash/ratelimit`).
2. **`unsafe-inline` + `unsafe-eval`** in CSP `script-src` — required by Next.js App Router for hydration scripts. Can be tightened with nonce-based CSP when Next.js supports it natively.
3. **Google OAuth provider** is declared in the schema (`authProvider: "google"`) but not yet wired in `auth.ts` providers array.
4. **No CSRF token** on API routes — relies on SameSite cookies + Origin header validation via Next.js defaults. Custom mutation routes don't explicitly verify CSRF tokens.

---

## 6. AI QUICK ASSESSMENT

> The following are potential issues identified by static analysis of the codebase. They are ordered by severity (highest first). The external Architect should prioritize review of these areas.

### 🔴 6.1 — In-Memory Rate Limiter Will Fail in Production (Multi-Instance)

**File:** `src/lib/rate-limit.ts`

The rate limiter uses a `Map` in process memory. In Docker Compose, the `app` container runs as a single instance, so this works today. However:
- Any horizontal scaling (multiple `app` replicas, Kubernetes, serverless) will give each instance its own `Map`, effectively multiplying all rate limits by the replica count.
- A deploy/restart clears all rate limit state, creating a window of zero protection.

**Recommendation:** Migrate to Redis-based rate limiting (`@upstash/ratelimit` or a custom Lua script). Redis is already in the stack — the infrastructure cost is zero.

---

### 🔴 6.2 — Credits Deducted ONLY on Success — Race Condition Window

**File:** `src/workers/report.processor.ts` (line ~260)

Credits are decremented inside the same `$transaction` that marks the report as COMPLETED. This means:
- Between the `POST /reports/start` credit check (`user.credits >= limits.reportCost`) and the worker's deduction (potentially minutes later), the user's credit balance is **not locked or reserved**.
- A user can start multiple reports in rapid succession, each passing the credit check, and end up with a negative credit balance.
- The `maxConcurrentReports` limit partially mitigates this, but doesn't close the gap entirely (e.g., FREE plan: `maxConcurrent=1`, but the timing window between the check and the job starting allows a second request to pass).

**Recommendation:** Either (a) deduct credits **optimistically at enqueue time** with a refund on failure, or (b) use a `SELECT ... FOR UPDATE` lock on the user row in the credit check. Option (a) is simpler and more common in billing systems.

---

### 🟡 6.3 — Hardcoded `REPORT_COST = 10` in Worker vs. `getPlanLimits()` in API

**Files:** `src/workers/report.processor.ts` (line ~176), `src/lib/plan-limits.ts`

The worker hardcodes `const REPORT_COST = 10` when decrementing credits, but `plan-limits.ts` defines `reportCost: 10` (FREE) and `reportCost: 30` (PRO/AGENCY). The API route uses `limits.reportCost` for the credit sufficiency check, but the worker always deducts 10 regardless of plan.

This means **PRO/AGENCY users are undercharged** — the API checks for 30 credits but the worker only deducts 10.

**Recommendation:** Pass `reportCost` through the BullMQ job data, or look up the user's plan inside the worker transaction.

---

### 🟡 6.4 — Subscription Cancellation Downgrades Plan Immediately (Not at Period End)

**File:** `src/app/api/billing/cancel/route.ts`

When a user cancels, the code sets `User.plan = FREE` **immediately**, even though the subscription is marked as "active until `currentPeriodEnd`." The comment says "Кредиты не забираем — пользователь может их использовать," but the plan downgrade is instant, which means:
- Features gated by plan (competitor benchmark, white-label, multi-LLM, scheduled reports) stop working immediately after cancel — even though the user paid for the full period.
- The `status: CANCELLED` on the subscription preserves the period dates, but nothing in the codebase checks `currentPeriodEnd` to restore access.

**Recommendation:** Keep `User.plan` at the paid tier until `currentPeriodEnd`. Add a cron job (or extend `cron-scheduled-reports.ts`) to downgrade expired subscriptions.

---

### 🟡 6.5 — PDF Generation via Playwright Inside API Route (Latency + Memory Risk)

**File:** `src/app/api/reports/[id]/pdf/route.ts`

PDF generation launches a full Chromium instance inside the Next.js API route handler. This:
- Blocks the API response for 10–30+ seconds (navigating to `/r/[shareId]`, waiting for `networkidle`, rendering PDF).
- Consumes ~200–500MB RAM per Chromium instance with no concurrency limit — a user can trigger multiple concurrent PDF requests.
- The temporary `shareId` creation/cleanup is not wrapped in a try/finally, so if an error occurs between creation and cleanup, a dangling public share link persists.

**Recommendation:** Move PDF generation to a BullMQ job (similar to report generation). Return a job ID and let the client poll for the result. Add a concurrency limit. Wrap the temp `shareId` cleanup in a `finally` block.

---

### ℹ️ Additional Minor Observations

| Area | Observation |
|---|---|
| **No test suite** | No `__tests__/`, `*.test.ts`, or `*.spec.ts` files found. No test runner in `devDependencies`. |
| **`prisma` in `dependencies`** | `prisma` CLI is in `dependencies` (not `devDependencies`). This adds ~30MB to the production Docker image unnecessarily. |
| **Worker concurrency = 1** | Both standalone and inline workers are set to `concurrency: 1`. This means only one report processes at a time globally, which may be a bottleneck for paying users. This is intentional (Playwright RAM), but should be documented. |
| **No retry config in queue.add()** | When enqueuing jobs in `/reports/start`, no `attempts` or `backoff` options are passed to `reportQueue.add()`. The worker references `job.opts.attempts ?? 3` but this default comes from BullMQ's own default, not explicit configuration. |
| **Soft delete on User has no enforcement** | `User.deletedAt` exists but no queries filter `WHERE deletedAt IS NULL`. A soft-deleted user can still log in and use the platform. |

---

> **End of Part 2.** The full architecture export (Part 1 + Part 2) is ready for handoff to the external Architect.
