import Link from 'next/link';
import { ArrowRight, Cpu, Sparkles } from 'lucide-react';
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
          <h1 className="font-headline text-3xl font-bold text-slate-900">Solutions</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Discover curated shopping journeys built on the real Agora marketplace catalog, so customers can move from goal to products without starting from scratch.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((solution) => (
            <div key={solution.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
              <div className="h-44 w-full overflow-hidden">
                <img src={solution.image} alt={solution.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <Cpu className="size-3.5 text-[#d65a24]" />
                  {solution.category}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{solution.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{solution.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">{solution.requirements.length} requirements</span>
                  <Link href={`/solutions/${solution.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
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
