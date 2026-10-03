import { getActiveProducts } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { SolutionBuilderClient } from '@/components/solution-builder';
import { getPublicSolutionDefinitionBySlug } from '@/lib/server/solutions';

export const dynamic = 'force-dynamic';

export default async function GamingPcSolutionPage() {
  const solution = await getPublicSolutionDefinitionBySlug('gaming-pc');
  if (!solution) {
    return (
      <PublicShell>
        <main className="mx-auto max-w-4xl px-3 py-8 sm:px-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
            This solution is not available right now.
          </div>
        </main>
      </PublicShell>
    );
  }

  const products = await getActiveProducts();

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-3 py-8 sm:px-4">
        <SolutionBuilderClient solution={solution} products={products} />
      </main>
    </PublicShell>
  );
}
