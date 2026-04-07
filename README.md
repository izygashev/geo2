# GEO — AI Visibility SaaS

B2B-платформа для отслеживания упоминаний бренда в ответах ИИ (ChatGPT, Perplexity, Claude) и генерации рекомендаций по улучшению **AI Visibility Score**.

---

## Что делает продукт

1. Пользователь указывает URL сайта → платформа парсит его содержимое (Playwright)
2. Claude генерирует ключевые запросы, по которым аудитория ищет продукт
3. Perplexity Sonar Pro Search и Claude Sonnet проверяют, упоминается ли бренд в ответах ИИ по каждому запросу
4. Система считает **AI Visibility Score** (0–100) по 5 факторам: SoV, Schema.org, llms.txt, контент, авторитет
5. Claude генерирует конкретные рекомендации с готовым кодом (Schema, llms.txt, статьи, FAQ)
6. Пользователь получает PDF-отчёт, может поделиться ссылкой, отслеживать динамику

---

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 16.2 (App Router, TypeScript, Turbopack) |
| UI | Tailwind CSS v4 + shadcn/ui + Recharts |
| БД | PostgreSQL + Prisma 7 (pg-адаптер) |
| Очередь | BullMQ + Redis |
| Парсинг | Playwright |
| Аутентификация | NextAuth.js v5 (Email/Password + bcrypt) |
| LLM | OpenRouter API |
| Email | Resend |
| Платежи | YooKassa |

### Используемые модели (OpenRouter)

| Задача | Модель |
|---|---|
| Ключевые запросы + рекомендации | `anthropic/claude-opus-4.6` |
| AI-видимость (основная) | `perplexity/sonar-pro-search` |
| AI-видимость (Multi-LLM) | `anthropic/claude-sonnet-4.6` |
| Генерация контента | `anthropic/claude-sonnet-4` |

---

## Архитектура

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes
│   ├── dashboard/          # Личный кабинет
│   └── r/[shareId]/        # Публичная ссылка на отчёт
├── components/             # React-компоненты
├── lib/                    # auth, prisma, redis, email, rate-limit
├── services/
│   ├── llm.ts              # Весь AI-слой (OpenRouter)
│   └── scraper.ts          # Playwright парсинг
└── workers/
    ├── report.processor.ts # Логика обработки отчёта
    └── report.worker.ts    # Standalone BullMQ worker

prisma/
└── schema.prisma           # Схема БД
```

**Пайплайн генерации отчёта:**
```
scrape → generateKeywords → checkShareOfVoice × N → generateRecommendations → DB save → email
```

Worker запускается инлайн внутри Next.js при первом запросе (через `worker-manager.ts`) или отдельно (`npm run worker`).

---

## Быстрый старт

### 1. Зависимости

```bash
npm install
npx playwright install chromium
```

### 2. Переменные окружения

```bash
cp .env.example .env
# Заполните .env (минимум: DATABASE_URL, AUTH_SECRET, OPENROUTER_API_KEY)
```

### 3. Инфраструктура (PostgreSQL + Redis)

```bash
docker-compose up -d
```

### 4. База данных

```bash
npx prisma migrate deploy
# или для dev:
npx prisma db push
```

### 5. Запуск

```bash
npm run dev
```

Приложение: [http://localhost:3000](http://localhost:3000)

---

## Переменные окружения

| Переменная | Обязательна | Описание |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | NextAuth secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | URL приложения (`http://localhost:3000`) |
| `REDIS_URL` | ✅ | Redis (`redis://localhost:6379`) |
| `OPENROUTER_API_KEY` | ✅ | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `NEXT_PUBLIC_APP_URL` | — | Публичный URL (для OpenRouter Referer) |
| `RESEND_API_KEY` | — | Email-уведомления ([resend.com](https://resend.com)) |
| `RESEND_FROM_EMAIL` | — | From-адрес (`Name <email>`) |
| `YOOKASSA_SHOP_ID` | — | ЮKassa shop ID |
| `YOOKASSA_SECRET_KEY` | — | ЮKassa secret key |

---

## Скрипты

```bash
npm run dev          # Dev-сервер
npm run build        # Production build
npm run worker       # Запуск standalone BullMQ worker
npm run lint         # ESLint

# Утилиты (через tsx)
npx tsx scripts/check-reports.ts     # Статус отчётов в БД
npx tsx scripts/seed-user.ts         # Создать тестового пользователя
npx tsx scripts/set-credits.ts       # Выдать кредиты пользователю
npx tsx scripts/cron-scheduled-reports.ts  # Запуск scheduled отчётов
```
