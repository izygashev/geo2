import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Политика конфиденциальности — Geo Studio",
  description: "Политика обработки персональных данных сервиса Geo Studio (geostudioai.ru).",
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
          <p className="mt-2 text-sm text-[#787774]">
            Редакция от&nbsp;13&nbsp;апреля&nbsp;2026&nbsp;г.
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#555]">
            {/* ── 1 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                1. Общие положения
              </h2>
              <p>
                1.1. Настоящая Политика обработки персональных данных (далее&nbsp;— &laquo;Политика&raquo;)
                разработана в&nbsp;соответствии с&nbsp;Федеральным законом от&nbsp;27.07.2006
                №&nbsp;152&#8209;ФЗ &laquo;О&nbsp;персональных данных&raquo; и&nbsp;определяет порядок
                обработки и&nbsp;защиты персональных данных пользователей сервиса Geo&nbsp;Studio
                (далее&nbsp;— &laquo;Сервис&raquo;), расположенного по&nbsp;адресу{" "}
                <a href="https://geostudioai.ru" className="text-[#1a1a1a] underline underline-offset-2">
                  geostudioai.ru
                </a>.
              </p>
              <p className="mt-3">
                1.2. Оператором персональных данных является Плательщик&nbsp;НПД
                Изыгашев&nbsp;Георгий&nbsp;Олегович, ИНН&nbsp;425201762001
                (далее&nbsp;— &laquo;Оператор&raquo;).
              </p>
              <p className="mt-3">
                1.3. Регистрируясь в&nbsp;Сервисе, Пользователь свободно, своей волей
                и&nbsp;в&nbsp;своём интересе даёт согласие на&nbsp;обработку персональных данных
                в&nbsp;соответствии с&nbsp;настоящей Политикой.
              </p>
            </section>

            {/* ── 2 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                2. Состав собираемых данных
              </h2>
              <p>2.1. Оператор обрабатывает следующие категории персональных данных:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li>Имя (указанное при регистрации);</li>
                <li>Адрес электронной почты (email);</li>
                <li>URL-адреса сайтов, которые Пользователь передаёт для анализа;</li>
                <li>Техническая информация: IP-адрес, тип браузера, файлы cookie, уникальный
                    идентификатор устройства (fingerprint) — для обеспечения безопасности аккаунта.</li>
              </ul>
              <p className="mt-3">
                2.2. Сервис <strong>не&nbsp;собирает и&nbsp;не&nbsp;хранит</strong> данные банковских карт.
                Все платёжные операции обрабатываются сертифицированным платёжным оператором ЮKassa (НКО &laquo;ЮМани&raquo;)
                в&nbsp;соответствии со&nbsp;стандартом PCI&nbsp;DSS.
              </p>
            </section>

            {/* ── 3 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                3. Цели обработки персональных данных
              </h2>
              <p>3.1. Персональные данные обрабатываются в&nbsp;следующих целях:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li>Создание и&nbsp;аутентификация учётной записи Пользователя;</li>
                <li>Предоставление услуг Сервиса — анализ AI-видимости сайтов (GEO-аналитика);</li>
                <li>Обработка платежей, начисление кредитов и&nbsp;выставление чеков;</li>
                <li>Отправка транзакционных уведомлений (готовность отчёта, изменения в&nbsp;подписке);</li>
                <li>Обеспечение безопасности и&nbsp;предотвращение мошенничества.</li>
              </ul>
              <p className="mt-3">
                3.2. Оператор не&nbsp;использует персональные данные для рассылки рекламных
                материалов без отдельного явного согласия Пользователя.
              </p>
            </section>

            {/* ── 4 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                4. Правовые основания обработки
              </h2>
              <p>4.1. Обработка персональных данных осуществляется на&nbsp;основании:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li>Согласия субъекта персональных данных (п.&nbsp;1 ч.&nbsp;1 ст.&nbsp;6 152&#8209;ФЗ);</li>
                <li>Исполнения договора, стороной которого является субъект (п.&nbsp;5 ч.&nbsp;1 ст.&nbsp;6 152&#8209;ФЗ) —
                    акцепт{" "}
                    <Link href="/offer" className="text-[#1a1a1a] underline underline-offset-2">
                      Публичной оферты
                    </Link>.</li>
              </ul>
            </section>

            {/* ── 5 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                5. Передача данных третьим лицам
              </h2>
              <p>
                5.1. Оператор не&nbsp;продаёт и&nbsp;не&nbsp;передаёт персональные данные третьим лицам,
                за&nbsp;исключением случаев, прямо предусмотренных настоящей Политикой и&nbsp;законодательством РФ.
              </p>
              <p className="mt-3">5.2. Данные могут передаваться следующим категориям получателей:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li><strong>ЮKassa</strong> (НКО &laquo;ЮМани&raquo;) — для обработки платежей;</li>
                <li><strong>Resend, Inc.</strong> — для доставки транзакционных email-уведомлений;</li>
                <li><strong>Хостинг-провайдер</strong> — для хранения данных на&nbsp;серверах, расположенных
                    на&nbsp;территории Российской Федерации.</li>
              </ul>
              <p className="mt-3">
                5.3. Оператор вправе раскрыть персональные данные по&nbsp;законному требованию
                государственных органов Российской Федерации.
              </p>
            </section>

            {/* ── 6 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                6. Защита персональных данных
              </h2>
              <p>
                6.1. Оператор принимает необходимые и&nbsp;достаточные организационные и&nbsp;технические
                меры для защиты персональных данных от&nbsp;неправомерного доступа, уничтожения,
                изменения, блокирования, копирования, распространения, а&nbsp;также от&nbsp;иных
                неправомерных действий третьих лиц.
              </p>
              <p className="mt-3">
                6.2. Пароли хранятся в&nbsp;виде криптографических хэшей (bcrypt). Передача данных
                между клиентом и&nbsp;сервером осуществляется по&nbsp;протоколу TLS.
              </p>
            </section>

            {/* ── 7 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                7. Права пользователя
              </h2>
              <p>7.1. Пользователь имеет право:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li>Получить информацию об&nbsp;обработке своих персональных данных;</li>
                <li>Потребовать уточнения, блокирования или уничтожения персональных данных;</li>
                <li>Отозвать согласие на&nbsp;обработку персональных данных;</li>
                <li>Удалить свою учётную запись и&nbsp;все связанные данные.</li>
              </ul>
              <p className="mt-3">
                7.2. Для реализации указанных прав направьте запрос на&nbsp;адрес{" "}
                <a
                  href="mailto:hello@geostudioai.ru"
                  className="text-[#1a1a1a] underline underline-offset-2"
                >
                  hello@geostudioai.ru
                </a>
                . Оператор обязуется рассмотреть обращение в&nbsp;течение 30&nbsp;дней.
              </p>
            </section>

            {/* ── 8 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                8. Cookies и&nbsp;аналитика
              </h2>
              <p>
                8.1. Сервис использует файлы cookie для поддержания сессии авторизации
                и&nbsp;обеспечения корректной работы платформы.
              </p>
              <p className="mt-3">
                8.2. Пользователь может отключить приём файлов cookie в&nbsp;настройках браузера,
                однако это может ограничить функциональность Сервиса.
              </p>
            </section>

            {/* ── 9 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                9. Сроки хранения
              </h2>
              <p>
                9.1. Персональные данные хранятся в&nbsp;течение всего срока действия учётной записи
                Пользователя и&nbsp;в&nbsp;течение 1&nbsp;(одного) года после её&nbsp;удаления —
                для выполнения требований бухгалтерского и&nbsp;налогового учёта.
              </p>
              <p className="mt-3">
                9.2. По&nbsp;истечении указанного срока данные уничтожаются.
              </p>
            </section>

            {/* ── 10 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                10. Изменения Политики
              </h2>
              <p>
                10.1. Оператор оставляет за&nbsp;собой право вносить изменения в&nbsp;настоящую Политику.
                Актуальная версия всегда доступна по&nbsp;адресу{" "}
                <a href="https://geostudioai.ru/privacy" className="text-[#1a1a1a] underline underline-offset-2">
                  geostudioai.ru/privacy
                </a>.
              </p>
              <p className="mt-3">
                10.2. Продолжая использовать Сервис после внесения изменений, Пользователь подтверждает
                своё согласие с&nbsp;обновлённой Политикой.
              </p>
            </section>

            {/* ── Реквизиты ── */}
            <section className="border-t border-[#EAEAEA] pt-8">
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                Реквизиты оператора
              </h2>
              <p>
                Плательщик&nbsp;НПД&nbsp;Изыгашев&nbsp;Георгий&nbsp;Олегович
                <br />
                ИНН&nbsp;425201762001
                <br />
                Электронная почта:{" "}
                <a
                  href="mailto:hello@geostudioai.ru"
                  className="text-[#1a1a1a] underline underline-offset-2"
                >
                  hello@geostudioai.ru
                </a>
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
