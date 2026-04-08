import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Политика конфиденциальности — Geo Studio",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3] text-[#1a1a1a]">
      {/* ─── Header ─── */}
      <header className="border-b border-[#EAEAEA]">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#787774] transition-colors hover:text-[#1a1a1a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Главная
          </Link>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 py-16 lg:py-24">
        <article className="mx-auto max-w-3xl px-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Политика обработки персональных данных
          </h1>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#555]">
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                1. Общие положения
              </h2>
              <p>
                Настоящая политика определяет порядок обработки персональных
                данных и&nbsp;меры по&nbsp;обеспечению их&nbsp;безопасности.
                Оператором персональных данных является Плательщик&nbsp;НПД&nbsp;Изыгашев&nbsp;Георгий&nbsp;Олегович
                (ИНН&nbsp;425201762001).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                2. Цели сбора
              </h2>
              <p>
                Мы&nbsp;собираем email-адреса исключительно для предоставления
                доступа к&nbsp;SaaS-платформе GEO&nbsp;SaaS и&nbsp;отправки
                чеков. Данные обрабатываются на&nbsp;основании согласия
                пользователя, выраженного при регистрации на&nbsp;платформе.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                3. Третьи лица
              </h2>
              <p>
                Ваши данные не&nbsp;передаются третьим лицам,
                за&nbsp;исключением платёжных систем для проведения транзакций.
                Мы&nbsp;используем ЮKassa для обработки платежей — ваши
                платёжные данные передаются напрямую платёжному оператору
                и&nbsp;не&nbsp;хранятся на&nbsp;наших серверах.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                4. Права пользователя
              </h2>
              <p>
                Вы&nbsp;вправе в&nbsp;любой момент запросить удаление своих
                персональных данных, направив письмо на&nbsp;адрес{" "}
                <a
                  href="mailto:hello@geosaas.com"
                  className="text-[#1a1a1a] underline underline-offset-2"
                >
                  hello@geosaas.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                5. Изменения
              </h2>
              <p>
                Мы&nbsp;оставляем за&nbsp;собой право вносить изменения
                в&nbsp;настоящую политику. Актуальная версия всегда доступна
                на&nbsp;данной странице.
              </p>
            </section>
          </div>

          <p className="mt-12 text-xs text-[#BBBBBB]">
            Дата последнего обновления: {new Date().getFullYear()}
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
