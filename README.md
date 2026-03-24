# GEO SaaS — Аналитика AI Visibility

B2B-платформа для отслеживания упоминаний бренда в ответах ИИ (ChatGPT, Perplexity, Claude) и генерации рекомендаций по улучшению AI Visibility Score.

## Стек

- **Фреймворк:** Next.js 16 (App Router, TypeScript)
- **Стилизация:** Tailwind CSS v4 + shadcn/ui + recharts
- **БД:** PostgreSQL + Prisma ORM
- **Аутентификация:** NextAuth.js v5 (Credentials: Email/Password)
- **Фоновые задачи:** BullMQ + Redis (планируется)
- **Парсинг:** Playwright (планируется)
- **LLM:** OpenRouter API (планируется)

## Запуск

```bash
# Запустить PostgreSQL (Docker)
docker start geo-postgres

# Установить зависимости
npm install

# Применить схему БД
npx prisma db push

# Запустить dev-сервер
npm run dev
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/geo_saas"
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"
```
