'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { Camera, LoaderCircle, Search, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { buildProductSlug, getImageUrl } from '@/lib/storefront';
import { isVisualSearchImageType, VISUAL_SEARCH_MAX_BYTES } from '@/lib/visual-search';
import { refreshGroundedShoppingSelection } from '@/lib/server/ai-shopping';
import type { ShoppingPlanState } from '@/lib/ai-shopping-state';
import type { CatalogCartProduct } from '@/lib/types';

type VisualMatch = {
  product: CatalogCartProduct;
  sellerName: string;
  currentPrice: number;
  stock: number;
  reason: string;
};

type VisualResult = {
  analysis: {
    productType: string;
    brandOrModel: string | null;
    visibleText: string[];
    appearance: string;
    searchTerms: string[];
  };
  shopping: {
    plan: { summary: string; recommendation: string };
    state: ShoppingPlanState;
    matches: VisualMatch[];
    searchMayBeIncomplete: boolean;
  };
};

function isVisualResult(value: unknown): value is VisualResult {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<VisualResult>;
  return Boolean(
    data.analysis
    && typeof data.analysis.productType === 'string'
    && Array.isArray(data.analysis.searchTerms)
    && data.shopping
    && data.shopping.plan
    && typeof data.shopping.plan.summary === 'string'
    && data.shopping.state
    && Array.isArray(data.shopping.state.selectedProductIds)
    && Array.isArray(data.shopping.matches)
  );
}

