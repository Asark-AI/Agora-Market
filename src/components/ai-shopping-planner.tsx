'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, ShoppingCart, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { editGroundedShoppingPlan, planGroundedShopping, refreshGroundedShoppingSelection, type GroundedShoppingPlan } from '@/lib/server/ai-shopping';
import { useCart } from '@/hooks/use-cart';
import type { ShoppingGoalInput } from '@/ai/flows/plan-shopping-goal';

const currency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

export function AiShoppingPlanner() {
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [brands, setBrands] = useState('');
  const [existingItems, setExistingItems] = useState('');
  const [mustHaves, setMustHaves] = useState('');
  const [result, setResult] = useState<GroundedShoppingPlan | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  const canSubmit = useMemo(() => goal.trim().length >= 10, [goal]);
  const selectedMatches = result?.matches.filter((match) => result.state.selectedProductIds.includes(match.product.id)) || [];

  const handlePlanEdit = async () => {
    if (!result || !editMessage.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      setResult(await editGroundedShoppingPlan(result.state, { message: editMessage }));
      setEditMessage('');
    } catch (cause) {
      console.error('Unable to refresh Agora shopping plan after an edit:', cause);
      setError(cause instanceof Error && cause.message.toLowerCase().includes('rate limited')
        ? cause.message
        : 'We could not update your plan from the latest catalog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelection = async (productId: string) => {
    if (!result || isLoading) return;
    setIsLoading(true);
    setError('');
    const selected = result.state.selectedProductIds.includes(productId);
    const nextIds = selected
      ? result.state.selectedProductIds.filter((id) => id !== productId)
      : [...result.state.selectedProductIds, productId];
    try {
      setResult(await refreshGroundedShoppingSelection(result.state, nextIds));
    } catch (cause) {
      console.error('Unable to refresh Agora catalog selection:', cause);
      setError(cause instanceof Error && cause.message.toLowerCase().includes('rate limited')
        ? cause.message
        : 'We could not validate the latest price and stock for your selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const payload: ShoppingGoalInput = {
        goal,
        budget: budget ? Number(budget) : undefined,
        preferredBrands: brands.split(',').map((brand) => brand.trim()).filter(Boolean),
        existingItems: existingItems.split(',').map((item) => item.trim()).filter(Boolean),
        mustHaveFeatures: mustHaves.split(',').map((feature) => feature.trim()).filter(Boolean),
      };
      setResult(await planGroundedShopping(payload));
    } catch (cause) {
      console.error('Unable to create a grounded Agora shopping plan:', cause);
      setError(cause instanceof Error && cause.message.toLowerCase().includes('rate limited')
        ? cause.message
        : 'We could not search the Agora catalog right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSelected = async () => {
    if (!result || !result.state.selectedProductIds.length || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const selectedIds = [...result.state.selectedProductIds];
      const refreshed = await refreshGroundedShoppingSelection(result.state, selectedIds);
      setResult(refreshed);
      if (
        refreshed.state.selectedProductIds.length !== selectedIds.length ||
        selectedIds.some((id) => !refreshed.state.selectedProductIds.includes(id))
      ) {
        setError('Some selected listings changed or are no longer available. Review the refreshed plan before adding items.');
        return;
      }
      const currentMatches = refreshed.matches.filter((match) => selectedIds.includes(match.product.id));
      if (currentMatches.length !== selectedIds.length) {
        setError('Some selected listings could not be refreshed. Review the plan before adding items.');
        return;
      }
      currentMatches.forEach((match) => addToCart(match.product));
    } catch (cause) {
      console.error('Unable to validate selected listings before adding to cart:', cause);
      setError(cause instanceof Error && cause.message.toLowerCase().includes('rate limited')
        ? cause.message
        : 'We could not validate the selected listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d65a24]">
            <Wand2 className="size-4" />
            Agora AI planner
          </div>
          <CardTitle className="mt-2 text-2xl font-bold text-slate-900">Tell Agora what you want to accomplish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="goal" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Goal</label>
            <Textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} className="min-h-[90px] border-slate-200" placeholder="I want to build a gaming PC for GH₵15,000." />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="budget" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Budget (GHS)</label>
              <Input id="budget" type="number" min="0" max="1000000" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="15000 (optional)" className="border-slate-200" />
            </div>
            <div>
              <label htmlFor="brands" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Preferred brands</label>
              <Input id="brands" value={brands} onChange={(event) => setBrands(event.target.value)} placeholder="NVIDIA, Logitech" className="border-slate-200" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="existing" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Already own</label>
              <Input id="existing" value={existingItems} onChange={(event) => setExistingItems(event.target.value)} placeholder="Monitor, keyboard, mouse" className="border-slate-200" />
            </div>
            <div>
              <label htmlFor="features" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Must-have features</label>
              <Input id="features" value={mustHaves} onChange={(event) => setMustHaves(event.target.value)} placeholder="Quiet build, SSD storage" className="border-slate-200" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => void handleSubmit()} disabled={!canSubmit || isLoading} className="bg-[#d65a24] text-white hover:bg-[#b94e1d]">
              {isLoading ? 'Searching catalog...' : 'Plan with Agora'}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d65a24]">Agora AI plan</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{result.plan.summary}</h3>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Recommendation</p>
              <p className="mt-2 text-sm text-slate-700">{result.plan.recommendation}</p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected total</p><p className="mt-1 font-semibold text-slate-900">{currency.format(result.state.total)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Maximum budget</p><p className="mt-1 font-semibold text-slate-900">{result.state.budget === undefined ? 'Not specified' : currency.format(result.state.budget)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget remaining</p><p className="mt-1 font-semibold text-slate-900">{result.state.remainingBudget === undefined ? 'Not calculated' : currency.format(result.state.remainingBudget)}</p></div>
              <p className="text-xs text-slate-500 sm:col-span-3">Goal retained: {result.state.originalGoal}{result.state.preferences.preferredBrands.length ? ` · Preferred brands: ${result.state.preferences.preferredBrands.join(', ')}` : ''}{result.state.existingItems.length ? ` · Already owned: ${result.state.existingItems.join(', ')}` : ''}</p>
            </div>
            {result.state.constraints.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Plan constraints">{result.state.constraints.map((constraint) => <li key={constraint} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">{constraint}</li>)}</ul>}
            {result.searchMayBeIncomplete && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The catalog search reached its current result limit. There may be additional matching listings.</p>}
            {result.selectionNotice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{result.selectionNotice}</p>}
            {result.matches.length > 0 ? (
              <section aria-labelledby="catalog-match-title">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h4 id="catalog-match-title" className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Current catalog matches</h4>
                    <p className="mt-1 text-xs text-slate-500">Live products from active Agora sellers. Checkout revalidates price and stock.</p>
                  </div>
                  {selectedMatches.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{selectedMatches.length} selected</p>
                      <p className="text-sm font-semibold text-slate-900">{currency.format(result.state.total)}</p>
                    </div>
                  )}
                </div>
                <ul className="mt-3 space-y-3">
                  {result.matches.map((match) => {
                    const selected = result.state.selectedProductIds.includes(match.product.id);
                    return (
                      <li key={match.product.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
                        <img src={match.product.images?.[0] || 'https://placehold.co/160x160.png'} alt="" className="size-16 rounded-xl border border-slate-200 object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{match.product.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{currency.format(match.currentPrice)} · {match.sellerName}</p>
                          <p className="mt-1 text-xs text-slate-500">Verified listing facts: {currency.format(match.currentPrice)} current price · {match.stock} in stock · {match.sellerVerified ? 'Agora-verified seller' : 'Seller verification not shown'}{match.sellerRegionName ? ` · Seller-listed region: ${match.sellerRegionName}` : ''}</p>
                          <p className="mt-1 text-xs text-slate-500">Why this product? {match.reason}</p>
                          {match.product.specifications?.length ? (
                            <p className="mt-1 text-xs text-slate-500">Seller-provided listing specs (unverified): {match.product.specifications.slice(0, 3).map((spec) => `${spec.name}: ${spec.value}`).join(' · ')}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-amber-800">Compatibility: {match.compatibility === 'unknown' ? 'Could not be verified from the available product information.' : match.compatibility} · Delivery: {match.deliveryAvailability === 'unknown' ? 'Availability could not be verified.' : match.deliveryAvailability}</p>
                        </div>
                        <Button type="button" variant={selected ? 'secondary' : 'outline'} disabled={isLoading} onClick={() => void handleSelection(match.product.id)}>
                          {selected ? <Check className="mr-2 size-4" /> : null}{isLoading ? 'Checking...' : selected ? 'Selected' : 'Select'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex justify-end">
                  <Button type="button" disabled={!selectedMatches.length || isLoading} onClick={() => void handleAddSelected()} className="bg-[#d65a24] text-white hover:bg-[#b94e1d]">
                    <ShoppingCart className="mr-2 size-4" /> Add selected to cart
                  </Button>
                </div>
              </section>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No relevant in-stock products were found for this goal. We have not invented substitutes or prices.</p>
            )}
            {result.plan.followUpQuestions.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Questions to refine the plan</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.plan.followUpQuestions.map((question) => <li key={question}>{question}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label htmlFor="plan-edit" className="mb-2 block text-sm font-semibold text-slate-900">Refine this plan</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="plan-edit" value={editMessage} onChange={(event) => setEditMessage(event.target.value)} maxLength={500} placeholder="Make it cheaper, remove the monitor, or use verified sellers" disabled={isLoading} />
                <Button type="button" onClick={() => void handlePlanEdit()} disabled={!editMessage.trim() || isLoading} className="bg-[#d65a24] text-white hover:bg-[#b94e1d]">{isLoading ? 'Refreshing...' : 'Update plan'}</Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Edits refresh catalog matches. Delivery destinations and product compatibility are not claimed unless Agora has verified data.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!result && !isLoading && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-medium text-slate-700"><Sparkles className="size-4 text-[#d65a24]" /> Start with a product goal, budget, and any existing gear you already own.</div>
        </div>
      )}
    </div>
  );
}
