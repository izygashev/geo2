import Link from "next/link";
import { Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#EAEAEA] bg-[#F7F6F3]">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        {/* Top row */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#787774]" />
              <span className="text-sm font-semibold tracking-tight text-[#1a1a1a]">
                Geo Studio
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#787774]">
              Платформа аналитики AI-видимости бренда.
              <br />
              Анализируем упоминания в ChatGPT, Perplexity и Claude.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#BBBBBB]">
                Продукт
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/sign-up"
                    className="text-xs text-[#787774] transition-colors hover:text-[#1a1a1a]"
                  >
                    Начать бесплатно
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-in"
                    className="text-xs text-[#787774] transition-colors hover:text-[#1a1a1a]"
                  >
                    Войти
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#BBBBBB]">
                Документы
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-xs text-[#787774] transition-colors hover:text-[#1a1a1a]"
                  >
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link
                    href="/offer"
                    className="text-xs text-[#787774] transition-colors hover:text-[#1a1a1a]"
                  >
                    Оферта
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-[#EAEAEA]" />

        {/* Bottom row — реквизиты */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] leading-relaxed text-[#BBBBBB]">
            НПД Изыгашев Георгий Олегович • ИНН 425201762001
          </p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:hello@geosaas.com"
              className="text-[11px] text-[#BBBBBB] transition-colors hover:text-[#787774]"
            >
              hello@geosaas.com
            </a>
            <p className="text-[11px] text-[#BBBBBB]">
              © {new Date().getFullYear()} Geo Studio
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
