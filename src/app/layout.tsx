import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ─── Metadata ─── */

const SITE_URL = "https://geostudioai.ru";
const SITE_NAME = "Geo Studio";
const SITE_DESCRIPTION =
  "Geo Studio — B2B SaaS-платформа для анализа AI-видимости бренда и Generative Engine Optimization (GEO). " +
  "Отслеживайте упоминания вашей компании в ответах ChatGPT, Perplexity, Claude, Gemini и других генеративных поисковых систем. " +
  "Получайте детальные отчёты, Share of Voice аналитику, анализ конкурентов и готовые рекомендации по оптимизации.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Geo Studio — AI-видимость бренда и Generative Engine Optimization",
    template: "%s — Geo Studio",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "GEO",
    "Generative Engine Optimization",
    "AI-видимость",
    "AI visibility",
    "видимость бренда в ИИ",
    "ChatGPT упоминания",
    "Perplexity аналитика",
    "Claude аналитика",
    "Gemini аналитика",
    "AI search optimization",
    "Share of Voice AI",
    "LLM оптимизация",
    "LLM SEO",
    "AI reputation management",
    "AI-репутация бренда",
    "аудит AI-видимости",
    "llms.txt",
    "Schema.org для ИИ",
    "GEO-аналитика",
    "Geo Studio",
  ],
  authors: [{ name: "Geo Studio", url: SITE_URL }],
  creator: "Geo Studio",
  publisher: "Geo Studio",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Geo Studio — AI-видимость бренда и Generative Engine Optimization",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Geo Studio — AI-видимость бренда и GEO",
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

/* ─── JSON-LD Structured Data ─── */

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "B2B SaaS platform for AI visibility analysis and Generative Engine Optimization (GEO). " +
        "Tracks and optimizes brand mentions in ChatGPT, Perplexity, Claude, Gemini and other generative AI search engines.",
      email: "hello@geostudioai.ru",
      foundingDate: "2026",
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "SaaS-платформа для анализа AI-видимости бренда. Анализирует упоминания в ChatGPT, Perplexity, Claude и Gemini. " +
        "Предоставляет Share of Voice аналитику, анализ конкурентов и готовые рекомендации по Generative Engine Optimization.",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "RUB",
          description: "1 бесплатный аудит, Share of Voice аналитика, рекомендации с кодом",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "1990",
          priceCurrency: "RUB",
          description: "20 отчётов/мес, все AI-провайдеры, анализ конкурентов, приоритетная генерация",
        },
        {
          "@type": "Offer",
          name: "Agency",
          price: "4990",
          priceCurrency: "RUB",
          description: "60 отчётов/мес, все AI-провайдеры, API-доступ, White-label отчёты",
        },
      ],
      provider: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Что такое Geo Studio?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Geo Studio — это платформа для анализа видимости вашего бренда в ответах AI-систем. Мы проверяем, рекомендуют ли ChatGPT, Claude и Perplexity вашу компанию, и даём конкретные рекомендации по улучшению.",
          },
        },
        {
          "@type": "Question",
          name: "Как работает анализ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Вы вводите URL сайта. Наша система анализирует структуру, контент и техническую разметку сайта, отправляет запросы в AI-поисковые системы для проверки упоминаемости бренда и формирует детальный отчёт с оценкой видимости и стратегией оптимизации.",
          },
        },
        {
          "@type": "Question",
          name: "Сколько времени занимает генерация отчёта?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Генерация полного отчёта обычно занимает от 1 до нескольких минут. Система анализирует тысячи параметров сайта и проверяет упоминания через различных AI-провайдеров в реальном времени.",
          },
        },
        {
          "@type": "Question",
          name: "Что такое кредиты и сколько стоит один отчёт?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "При регистрации каждый пользователь получает приветственные кредиты для одного бесплатного аудита. Далее оплата производится кредитами. На тарифах Pro и Agency один отчёт стоит 30 кредитов.",
          },
        },
        {
          "@type": "Question",
          name: "Безопасны ли мои данные?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Да. Содержимое сайта не хранится после анализа. Все данные передаются по зашифрованным каналам, а результаты отчётов доступны только вашему аккаунту.",
          },
        },
      ],
    },
  ],
};

/* ─── Layout ─── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F6F3] text-[#1a1a1a] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
