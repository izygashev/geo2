import Link from "next/link";
import { Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-14 lg:px-8 lg:py-20">
        {/* Top row */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="mb-4 flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-[#999]" strokeWidth={1.5} />
              <span className="text-[14px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">
                Geo Studio
              </span>
            </div>
            <p className="text-[12px] leading-[1.7] text-[#999]">
              Платформа аналитики AI-видимости бренда.
              <br />
              Анализируем упоминания в ChatGPT, Perplexity и Claude.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-14">
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#CCC]">
                Продукт
              </p>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/sign-up"
                    className="text-[12px] text-[#888] transition-colors duration-200 hover:text-[#0A0A0A]"
                  >
                    Начать бесплатно
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-in"
                    className="text-[12px] text-[#888] transition-colors duration-200 hover:text-[#0A0A0A]"
                  >
                    Войти
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-[12px] text-[#888] transition-colors duration-200 hover:text-[#0A0A0A]"
                  >
                    Блог
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#CCC]">
                Документы
              </p>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/privacy"
                    className="text-[12px] text-[#888] transition-colors duration-200 hover:text-[#0A0A0A]"
                  >
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link
                    href="/offer"
                    className="text-[12px] text-[#888] transition-colors duration-200 hover:text-[#0A0A0A]"
                  >
                    Оферта
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-neutral-100" />

        {/* Bottom row — реквизиты */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] leading-relaxed text-[#CCC]">
            НПД Изыгашев Георгий Олегович • ИНН 425201762001
          </p>
          <div className="flex items-center gap-5">
            <a
              href="mailto:hello@geostudioai.ru"
              className="text-[11px] text-[#CCC] transition-colors duration-200 hover:text-[#888]"
            >
              hello@geostudioai.ru
            </a>
            <p className="text-[11px] text-[#CCC]">
              © {new Date().getFullYear()} Geo Studio
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
