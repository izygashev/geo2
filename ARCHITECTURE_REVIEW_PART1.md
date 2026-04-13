# Geo Studio — Architecture Export (Part 1 of 2)

> **Generated:** 2026-04-13  
> **Repo:** `izygashev/geo2` / branch `master`  
> **Stack:** Next.js 16.2 (App Router), Prisma 7.5, PostgreSQL 16, Redis 7, BullMQ, YooKassa, OpenRouter AI  
> **Purpose:** Handoff document for external Architecture Review  

---

## 1. PROJECT STRUCTURE

```
GEO/
├── prisma/
│   ├── schema.prisma
│   ├── prisma.config.ts
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20260403130442_init_with_subscriptions_payments/
│       ├── 20260404102116_add_report_metadata/
│       ├── 20260404115254_add_project_schedule/
│       ├── 20260404115619_add_share_id/
│       ├── 20260404125047_add_brand_and_limits/
│       ├── 20260404125151_add_competitor_urls/
│       ├── 20260405115556_add_robots_semantic_sentiment_category/
│       ├── 20260406123732_add_fingerprint_and_auth_provider/
│       ├── 20260407132240_refine_schema_integrity/
│       ├── 20260408103329_add_scraped_body/
│       ├── 20260408104620_add_digital_pr/
│       └── 20260413122203_add_pending_subscription_status/
├── public/
│   └── back2.png
├── scripts/                          # Operational / dev CLI scripts
│   ├── check-reports.ts
│   ├── check-status.ts
│   ├── cron-scheduled-reports.ts
│   ├── debug-queue.ts
│   ├── debug-report.ts
│   ├── reset-db.ts
│   ├── seed-project.ts
│   ├── seed-user.ts
│   ├── set-credits.ts
│   ├── set-pro.ts
│   ├── test-polling.ts
│   ├── test-queue.ts
│   └── test-report.ts
│
├── src/
│   ├── middleware.ts                 # Next.js edge middleware (auth gate)
│   │
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing / marketing page
│   │   │
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   │   └── route.ts          # POST — free express analysis (OpenRouter)
│   │   │   ├── auth/
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts      # POST — user registration
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth catch-all handler
│   │   │   ├── billing/
│   │   │   │   ├── subscribe/
│   │   │   │   │   └── route.ts      # POST — create YooKassa payment
│   │   │   │   ├── cancel/
│   │   │   │   │   └── route.ts      # POST — cancel subscription
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts      # POST — YooKassa webhook (IP + HMAC)
│   │   │   ├── projects/
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET/PUT/DELETE project
│   │   │   │       ├── brand/
│   │   │   │       │   └── route.ts  # PUT — white-label brand settings
│   │   │   │       ├── competitors/
│   │   │   │       │   └── route.ts  # PUT — competitor URLs
│   │   │   │       └── schedule/
│   │   │   │           └── route.ts  # PUT — schedule auto-reports
│   │   │   ├── reports/
│   │   │   │   ├── start/
│   │   │   │   │   └── route.ts      # POST — enqueue new report
│   │   │   │   ├── generate-content/
│   │   │   │   │   └── route.ts      # POST — AI content generation
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET — fetch report data
│   │   │   │       ├── status/
│   │   │   │       │   └── route.ts  # GET — poll report status
│   │   │   │       ├── cancel/
│   │   │   │       │   └── route.ts  # POST — cancel in-flight report
│   │   │   │       ├── pdf/
│   │   │   │       │   └── route.ts  # GET — download PDF export
│   │   │   │       └── share/
│   │   │   │           └── route.ts  # POST — create/toggle share link
│   │   │   └── settings/
│   │   │       ├── profile/
│   │   │       │   └── route.ts      # PUT — update user profile
│   │   │       └── password/
│   │   │           └── route.ts      # PUT — change password
│   │   │
│   │   ├── blog/
│   │   │   ├── page.tsx              # Blog index
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Blog post (MDX)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Dashboard shell (sidebar)
│   │   │   ├── loading.tsx
│   │   │   ├── page.tsx              # Dashboard home (project list)
│   │   │   ├── billing/
│   │   │   │   └── page.tsx
│   │   │   ├── citations/
│   │   │   │   └── page.tsx
│   │   │   ├── projects/
│   │   │   │   └── [id]/
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx
│   │   │   ├── prompts/
│   │   │   │   └── page.tsx
│   │   │   ├── rag-editor/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx          # Reports list
│   │   │   │   ├── diff/
│   │   │   │   │   └── page.tsx      # Report diff / comparison
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Single report view
│   │   │   │       └── loading.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── trends/
│   │   │   │   └── page.tsx
│   │   │   └── x-ray/
│   │   │       └── page.tsx
│   │   ├── llms.txt/
│   │   │   └── route.ts             # GET — /llms.txt (LLM-readable site info)
│   │   ├── offer/
│   │   │   └── page.tsx
│   │   ├── privacy/
│   │   │   └── page.tsx
│   │   ├── r/
│   │   │   └── [shareId]/
│   │   │       └── page.tsx          # Public shared report
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   └── sign-up/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── analysis-result.tsx
│   │   ├── billing-client.tsx
│   │   ├── competitors-table.tsx
│   │   ├── content-gaps.tsx
│   │   ├── delete-button.tsx
│   │   ├── faq-accordion.tsx
│   │   ├── footer.tsx
│   │   ├── hero-form.tsx
│   │   ├── new-project-dialog.tsx
│   │   ├── profile-form.tsx
│   │   ├── project-settings-form.tsx
│   │   ├── recommendations-panel.tsx
│   │   ├── report-list-item.tsx
│   │   ├── report-pdf-button.tsx
│   │   ├── report-progress-bar.tsx
│   │   ├── rerun-report-button.tsx
│   │   ├── score-history-chart.tsx
│   │   ├── score-ring.tsx
│   │   ├── share-report-button.tsx
│   │   ├── sidebar-nav.tsx
│   │   ├── sign-out-button.tsx
│   │   ├── site-checklist.tsx
│   │   ├── sov-charts.tsx
│   │   ├── trends-chart.tsx
│   │   ├── typewriter-text.tsx
│   │   ├── visibility-trend-chart-wrapper.tsx
│   │   ├── visibility-trend-chart.tsx
│   │   └── ui/                       # shadcn/ui primitives
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── rag-visualizer.tsx
│   │       ├── separator.tsx
│   │       ├── tabs.tsx
│   │       └── tooltip.tsx
│   │
│   ├── content/
│   │   └── blog/
│   │       └── what-is-geo.mdx
│   │
│   ├── emails/
│   │   ├── ResetPasswordEmail.tsx
│   │   ├── TransactionEmail.tsx
│   │   ├── VerificationEmail.tsx
│   │   └── WelcomeEmail.tsx
│   │
│   ├── generated/                    # Prisma Client output (gitignored)
│   │
│   ├── lib/
│   │   ├── auth.config.ts            # NextAuth providers config
│   │   ├── auth.ts                   # NextAuth init + session helpers
│   │   ├── email.ts                  # Email sending (Resend / Nodemailer)
│   │   ├── json-utils.ts             # JSON extraction / repair for LLM output
│   │   ├── mail.ts                   # Mail transport abstraction
│   │   ├── mdx.ts                    # MDX blog renderer
│   │   ├── plan-limits.ts            # Plan feature gates & credit costs
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── queue.ts                  # BullMQ queue definition
│   │   ├── rate-limit.ts             # In-memory sliding window rate limiter
│   │   ├── redis.ts                  # Redis / IORedis connection
│   │   ├── utils.ts                  # Generic helpers (cn, etc.)
│   │   └── worker-manager.ts         # Worker lifecycle management
│   │
│   ├── scripts/
│   │   └── check-reports.ts
│   │
│   ├── services/
│   │   ├── llm.ts                    # OpenRouter / OpenAI multi-model SoV calls
│   │   ├── scraper.ts                # Playwright-based site scraper
│   │   └── yookassa.ts               # YooKassa SDK wrapper + plan config
│   │
│   ├── types/
│   │   └── next-auth.d.ts            # NextAuth type augmentation
│   │
│   └── workers/
│       ├── report.processor.ts       # Report generation pipeline (scrape → LLM → score)
│       └── report.worker.ts          # BullMQ worker entrypoint
│
├── Dockerfile
├── docker-compose.yml
├── docker-compose.override.yml
├── components.json                   # shadcn/ui config
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

---

## 2. DATABASE SCHEMA (`prisma/schema.prisma`)

```prisma
// Geo Studio Prisma Schema
// Docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ==========================================
// Enums
// ==========================================

