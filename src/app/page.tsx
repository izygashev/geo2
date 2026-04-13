import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Globe,
  Code2,
  Check,
  ArrowRight,
  Search,
  Zap,
  Clock,
  ShieldAlert,
  Ghost,
  FileWarning,
  DollarSign,
  Bot,
  Sparkles,
} from "lucide-react";
import { HeroForm } from "@/components/hero-form";
import { FaqAccordion } from "@/components/faq-accordion";
import { Footer } from "@/components/footer";

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      {/* ─── SR-Only GEO / LLM-Readable Summary ─── */}
      <p className="sr-only">
        Geo Studio — B2B SaaS platform for AI visibility analysis (GEO — Generative Engine Optimization).
        We help businesses understand how LLMs like ChatGPT, Claude, and Gemini read, rank, and recommend
        their website content. Track your Share of Voice, analyze competitors, and get actionable optimization
        recommendations with ready-to-use code snippets.
      </p>

      {/* ─── Navigation ─── */}
      <header>
        <nav className="sticky top-0 z-50 border-b border-neutral-100 bg-[#FAFAFA]/80 backdrop-blur-2xl backdrop-saturate-150">
          <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0A0A0A] transition-transform duration-200 group-hover:scale-[1.04]">
                <Globe className="h-[18px] w-[18px] text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">
                Geo Studio
              </span>
            </Link>

            {/* Center nav links — desktop only */}
            <div className="hidden md:flex items-center gap-10">
              <a href="#problem" className="text-[13px] font-medium text-[#666] transition-colors duration-200 hover:text-[#0A0A0A]">
                Проблема
              </a>
              <a href="#how-it-works" className="text-[13px] font-medium text-[#666] transition-colors duration-200 hover:text-[#0A0A0A]">
                Как это работает
              </a>
              <a href="#features" className="text-[13px] font-medium text-[#666] transition-colors duration-200 hover:text-[#0A0A0A]">
                Возможности
              </a>
              <a href="#pricing" className="text-[13px] font-medium text-[#666] transition-colors duration-200 hover:text-[#0A0A0A]">
                Тарифы
              </a>
              <a href="#faq" className="text-[13px] font-medium text-[#666] transition-colors duration-200 hover:text-[#0A0A0A]">
                Частые вопросы
              </a>
              <Link href="/blog" className="text-[13px] font-medium text-[#666] transition-colors duration-200 hover:text-[#0A0A0A]">
                Блог
              </Link>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="btn-tactile inline-flex h-10 items-center rounded-[10px] bg-[#0A0A0A] px-5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:bg-[#1a1a1a] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                >
                  Дашборд
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="hidden sm:inline-flex text-[13px] font-medium text-[#666] transition-colors duration-200 hover:text-[#0A0A0A]"
                  >
                    Вход
                  </Link>
                  <Link
                    href="/sign-up"
                    className="btn-tactile inline-flex h-10 items-center rounded-[10px] bg-[#0A0A0A] px-5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:bg-[#1a1a1a] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                  >
                    Попробовать бесплатно
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* ─── Hero — Centered with Ambient Glow ─── */}
        <section className="relative flex min-h-[calc(100dvh-72px)] items-center justify-center overflow-hidden">
          {/* Background image */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <img
              src="/back2.png"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
            {/* Subtle overlay to ensure text readability */}
            <div className="absolute inset-0 bg-[#FAFAFA]/40" />
          </div>

          {/* Content */}
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center lg:px-8 lg:py-32">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-200/60 bg-white/60 px-4 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#999]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#666]">
                AI Visibility Platform
              </span>
            </div>

            <h1 className="font-sans text-[2.75rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.25rem]">
              Узнайте, рекомендует
              <br />
              ли ИИ{" "}
              <span className="bg-gradient-to-r from-[#666] to-[#999] bg-clip-text text-transparent">
                [ваш бренд]
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-lg text-[16px] leading-[1.7] text-[#666] sm:text-[17px]">
              Анализируем, как ChatGPT, Gemini и Claude воспринимают
              и рекомендуют вашу компанию. Узнайте свой Geo&nbsp;Score сегодня.
            </p>

            {/* CTA */}
            <div className="mt-12 w-full max-w-xl">
              <HeroForm isAuthenticated={isAuthenticated} />
            </div>

            {/* Bottom badges */}
            {!isAuthenticated && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-[13px] text-[#999]">
                <span className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-[#BBBBBB]" strokeWidth={1.5} />
                  Первый аудит бесплатно
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#BBBBBB]" strokeWidth={1.5} />
                  Анализ за 2 минуты
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ─── AI Marquee ─── */}
        <section className="border-y border-neutral-100 bg-white/50 py-5">
          <div
            className="relative mx-auto max-w-5xl overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0, black 128px, black calc(100% - 128px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, black 128px, black calc(100% - 128px), transparent 100%)",
            }}
          >
            <div className="flex w-max animate-marquee items-center gap-16">
              {[
                { name: "ChatGPT", sub: "OpenAI" },
                { name: "Claude", sub: "Anthropic" },
                { name: "Perplexity", sub: "AI Search" },
                { name: "Gemini", sub: "Google" },
                { name: "Copilot", sub: "Microsoft" },
                { name: "Meta AI", sub: "Meta" },
              ].map((ai) => (
                <div key={`a-${ai.name}`} className="flex shrink-0 items-center gap-2.5">
                  <span className="text-[13px] font-medium tracking-[-0.01em] text-[#B0B0B0]">{ai.name}</span>
                  <span className="text-[10px] text-[#D5D5D5]">/</span>
                  <span className="text-[11px] text-[#C5C5C5]">{ai.sub}</span>
                </div>
              ))}
              {[
                { name: "ChatGPT", sub: "OpenAI" },
                { name: "Claude", sub: "Anthropic" },
                { name: "Perplexity", sub: "AI Search" },
                { name: "Gemini", sub: "Google" },
                { name: "Copilot", sub: "Microsoft" },
                { name: "Meta AI", sub: "Meta" },
              ].map((ai) => (
                <div key={`b-${ai.name}`} className="flex shrink-0 items-center gap-2.5">
                  <span className="text-[13px] font-medium tracking-[-0.01em] text-[#B0B0B0]">{ai.name}</span>
                  <span className="text-[10px] text-[#D5D5D5]">/</span>
                  <span className="text-[11px] text-[#C5C5C5]">{ai.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pain Points — PAS Framework ─── */}
        <section id="problem" className="py-28 lg:py-36">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999]">
                Проблема
              </p>
              <h2 className="mx-auto max-w-2xl text-[1.75rem] font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-[2rem] lg:text-[2.25rem]">
                Почему классическое SEO
                <br className="hidden sm:block" />
                <span className="text-[#999]">больше не работает?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[15px] leading-[1.7] text-[#888]">
                Нейросети изменили правила игры. Пока вы покупаете ссылки,
                ваши клиенты задают вопросы ChatGPT.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: TrendingDown,
                  iconBg: "bg-red-50",
                  iconColor: "text-red-400",
                  title: "Потеря горячего трафика",
                  desc: "Пользователи не ищут в Google. Они просят ИИ: «Посоветуй лучший сервис». Если алгоритм вас не знает, вы теряете лиды на самом дне воронки.",
                },
                {
                  icon: ShieldAlert,
                  iconBg: "bg-amber-50",
                  iconColor: "text-amber-500",
                  title: "ИИ-галлюцинации о бренде",
                  desc: "Нейросети могут выдумывать факты, заявлять о закрытии вашей компании или приписывать вам несуществующий негатив.",
                },
                {
                  icon: Ghost,
                  iconBg: "bg-violet-50",
                  iconColor: "text-violet-500",
                  title: "Слепота промптов",
                  desc: "Сбор семантики через Wordstat мертв. Клиенты пишут длинные запросы со сложным контекстом. Вы не знаете реальный спрос в эпоху LLM.",
                },
                {
                  icon: FileWarning,
                  iconBg: "bg-sky-50",
                  iconColor: "text-sky-500",
                  title: "Невидимый контент",
                  desc: "Вы пишете красивые тексты для людей, но RAG-алгоритмы их не понимают. Они спотыкаются о метафоры и игнорируют ваши страницы.",
                },
                {
                  icon: DollarSign,
                  iconBg: "bg-emerald-50",
                  iconColor: "text-emerald-500",
                  title: "Слив PR-бюджетов",
                  desc: "Стандартные закупки SEO-ссылок больше не дают эффекта. ИИ доверяет только узкому пулу трастовых платформ. Вы платите за воздух.",
                },
                {
                  icon: Bot,
                  iconBg: "bg-slate-50",
                  iconColor: "text-slate-500",
                  title: "Техническая слепота",
                  desc: "У вас нет файла llms.txt, микроразметки FAQ и семантического HTML. ИИ-агенты даже не пытаются парсить ваш сайт.",
                },
              ].map((card) => (
                <article
                  key={card.title}
                  className="group rounded-2xl border border-neutral-100 bg-white p-7 transition-all duration-300 hover:border-neutral-200 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)]"
                >
                  <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                    <card.icon className={`h-[18px] w-[18px] ${card.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2.5 text-[15px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                    {card.title}
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-[#888]">
                    {card.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works — Numbered Steps (ERA-style) ─── */}
        <section id="how-it-works" className="border-y border-neutral-100 bg-white py-28 lg:py-36">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999]">
                Как это работает
              </p>
              <h2 className="mx-auto max-w-lg text-[1.75rem] font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-[2rem] lg:text-[2.25rem]">
                Три шага до полного
                <br className="hidden sm:block" />
                <span className="text-[#999]">контроля AI-видимости</span>
              </h2>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Введите URL",
                  desc: "Укажите адрес сайта и запустите анализ. Наша система проверит техническую разметку, контент и упоминания вашего бренда.",
                },
                {
                  step: "02",
                  title: "Получите отчёт",
                  desc: "Через 2 минуты получите детальный отчёт с Geo Score, Share of Voice, анализом конкурентов и списком рекомендаций.",
                },
                {
                  step: "03",
                  title: "Оптимизируйте",
                  desc: "Примените готовые фрагменты кода и рекомендации. Отслеживайте рост AI-видимости в динамике с каждым новым отчётом.",
                },
              ].map((item) => (
                <article key={item.step} className="group relative">
                  <div className="mb-6 text-[48px] font-extralight tracking-[-0.04em] text-[#E5E5E5] transition-colors duration-300 group-hover:text-[#CCCCCC]">
                    /{item.step}
                  </div>
                  <h3 className="mb-3 text-[16px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                    {item.title}
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-[#888]">
                    {item.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features — Premium Bento Grid ─── */}
        <section id="features" className="py-28 lg:py-36">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999]">
                Возможности
              </p>
              <h2 className="mx-auto mb-20 max-w-lg text-[1.75rem] font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-[2rem] lg:text-[2.25rem]">
                Всё для оптимизации
                <br className="hidden md:block" />
                <span className="text-[#999]">AI-видимости вашего бренда</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* ── Card 1: Share of Voice — wide ── */}
              <article className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-7 transition-all duration-300 hover:border-neutral-200 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] md:col-span-2 md:p-9">
                <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xs">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F5]">
                      <Search className="h-[18px] w-[18px] text-[#888]" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-2.5 text-[16px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                      Share of Voice в ИИ
                    </h3>
                    <p className="text-[13px] leading-[1.7] text-[#888]">
                      Узнайте, как часто ChatGPT, Perplexity и Claude рекомендуют ваш бренд по целевым запросам.
                    </p>
                  </div>

                  {/* Mini SoV visualization */}
                  <div className="flex shrink-0 items-center gap-6 rounded-2xl border border-neutral-100 bg-[#FAFAFA] px-7 py-6">
                    <div className="relative h-20 w-20">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#F0F0F0" strokeWidth="2.5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeDasharray="88" strokeDashoffset="35" strokeLinecap="round" className="transition-all duration-700" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold tracking-[-0.03em] text-[#0A0A0A]">60%</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-[12px]">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-[#0A0A0A]" />
                        <span className="text-[#666]">Ваш бренд</span>
                        <span className="ml-auto pl-3 font-semibold tabular-nums text-[#0A0A0A]">60%</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-[#E5E5E5]" />
                        <span className="text-[#AAA]">Конкуренты</span>
                        <span className="ml-auto pl-3 font-semibold tabular-nums text-[#AAA]">40%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              {/* ── Card 2: Анализ конкурентов — tall ── */}
              <article className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-7 transition-all duration-300 hover:border-neutral-200 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] md:row-span-2 md:p-9">
                <div className="mb-7">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F5]">
                    <BarChart3 className="h-[18px] w-[18px] text-[#888]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2.5 text-[16px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                    Анализ конкурентов
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-[#888]">
                    Сравните AI-видимость с конкурентами. Узнайте, кого ИИ рекомендует вместо вас.
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border border-neutral-100 bg-[#FAFAFA] p-5">
                  {[
                    { name: "Ваш бренд", score: 72, highlight: true },
                    { name: "competitor-a.ru", score: 58, highlight: false },
                    { name: "competitor-b.ru", score: 41, highlight: false },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold ${item.highlight ? "bg-[#0A0A0A] text-white" : "bg-[#F0F0F0] text-[#CCC]"}`}>
                        {item.score}
                      </div>
                      <span className={`flex-1 truncate text-[12px] ${item.highlight ? "font-medium text-[#0A0A0A]" : "text-[#CCC]"}`} style={item.highlight ? {} : { filter: "blur(3px)" }}>
                        {item.name}
                      </span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F0F0F0]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.highlight ? "bg-[#0A0A0A]" : "bg-[#E0E0E0]"}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              {/* ── Card 3: Стратегия оптимизации ── */}
              <article className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-7 transition-all duration-300 hover:border-neutral-200 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] md:col-span-2 md:p-9">
                <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xs">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F5]">
                      <TrendingUp className="h-[18px] w-[18px] text-[#888]" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-2.5 text-[16px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                      Стратегия оптимизации
                    </h3>
                    <p className="text-[13px] leading-[1.7] text-[#888]">
                      Конкретные рекомендации: Schema.org, llms.txt, контентная стратегия для ИИ.
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2.5 rounded-xl border border-neutral-100 bg-[#FAFAFA] p-5">
                    {[
                      { label: "Добавить Schema.org", status: "critical" as const },
                      { label: "Создать llms.txt", status: "warning" as const },
                      { label: "Meta-описание", status: "done" as const },
                      { label: "H1 оптимизирован", status: "done" as const },
                    ].map((task) => (
                      <div key={task.label} className="flex items-center gap-3">
                        <span className={`inline-flex h-5 shrink-0 items-center rounded-md px-2 text-[10px] font-semibold uppercase tracking-[0.04em] ${
                          task.status === "critical"
                            ? "bg-red-50 text-red-400"
                            : task.status === "warning"
                              ? "bg-amber-50 text-amber-500"
                              : "bg-emerald-50 text-emerald-500"
                        }`}>
                          {task.status === "critical" ? "Fix" : task.status === "warning" ? "Add" : "OK"}
                        </span>
                        <span className="text-[12px] text-[#666]">{task.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              {/* ── Card 4: Готовый код — full width ── */}
              <article className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-7 transition-all duration-300 hover:border-neutral-200 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] md:col-span-3 md:p-9">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                  <div className="max-w-sm">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F5]">
                      <Code2 className="h-[18px] w-[18px] text-[#888]" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-2.5 text-[16px] font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                      Готовый код для вставки
                    </h3>
                    <p className="text-[13px] leading-[1.7] text-[#888]">
                      Получите Schema.org разметку, meta-теги и llms.txt — готовые к вставке на сайт. Просто скопируйте и вставьте.
                    </p>
                  </div>

                  <div className="flex-1 overflow-hidden rounded-xl border border-[#222] bg-[#0A0A0A]">
                    <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/80" />
                      <span className="ml-4 text-[10px] font-medium text-white/25">schema.jsonld</span>
                    </div>
                    <div className="overflow-x-auto p-5 font-mono text-[12px] leading-[1.8]">
                      <div><span className="text-white/20 select-none">1  </span><span className="text-[#C792EA]">{"{"}</span></div>
                      <div><span className="text-white/20 select-none">2  </span>  <span className="text-[#80CBC4]">&quot;@context&quot;</span><span className="text-white/40">: </span><span className="text-[#C3E88D]">&quot;https://schema.org&quot;</span><span className="text-white/40">,</span></div>
                      <div><span className="text-white/20 select-none">3  </span>  <span className="text-[#80CBC4]">&quot;@type&quot;</span><span className="text-white/40">: </span><span className="text-[#C3E88D]">&quot;Organization&quot;</span><span className="text-white/40">,</span></div>
                      <div><span className="text-white/20 select-none">4  </span>  <span className="text-[#80CBC4]">&quot;name&quot;</span><span className="text-white/40">: </span><span className="text-[#C3E88D]">&quot;Ваш бренд&quot;</span><span className="text-white/40">,</span></div>
                      <div><span className="text-white/20 select-none">5  </span>  <span className="text-[#80CBC4]">&quot;url&quot;</span><span className="text-white/40">: </span><span className="text-[#C3E88D]">&quot;https://example.com&quot;</span></div>
                      <div><span className="text-white/20 select-none">6  </span><span className="text-[#C792EA]">{"}"}</span></div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ─── Stats Banner — ERA-inspired social proof ─── */}
        <section className="border-y border-neutral-100 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-neutral-100">
              {[
                { value: "50K+", label: "Запросов отслежено" },
                { value: "92%", label: "Точность анализа" },
                { value: "2 мин", label: "Среднее время отчёта" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <span className="text-[2.5rem] font-bold tracking-[-0.04em] text-[#0A0A0A] lg:text-[3rem]">
                    {stat.value}
                  </span>
                  <span className="mt-2 text-[13px] font-medium text-[#999]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section id="pricing" className="py-28 lg:py-36">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999]">
                Тарифы
              </p>
              <h2 className="mb-4 text-[1.75rem] font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-[2rem] lg:text-[2.25rem]">
                Начните бесплатно
              </h2>
              <p className="mb-20 text-[15px] text-[#999]">
                Масштабируйтесь по мере роста
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl items-start gap-5 lg:grid-cols-3">
              {/* ── Free ── */}
              <article className="flex flex-col rounded-2xl border border-neutral-100 bg-white p-8 transition-all duration-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)]">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#999]">Free</h3>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[2.5rem] font-bold tracking-[-0.04em] text-[#0A0A0A]">0</span>
                  <span className="text-lg font-normal text-[#CCC]">₽<span className="text-[13px]">/мес</span></span>
                </div>
                <p className="mt-2 text-[12px] text-[#BBB]">Один бесплатный аудит</p>

                <ul className="mt-9 flex-1 space-y-4">
                  {[
                    "1 бесплатный аудит (демо)",
                    "Share of Voice аналитика",
                    "Рекомендации с кодом",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[13px] text-[#777]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#DDD]" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/sign-up"
                  className="btn-tactile mt-10 flex h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[13px] font-medium text-[#666] transition-all duration-200 hover:border-neutral-300 hover:shadow-sm"
                >
                  Тест-драйв
                </Link>
              </article>

              {/* ── Pro — Hero card ── */}
              <article className="relative z-10 flex flex-col rounded-2xl bg-white p-9 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_25px_60px_-12px_rgba(0,0,0,0.1)] lg:scale-[1.03]">
                <div className="mb-6 flex">
                  <span className="inline-flex items-center rounded-full bg-[#0A0A0A] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
                    Популярный
                  </span>
                </div>

                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A0A0A]">Pro</h3>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[2.75rem] font-bold tracking-[-0.04em] text-[#0A0A0A]">1 990</span>
                  <span className="text-lg font-normal text-[#CCC]">₽<span className="text-[13px]">/мес</span></span>
                </div>
                <p className="mt-2 text-[12px] text-[#999]">200 кредитов ежемесячно</p>

                <ul className="mt-9 flex-1 space-y-4">
                  {[
                    "20 отчётов/мес",
                    "Все AI-провайдеры",
                    "Анализ конкурентов",
                    "Приоритетная генерация",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[13px] text-[#444]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/sign-up"
                  className="btn-tactile mt-10 flex h-12 w-full items-center justify-center rounded-xl border border-[#0A0A0A] bg-[#0A0A0A] text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:bg-[#1a1a1a] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
                >
                  Перейти на Pro
                </Link>
              </article>

              {/* ── Agency ── */}
              <article className="flex flex-col rounded-2xl border border-neutral-100 bg-white p-8 transition-all duration-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)]">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#999]">Agency</h3>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[2.5rem] font-bold tracking-[-0.04em] text-[#0A0A0A]">4 990</span>
                  <span className="text-lg font-normal text-[#CCC]">₽<span className="text-[13px]">/мес</span></span>
                </div>
                <p className="mt-2 text-[12px] text-[#BBB]">600 кредитов ежемесячно</p>

                <ul className="mt-9 flex-1 space-y-4">
                  {[
                    "60 отчётов/мес",
                    "Все AI-провайдеры",
                    "API-доступ",
                    "White-label отчёты",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[13px] text-[#777]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#DDD]" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/sign-up"
                  className="btn-tactile mt-10 flex h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[13px] font-medium text-[#666] transition-all duration-200 hover:border-neutral-300 hover:shadow-sm"
                >
                  Обсудить задачи
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="border-t border-neutral-100 bg-white py-28 lg:py-36">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999]">
                FAQ
              </p>
              <h2 className="mb-16 text-[1.75rem] font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-[2rem] lg:text-[2.25rem]">
                Частые вопросы
              </h2>
            </div>
            <FaqAccordion />
          </div>
        </section>

        {/* ─── Bottom CTA — with ambient glow ─── */}
        <section className="relative overflow-hidden border-t border-neutral-100 py-28 lg:py-36">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-100/20 via-sky-100/15 to-rose-100/10 blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-[2rem] lg:text-[2.25rem]">
                Готовы узнать, что о вас
                <br />
                <span className="text-[#999]">думает ИИ?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.7] text-[#888]">
                Первый аудит бесплатно. Без привязки карты.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="btn-tactile inline-flex h-11 items-center gap-2.5 rounded-xl bg-[#0A0A0A] px-6 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:bg-[#1a1a1a] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
                >
                  Начать бесплатно
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
                <Link
                  href="/sign-in"
                  className="btn-tactile inline-flex h-11 items-center rounded-xl border border-neutral-200 bg-white px-6 text-[13px] font-medium text-[#666] transition-all duration-200 hover:border-neutral-300 hover:shadow-sm"
                >
                  Войти
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <Footer />
    </div>
  );
}
