'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ShoppingCart, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { editGroundedShoppingPlan, planGroundedShopping, refreshGroundedShoppingSelection, type GroundedShoppingPlan } from '@/lib/server/ai-shopping';
import { useCart } from '@/hooks/use-cart';
import type { ShoppingGoalInput } from '@/ai/flows/plan-shopping-goal';
import { findSolutionIntentMatches, type SolutionIntentSource } from '@/lib/solutions';
const currency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

export function AiShoppingPlanner({ solutions = [] }: { solutions?: SolutionIntentSource[] }) {
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [brands, setBrands] = useState('');
  const [existingItems, setExistingItems] = useState('');
  const [mustHaves, setMustHaves] = useState('');
  const [result, setResult] = useState<GroundedShoppingPlan | null>(null);
  const [conversation, setConversation] = useState<Array<{ role: 'buyer' | 'assistant'; text: string }>>([]);
  const [editMessage, setEditMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  const canSubmit = useMemo(() => goal.trim().length >= 10, [goal]);
  const selectedMatches = result?.matches.filter((match) => result.state.selectedProductIds.includes(match.product.id)) || [];
  const suggestedSolutions = useMemo(() => findSolutionIntentMatches(goal, solutions), [goal, solutions]);

  const handlePlanEdit = async () => {
    if (!result || !editMessage.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const message = editMessage.trim();
      const updated = await editGroundedShoppingPlan(result.state, { message });
      setResult(updated);
      setConversation((current) => [...current, { role: 'buyer', text: message }, { role: 'assistant', text: updated.plan.recommendation }]);
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
    setConversation([]);
    try {
      const payload: ShoppingGoalInput = {
        goal,
        budget: budget ? Number(budget) : undefined,
        preferredBrands: brands.split(',').map((brand) => brand.trim()).filter(Boolean),
        existingItems: existingItems.split(',').map((item) => item.trim()).filter(Boolean),
        mustHaveFeatures: mustHaves.split(',').map((feature) => feature.trim()).filter(Boolean),
      };
      const planned = await planGroundedShopping(payload);
      setResult(planned);
      setConversation([
        { role: 'buyer', text: goal.trim() },
        { role: 'assistant', text: planned.plan.recommendation },
      ]);
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
      <Card className="border-[#292f35] bg-[#171B1F] text-white shadow-[0_18px_52px_-36px_rgba(0,0,0,0.8)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F0C75E]">
            <Wand2 className="size-4" />
            Agora AI planner
          </div>
          <CardTitle className="mt-2 text-2xl font-bold text-white">Tell Agora what you want to accomplish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="goal" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9299A1]">Your shopping goal</label>
            <Textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} className="min-h-[90px] border-[#424a52] bg-[#111416] text-white placeholder:text-[#777f88]" placeholder="I want to build a gaming PC for GH₵15,000." />
          </div>
          <details className="rounded-2xl border border-[#292f35] bg-[#111416] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#B7BCC3]">Add preferences (optional)</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="budget" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9299A1]">Budget (GHS)</label>
              <Input id="budget" type="number" min="0" max="1000000" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="15000 (optional)" className="border-[#424a52] bg-[#171B1F] text-white placeholder:text-[#777f88]" />
            </div>
            <div>
              <label htmlFor="brands" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9299A1]">Preferred brands</label>
              <Input id="brands" value={brands} onChange={(event) => setBrands(event.target.value)} placeholder="NVIDIA, Logitech" className="border-[#424a52] bg-[#171B1F] text-white placeholder:text-[#777f88]" />
            </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="existing" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9299A1]">Already own</label>
              <Input id="existing" value={existingItems} onChange={(event) => setExistingItems(event.target.value)} placeholder="Monitor, keyboard, mouse" className="border-[#424a52] bg-[#171B1F] text-white placeholder:text-[#777f88]" />
            </div>
            <div>
              <label htmlFor="features" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9299A1]">Must-have features</label>
              <Input id="features" value={mustHaves} onChange={(event) => setMustHaves(event.target.value)} placeholder="Quiet build, SSD storage" className="border-[#424a52] bg-[#171B1F] text-white placeholder:text-[#777f88]" />
            </div>
            </div>
          </details>
          <div className="flex justify-end">
            <Button onClick={() => void handleSubmit()} disabled={!canSubmit || isLoading} className="bg-[#D4A72C] text-[#101316] hover:bg-[#F0C75E]">
              {isLoading ? 'Searching catalog...' : 'Ask Agora'}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
          {suggestedSolutions.length > 0 && (
            <div className="rounded-2xl border border-[#D4A72C]/25 bg-[#111416] p-4">
              <p className="text-sm font-semibold text-white">Building a larger setup?</p>
              <p className="mt-1 text-xs text-[#9299A1]">Start from a reusable solution template and choose the items you need.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedSolutions.map((solution) => (
                  <Link key={solution.slug} href={`/solutions/${solution.slug}`} className="inline-flex items-center gap-2 rounded-full border border-[#555d65] px-3 py-2 text-xs font-semibold text-[#F0C75E] hover:bg-[#292D31]">
                    Build {solution.name}<ArrowRight className="size-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-[#292f35] bg-[#171B1F] text-white shadow-[0_18px_52px_-36px_rgba(0,0,0,0.8)]">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F0C75E]">Agora AI plan</p>
              <h3 className="mt-2 text-xl font-bold text-white">{result.plan.summary}</h3>
            </div>
            <div className="space-y-3 rounded-2xl border border-[#292f35] bg-[#111416] p-4">
              <p className="text-sm font-semibold text-white">Shopping conversation</p>
              {conversation.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'buyer' ? 'ml-auto bg-[#292D31] text-white' : 'bg-[#1c2226] text-[#D4D8DC]'}`}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#F0C75E]">{message.role === 'buyer' ? 'You' : 'Agora AI'}</p>
                  {message.text}
                </div>
              ))}
            </div>
            <div className="grid gap-3 rounded-2xl border border-[#292f35] bg-[#111416] p-4 sm:grid-cols-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9299A1]">Selected total</p><p className="mt-1 font-semibold text-white">{currency.format(result.state.total)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9299A1]">Maximum budget</p><p className="mt-1 font-semibold text-white">{result.state.budget === undefined ? 'Not specified' : currency.format(result.state.budget)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9299A1]">Budget remaining</p><p className="mt-1 font-semibold text-white">{result.state.remainingBudget === undefined ? 'Not calculated' : currency.format(result.state.remainingBudget)}</p></div>
              <p className="text-xs text-[#9299A1] sm:col-span-3">Goal retained: {result.state.originalGoal}{result.state.preferences.preferredBrands.length ? ` · Preferred brands: ${result.state.preferences.preferredBrands.join(', ')}` : ''}{result.state.existingItems.length ? ` · Already owned: ${result.state.existingItems.join(', ')}` : ''}</p>
            </div>
            {result.state.constraints.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Plan constraints">{result.state.constraints.map((constraint) => <li key={constraint} className="rounded-full border border-[#424a52] bg-[#111416] px-3 py-1 text-xs text-[#B7BCC3]">{constraint}</li>)}</ul>}
            {result.searchMayBeIncomplete && <p role="status" className="rounded-xl border border-amber-700/50 bg-amber-950/40 p-3 text-sm text-amber-100">The catalog search reached its current result limit. There may be additional matching listings.</p>}
            {result.selectionNotice && <p role="status" className="rounded-xl border border-amber-700/50 bg-amber-950/40 p-3 text-sm text-amber-100">{result.selectionNotice}</p>}
            {result.matches.length > 0 ? (
              <section aria-labelledby="catalog-match-title">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h4 id="catalog-match-title" className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9299A1]">Current catalog matches</h4>
                    <p className="mt-1 text-xs text-[#9299A1]">Live products from active Agora sellers. Checkout revalidates price and stock.</p>
                  </div>
                  {selectedMatches.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-[#9299A1]">{selectedMatches.length} selected</p>
                      <p className="text-sm font-semibold text-white">{currency.format(result.state.total)}</p>
                    </div>
                  )}
                </div>
                <ul className="mt-3 space-y-3">
                  {result.matches.map((match) => {
                    const selected = result.state.selectedProductIds.includes(match.product.id);
                    return (
                      <li key={match.product.id} className="flex flex-col gap-3 rounded-2xl border border-[#292f35] bg-[#111416] p-3 sm:flex-row sm:items-center">
                        <img src={match.product.images?.[0] || 'https://placehold.co/160x160.png'} alt="" className="size-16 rounded-xl border border-[#292f35] object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white">{match.product.name}</p>
                          <p className="mt-1 text-sm text-[#D4D8DC]">{currency.format(match.currentPrice)} · {match.sellerName}</p>
                          <p className="mt-1 text-xs text-[#9299A1]">Verified listing facts: {currency.format(match.currentPrice)} current price · {match.stock} in stock · {match.sellerVerified ? 'Agora-verified seller' : 'Seller verification not shown'}{match.sellerRegionName ? ` · Seller-listed region: ${match.sellerRegionName}` : ''}</p>
                          <p className="mt-1 text-xs text-[#9299A1]">Why this product? {match.reason}</p>
                          {match.product.specifications?.length ? (
                            <p className="mt-1 text-xs text-[#9299A1]">Seller-provided listing specs (unverified): {match.product.specifications.slice(0, 3).map((spec) => `${spec.name}: ${spec.value}`).join(' · ')}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-amber-200">Compatibility: {match.compatibility === 'unknown' ? 'Could not be verified from the available product information.' : match.compatibility} · Delivery: {match.deliveryAvailability === 'unknown' ? 'Availability could not be verified.' : match.deliveryAvailability}</p>
                        </div>
                        <Button type="button" variant={selected ? 'secondary' : 'outline'} disabled={isLoading} onClick={() => void handleSelection(match.product.id)}>
                          {selected ? <Check className="mr-2 size-4" /> : null}{isLoading ? 'Checking...' : selected ? 'Selected' : 'Select'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex justify-end">
                  <Button type="button" disabled={!selectedMatches.length || isLoading} onClick={() => void handleAddSelected()} className="bg-[#D4A72C] text-[#101316] hover:bg-[#F0C75E]">
                    <ShoppingCart className="mr-2 size-4" /> Add selected to cart
                  </Button>
                </div>
              </section>
            ) : (
              <p className="rounded-xl border border-dashed border-[#424a52] bg-[#111416] p-4 text-sm text-[#B7BCC3]">No relevant in-stock products were found for this goal. We have not invented substitutes or prices.</p>
            )}
            {result.plan.followUpQuestions.length > 0 && (
              <div className="rounded-2xl border border-[#292f35] bg-[#111416] p-4">
                <p className="text-sm font-semibold text-white">Questions to refine the plan</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#D4D8DC]">
                  {result.plan.followUpQuestions.map((question) => <li key={question}>{question}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-2xl border border-[#292f35] bg-[#111416] p-4">
              <label htmlFor="plan-edit" className="mb-2 block text-sm font-semibold text-white">Refine this plan</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="plan-edit" value={editMessage} onChange={(event) => setEditMessage(event.target.value)} maxLength={500} placeholder="Make it cheaper, remove the monitor, or use verified sellers" disabled={isLoading} className="border-[#424a52] bg-[#171B1F] text-white placeholder:text-[#777f88]" />
                <Button type="button" onClick={() => void handlePlanEdit()} disabled={!editMessage.trim() || isLoading} className="bg-[#D4A72C] text-[#101316] hover:bg-[#F0C75E]">{isLoading ? 'Refreshing...' : 'Update plan'}</Button>
              </div>
              <p className="mt-2 text-xs text-[#9299A1]">Edits refresh catalog matches. Delivery destinations and product compatibility are not claimed unless Agora has verified data.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!result && !isLoading && (
        <div className="rounded-2xl border border-dashed border-[#424a52] bg-[#171B1F] p-6 text-sm text-[#B7BCC3]">
          <div className="flex items-center gap-2 font-medium text-white"><Sparkles className="size-4 text-[#F0C75E]" /> Start with a product goal, budget, and any existing gear you already own.</div>
        </div>
      )}
    </div>
  );
}