enum Plan {
  FREE
  PRO
  AGENCY
}

enum ReportStatus {
  PROCESSING
  COMPLETED
  FAILED
}

enum SubscriptionStatus {
  PENDING
  ACTIVE
  CANCELLED
  EXPIRED
  PAST_DUE
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  CANCELLED
  REFUNDED
}

// ==========================================
// Models
// ==========================================

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  password     String
  plan         Plan     @default(FREE)
  credits      Int      @default(50)
  authProvider String   @default("credentials") // "credentials" | "google"
  deletedAt    DateTime?                        // soft delete — сохраняем финансовую историю
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  projects      Project[]
  subscriptions Subscription[]
  payments      Payment[]
}

model Project {
  id        String   @id @default(uuid())
  userId    String
  url       String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Расписание автоматического повторного анализа
  scheduleFrequency String?   // "weekly" | "monthly" | null (off)
  scheduleNextRun   DateTime? // Когда следующий запуск

  // Webhook URL для уведомлений (Zapier, Make, etc.)
  webhookUrl        String?

  // White-label настройки (PRO/AGENCY)
  brandLogoUrl      String?   // URL или base64 лого клиента
  brandAccentColor  String?   // HEX цвет акцента, напр. "#2D6A4F"

  // Конкурентный бенчмарк (PRO/AGENCY)
  competitorUrls    Json      @default("[]") // Массив URL конкурентов (до 3)

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reports Report[]

  @@index([userId])
  @@index([scheduleNextRun])
}

