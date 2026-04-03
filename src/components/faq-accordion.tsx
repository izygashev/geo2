"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Что такое GEO SaaS?",
    answer:
      "GEO SaaS — это платформа для анализа видимости вашего бренда в ответах AI-систем. Мы проверяем, рекомендуют ли ChatGPT, Claude и Perplexity вашу компанию, и даём конкретные рекомендации по улучшению.",
  },
  {
    question: "Как работает анализ?",
    answer:
      "Вы вводите URL сайта, наша система сканирует его структуру, контент и разметку. Затем мы отправляем целевые запросы в AI-поисковики и проверяем, упоминается ли ваш бренд. Результат — детальный отчёт с оценкой и стратегией.",
  },
  {
    question: "Сколько времени занимает генерация отчёта?",
    answer:
      "Обычно от 1 до 2 минут. Система анализирует сайт через Playwright, проверяет упоминания через AI-провайдеров и генерирует рекомендации с готовым кодом для внедрения.",
  },
  {
    question: "Что такое кредиты и сколько стоит один отчёт?",
    answer:
      "Один отчёт стоит 10 кредитов. При регистрации вы получаете 50 бесплатных кредитов — этого хватит на 5 полных аудитов. Дополнительные кредиты можно приобрести в тарифных планах.",
  },
  {
    question: "Какие рекомендации я получу?",
    answer:
      "Отчёт включает конкретные действия: добавление разметки Schema.org, создание файла llms.txt, оптимизацию контента под AI-поиск, а также готовые фрагменты кода для вставки на сайт.",
  },
  {
    question: "Безопасны ли мои данные?",
    answer:
      "Да. Мы не храним содержимое вашего сайта после анализа. Все данные передаются по зашифрованным каналам, а результаты отчётов доступны только вашему аккаунту.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border-b border-[#EAEAEA]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between py-5 text-left"
            >
              <span className="text-sm font-medium text-[#1a1a1a] pr-4">
                {item.question}
              </span>
              {isOpen ? (
                <Minus className="h-4 w-4 shrink-0 text-[#787774]" strokeWidth={1.5} />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-[#BBBBBB]" strokeWidth={1.5} />
              )}
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm leading-relaxed text-[#787774]">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
