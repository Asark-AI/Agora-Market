'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { buildProductSlug } from '@/lib/storefront';
import { getSolutionBudgetEstimate, getSolutionRecommendations, type SolutionDefinition } from '@/lib/solutions';
import type { Product } from '@/lib/types';

const ghanaCurrency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

export function SolutionBuilderClient({ solution, products }: { solution: SolutionDefinition; products: Product[] }) {
  const { addToCart } = useCart();
  const recommendations = useMemo(() => getSolutionRecommendations(products, solution), [products, solution]);
  const estimatedTotal = useMemo(() => getSolutionBudgetEstimate(recommendations), [recommendations]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d65a24]">Goal-based shopping</p>
              <h1 className="mt-2 font-headline text-3xl font-bold text-slate-900">{solution.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{solution.description}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Estimated build</p>
              <p className="mt-2 font-headline text-2xl font-bold text-emerald-900">{ghanaCurrency.format(estimatedTotal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(solution.metadata?.targetAudience || solution.metadata?.useCases.length || solution.metadata?.outcomes.length || solution.metadata?.budgetRange?.min !== undefined || solution.metadata?.budgetRange?.max !== undefined) && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {solution.metadata.targetAudience && <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Designed for</p><p className="mt-2 text-sm text-slate-800">{solution.metadata.targetAudience}</p></div>}
            {(solution.metadata.budgetRange?.min !== undefined || solution.metadata.budgetRange?.max !== undefined) && <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Typical budget</p><p className="mt-2 text-sm text-slate-800">{solution.metadata.budgetRange.min !== undefined ? ghanaCurrency.format(solution.metadata.budgetRange.min) : 'No minimum'} to {solution.metadata.budgetRange.max !== undefined ? ghanaCurrency.format(solution.metadata.budgetRange.max) : 'No maximum'}</p></div>}
            {solution.metadata.useCases.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Use cases</p><p className="mt-2 text-sm text-slate-800">{solution.metadata.useCases.join(' · ')}</p></div>}
            {solution.metadata.outcomes.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Intended outcomes</p><p className="mt-2 text-sm text-slate-800">{solution.metadata.outcomes.join(' · ')}</p></div>}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {solution.questions.map((question) => (
          <Card key={question} className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Question</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{question}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation) => {
          const requirement = solution.requirements.find((item) => item.id === recommendation.requirementId);
          const addQuantity = Math.max(1, requirement?.quantity ?? 1);
          return (
            <Card key={recommendation.requirementId} className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-semibold text-slate-900">{recommendation.requirementName}</CardTitle>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">{requirement?.type || 'required'}</span>
                  </div>
                  {requirement?.description && <p className="mt-1 text-sm text-slate-600">{requirement.description}</p>}
                  {requirement && <p className="mt-1 text-xs text-slate-500">Minimum {requirement.minQuantity} · Suggested {requirement.quantity}{requirement.maxQuantity ? ` · Maximum ${requirement.maxQuantity}` : ''}</p>}
                  <p className="mt-1 text-sm text-slate-500">{recommendation.summary}</p>
                  {requirement?.notes?.map((note) => <p key={note} className="mt-1 text-xs text-slate-500">{note}</p>)}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {recommendation.status === 'compatible' ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <ShieldAlert className="size-3.5 text-amber-600" />}
                  {recommendation.status === 'compatible' ? 'Verified enough data' : recommendation.status === 'unknown' ? 'Data may be incomplete' : 'Needs review'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendation.matchingProducts.length > 0 ? (
                recommendation.matchingProducts.map((product) => (
                  <div key={product.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={product.images?.[0] || 'https://placehold.co/160x160.png'} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{ghanaCurrency.format(product.price)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/product/${buildProductSlug(product)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">View <ArrowRight className="size-3.5" /></Link>
                      <Button size="sm" onClick={() => addToCart(product, addQuantity)} className="bg-[#d65a24] text-white hover:bg-[#b94e1d]">
                        <ShoppingCart className="mr-1.5 size-3.5" /> Add{addQuantity > 1 ? ` ×${addQuantity}` : ''}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No matching products are currently available in the catalog for this requirement.
                </div>
              )}
            </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#d65a24]/20 bg-[#fff7f3] p-4 text-sm text-slate-700">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Sparkles className="size-4 text-[#d65a24]" />
          Marketplace rule
        </div>
        <p className="mt-2 text-sm leading-6">
          This solution layer does not invent fake products or force a bundle. It matches against the real Agora marketplace catalog, then lets the buyer review and finalize the selected parts before adding them to the normal cart.
        </p>
      </div>
    </div>
  );
}
