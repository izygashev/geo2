import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Публичная оферта — Geo Studio",
  description: "Публичная оферта (пользовательское соглашение) сервиса Geo Studio (geostudioai.ru).",
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
          <p className="mt-2 text-sm text-[#787774]">
            Публичная оферта &middot; редакция от&nbsp;13&nbsp;апреля&nbsp;2026&nbsp;г.
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#555]">
            {/* ── 1 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                1. Общие положения
              </h2>
              <p>
                1.1. Настоящий документ является официальным предложением (публичной офертой)
                Плательщика&nbsp;НПД Изыгашева&nbsp;Георгия&nbsp;Олеговича, ИНН&nbsp;425201762001
                (далее&nbsp;— &laquo;Исполнитель&raquo;), адресованным любому дееспособному
                физическому лицу (далее&nbsp;— &laquo;Заказчик&raquo;), заключить договор
                возмездного оказания услуг на&nbsp;условиях, изложенных ниже.
              </p>
              <p className="mt-3">
                1.2. В&nbsp;соответствии со&nbsp;ст.&nbsp;435 и&nbsp;ст.&nbsp;437
                Гражданского кодекса Российской Федерации настоящая оферта
                является публичной.
              </p>
              <p className="mt-3">
                1.3. Акцептом оферты является завершение регистрации в&nbsp;Сервисе
                (создание учётной записи). С&nbsp;момента акцепта договор считается
                заключённым (п.&nbsp;3 ст.&nbsp;438 ГК&nbsp;РФ).
              </p>
            </section>

            {/* ── 2 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                2. Термины и&nbsp;определения
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li>
                  <strong>Сервис</strong>&nbsp;— программный комплекс Geo&nbsp;Studio, доступный
                  по&nbsp;адресу{" "}
                  <a href="https://geostudioai.ru" className="text-[#1a1a1a] underline underline-offset-2">
                    geostudioai.ru
                  </a>, предоставляющий аналитику AI-видимости сайтов (GEO-аналитика).
                </li>
                <li>
                  <strong>Кредит</strong>&nbsp;— внутренняя расчётная единица Сервиса, приобретаемая
                  Заказчиком и&nbsp;списываемая при формировании аналитических отчётов.
                </li>
                <li>
                  <strong>Отчёт</strong>&nbsp;— автоматически формируемый результат анализа сайта
                  с&nbsp;помощью моделей искусственного интеллекта.
                </li>
                <li>
                  <strong>Тарифный план</strong>&nbsp;— набор условий (количество кредитов, проектов,
                  расписание), определяющий объём доступных Заказчику услуг.
                </li>
              </ul>
            </section>

            {/* ── 3 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                3. Предмет договора
              </h2>
              <p>
                3.1. Исполнитель обязуется оказать Заказчику услуги по&nbsp;автоматизированному
                анализу AI-видимости сайтов в&nbsp;генеративных поисковых системах (GEO-аналитика),
                а&nbsp;Заказчик обязуется оплатить указанные услуги на&nbsp;условиях настоящей оферты.
              </p>
              <p className="mt-3">
                3.2. Конкретный состав и&nbsp;объём услуг определяются выбранным Заказчиком
                тарифным планом и&nbsp;количеством приобретённых кредитов.
              </p>
            </section>

            {/* ── 4 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                4. Порядок оказания услуг
              </h2>
              <p>
                4.1. Заказчик самостоятельно создаёт проект, указывает URL-адрес сайта
                и&nbsp;инициирует формирование отчёта через интерфейс Сервиса.
              </p>
              <p className="mt-3">
                4.2. Услуга считается оказанной в&nbsp;момент завершения формирования отчёта
                и&nbsp;предоставления Заказчику доступа к&nbsp;его результатам.
              </p>
              <p className="mt-3">
                4.3. Исполнитель обязуется обеспечивать доступность Сервиса не&nbsp;менее 95&nbsp;%
                времени в&nbsp;месяц, за&nbsp;исключением плановых технических работ, о&nbsp;которых
                Заказчик уведомляется заблаговременно.
              </p>
            </section>

            {/* ── 5 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                5. Стоимость услуг и&nbsp;порядок оплаты
              </h2>
              <p>
                5.1. Оплата услуг производится авансовым платежом путём приобретения
                кредитов через интерфейс Сервиса. Стоимость кредитов указана
                на&nbsp;странице тарифов в&nbsp;рублях Российской Федерации.
              </p>
              <p className="mt-3">
                5.2. Платежи обрабатываются сертифицированным платёжным оператором
                ЮKassa (НКО&nbsp;&laquo;ЮМани&raquo;). Данные банковских карт передаются
                напрямую платёжному оператору и&nbsp;не&nbsp;хранятся на&nbsp;серверах Исполнителя.
              </p>
              <p className="mt-3">
                5.3. Неиспользованные кредиты сохраняются на&nbsp;балансе Заказчика
                бессрочно.
              </p>
              <p className="mt-3">
                5.4. Исполнитель направляет электронный чек на&nbsp;адрес электронной почты
                Заказчика в&nbsp;соответствии с&nbsp;требованиями 54&#8209;ФЗ.
              </p>
            </section>

            {/* ── 6 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                6. Возврат средств
              </h2>
              <p>
                6.1. Возврат денежных средств за&nbsp;кредиты, которые были использованы
                для формирования отчётов (услуга оказана), не&nbsp;производится.
              </p>
              <p className="mt-3">
                6.2. Если кредиты не&nbsp;были израсходованы, Заказчик вправе направить
                запрос на&nbsp;возврат средств на&nbsp;адрес{" "}
                <a
                  href="mailto:hello@geostudioai.ru"
                  className="text-[#1a1a1a] underline underline-offset-2"
                >
                  hello@geostudioai.ru
                </a>
                . Решение о&nbsp;возврате принимается Исполнителем в&nbsp;течение
                10&nbsp;рабочих дней.
              </p>
            </section>

            {/* ── 7 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                7. Права и&nbsp;обязанности сторон
              </h2>
              <p className="font-medium text-[#1a1a1a]">7.1. Исполнитель обязан:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li>Обеспечивать функционирование и&nbsp;доступность Сервиса;</li>
                <li>Хранить и&nbsp;обрабатывать персональные данные в&nbsp;соответствии
                    с&nbsp;<Link href="/privacy" className="text-[#1a1a1a] underline underline-offset-2">Политикой
                    конфиденциальности</Link>;</li>
                <li>Уведомлять Заказчика об&nbsp;изменениях условий оферты.</li>
              </ul>
              <p className="mt-4 font-medium text-[#1a1a1a]">7.2. Заказчик обязан:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                <li>Предоставлять достоверные данные при регистрации;</li>
                <li>Не&nbsp;передавать доступ к&nbsp;учётной записи третьим лицам;</li>
                <li>Не&nbsp;использовать Сервис для целей, противоречащих законодательству РФ;</li>
                <li>Самостоятельно обеспечивать безопасность своих учётных данных.</li>
              </ul>
            </section>

            {/* ── 8 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                8. Ограничение ответственности
              </h2>
              <p>
                8.1. Результаты аналитики носят <strong>информационно-рекомендательный характер</strong>.
                Исполнитель не&nbsp;гарантирует конкретных результатов продвижения в&nbsp;AI-поисковых
                системах и&nbsp;не&nbsp;несёт ответственности за&nbsp;действия или бездействие Заказчика
                на&nbsp;основе полученных рекомендаций.
              </p>
              <p className="mt-3">
                8.2. Совокупная ответственность Исполнителя по&nbsp;настоящему договору ограничена
                суммой, фактически уплаченной Заказчиком за&nbsp;последние 3&nbsp;(три) календарных
                месяца, предшествующих моменту возникновения основания для ответственности.
              </p>
              <p className="mt-3">
                8.3. Исполнитель не&nbsp;несёт ответственности за&nbsp;перебои в&nbsp;работе Сервиса,
                вызванные действиями третьих лиц, сбоями в&nbsp;работе каналов связи или
                обстоятельствами непреодолимой силы.
              </p>
            </section>

            {/* ── 9 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                9. Интеллектуальная собственность
              </h2>
              <p>
                9.1. Все материалы Сервиса, включая интерфейс, программный код
                и&nbsp;алгоритмы, являются интеллектуальной собственностью Исполнителя.
              </p>
              <p className="mt-3">
                9.2. Заказчик получает неисключительное, непередаваемое право использовать
                результаты сформированных отчётов для собственных нужд.
              </p>
            </section>

            {/* ── 10 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                10. Срок действия и&nbsp;расторжение
              </h2>
              <p>
                10.1. Договор вступает в&nbsp;силу с&nbsp;момента акцепта (регистрации) и&nbsp;действует
                до&nbsp;момента удаления учётной записи Заказчика.
              </p>
              <p className="mt-3">
                10.2. Заказчик вправе в&nbsp;любой момент отказаться от&nbsp;услуг, удалив свою
                учётную запись в&nbsp;настройках профиля или направив запрос на&nbsp;адрес{" "}
                <a
                  href="mailto:hello@geostudioai.ru"
                  className="text-[#1a1a1a] underline underline-offset-2"
                >
                  hello@geostudioai.ru
                </a>.
              </p>
              <p className="mt-3">
                10.3. Исполнитель вправе расторгнуть договор в&nbsp;одностороннем порядке
                в&nbsp;случае нарушения Заказчиком условий настоящей оферты, уведомив его
                по&nbsp;электронной почте.
              </p>
            </section>

            {/* ── 11 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                11. Порядок разрешения споров
              </h2>
              <p>
                11.1. Все споры разрешаются путём переговоров. Претензионный порядок обязателен;
                срок рассмотрения претензии — 30&nbsp;(тридцать) календарных дней.
              </p>
              <p className="mt-3">
                11.2. При недостижении соглашения спор передаётся на&nbsp;рассмотрение в&nbsp;суд
                по&nbsp;месту нахождения Исполнителя в&nbsp;соответствии с&nbsp;законодательством
                Российской Федерации.
              </p>
            </section>

            {/* ── 12 ── */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                12. Изменения оферты
              </h2>
              <p>
                12.1. Исполнитель оставляет за&nbsp;собой право вносить изменения в&nbsp;настоящую
                оферту. Актуальная версия всегда доступна по&nbsp;адресу{" "}
                <a href="https://geostudioai.ru/offer" className="text-[#1a1a1a] underline underline-offset-2">
                  geostudioai.ru/offer
                </a>.
              </p>
              <p className="mt-3">
                12.2. Продолжая использовать Сервис после внесения изменений, Заказчик подтверждает
                своё согласие с&nbsp;обновлёнными условиями.
              </p>
            </section>

            {/* ── Реквизиты ── */}
            <section className="border-t border-[#EAEAEA] pt-8">
              <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">
                Реквизиты исполнителя
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
