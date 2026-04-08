import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Публичная оферта — Geo Studio",
};

export default function OfferPage() {
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
            Пользовательское соглашение
          </h1>
          <p className="mt-2 text-sm text-[#787774]">Публичная оферта</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#555]">
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                1. Предмет соглашения
              </h2>
              <p>
                Сервис GEO&nbsp;SaaS предоставляет услуги
                автоматизированного аудита сайтов с&nbsp;использованием
                нейросетей. Настоящее соглашение определяет условия
                использования платформы, расположенной по&nbsp;адресу{" "}
                <span className="text-[#1a1a1a]">geosaas.com</span>.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                2. Оплата
              </h2>
              <p>
                Оплата услуг производится авансовым платежом путём покупки
                внутренних &laquo;кредитов&raquo;. Каждый аудит-отчёт
                списывает определённое количество кредитов с&nbsp;баланса
                пользователя. Возврат средств за&nbsp;уже потраченные
                кредиты не&nbsp;производится.
              </p>
              <p className="mt-3">
                Неиспользованные кредиты сохраняются на&nbsp;балансе
                пользователя бессрочно. Платежи обрабатываются через
                сертифицированного оператора ЮKassa.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                3. Ответственность
              </h2>
              <p>
                Результаты аналитики носят рекомендательный характер.
                Сервис не&nbsp;гарантирует конкретных результатов
                продвижения в&nbsp;AI-поисковиках и&nbsp;не&nbsp;несёт
                ответственности за&nbsp;действия пользователя на&nbsp;основе
                полученных рекомендаций.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                4. Интеллектуальная собственность
              </h2>
              <p>
                Все материалы платформы, включая интерфейс, код
                и&nbsp;алгоритмы, являются интеллектуальной собственностью
                оператора. Пользователь получает неисключительное право
                использовать результаты аналитики для собственных нужд.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                5. Заключительные положения
              </h2>
              <p>
                Оператор оставляет за&nbsp;собой право изменять условия
                настоящего соглашения. Актуальная версия всегда доступна
                на&nbsp;данной странице. Продолжая использовать платформу
                после внесения изменений, пользователь подтверждает своё
                согласие с&nbsp;новыми условиями.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                Реквизиты
              </h2>
              <p>
                Плательщик&nbsp;НПД&nbsp;Изыгашев&nbsp;Георгий&nbsp;Олегович
                <br />
                ИНН&nbsp;425201762001
                <br />
                Электронная почта:{" "}
                <a
                  href="mailto:hello@geosaas.com"
                  className="text-[#1a1a1a] underline underline-offset-2"
                >
                  hello@geosaas.com
                </a>
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
