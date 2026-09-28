import { CategoryNavigationSkeleton, ProductGridSkeleton } from '@/components/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <main className="min-h-screen bg-background px-4 pb-8 pt-6" aria-busy="true" aria-label="Loading Agora"><div className="mx-auto max-w-7xl"><Skeleton className="h-8 w-48" /><CategoryNavigationSkeleton /><Skeleton className="mt-6 h-6 w-40" /><div className="mt-3"><ProductGridSkeleton count={8} /></div></div></main>;
}