model Report {
  id           String       @id @default(uuid())
  projectId    String
  status       ReportStatus @default(PROCESSING)
  overallScore Float?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // ─── Anti-abuse fingerprint (для Credentials-пользователей) ──
  fingerprintId String?

  // ─── Публичная ссылка ───────────────────────────────
  shareId      String?      @unique

  // ─── Site metadata (из scraper) ─────────────────────
  siteTitle       String?
  siteDescription String?  @db.Text
  siteH1          String?
  hasLlmsTxt      Boolean  @default(false)
  schemaOrgTypes  Json     @default("[]")
  contentLength   Int      @default(0)
  scrapedBody     String?  @db.Text      // Полный bodyText для RAG-визуализации
  digitalPr       Json?                 // Результаты Digital PR (массив DigitalPrMention[])

  // ─── Новые технические проверки (scraper) ───────────
  robotsTxtAiFriendly Boolean @default(false)
  semanticHtmlValid   Boolean @default(false)

  // ─── Category / Sentiment (из LLM SoV анализа) ─────
  categorySearched String?
  sentiment        String?  // "positive" | "neutral" | "negative" | null

  // ─── Score breakdown ────────────────────────────────
  scoreSov        Float?
  scoreSchema     Float?
  scoreLlmsTxt    Float?
  scoreContent    Float?
  scoreAuthority  Float?

  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  shareOfVoices   ShareOfVoice[]
  recommendations Recommendation[]

  @@index([projectId])
  @@index([fingerprintId])
}

model ShareOfVoice {
  id             String  @id @default(uuid())
  reportId       String
  llmProvider    String
  keyword        String
  isMentioned    Boolean
  mentionContext String  @default("") @db.Text
  competitors    Json
  sentiment      String?
  categorySearched String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@unique([reportId, llmProvider, keyword])
  @@index([reportId])
}

