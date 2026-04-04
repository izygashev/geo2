export default function ReportLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Back link */}
      <div className="h-4 w-24 rounded bg-[#F0EFEB]" />

      {/* Header card skeleton */}
      <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-36 rounded bg-[#EAEAEA]" />
              <div className="h-5 w-20 rounded-md bg-[#F0EFEB]" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-32 rounded bg-[#F0EFEB]" />
              <div className="h-4 w-44 rounded bg-[#F0EFEB]" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-md bg-[#EAEAEA]" />
            <div className="h-9 w-32 rounded-md bg-[#EAEAEA]" />
          </div>
        </div>
      </div>

      {/* Score row skeleton */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 rounded-xl border border-[#EAEAEA] bg-white p-6 flex flex-col items-center">
          <div className="h-3 w-28 rounded bg-[#F0EFEB] mb-4" />
          <div className="h-28 w-28 rounded-full border-4 border-[#EAEAEA]" />
        </div>
        <div className="lg:col-span-4 rounded-xl border border-[#EAEAEA] bg-white p-6 space-y-4">
          <div className="h-3 w-28 rounded bg-[#F0EFEB]" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-full rounded bg-[#EAEAEA]" />
          ))}
        </div>
        <div className="lg:col-span-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#EAEAEA] bg-white p-5">
              <div className="h-3 w-20 rounded bg-[#F0EFEB]" />
              <div className="mt-3 h-8 w-12 rounded bg-[#EAEAEA]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
