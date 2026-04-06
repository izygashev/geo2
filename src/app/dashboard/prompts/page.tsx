import { Target, Lock } from "lucide-react";

export default function PromptsPage() {
  return (
    <div className="pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F4]">
            <Target className="h-4 w-4 text-[#787774]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">
              Реверс-промпты
            </h1>
            <p className="text-xs text-[#787774]">Reverse Prompt Engineering</p>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#787774]">
          Узнайте, какие именно промпты пользователи задают AI-системам, чтобы найти продукт в вашей нише.
          Оптимизируйте контент под реальные сценарии поиска.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E5E3] bg-[#FAFAF9] px-8 py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EFEB]">
          <Lock className="h-6 w-6 text-[#CCCCCC]" />
        </div>
        <h2 className="text-base font-semibold text-[#1a1a1a]">Скоро</h2>
        <p className="mt-2 max-w-md text-sm text-[#787774]">
          Инструмент находится в активной разработке и будет доступен в ближайшем обновлении.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-[#F0EFEB] px-3 py-1 text-[11px] font-medium text-[#787774]">
          🚀 Запуск — Q2 2026
        </span>
      </div>
    </div>
  );
}