export function VisualProductSearch() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState<VisualResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState('');
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const setSelectedFile = (selectedFile: File | null) => {
    setFile(selectedFile);
    setResult(null);
    setError(selectedFile && !isVisualSearchImageType(selectedFile.type)
      ? 'Upload a JPEG, PNG, or WebP image.'
      : selectedFile && selectedFile.size > VISUAL_SEARCH_MAX_BYTES
        ? 'Choose an image smaller than 4 MB.'
        : '');
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    event.currentTarget.value = '';
    if (!selectedFile) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(selectedFile);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || isLoading) return;
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/search/visual', { method: 'POST', body: formData });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'Visual search could not complete. Please try again.';
        throw new Error(message);
      }
      if (!isVisualResult(payload)) {
        throw new Error('Visual search returned an invalid response. Please try again.');
      }
      setResult(payload);
    } catch (cause) {
      console.error('Unable to search Agora products by image:', cause);
      setError(cause instanceof Error ? cause.message : 'Visual search could not complete. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (match: VisualMatch) => {
    if (!result || addingProductId) return;
    setAddingProductId(match.product.id);
    setError('');
    try {
      const refreshed = await refreshGroundedShoppingSelection(result.shopping.state, [match.product.id]);
      const currentMatch = refreshed.matches.find((candidate) => candidate.product.id === match.product.id);
      if (!currentMatch || !refreshed.state.selectedProductIds.includes(match.product.id)) {
        throw new Error('This listing is no longer available. Run the visual search again to refresh results.');
      }
      addToCart(currentMatch.product);
      setResult((current) => current ? {
        ...current,
        shopping: {
          ...current.shopping,
          state: refreshed.state,
          matches: refreshed.matches,
        },
      } : current);
    } catch (cause) {
      console.error('Unable to refresh visual search listing before adding to cart:', cause);
      setError(cause instanceof Error ? cause.message : 'We could not validate this listing. Please try again.');
    } finally {
      setAddingProductId('');
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-[#292f35] bg-[#171B1F] text-white shadow-[0_18px_52px_-36px_rgba(0,0,0,0.8)]">
        <CardHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F0C75E]">
            <Camera className="size-4" />
            Visual product search
          </div>
          <CardTitle className="text-xl text-white sm:text-2xl">Find products that look like your photo</CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-[#B7BCC3]">
            Upload a product image and we’ll identify its visible features, then search active Agora listings. Your image is sent to Google AI for analysis and is not saved by Agora.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="visual-search-image" className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#555d65] bg-[#111416] p-5 text-center transition hover:border-[#D4A72C]">
              {previewUrl ? (
                <img src={previewUrl} alt="Selected product image preview" className="max-h-56 max-w-full rounded-xl object-contain" />
              ) : (
                <>
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#292D31] text-[#F0C75E]"><Upload className="size-5" /></span>
                  <span className="text-sm font-semibold text-white">Choose a product photo</span>
                  <span className="text-xs text-[#9299A1]">JPEG, PNG or WebP · up to 4 MB</span>
                </>
              )}
            </label>
            <input
              id="visual-search-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#9299A1]">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Images are processed in memory for this search.'}</p>
              <div className="flex flex-wrap gap-2">
                {file && (
                  <Button type="button" variant="outline" onClick={() => setSelectedFile(null)} className="border-[#555d65] text-white hover:bg-[#292D31]">
                    <X className="mr-2 size-4" />Remove image
                  </Button>
                )}
                <label htmlFor="visual-search-camera" className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-[#555d65] px-4 py-2 text-sm font-medium text-white hover:bg-[#292D31]">
                  <Camera className="mr-2 size-4" />Take photo
                </label>
                <input id="visual-search-camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleFileChange} className="sr-only" />
                <Button type="submit" disabled={!file || file.size > VISUAL_SEARCH_MAX_BYTES || !isVisualSearchImageType(file.type) || isLoading} className="bg-[#D4A72C] text-[#101316] hover:bg-[#F0C75E]">
                  {isLoading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
                  {isLoading ? 'Searching Agora…' : 'Search by image'}
                </Button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {result && (
        <section className="space-y-4" aria-live="polite">
          <div className="rounded-2xl border border-[#292f35] bg-[#171B1F] p-4">
            <h2 className="font-semibold text-white">What we found in the image</h2>
            <p className="mt-1 text-sm text-[#B7BCC3]">{result.analysis.productType}{result.analysis.brandOrModel ? ` · ${result.analysis.brandOrModel}` : ''} · {result.analysis.appearance}</p>
            <p className="mt-2 text-xs text-[#9299A1]">Visual similarity is an estimate. Check each listing’s details before buying.</p>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-white">Agora listings</h2>
                <p className="mt-1 text-sm text-[#B7BCC3]">{result.shopping.plan.summary}</p>
              </div>
              {result.shopping.searchMayBeIncomplete && <span className="rounded-full bg-[#292D31] px-3 py-1 text-xs text-[#F0C75E]">Search limited to available results</span>}
            </div>
            {result.shopping.matches.length ? (
              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {result.shopping.matches.map((match) => (
                  <article key={match.product.id} className="min-w-0 overflow-hidden rounded-2xl border border-[#292f35] bg-[#171B1F]">
                    <Link href={`/product/${buildProductSlug(match.product)}`} className="block aspect-square bg-[#101316]">
                      <img src={getImageUrl(match.product.images?.[0])} alt={match.product.name} className="size-full object-cover" />
                    </Link>
                    <div className="space-y-2 p-3">
                      <Link href={`/product/${buildProductSlug(match.product)}`} className="line-clamp-2 text-sm font-semibold text-white hover:text-[#F0C75E]">{match.product.name}</Link>
                      <p className="text-xs text-[#B7BCC3]">{match.sellerName}</p>
                      <p className="text-sm font-bold text-[#F0C75E]">{new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(match.currentPrice)}</p>
                      <p className="text-xs text-[#9299A1]">Visually similar · {match.stock} in stock · {match.reason}</p>
                      <Button type="button" variant="outline" className="w-full border-[#555d65] text-white hover:bg-[#292D31]" disabled={Boolean(addingProductId)} onClick={() => void handleAddToCart(match)}>
                        {addingProductId === match.product.id ? 'Checking listing…' : 'Add to cart'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[#555d65] p-5 text-sm text-[#B7BCC3]">{result.shopping.plan.recommendation}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
