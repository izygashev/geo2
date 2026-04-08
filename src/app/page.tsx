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
} from "lucide-react";
import { HeroForm } from "@/components/hero-form";
import { FaqAccordion } from "@/components/faq-accordion";
import { Footer } from "@/components/footer";

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3] text-[#1a1a1a]">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 border-b border-[#EAEAEA]/60 bg-[#F7F6F3]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a]">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">
              Geo Studio
            </span>
          </Link>

          {/* Center nav links — desktop only */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[#555] transition-colors hover:text-[#1a1a1a]">
              Продукт
            </a>
            <a href="#pricing" className="text-sm font-medium text-[#555] transition-colors hover:text-[#1a1a1a]">
              Решения
            </a>
            <a href="#pricing" className="text-sm font-medium text-[#555] transition-colors hover:text-[#1a1a1a]">
              Цены
            </a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn-tactile rounded-lg bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
              >
                Дашборд
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:inline-flex text-sm font-medium text-[#555] transition-colors hover:text-[#1a1a1a]"
                >
                  Вход
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-tactile rounded-lg bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
                >
                  Попробовать бесплатно
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero — centered fullscreen with 3D-inspired background ─── */}
      <section className="relative flex min-h-[calc(100dvh-64px)] items-center justify-center overflow-hidden">
        {/* 3D geometric shapes — background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/back2.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
        />

        {/* Content — centered */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
          <h1 className="font-sans text-[2.75rem] font-extrabold leading-[1.1] tracking-tighter sm:text-5xl md:text-[3.5rem] lg:text-[4rem]">
            Узнайте, рекомендует
            <br />
            ли ИИ <span className="text-[#787774]">[ваш бренд]</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#787774] sm:text-lg">
            Анализируем, как ChatGPT, Gemini и Claude воспринимают
            <br className="hidden sm:block" />
            и рекомендуют вашу компанию. Узнайте свой Geo Score сегодня.
          </p>

          {/* CTA — wide centered input */}
          <div className="mt-10 w-full max-w-xl">
            <HeroForm isAuthenticated={isAuthenticated} />
          </div>

          {/* Bottom badges — только для неавторизованных */}
          {!isAuthenticated && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-[#787774]">
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-[#BBBBBB]" />
                Первый аудит бесплатно
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#BBBBBB]" />
                Анализ за 2 минуты
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ─── AI Marquee ─── */}
      <section className="border-y border-[#EAEAEA] py-6">
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
              <div key={`a-${ai.name}`} className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium text-[#BBBBBB]">{ai.name}</span>
                <span className="text-[10px] text-[#D5D5D5]">/</span>
                <span className="text-xs text-[#CCCCCC]">{ai.sub}</span>
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
              <div key={`b-${ai.name}`} className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium text-[#BBBBBB]">{ai.name}</span>
                <span className="text-[10px] text-[#D5D5D5]">/</span>
                <span className="text-xs text-[#CCCCCC]">{ai.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pain Points — PAS Framework ─── */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          {/* Header */}
          <div className="text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
              Проблема
            </p>
            <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tighter text-[#1a1a1a] md:text-3xl">
              Почему классическое SEO
              <br className="hidden sm:block" />
              <span className="text-[#787774]">больше не работает?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#787774] sm:text-base">
              Нейросети изменили правила игры. Пока вы покупаете ссылки,
              <br className="hidden sm:block" />
              ваши клиенты задают вопросы ChatGPT.
            </p>
          </div>

          {/* Pain Points Grid */}
          <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                <TrendingDown className="h-4 w-4 text-red-500" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                Потеря горячего трафика
              </h3>
              <p className="text-sm leading-relaxed text-[#787774]">
                Пользователи не ищут в Google. Они просят ИИ: «Посоветуй лучший сервис». Если алгоритм вас не знает, вы теряете лиды на самом дне воронки.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                <ShieldAlert className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                ИИ-галлюцинации о бренде
              </h3>
              <p className="text-sm leading-relaxed text-[#787774]">
                Нейросети могут выдумывать факты, заявлять о закрытии вашей компании или приписывать вам несуществующий негатив. Без мониторинга вы об этом даже не узнаете.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                <Ghost className="h-4 w-4 text-purple-600" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                Слепота промптов
              </h3>
              <p className="text-sm leading-relaxed text-[#787774]">
                Сбор семантики через Wordstat мертв. Клиенты пишут длинные запросы со сложным контекстом. Вы не знаете, как выглядит реальный спрос в эпоху LLM.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <FileWarning className="h-4 w-4 text-blue-600" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                Невидимый контент
              </h3>
              <p className="text-sm leading-relaxed text-[#787774]">
                Вы пишете красивые тексты для людей, но RAG-алгоритмы их не понимают. Они спотыкаются о метафоры и игнорируют ваши страницы при парсинге.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <DollarSign className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                Слив PR-бюджетов
              </h3>
              <p className="text-sm leading-relaxed text-[#787774]">
                Стандартные закупки SEO-ссылок больше не дают эффекта. ИИ доверяет только узкому пулу трастовых баз данных и платформ. Вы платите за воздух.
              </p>
            </div>
            {/* Card 6 */}
            <div className="group rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                <Bot className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                Техническая слепота
              </h3>
              <p className="text-sm leading-relaxed text-[#787774]">
                У вас нет файла llms.txt, микроразметки FAQ и семантического HTML. ИИ-агенты даже не пытаются парсить ваш сайт — для них вы просто не существуете.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features — Premium Bento Grid ─── */}
      <section id="features" className="py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
              Возможности
            </p>
            <h2 className="mx-auto mb-16 max-w-lg text-2xl font-bold tracking-tighter md:text-3xl">
              Всё, что нужно для оптимизации
              <br className="hidden md:block" />
              <span className="text-[#787774]">AI-видимости вашего бренда</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* ── Card 1: Share of Voice — wide ── */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:col-span-2 md:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xs">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F4]">
                    <Search className="h-4 w-4 text-[#787774]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold tracking-tight text-[#1a1a1a]">
                    Share of Voice в ИИ
                  </h3>
                  <p className="text-sm leading-relaxed text-[#787774]">
                    Узнайте, как часто ChatGPT, Perplexity и Claude рекомендуют ваш бренд по целевым запросам.
                  </p>
                </div>

                {/* Mini SoV visualization */}
                <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-[#F0EFEB] bg-[#FAFAF9] px-6 py-5">
                  {/* Donut chart */}
                  <div className="relative h-20 w-20">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#F0EFEB" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeDasharray="88" strokeDashoffset="35" strokeLinecap="round" className="transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">60%</span>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#1a1a1a]" />
                      <span className="text-[#555]">Ваш бренд</span>
                      <span className="ml-auto font-medium tabular-nums text-[#1a1a1a]">60%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#E0DFDB]" />
                      <span className="text-[#999]">Конкуренты</span>
                      <span className="ml-auto font-medium tabular-nums text-[#999]">40%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card 2: Анализ конкурентов — tall ── */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:row-span-2 md:p-8">
              <div className="mb-6">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F4]">
                  <BarChart3 className="h-4 w-4 text-[#787774]" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-[#1a1a1a]">
                  Анализ конкурентов
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  Сравните AI-видимость с конкурентами. Узнайте, кого ИИ рекомендует вместо вас.
                </p>
              </div>

              {/* Mini competitor list */}
              <div className="space-y-2.5 rounded-xl border border-[#F0EFEB] bg-[#FAFAF9] p-4">
                {[
                  { name: "Ваш бренд", score: 72, highlight: true },
                  { name: "competitor-a.ru", score: 58, highlight: false },
                  { name: "competitor-b.ru", score: 41, highlight: false },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold ${item.highlight ? "bg-[#1a1a1a] text-white" : "bg-[#F0EFEB] text-[#BBBBBB]"}`}>
                      {item.score}
                    </div>
                    <span className={`flex-1 truncate text-xs ${item.highlight ? "font-medium text-[#1a1a1a]" : "text-[#BBBBBB]"}`} style={item.highlight ? {} : { filter: "blur(3px)" }}>
                      {item.name}
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F0EFEB]">
                      <div
                        className={`h-full rounded-full ${item.highlight ? "bg-[#1a1a1a]" : "bg-[#DDDCDA]"}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Card 3: Стратегия оптимизации ── */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:col-span-2 md:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xs">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F4]">
                    <TrendingUp className="h-4 w-4 text-[#787774]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold tracking-tight text-[#1a1a1a]">
                    Стратегия оптимизации
                  </h3>
                  <p className="text-sm leading-relaxed text-[#787774]">
                    Конкретные рекомендации: Schema.org, llms.txt, контентная стратегия для ИИ.
                  </p>
                </div>

                {/* Mini task list */}
                <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-[#F0EFEB] bg-[#FAFAF9] p-4">
                  {[
                    { label: "Добавить Schema.org", status: "critical" as const },
                    { label: "Создать llms.txt", status: "warning" as const },
                    { label: "Meta-описание", status: "done" as const },
                    { label: "H1 оптимизирован", status: "done" as const },
                  ].map((task) => (
                    <div key={task.label} className="flex items-center gap-2.5">
                      <span className={`inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                        task.status === "critical"
                          ? "bg-red-50 text-red-500"
                          : task.status === "warning"
                            ? "bg-amber-50 text-amber-500"
                            : "bg-emerald-50 text-emerald-500"
                      }`}>
                        {task.status === "critical" ? "Fix" : task.status === "warning" ? "Add" : "OK"}
                      </span>
                      <span className="text-xs text-[#555]">{task.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Card 4: Готовый код — full width ── */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#EAEAEA]/80 bg-white p-6 transition-all duration-300 hover:border-[#D5D5D5] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:col-span-3 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                <div className="max-w-sm">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F4]">
                    <Code2 className="h-4 w-4 text-[#787774]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold tracking-tight text-[#1a1a1a]">
                    Готовый код для вставки
                  </h3>
                  <p className="text-sm leading-relaxed text-[#787774]">
                    Получите Schema.org разметку, meta-теги и llms.txt — готовые к вставке на сайт. Просто скопируйте и вставьте.
                  </p>
                </div>

                {/* Faux code editor */}
                <div className="flex-1 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]">
                  {/* macOS window bar */}
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    <span className="ml-3 text-[10px] text-white/30">schema.jsonld</span>
                  </div>
                  {/* Code lines */}
                  <div className="overflow-x-auto p-4 font-mono text-xs leading-6">
                    <div><span className="text-white/30">1 </span><span className="text-[#C792EA]">{'{'}</span></div>
                    <div><span className="text-white/30">2 </span>  <span className="text-[#80CBC4]">&quot;@context&quot;</span><span className="text-white/50">: </span><span className="text-[#C3E88D]">&quot;https://schema.org&quot;</span><span className="text-white/50">,</span></div>
                    <div><span className="text-white/30">3 </span>  <span className="text-[#80CBC4]">&quot;@type&quot;</span><span className="text-white/50">: </span><span className="text-[#C3E88D]">&quot;Organization&quot;</span><span className="text-white/50">,</span></div>
                    <div><span className="text-white/30">4 </span>  <span className="text-[#80CBC4]">&quot;name&quot;</span><span className="text-white/50">: </span><span className="text-[#C3E88D]">&quot;Ваш бренд&quot;</span><span className="text-white/50">,</span></div>
                    <div><span className="text-white/30">5 </span>  <span className="text-[#80CBC4]">&quot;url&quot;</span><span className="text-white/50">: </span><span className="text-[#C3E88D]">&quot;https://example.com&quot;</span></div>
                    <div><span className="text-white/30">6 </span><span className="text-[#C792EA]">{'}'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing — Quiet Luxury ─── */}
      <section id="pricing" className="border-t border-[#EAEAEA] py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
              Тарифы
            </p>
            <h2 className="mb-3 text-2xl font-bold tracking-tighter md:text-3xl">
              Начните бесплатно
            </h2>
            <p className="mb-16 text-sm text-[#787774]">
              Масштабируйтесь по мере роста
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl items-center gap-5 lg:grid-cols-3">
            {/* ── Free ── */}
            <div className="flex flex-col rounded-2xl border border-[#EAEAEA]/60 bg-[#FAFAF9] p-7">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#999]">Free</h3>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tighter text-[#1a1a1a]">0</span>
                <span className="text-lg font-normal text-[#BBBBBB]">₽<span className="text-sm">/мес</span></span>
              </div>
              <p className="mt-2 text-xs text-[#BBBBBB]">Один бесплатный аудит</p>

              <ul className="mt-8 flex-1 space-y-3.5">
                {[
                  "1 бесплатный аудит (демо)",
                  "Share of Voice аналитика",
                  "Рекомендации с кодом",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#777]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D5D5D5]" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="btn-tactile mt-9 flex h-10 w-full items-center justify-center rounded-xl border border-[#E5E5E3] bg-white text-sm font-medium text-[#555] transition-all hover:border-[#D5D5D5] hover:shadow-sm"
              >
                Тест-драйв
              </Link>
            </div>

            {/* ── Pro — Hero card ── */}
            <div className="relative z-10 flex flex-col rounded-2xl bg-white p-8 ring-1 ring-[#1a1a1a]/[0.08] lg:scale-105 lg:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)]">
              {/* Badge */}
              <div className="mb-5 flex">
                <span className="inline-flex items-center rounded-full bg-[#F5F5F4] px-3 py-1 text-[11px] font-medium text-[#1a1a1a]">
                  Самый популярный
                </span>
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]">Pro</h3>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-5xl font-bold tracking-tighter text-[#1a1a1a]">1 990</span>
                <span className="text-lg font-normal text-[#BBBBBB]">₽<span className="text-sm">/мес</span></span>
              </div>
              <p className="mt-2 text-xs text-[#999]">200 кредитов ежемесячно</p>

              <ul className="mt-8 flex-1 space-y-3.5">
                {[
                  "20 отчётов/мес",
                  "Все AI-провайдеры",
                  "Анализ конкурентов",
                  "Приоритетная генерация",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#444]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="btn-tactile mt-9 flex h-11 w-full items-center justify-center rounded-xl bg-[#1a1a1a] text-sm font-medium text-white transition-all hover:bg-[#333] hover:shadow-lg"
              >
                Перейти на Pro
              </Link>
            </div>

            {/* ── Agency ── */}
            <div className="flex flex-col rounded-2xl border border-[#EAEAEA]/60 bg-[#FAFAF9] p-7">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#999]">Agency</h3>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tighter text-[#1a1a1a]">4 990</span>
                <span className="text-lg font-normal text-[#BBBBBB]">₽<span className="text-sm">/мес</span></span>
              </div>
              <p className="mt-2 text-xs text-[#BBBBBB]">600 кредитов ежемесячно</p>

              <ul className="mt-8 flex-1 space-y-3.5">
                {[
                  "60 отчётов/мес",
                  "Все AI-провайдеры",
                  "API-доступ",
                  "White-label отчёты",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#777]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D5D5D5]" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="btn-tactile mt-9 flex h-10 w-full items-center justify-center rounded-xl border border-[#E5E5E3] bg-white text-sm font-medium text-[#555] transition-all hover:border-[#D5D5D5] hover:shadow-sm"
              >
                Обсудить задачи
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-t border-[#EAEAEA] py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
            FAQ
          </p>
          <h2 className="mb-14 text-2xl font-bold tracking-tighter md:text-3xl">
            Частые вопросы
          </h2>
        </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="border-t border-[#EAEAEA] py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
              Готовы узнать, что о вас
              <br />
              <span className="text-[#787774]">думает ИИ?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#787774]">
              Первый аудит бесплатно. Без привязки карты.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="btn-tactile inline-flex h-9 items-center gap-2 rounded-md bg-[#111] px-5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
              >
                Начать бесплатно
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/sign-in"
                className="btn-tactile inline-flex h-9 items-center rounded-md border border-[#EAEAEA] px-5 text-sm font-medium text-[#555] transition-colors hover:border-[#D5D5D5] hover:bg-white"
              >
                Войти
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <Footer />
    </div>
  );
}
