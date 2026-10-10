import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public-shell';
import { SolutionBuilderClient } from '@/components/solution-builder';
import { getActiveProducts } from '@/lib/storefront';
import { getPublicSolutionDefinitionBySlug } from '@/lib/server/solutions';

export const dynamic = 'force-dynamic';

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = await getPublicSolutionDefinitionBySlug(slug);
  if (!solution) notFound();
  const products = await getActiveProducts();

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <SolutionBuilderClient solution={solution} products={products} />
      </main>
    </PublicShell>
  );
}
