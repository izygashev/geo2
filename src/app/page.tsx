import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  BarChart3,
  TrendingUp,
  Globe,
  Code2,
  Check,
  ArrowRight,
  Search,
  Zap,
  Clock,
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
              Geo SaaS
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
          src="/back.png"
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

          {/* Bottom badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-[#787774]">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#BBBBBB]" />
              50 бесплатных кредитов
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#BBBBBB]" />
              Анализ за 2 минуты
            </span>
          </div>
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

      {/* ─── Features — asymmetric bento grid ─── */}
      <section id="features" className="py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
            Возможности
          </p>
          <h2 className="mb-16 max-w-lg text-2xl font-bold tracking-tighter md:text-3xl">
            Всё, что нужно для оптимизации
            <br className="hidden md:block" />
            <span className="text-[#787774]">AI-видимости вашего бренда</span>
          </h2>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#EAEAEA] bg-[#EAEAEA] md:grid-cols-2">
            {[
              {
                icon: Search,
                title: "Share of Voice в ИИ",
                desc: "Узнайте, как часто ChatGPT, Perplexity и Claude рекомендуют ваш бренд по целевым запросам.",
              },
              {
                icon: BarChart3,
                title: "Анализ конкурентов",
                desc: "Сравните AI-видимость с конкурентами. Узнайте, кого ИИ рекомендует вместо вас.",
              },
              {
                icon: TrendingUp,
                title: "Стратегия оптимизации",
                desc: "Конкретные рекомендации: Schema.org, llms.txt, контентная стратегия для ИИ.",
              },
              {
                icon: Code2,
                title: "Готовый код",
                desc: "Получите Schema.org разметку, meta-теги и llms.txt — готовые к вставке на сайт.",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group bg-white p-8 transition-colors duration-300 hover:bg-[#FBFBFA]"
                style={{ "--index": i } as React.CSSProperties}
              >
                <feature.icon className="mb-4 h-5 w-5 text-[#787774] transition-colors group-hover:text-[#1a1a1a]" strokeWidth={1.5} />
                <h3 className="mb-2 text-sm font-semibold tracking-tight text-[#1a1a1a]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="border-t border-[#EAEAEA] py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
            Тарифы
          </p>
          <h2 className="mb-3 max-w-md text-2xl font-bold tracking-tighter md:text-3xl">
            Начните бесплатно
          </h2>
          <p className="mb-14 text-sm text-[#787774]">
            Масштабируйтесь по мере роста
          </p>

          <div className="mx-auto grid max-w-3xl gap-px overflow-hidden rounded-xl border border-[#EAEAEA] bg-[#EAEAEA] lg:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col bg-white p-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#787774]">Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tighter">0</span>
                <span className="text-sm text-[#BBBBBB]">₽/мес</span>
              </div>
              <p className="mt-1 text-xs text-[#BBBBBB]">50 кредитов при регистрации</p>

              <ul className="mt-8 flex-1 space-y-3">
                {[
                  "5 отчётов (50 кредитов)",
                  "Share of Voice аналитика",
                  "Рекомендации с кодом",
                  "1 проект",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#555]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#CCCCCC]" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="btn-tactile mt-8 flex h-9 w-full items-center justify-center rounded-md border border-[#EAEAEA] text-sm font-medium text-[#555] transition-colors hover:border-[#D5D5D5] hover:bg-[#FBFBFA]"
              >
                Начать бесплатно
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col bg-white p-6">
              <div className="absolute -top-px left-0 right-0 h-[2px] bg-[#111]" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#1a1a1a]">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tighter">1 990</span>
                <span className="text-sm text-[#BBBBBB]">₽/мес</span>
              </div>
              <p className="mt-1 text-xs text-[#BBBBBB]">200 кредитов ежемесячно</p>

              <ul className="mt-8 flex-1 space-y-3">
                {[
                  "20 отчётов/мес",
                  "Все AI-провайдеры",
                  "Анализ конкурентов",
                  "До 10 проектов",
                  "Приоритетная генерация",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#555]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1a1a1a]" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="btn-tactile mt-8 flex h-9 w-full items-center justify-center rounded-md bg-[#111] text-sm font-medium text-white transition-colors hover:bg-[#333]"
              >
                Начать с Pro
              </Link>
            </div>

            {/* Agency */}
            <div className="flex flex-col bg-white p-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#787774]">Agency</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tighter">4 990</span>
                <span className="text-sm text-[#BBBBBB]">₽/мес</span>
              </div>
              <p className="mt-1 text-xs text-[#BBBBBB]">600 кредитов ежемесячно</p>

              <ul className="mt-8 flex-1 space-y-3">
                {[
                  "60 отчётов/мес",
                  "Все AI-провайдеры",
                  "API-доступ",
                  "Безлимитные проекты",
                  "White-label отчёты",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#555]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#CCCCCC]" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="btn-tactile mt-8 flex h-9 w-full items-center justify-center rounded-md border border-[#EAEAEA] text-sm font-medium text-[#555] transition-colors hover:border-[#D5D5D5] hover:bg-[#FBFBFA]"
              >
                Связаться
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-t border-[#EAEAEA] py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
            FAQ
          </p>
          <h2 className="mb-14 text-2xl font-bold tracking-tighter md:text-3xl">
            Частые вопросы
          </h2>
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
              Первые 5 отчётов бесплатно. Без привязки карты.
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
