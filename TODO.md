# 🏗️ GEO SaaS — План улучшений

## 🔴 УРОВЕНЬ 1 — Критично (без этого не запускать)

- [x] **1. Rate limiting на /api/analyze и /api/reports/start**
  - `/api/analyze`: 1 запрос в 10 секунд по IP
  - `/api/reports/start`: 3 запроса в минуту по userId
  - Используем in-memory Map (для MVP), позже — upstash-ratelimit

- [x] **2. Валидация email при регистрации (Zod)**
  - Zod-схема для body в `/api/auth/register`
  - Проверка формата email, длины пароля, имени

- [x] **3. Кнопка "Новый проект" — рабочая модалка**
  - Модалка с формой URL на дашборде
  - POST /api/reports/start → редирект на отчёт
  - Кнопка "Создать проект" в пустом состоянии тоже работает

- [x] **4. Удаление проекта и отчёта (Delete CRUD)**
  - `DELETE /api/projects/[id]` — каскадное удаление проекта + отчётов
  - Кнопка удаления на дашборде (с confirm)
  - Кнопка удаления отчёта на странице отчётов

## 🟡 УРОВЕНЬ 2 — Делает продукт полезным

- [x] **5. Настройки профиля — смена имени и пароля**
  - Форма на `/dashboard/settings` (Server Action)
  - Валидация старого пароля при смене

- [x] **6. Email-уведомление о готовности отчёта**
  - Resend.com (3000 писем/мес бесплатно)
  - Worker отправляет email при COMPLETED/FAILED

- [x] **7. Scheduled Reports (автоматический re-check)**
  - Cron + BullMQ: еженедельный/ежемесячный перезапуск
  - UI для выбора расписания в проекте

## 🟢 УРОВЕНЬ 3 — Рост и монетизация

- [x] **8. Публичный отчёт (share link)**
  - `/r/[shareId]` — публичная страница без авторизации
  - Кнопка "Поделиться" в отчёте, генерация shareId

- [x] **9. Сравнение двух отчётов (diff view)**
  - Выбор двух отчётов одного проекта
  - Diff: score delta, новые/утерянные упоминания, конкуренты

- [ ] **10. Webhook / Zapier интеграция**
  - Настройка webhook URL в проекте
  - POST на URL при COMPLETED с payload отчёта

## 🔵 УРОВЕНЬ 4 — Техдолг

- [ ] **11. Unit-тесты для утилит и API**
  - Vitest для `json-utils.ts`, `normalizeUrl`
  - Тесты API-роутов

- [ ] **12. Error tracking (Sentry)**
  - `@sentry/nextjs` + DSN
  - Capture exceptions в API-роутах и worker

- [ ] **13. CI/CD (GitHub Actions)**
  - lint → build → test → deploy
  - Автоматический запуск при push в master
