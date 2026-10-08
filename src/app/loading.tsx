import { CategoryNavigationSkeleton, ProductGridSkeleton } from '@/components/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0B0D0F] px-3 pb-8 pt-4 sm:px-4" aria-busy="true" aria-label="Loading Agora">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl border border-[#D4A72C]/30 bg-[#D4A72C]/10" />
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-16 bg-[#2a2f34]" />
            <Skeleton className="h-4 w-20 bg-[#2a2f34]" />
          </div>
        </div>

        <div className="mb-4 rounded-full border border-[#2a2f34] bg-[#101316] p-2">
          <div className="flex gap-2 overflow-hidden">
            <CategoryNavigationSkeleton />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-32 bg-[#2a2f34]" />
          <Skeleton className="h-4 w-16 bg-[#2a2f34]" />
        </div>

        <div className="mt-3">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </main>
  );
}
