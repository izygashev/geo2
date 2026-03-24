import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  Bot,
  BarChart3,
  Shield,
  Zap,
  Globe,
  TrendingUp,
} from "lucide-react";
import { HeroForm } from "@/components/hero-form";

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold text-white">GEO SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Дашборд
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                >
                  Войти
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-24">
        {/* Gradient glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute right-1/4 top-1/2 h-[300px] w-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/50 px-4 py-1.5 text-sm text-slate-400 backdrop-blur-sm">
            <Bot className="h-4 w-4 text-blue-400" />
            Аналитика AI Visibility
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Узнайте, рекомендует ли{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ИИ ваш бренд
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-slate-400">
            Анализируем, как ChatGPT, Perplexity и Claude упоминают вашу
            компанию. Получите стратегию оптимизации для AI-поисковиков.
          </p>

          <div className="mt-4 w-full max-w-xl">
            <HeroForm isAuthenticated={isAuthenticated} />
          </div>

          <div className="mt-2 flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Анализ за 2 минуты
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              50 бесплатных кредитов
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800/50 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-white">
            Что вы получите
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6 backdrop-blur-sm transition-colors hover:border-slate-700/50"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10">
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Globe className="h-4 w-4" />
            GEO SaaS
          </div>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Все права защищены
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Bot,
    title: "Share of Voice в ИИ",
    description:
      "Узнайте, как часто ChatGPT, Perplexity и Claude рекомендуют ваш бренд по целевым запросам.",
  },
  {
    icon: BarChart3,
    title: "Анализ конкурентов",
    description:
      "Сравните AI-видимость вашего бренда с конкурентами. Выясните, кого ИИ рекомендует вместо вас.",
  },
  {
    icon: TrendingUp,
    title: "Стратегия оптимизации",
    description:
      "Получите конкретные рекомендации: разметка Schema.org, llms.txt, контентная стратегия для ИИ.",
  },
];
