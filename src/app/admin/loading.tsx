/** Streamed instantly while an admin page's data resolves, so navigation
 *  feels immediate instead of blocking on Supabase. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-56 rounded-lg bg-page-fg/[0.08]" />
        <div className="mt-3 h-4 w-80 rounded bg-page-fg/[0.05]" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[118px] rounded-[20px] border border-page-fg/[0.09] bg-page" />
        ))}
      </div>
      <div className="rounded-[20px] border border-page-fg/[0.09] bg-page">
        <div className="border-b border-page-fg/[0.09] px-5 py-4">
          <div className="h-5 w-40 rounded bg-page-fg/[0.08]" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-page-fg/[0.06] px-5 py-4 last:border-0">
            <div className="h-4 w-28 rounded bg-page-fg/[0.06]" />
            <div className="h-4 flex-1 rounded bg-page-fg/[0.04]" />
            <div className="h-4 w-20 rounded bg-page-fg/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
