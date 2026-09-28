import { PublicShell } from '@/components/public-shell';
import { ProductDetailsSkeleton } from '@/components/loading-skeletons';

export default function ProductLoading() {
  return <PublicShell><main className="container mx-auto max-w-7xl px-4 py-8"><ProductDetailsSkeleton /></main></PublicShell>;
}
