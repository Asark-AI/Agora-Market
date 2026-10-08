import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="group relative flex min-w-0 h-full flex-col overflow-hidden rounded-[var(--radius)] border border-[#2a2f34] bg-[#171B1F] shadow-[0_18px_52px_-36px_rgba(0,0,0,0.75)]" aria-hidden="true">
      <div className="relative aspect-square overflow-hidden bg-[#101316]">
        <Skeleton className="absolute left-2 top-2 h-5 w-12 rounded-full border border-[#D4A72C]/30 bg-[#D4A72C]/15" />
        <Skeleton className="absolute right-2 top-2 size-9 rounded-full border border-[#2a2f34] bg-[#101316]/90" />
        <Skeleton className="h-full w-full border-0 bg-[#20252A]/80" />
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <Skeleton className="h-4 w-full bg-[#2a2f34]" />
        <Skeleton className="mt-0.5 h-4 w-4/5 bg-[#2a2f34]" />

        <div className="mt-1 flex h-4 items-center gap-1">
          <Skeleton className="size-3 rounded-full bg-[#D4A72C]/35" />
          <Skeleton className="h-3 w-16 bg-[#2a2f34]" />
        </div>

        <Skeleton className="mt-1.5 h-5 w-28 bg-[#2a2f34]" />
        <Skeleton className="mt-0.5 h-3 w-16 bg-[#2a2f34]" />

        <div className="mt-auto flex min-h-10 items-center justify-between gap-2 pt-1.5">
          <Skeleton className="h-3 w-20 bg-[#2a2f34]" />
          <Skeleton className="size-10 rounded-full border border-[#D4A72C]/30 bg-[#D4A72C]/10" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">{Array.from({ length: count }).map((_, index) => <ProductCardSkeleton key={index} />)}</div>;
}

export function CategoryNavigationSkeleton() {
  return <div className="flex gap-2 overflow-hidden py-3" aria-hidden="true">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className={`h-9 shrink-0 rounded-full border-[#2a2f34] bg-[#171B1F] ${index % 2 ? 'w-28' : 'w-20'}`} />)}</div>;
}

