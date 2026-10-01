import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="group relative flex min-w-0 h-full flex-col overflow-hidden border border-[#e3e7eb] bg-white" aria-hidden="true">
      <div className="relative aspect-square overflow-hidden bg-[#f1f4f6]">
        <Skeleton className="absolute left-2 top-2 h-5 w-12 rounded-sm" />
        <Skeleton className="absolute right-2 top-2 size-9 rounded-full" />
        <Skeleton className="h-full w-full" />
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-0.5 h-4 w-4/5" />

        <div className="mt-1 flex h-4 items-center gap-1">
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>

        <Skeleton className="mt-1.5 h-5 w-28" />
        <Skeleton className="mt-0.5 h-3 w-16" />

        <div className="mt-auto flex min-h-10 items-center justify-between gap-2 pt-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">{Array.from({ length: count }).map((_, index) => <ProductCardSkeleton key={index} />)}</div>;
}

export function CategoryNavigationSkeleton() {
  return <div className="flex gap-2 overflow-hidden py-3" aria-hidden="true">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className={`h-9 shrink-0 rounded-full ${index % 2 ? 'w-28' : 'w-20'}`} />)}</div>;
}

export function ProductDetailsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading product details">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div className="-mx-3 space-y-0 sm:-mx-4 lg:mx-0">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex gap-2 overflow-hidden px-3 py-2 sm:px-4 lg:px-0">
            <Skeleton className="size-14 shrink-0 rounded-none" />
            <Skeleton className="size-14 shrink-0 rounded-none" />
            <Skeleton className="size-14 shrink-0 rounded-none" />
          </div>
          <div className="flex h-10 items-center gap-3 border-y border-border px-3 sm:px-4 lg:px-0"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-28" /></div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-2/5" />
          <div className="space-y-2 border-y border-border py-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-3 w-32" /></div>
          <div className="flex items-center justify-between"><Skeleton className="h-9 w-28" /><Skeleton className="h-3 w-24" /></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex h-12 items-center justify-between border-y border-border"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-20" /></div>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-24 w-full rounded-none" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-80" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}</div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]"><Skeleton className="h-80 w-full rounded-xl" /><Skeleton className="h-80 w-full rounded-xl" /></div>
    </div>
  );
}

export function OrdersSkeleton() {
  return <div className="space-y-4" aria-busy="true" aria-label="Loading orders">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="border border-border bg-white p-4"><div className="flex justify-between"><Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-20" /></div><Skeleton className="mt-5 h-4 w-3/5" /><Skeleton className="mt-3 h-4 w-2/5" /><Skeleton className="mt-5 h-10 w-full" /></div>)}</div>;
}
