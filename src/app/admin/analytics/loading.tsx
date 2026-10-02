import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminAnalyticsLoading() {
  return (
    <main className="space-y-6 p-5 sm:p-8" aria-busy="true" aria-label="Loading platform analytics">
      <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      <div className="grid gap-4 xl:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
    </main>
  );
}
