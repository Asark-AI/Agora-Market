import { Skeleton } from '@/components/ui/skeleton';
import { PublicShell } from '@/components/public-shell';

const shortcutSkeletons = Array.from({ length: 10 });
const dealSkeletons = Array.from({ length: 4 });
const productSkeletons = Array.from({ length: 8 });

function ProductSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'w-[164px] shrink-0' : 'min-w-0'}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <Skeleton className="mt-3 h-3.5 w-4/5" />
      <Skeleton className="mt-2 h-5 w-2/5" />
      <Skeleton className="mt-2 h-3 w-3/5" />
    </div>
  );
}

export default function SearchLoading() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12" aria-busy="true" aria-label="Loading Explore">
        <Skeleton className="h-12 max-w-3xl rounded-full" />

        <section className="mt-7 border-y border-border/70 py-4">
          <div className="mb-4 flex items-center justify-between"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-24" /></div>
          <div className="grid grid-cols-5 gap-y-5 sm:grid-cols-10 sm:gap-y-4">
            {shortcutSkeletons.map((_, index) => <div key={index} className="flex flex-col items-center gap-2"><Skeleton className="size-14 rounded-full sm:size-16" /><Skeleton className="h-3 w-14" /></div>)}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between"><Skeleton className="h-6 w-28" /><Skeleton className="h-4 w-14" /></div>
          <div className="-mx-4 flex gap-3 overflow-hidden px-4"><div className="flex w-full gap-3">{dealSkeletons.map((_, index) => <ProductSkeleton compact key={index} />)}</div></div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-14" /></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{productSkeletons.map((_, index) => <ProductSkeleton key={index} />)}</div>
        </section>
      </main>
    </PublicShell>
  );
}
