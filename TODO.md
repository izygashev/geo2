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

## � УРОВЕНЬ 3.5 — Усиление продукта

- [ ] **14. Конкурентный бенчмарк**
  - Добавление до 3 URL конкурентов к проекту (`competitorUrls Json` в Project)
  - Worker прогоняет SoV-пайплайн по конкурентам параллельно
  - Дашборд: side-by-side score comparison (ваш vs конкуренты)
  - Стоимость: 25 кредитов (основной + конкуренты)

- [ ] **16. Trends Dashboard — обзор всех проектов**
  - Новая страница `/dashboard/trends`
  - Мульти-проектный график: все проекты на одной timeline
  - Таблица: рост/падение score за неделю/месяц
  - Zero API cost — только SQL-агрегация

- [ ] **18. Lead Magnet — бесплатный мини-аудит без регистрации**
  - Облегчённый пайплайн: scrape + 1 SoV + базовый score (без рекомендаций)
  - `/api/analyze/quick` — 3 запроса/день по IP
  - Landing показывает score + 2 подсказки → CTA "Полный отчёт → зарегистрируйтесь"
  - Себестоимость ~$0.02, zero credits

- [ ] **19. White-label PDF с брендингом клиента**
  - В настройках проекта: загрузка лого (base64/URL), выбор accent-цвета
  - PDF генерируется с лого клиента вместо "GEO SaaS"
  - Доступно для PRO/AGENCY планов

- [ ] **21. Multi-LLM проверка SoV**
  - Параллельная проверка через ChatGPT + Perplexity + Gemini
  - UI: "ChatGPT ✅ / Perplexity ❌ / Gemini ✅" по каждому запросу
  - Столбец `llmProvider` уже есть в ShareOfVoice — расширяем
  - PRO-only фича, доп. стоимость +5 кредитов

- [ ] **15. Защита от злоупотреблений (anti-abuse)**
  - Cooldown 5 мин между отчётами одного проекта
  - Лимит проектов по плану: FREE=3, PRO=20, AGENCY=unlimited
  - Лимит concurrent PROCESSING: FREE=1, PRO=3, AGENCY=10
  - Лимит scheduled reports: FREE=0, PRO=5, AGENCY=unlimited

## �🔵 УРОВЕНЬ 4 — Техдолг

- [ ] **11. Unit-тесты для утилит и API**
  - Vitest для `json-utils.ts`, `normalizeUrl`
  - Тесты API-роутов

- [ ] **12. Error tracking (Sentry)**
  - `@sentry/nextjs` + DSN
  - Capture exceptions в API-роутах и worker

- [ ] **13. CI/CD (GitHub Actions)**
  - lint → build → test → deploy
  - Автоматический запуск при push в master