export function ProductDetailsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading product details">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div className="-mx-3 space-y-0 sm:-mx-4 lg:mx-0">
          <Skeleton className="aspect-square w-full rounded-none border-0 bg-[#171B1F]" />
          <div className="flex gap-2 overflow-hidden px-3 py-2 sm:px-4 lg:px-0">
            <Skeleton className="size-14 shrink-0 rounded-xl border border-[#2a2f34] bg-[#171B1F]" />
            <Skeleton className="size-14 shrink-0 rounded-xl border border-[#2a2f34] bg-[#171B1F]" />
            <Skeleton className="size-14 shrink-0 rounded-xl border border-[#2a2f34] bg-[#171B1F]" />
          </div>
          <div className="flex h-10 items-center gap-3 border-y border-[#1d2227] px-3 sm:px-4 lg:px-0"><Skeleton className="h-3 w-32 bg-[#2a2f34]" /><Skeleton className="h-3 w-28 bg-[#2a2f34]" /></div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-3 w-24 bg-[#2a2f34]" />
          <Skeleton className="h-6 w-4/5 bg-[#2a2f34]" />
          <Skeleton className="h-4 w-2/5 bg-[#2a2f34]" />
          <div className="space-y-2 border-y border-[#1d2227] py-3"><Skeleton className="h-8 w-40 bg-[#2a2f34]" /><Skeleton className="h-3 w-32 bg-[#2a2f34]" /></div>
          <div className="flex items-center justify-between"><Skeleton className="h-9 w-28 bg-[#D4A72C]/20" /><Skeleton className="h-3 w-24 bg-[#2a2f34]" /></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex h-12 items-center justify-between border-y border-[#1d2227]"><Skeleton className="h-4 w-48 bg-[#2a2f34]" /><Skeleton className="h-4 w-20 bg-[#2a2f34]" /></div>
        <Skeleton className="h-5 w-28 bg-[#2a2f34]" />
        <Skeleton className="h-24 w-full rounded-2xl border border-[#2a2f34] bg-[#171B1F]" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2"><Skeleton className="h-8 w-52 bg-[#2a2f34]" /><Skeleton className="h-4 w-72 max-w-full bg-[#2a2f34]" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-4 rounded-lg border border-[#1d2227] bg-[#12161a] p-4">
            <div className="flex items-center justify-between"><Skeleton className="h-3 w-24 bg-[#2a2f34]" /><Skeleton className="size-9 rounded-lg bg-[#2a2f34]" /></div>
            <Skeleton className="h-7 w-28 bg-[#2a2f34]" />
            <Skeleton className="h-3 w-32 bg-[#2a2f34]" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5 rounded-lg border border-[#1d2227] bg-[#12161a] p-4">
          <div className="flex items-center justify-between"><Skeleton className="h-5 w-36 bg-[#2a2f34]" /><Skeleton className="h-8 w-24 rounded-md bg-[#2a2f34]" /></div>
          <div className="flex h-52 items-end gap-3 border-b border-[#1d2227] pb-3">
            {[42, 66, 50, 82, 60, 92, 72, 56, 78, 48, 88, 64].map((height, index) => (
              <Skeleton key={index} className="min-w-0 flex-1 rounded-t-sm rounded-b-none bg-[#2a2f34]" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="flex justify-between"><Skeleton className="h-3 w-12 bg-[#2a2f34]" /><Skeleton className="h-3 w-12 bg-[#2a2f34]" /><Skeleton className="h-3 w-12 bg-[#2a2f34]" /><Skeleton className="h-3 w-12 bg-[#2a2f34]" /></div>
        </div>
        <div className="space-y-5 rounded-lg border border-[#1d2227] bg-[#12161a] p-4">
          <div className="flex items-center justify-between"><Skeleton className="h-5 w-32 bg-[#2a2f34]" /><Skeleton className="size-8 rounded-full bg-[#2a2f34]" /></div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 border-b border-[#1d2227] pb-4 last:border-0 last:pb-0">
              <Skeleton className="size-10 shrink-0 rounded-full bg-[#2a2f34]" />
              <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-3/4 bg-[#2a2f34]" /><Skeleton className="h-3 w-1/2 bg-[#2a2f34]" /></div>
              <Skeleton className="h-3 w-12 bg-[#2a2f34]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-5 pb-20" aria-busy="true" aria-label="Loading business overview">
      <div className="space-y-2"><Skeleton className="h-4 w-40 bg-[#2a2f34]" /><Skeleton className="h-8 w-64 max-w-full bg-[#2a2f34]" /></div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border border-[#1d2227] bg-[#12161a] p-4">
            <Skeleton className="h-3 w-20 bg-[#2a2f34]" /><Skeleton className="h-8 w-28 bg-[#2a2f34]" /><Skeleton className="h-3 w-24 bg-[#2a2f34]" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-36 bg-[#2a2f34]" />
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-lg border border-[#1d2227] bg-[#12161a] p-3">
            <Skeleton className="size-9 shrink-0 rounded-md bg-[#2a2f34]" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4 bg-[#2a2f34]" /><Skeleton className="h-3 w-2/5 bg-[#2a2f34]" /></div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 bg-[#2a2f34]" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 rounded-lg border border-[#1d2227] bg-[#12161a] p-3">
            <div className="space-y-2"><Skeleton className="h-4 w-40 max-w-full bg-[#2a2f34]" /><Skeleton className="h-3 w-28 bg-[#2a2f34]" /></div>
            <Skeleton className="h-3 w-12 bg-[#2a2f34]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrdersSkeleton() {
  return <div className="space-y-4" aria-busy="true" aria-label="Loading orders">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="border border-[#1d2227] bg-[#12161a] p-4"><div className="flex justify-between"><Skeleton className="h-5 w-32 bg-[#2a2f34]" /><Skeleton className="h-5 w-20 bg-[#2a2f34]" /></div><Skeleton className="mt-5 h-4 w-3/5 bg-[#2a2f34]" /><Skeleton className="mt-3 h-4 w-2/5 bg-[#2a2f34]" /><Skeleton className="mt-5 h-10 w-full bg-[#2a2f34]" /></div>)}</div>;
}
