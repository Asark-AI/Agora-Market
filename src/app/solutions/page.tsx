import Link from 'next/link';
import { ArrowRight, Cpu, Sparkles } from 'lucide-react';
import { AiShoppingPlanner } from '@/components/ai-shopping-planner';
import { PublicShell } from '@/components/public-shell';
import { getPublicSolutionDefinitions } from '@/lib/server/solutions';

export default async function SolutionsPage() {
  const solutions = await getPublicSolutionDefinitions();

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-3 py-8 sm:px-4">
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d65a24]">
          <Sparkles className="size-4" />
          Goal-based shopping
        </div>

        <div className="mb-6">
          <h1 className="font-headline text-3xl font-bold text-white">Solutions</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#B7BCC3]">
            Discover curated shopping journeys built on the real Agora marketplace catalog, so customers can move from goal to products without starting from scratch.
          </p>
        </div>

        <div className="mb-8">
          <AiShoppingPlanner solutions={solutions.map((solution) => ({
            slug: solution.slug,
            name: solution.name,
            category: solution.category,
            metadata: solution.metadata,
            requirements: solution.requirements.map(({ name, keywords }) => ({ name, keywords })),
          }))} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((solution) => (
            <div key={solution.id} className="overflow-hidden rounded-3xl border border-[#292f35] bg-[#171B1F] shadow-sm transition hover:border-[#555d65]">
              <div className="h-44 w-full overflow-hidden bg-[#101316]">
                <img src={solution.image} alt={solution.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#424a52] bg-[#111416] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B7BCC3]">
                  <Cpu className="size-3.5 text-[#F0C75E]" />
                  {solution.category}
                </div>
                <h2 className="text-xl font-bold text-white">{solution.name}</h2>
                <p className="mt-2 text-sm text-[#B7BCC3]">{solution.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#9299A1]">{solution.requirements.length} requirements</span>
                  <Link href={`/solutions/${solution.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#F0C75E]">
                    Open builder <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
