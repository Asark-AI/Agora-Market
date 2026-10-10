'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Check, Minus, Plus, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { buildProductSlug } from '@/lib/storefront';
import { evaluateCompatibility, getSolutionRecommendations, type SolutionDefinition } from '@/lib/solutions';
import type { Product } from '@/lib/types';
import { refreshPublicSolutionProducts } from '@/lib/server/solutions';

const ghanaCurrency = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

function priceOf(product: Product) {
  return product.discountPrice != null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;
}

function compatibilityLabel(status: ReturnType<typeof evaluateCompatibility>) {
  if (status === 'compatible') return 'Compatible based on listed specs';
  if (status === 'incompatible') return 'Incompatible based on listed specs';
  return 'Compatibility unknown';
}

export function SolutionBuilderClient({ solution, products }: { solution: SolutionDefinition; products: Product[] }) {
  const { addToCart } = useCart();
  const [selectedByRequirement, setSelectedByRequirement] = useState<Record<string, string>>(() => {
    const recommendations = getSolutionRecommendations(products, solution);
    return Object.fromEntries(recommendations.flatMap((recommendation) => {
      const requirement = solution.requirements.find((item) => item.id === recommendation.requirementId);
      const product = recommendation.matchingProducts[0];
      return requirement?.required && product ? [[requirement.id, product.id]] : [];
    }));
  });
  const [ownedRequirementIds, setOwnedRequirementIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(
    solution.requirements.map((requirement) => [requirement.id, Math.max(1, requirement.quantity)])
  ));
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const recommendations = useMemo(() => getSolutionRecommendations(products, solution), [products, solution]);
  const productsByRequirement = useMemo(() => Object.fromEntries(
    solution.requirements.map((requirement) => [
      requirement.id,
      recommendations.find((recommendation) => recommendation.requirementId === requirement.id)?.matchingProducts || [],
    ])
  ), [recommendations, solution.requirements]);
  const selectedProducts = useMemo(() => Object.fromEntries(
    solution.requirements.flatMap((requirement) => {
      const product = productsByRequirement[requirement.id]?.find((candidate) => candidate.id === selectedByRequirement[requirement.id]);
      return product ? [[requirement.id, product]] : [];
    })
  ), [productsByRequirement, selectedByRequirement, solution.requirements]);
  const selectedProductList = Object.values(selectedProducts);
  const requiredGaps = solution.requirements.filter((requirement) =>
    requirement.required
    && !ownedRequirementIds.includes(requirement.id)
    && !selectedProducts[requirement.id]
  );
  const selectedItems = solution.requirements.flatMap((requirement) => {
    const product = selectedProducts[requirement.id];
    if (!product || ownedRequirementIds.includes(requirement.id)) return [];
    const quantity = quantities[requirement.id] || 1;
    return [{ requirementId: requirement.id, product, quantity: Math.min(quantity, product.stock) }];
  });
  const subtotal = selectedItems.reduce((total, item) => total + priceOf(item.product) * item.quantity, 0);
  const incompatibleSelections = selectedItems.filter(({ requirementId, product }) =>
    evaluateCompatibility(product, requirementId, selectedProductList, selectedProducts) === 'incompatible'
  );
  const compatibilityIsUnknown = selectedItems.some(({ requirementId, product }) =>
    evaluateCompatibility(product, requirementId, selectedProductList, selectedProducts) === 'unknown'
  );

  const toggleProduct = (requirementId: string, productId: string) => {
    setSelectedByRequirement((current) => ({
      ...current,
      [requirementId]: current[requirementId] === productId ? '' : productId,
    }));
    setError('');
  };

  const toggleOwned = (requirementId: string) => {
    setOwnedRequirementIds((current) => current.includes(requirementId)
      ? current.filter((id) => id !== requirementId)
      : [...current, requirementId]);
    setError('');
  };

  const changeQuantity = (requirementId: string, delta: number) => {
    const requirement = solution.requirements.find((item) => item.id === requirementId);
    if (!requirement) return;
    const minimum = Math.max(1, requirement.minQuantity);
    const maximum = Math.min(requirement.maxQuantity ?? 99, selectedProducts[requirementId]?.stock ?? 99);
    setQuantities((current) => ({
      ...current,
      [requirementId]: Math.min(maximum, Math.max(minimum, (current[requirementId] || requirement.quantity || 1) + delta)),
    }));
  };

  const addSolutionToCart = async () => {
    if (!selectedItems.length || isAdding) return;
    setIsAdding(true);
    setError('');
    try {
      const currentProducts = await refreshPublicSolutionProducts(selectedItems.map(({ product }) => ({
        sellerId: product.sellerId,
        productId: product.id,
      })));
      const productKey = (product: Pick<Product, 'sellerId' | 'id'>) => JSON.stringify([product.sellerId, product.id]);
      const productsById = new Map(currentProducts.map((product) => [productKey(product), product]));
      const unavailable = selectedItems.filter(({ product }) => !productsById.has(productKey(product)));
      if (unavailable.length) {
        throw new Error('Some selected listings have changed or are no longer available. Review your solution and try again.');
      }
      const insufficientStock = selectedItems.filter(({ product, quantity }) => {
        const currentProduct = productsById.get(productKey(product));
        return currentProduct && quantity > currentProduct.stock;
      });
      if (insufficientStock.length) {
        throw new Error('Some selected quantities exceed current stock. Adjust your solution and try again.');
      }
      selectedItems.forEach(({ product, quantity }) => {
        const currentProduct = productsById.get(productKey(product));
        if (currentProduct) addToCart(currentProduct, quantity);
      });
    } catch (cause) {
      console.error('Unable to refresh solution listings before adding to cart:', cause);
      setError(cause instanceof Error ? cause.message : 'We could not refresh the selected listings. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[#292f35] bg-[#171B1F] text-white shadow-[0_18px_52px_-36px_rgba(0,0,0,0.8)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F0C75E]">Goal-based shopping</p>
              <h1 className="mt-2 font-headline text-3xl font-bold text-white">{solution.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#B7BCC3]">{solution.description}</p>
            </div>
            <div className="rounded-2xl border border-[#D4A72C]/30 bg-[#111416] px-4 py-3 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9299A1]">Selected product subtotal</p>
              <p className="mt-2 font-headline text-2xl font-bold text-[#F0C75E]">{ghanaCurrency.format(subtotal)}</p>
              <p className="mt-1 text-xs text-[#9299A1]">Current listing prices · delivery excluded</p>
            </div>
          </div>
          {solution.budgetHint !== undefined && <p className="mt-4 text-xs text-[#9299A1]">Template budget guide: {ghanaCurrency.format(solution.budgetHint)}. Your selections may differ.</p>}
        </CardContent>
      </Card>

      <section aria-labelledby="solution-requirements-heading" className="space-y-4">
        <div>
          <h2 id="solution-requirements-heading" className="text-lg font-semibold text-white">Choose your components</h2>
          <p className="mt-1 text-sm text-[#B7BCC3]">Select a listing for each requirement, replace it any time, or mark an item you already own. Add the whole selection or just the parts you want.</p>
        </div>

        {solution.requirements.map((requirement) => {
          const matches = productsByRequirement[requirement.id] || [];
          const selectedId = selectedByRequirement[requirement.id];
          const selectedProduct = selectedProducts[requirement.id];
          const owned = ownedRequirementIds.includes(requirement.id);
          const quantity = quantities[requirement.id] || Math.max(1, requirement.quantity);
          const minimum = Math.max(1, requirement.minQuantity);
          const maximum = requirement.maxQuantity ?? 99;
          const selectedCompatibility = selectedProduct
            ? evaluateCompatibility(selectedProduct, requirement.id, selectedProductList, selectedProducts)
            : 'unknown';

          return (
            <Card key={requirement.id} className="border-[#292f35] bg-[#171B1F] text-white">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg text-white">{requirement.name}</CardTitle>
                      <span className="rounded-full border border-[#424a52] bg-[#111416] px-2 py-0.5 text-[11px] capitalize text-[#B7BCC3]">{requirement.type}</span>
                      {requirement.required && <span className="text-xs font-medium text-[#F0C75E]">Required</span>}
                    </div>
                    <p className="mt-1 text-sm text-[#B7BCC3]">{requirement.description}</p>
                    <p className="mt-1 text-xs text-[#9299A1]">Minimum {requirement.minQuantity} · Suggested {requirement.quantity}{requirement.maxQuantity ? ` · Maximum ${requirement.maxQuantity}` : ''}</p>
                    {requirement.notes?.map((note) => <p key={note} className="mt-1 text-xs text-[#9299A1]">{note}</p>)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={owned}
                    onClick={() => toggleOwned(requirement.id)}
                    className={`shrink-0 border-[#555d65] ${owned ? 'bg-[#292D31] text-[#F0C75E]' : 'text-white hover:bg-[#292D31]'}`}
                  >
                    {owned ? <Check className="mr-2 size-4" /> : null}
                    {owned ? 'Already owned' : 'I already own this'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {matches.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {matches.map((product) => {
                      const selected = selectedId === product.id;
                      const compatibility = evaluateCompatibility(product, requirement.id, selectedProductList, selectedProducts);
                      return (
                        <article key={product.id} className={`min-w-0 rounded-2xl border p-3 ${selected ? 'border-[#D4A72C]/70 bg-[#292D31]' : 'border-[#292f35] bg-[#111416]'}`}>
                          <div className="flex items-start gap-3">
                            <img src={product.images?.[0] || 'https://placehold.co/160x160.png'} alt="" className="size-16 shrink-0 rounded-xl border border-[#292f35] object-cover" />
                            <div className="min-w-0 flex-1">
                              <Link href={`/product/${buildProductSlug(product)}`} className="line-clamp-2 text-sm font-semibold text-white hover:text-[#F0C75E]">{product.name}</Link>
                              <p className="mt-1 text-sm font-bold text-[#F0C75E]">{ghanaCurrency.format(priceOf(product))}</p>
                              <p className="mt-1 text-xs text-[#9299A1]">{product.stock} available</p>
                            </div>
                          </div>
                          <p className={`mt-3 text-xs ${compatibility === 'compatible' ? 'text-emerald-300' : compatibility === 'incompatible' ? 'text-red-300' : 'text-amber-200'}`}>
                            {compatibilityLabel(compatibility)}
                          </p>
                          {product.specifications?.length ? (
                            <p className="mt-1 line-clamp-2 text-xs text-[#9299A1]">
                              Listing specs (seller-provided): {product.specifications.slice(0, 3).map(({ name, value }) => `${name}: ${value}`).join(' · ')}
                            </p>
                          ) : <p className="mt-1 text-xs text-[#9299A1]">No technical specifications listed.</p>}
                          <Button
                            type="button"
                            variant={selected ? 'secondary' : 'outline'}
                            aria-pressed={selected}
                            disabled={owned}
                            onClick={() => {
                              toggleProduct(requirement.id, product.id);
                              if (!selected && quantity > product.stock) {
                                setQuantities((current) => ({ ...current, [requirement.id]: Math.max(1, product.stock) }));
                              }
                            }}
                            className="mt-3 w-full border-[#555d65] text-white hover:bg-[#292D31]"
                          >
                            {selected ? <Check className="mr-2 size-4" /> : null}
                            {selected ? 'Selected · click to remove' : 'Choose this product'}
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[#555d65] p-4 text-sm text-[#B7BCC3]">No active, in-stock listing matches this requirement right now.</p>
                )}
                {selectedProduct && !owned && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#292f35] bg-[#111416] p-3">
                    <p className="text-sm text-[#D4D8DC]">Selected: {selectedProduct.name} · {compatibilityLabel(selectedCompatibility)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9299A1]">Quantity</span>
                      <Button type="button" variant="outline" size="icon" aria-label={`Decrease ${requirement.name} quantity`} disabled={quantity <= minimum} onClick={() => changeQuantity(requirement.id, -1)} className="size-8 border-[#555d65] text-white"><Minus className="size-3.5" /></Button>
                      <span aria-live="polite" className="min-w-6 text-center text-sm text-white">{quantity}</span>
                      <Button type="button" variant="outline" size="icon" aria-label={`Increase ${requirement.name} quantity`} disabled={quantity >= maximum} onClick={() => changeQuantity(requirement.id, 1)} className="size-8 border-[#555d65] text-white"><Plus className="size-3.5" /></Button>
                      <span className="sr-only">Stock available: {selectedProduct.stock}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-[#292f35] bg-[#171B1F] text-white">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">{selectedItems.length} product type{selectedItems.length === 1 ? '' : 's'} selected · subtotal {ghanaCurrency.format(subtotal)}</p>
            {requiredGaps.length > 0 && <p className="mt-1 text-sm text-amber-200">Still missing: {requiredGaps.map((requirement) => requirement.name).join(', ')}. You can still add this partial selection.</p>}
            {incompatibleSelections.length > 0 && <p role="alert" className="mt-1 text-sm text-red-300">At least one selected pair conflicts with listed technical specifications. Review those items before continuing.</p>}
            {!incompatibleSelections.length && compatibilityIsUnknown && <p className="mt-1 text-sm text-amber-200">Compatibility could not be verified for every selected item. Review the technical specifications before continuing.</p>}
            {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
          </div>
          <Button type="button" disabled={!selectedItems.length || isAdding} onClick={() => void addSolutionToCart()} className="shrink-0 bg-[#D4A72C] text-[#101316] hover:bg-[#F0C75E]">
            <ShoppingCart className="mr-2 size-4" />{isAdding ? 'Refreshing selections…' : 'Add selected items to cart'}
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-[#D4A72C]/20 bg-[#171B1F] p-4 text-sm text-[#B7BCC3]">
        <div className="flex items-center gap-2 font-semibold text-white"><Sparkles className="size-4 text-[#F0C75E]" /> Marketplace rule</div>
        <p className="mt-2 leading-6">Recommendations use real active, in-stock Agora listings. Compatibility is marked compatible or incompatible only when the relevant seller-provided specifications can be compared; otherwise it remains unknown. Checkout rechecks listing price and stock.</p>
        <Link href="/search" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#F0C75E] hover:underline">Return to product search <ArrowRight className="size-4" /></Link>
      </div>
    </div>
  );
}