model Recommendation {
  id            String @id @default(uuid())
  reportId      String
  type          String
  title         String
  description   String @db.Text
  generatedCode String @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
}

model Subscription {
  id                 String             @id @default(uuid())
  userId             String
  plan               Plan
  status             SubscriptionStatus @default(ACTIVE)
  creditsPerMonth    Int
  priceKopecks       Int
  paymentMethodId    String?
  currentPeriodStart DateTime           @default(now())
  currentPeriodEnd   DateTime
  cancelledAt        DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  payments Payment[]

  @@index([userId])
  @@index([status])
}

model Payment {
  id                String        @id @default(uuid())
  userId            String
  subscriptionId    String?
  yookassaPaymentId String        @unique
  amount            Int           // Сумма в копейках
  currency          String        @default("RUB")
  status            PaymentStatus @default(PENDING)
  credits           Int
  description       String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  subscription Subscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([yookassaPaymentId])
  @@index([subscriptionId])
}
```

---

## 3. CORE CONFIGURATIONS

### 3.1 `package.json` — Dependencies

#### Runtime (`dependencies`)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.1 | App framework (App Router, RSC, standalone build) |
| `react` / `react-dom` | 19.2.4 | React 19 with compiler support |
| `prisma` / `@prisma/client` / `@prisma/adapter-pg` | ^7.5.0 | ORM + PostgreSQL adapter |
| `next-auth` | ^5.0.0-beta.30 | Auth (v5 beta — JWT-based, Credentials + Google) |
| `bcrypt` | ^6.0.0 | Password hashing (cost factor 12) |
| `bullmq` | ^5.71.0 | Job queue for async report generation |
| `openai` | ^6.32.0 | OpenAI SDK (used via OpenRouter proxy) |
| `@yookassa/sdk` | ^0.0.3 | YooKassa payment gateway |
| `pg` | ^8.20.0 | Raw PostgreSQL driver (for Prisma adapter) |
| `playwright` | ^1.58.2 | Headless browser for site scraping |
| `@mozilla/readability` | ^0.6.0 | Content extraction (article parsing) |
| `jsdom` | ^29.0.2 | DOM parsing for scraper |
| `resend` | ^6.10.0 | Transactional email API |
| `nodemailer` | ^7.0.13 | SMTP email fallback |
| `@react-email/components` | ^1.0.12 | Email templates (React Email) |
| `zod` | ^4.3.6 | Schema validation |
| `swr` | ^2.4.1 | Client-side data fetching & polling |
| `recharts` | ^3.8.0 | Charts (SoV, trends, score history) |
| `lucide-react` | ^1.0.1 | Icon library |
| `@fingerprintjs/fingerprintjs` | ^5.1.0 | Browser fingerprinting (anti-abuse) |
| `class-variance-authority` / `clsx` / `tailwind-merge` | latest | Tailwind class utilities |
| `tw-animate-css` | ^1.4.0 | Tailwind animation utilities |
| `gray-matter` / `next-mdx-remote` | latest | MDX blog engine |
| `uuid` | ^13.0.0 | UUID generation |
| `dotenv` | ^17.3.1 | Env loading for scripts/workers |
| `@base-ui/react` | ^1.3.0 | Headless UI primitives |
| `@tailwindcss/typography` | ^0.5.19 | Prose styling for blog |

#### Dev (`devDependencies`)

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | Language |
| `@tailwindcss/postcss` / `tailwindcss` | ^4 | Tailwind CSS v4 |
| `eslint` / `eslint-config-next` | ^9 / 16.2.1 | Linting |
| `shadcn` | ^4.1.0 | Component generator CLI |
| `tsx` | ^4.21.0 | TypeScript execution (workers, scripts) |
| `babel-plugin-react-compiler` | 1.0.0 | React Compiler integration |
| `@types/*` | various | TypeScript type definitions |

#### NPM Scripts

```json
{
  "dev":    "next dev",
  "build":  "next build",
  "start":  "next start",
  "lint":   "eslint",
  "worker": "npx tsx src/workers/report.worker.ts"
}
```

---

### 3.2 `docker-compose.yml`

```yaml
# ════════════════════════════════════════════════════════════
# Geo Studio — Docker Compose (Full Stack)
# ════════════════════════════════════════════════════════════
#
# Production:  docker compose up -d
# Migrate:     docker compose run --rm migrate
# Logs:        docker compose logs -f app worker

services:
  # ── PostgreSQL ──────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-geo_saas}
      POSTGRES_USER: ${POSTGRES_USER:-geo}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-geo_secret}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-geo}"]
      interval: 5s
      timeout: 3s
      retries: 5

  # ── Redis ───────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # ── Next.js App ─────────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-geo}:${POSTGRES_PASSWORD:-geo_secret}@postgres:5432/${POSTGRES_DB:-geo_saas}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # ── BullMQ Worker ───────────────────────────────────────
  worker:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    command: ["npx", "tsx", "src/workers/report.worker.ts"]
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-geo}:${POSTGRES_PASSWORD:-geo_secret}@postgres:5432/${POSTGRES_DB:-geo_saas}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # ── Prisma Migrate (one-shot) ───────────────────────────
  migrate:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["npx", "prisma", "migrate", "deploy"]
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-geo}:${POSTGRES_PASSWORD:-geo_secret}@postgres:5432/${POSTGRES_DB:-geo_saas}
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
  redisdata:
```

**Architecture notes:**
- 4 services: `postgres`, `redis`, `app` (Next.js), `worker` (BullMQ), plus a one-shot `migrate` container.
- Ports are NOT exposed for postgres/redis in production — internal network only.
- `app` and `worker` share the same Docker image but different entrypoints.
- Health checks ensure dependency ordering.

---

### 3.3 `next.config.ts`

```typescript
import type { NextConfig } from "next";

// Content-Security-Policy: strict but compatible with Next.js App Router
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\n/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  output: "standalone",       // Optimized for Docker deployment
  reactCompiler: true,        // React Compiler enabled
  devIndicators: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

**Notes for Architect:**
- `output: "standalone"` — produces self-contained build for Docker.
- React Compiler is ON (`babel-plugin-react-compiler`).
- Full security header suite applied to ALL routes (CSP, HSTS, X-Frame-Options, etc.).
- `'unsafe-inline'` and `'unsafe-eval'` in `script-src` is required by Next.js App Router hydration — cannot be removed without nonce support.

---

### 3.4 `middleware.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/privacy", "/offer"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass-through: NextAuth internal API
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Pass-through: public report API (auth checked inside route handlers)
  if (pathname.startsWith("/api/reports")) return NextResponse.next();

  // Pass-through: YooKassa webhook (IP verification inside route handler)
  if (pathname.startsWith("/api/billing/webhook")) return NextResponse.next();

  // Pass-through: free express analysis (rate-limited inside route handler)
  if (pathname.startsWith("/api/analyze")) return NextResponse.next();

  // Pass-through: static public pages
  if (publicRoutes.includes(pathname)) return NextResponse.next();

  // Pass-through: blog + llms.txt (public for SEO)
  if (pathname.startsWith("/blog") || pathname.startsWith("/llms.txt"))
    return NextResponse.next();

  // Pass-through: public shared reports /r/[shareId]
  if (pathname.startsWith("/r/")) return NextResponse.next();

  // ── Auth gate: verify JWT ──
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

**Architecture notes:**
- Edge middleware runs on every non-static request.
- Two-tier auth: middleware handles coarse redirect-to-login; individual API routes perform fine-grained `auth()` session checks + ownership validation.
- Several API routes bypass middleware intentionally (webhook, analyze, reports) because they have their own auth/security mechanisms (IP allowlist, rate limit, per-route session check).
- `matcher` excludes Next.js internals and static files.

---

> **End of Part 1.** Part 2 will cover: API Route Inventory, Auth & Security State, and the AI Quick Assessment.
