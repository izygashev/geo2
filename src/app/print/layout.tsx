import "@/app/globals.css";

/**
 * Минимальный layout для print-страниц.
 * Не включает навигацию, JSON-LD, TooltipProvider и прочие обёртки.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body
        className="m-0 bg-white p-0 text-[#1a1a1a] antialiased"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
