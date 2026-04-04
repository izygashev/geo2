export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-5 w-32 rounded bg-[#EAEAEA]" />
          <div className="mt-2 h-4 w-56 rounded bg-[#F0EFEB]" />
        </div>
        <div className="h-9 w-36 rounded-md bg-[#EAEAEA]" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#EAEAEA] bg-white p-5">
            <div className="h-3 w-16 rounded bg-[#F0EFEB]" />
            <div className="mt-3 h-8 w-12 rounded bg-[#EAEAEA]" />
          </div>
        ))}
      </div>

      {/* Project list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#EAEAEA] bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-[#EAEAEA]" />
                <div className="h-3 w-24 rounded bg-[#F0EFEB]" />
              </div>
              <div className="h-6 w-16 rounded bg-[#EAEAEA]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
