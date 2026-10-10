'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Camera, Heart, Search, ShoppingBag, Sparkles, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';

const navLinks = [
  { href: '/search', label: 'Explore' },
  { href: '/categories', label: 'Categories' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/profile?tab=orders', label: 'Orders' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const cartItemCount = useCart((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const hasWishlistItems = useWishlist((state) => state.items.length > 0);
  const supportsPageSearch = ['/search', '/products', '/categories', '/flash-deals'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const selectedSearchCategory = pathname === '/search' ? searchParams.get('category') : null;
  const isVisualSearch = pathname === '/search' && searchParams.get('mode') === 'visual';
  const isAiSearch = pathname === '/search' && searchParams.get('mode') === 'ai';
  const searchAction = supportsPageSearch ? pathname : '/search';
  const searchPlaceholder = pathname.startsWith('/products')
    ? 'Search products, brands, categories...'
    : pathname.startsWith('/categories')
      ? 'Search departments or categories'
      : pathname.startsWith('/flash-deals')
        ? 'Search deals'
        : 'Search products, sellers, and deals';
  const updateSearchMode = (nextMode: 'visual' | 'ai') => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedSearchCategory) params.set('category', selectedSearchCategory);
    const activeMode = isVisualSearch ? 'visual' : isAiSearch ? 'ai' : null;
    if (activeMode !== nextMode) params.set('mode', nextMode);
    const query = params.toString();
    window.history.pushState(null, '', `/search${query ? `?${query}` : ''}`);
  };

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0D0F]/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-[60px] max-w-7xl flex-wrap items-center gap-3 px-4 py-2 sm:px-6 md:min-h-[68px] md:flex-nowrap">
        <form action={searchAction} className="order-last basis-full md:order-none md:block md:min-w-0 md:flex-1 md:basis-auto">
          {selectedSearchCategory && <input type="hidden" name="category" value={selectedSearchCategory} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#858B94] md:left-4 md:text-[#B7BCC3]" />
            <Input
              name="q"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-11 w-full rounded-xl border border-[#2a2f34] bg-[#14171A] pl-10 pr-[5.25rem] text-sm text-white placeholder:text-[#858B94] shadow-sm transition-colors focus-visible:border-[#D4A72C]/60 focus-visible:ring-2 focus-visible:ring-[#D4A72C]/20 md:rounded-full md:bg-[#101316] md:pl-11 md:pr-[5.5rem] md:focus-visible:ring-[#D4A72C]/40"
            />
            <button
              type="button"
              onClick={() => updateSearchMode('ai')}
              aria-label={isAiSearch ? 'Return to text search' : 'AI Search'}
              aria-pressed={isAiSearch}
              title={isAiSearch ? 'Return to text search' : 'AI Search'}
              className={`absolute right-10 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A72C]/60 ${
                isAiSearch
                  ? 'bg-[#D4A72C]/15 text-[#F0C75E]'
                  : 'text-[#9299A1] hover:bg-white/5 hover:text-[#F0C75E]'
              }`}
            >
              <Sparkles aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => updateSearchMode('visual')}
              aria-label={isVisualSearch ? 'Return to text search' : 'Search by image'}
              aria-pressed={isVisualSearch}
              title={isVisualSearch ? 'Return to text search' : 'Search by image'}
              className={`absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A72C]/60 ${
                isVisualSearch
                  ? 'bg-[#D4A72C]/15 text-[#F0C75E]'
                  : 'text-[#9299A1] hover:bg-white/5 hover:text-[#F0C75E]'
              }`}
            >
              <Camera aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </form>

        <nav className="hidden items-center gap-2 lg:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="rounded-full px-3 py-2 text-sm font-medium text-[#B7BCC3] transition hover:bg-[#171B1F] hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {hasWishlistItems && (
            <Link href="/wishlist" className="inline-flex size-9 items-center justify-center rounded-xl text-[#B7BCC3] transition hover:bg-[#171B1F] hover:text-[#F0C75E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:size-10" aria-label="Wishlist">
              <Heart className="size-[18px]" strokeWidth={1.8} />
            </Link>
          )}
          <Link href="/cart" className="relative hidden size-9 items-center justify-center rounded-xl bg-[#D4A72C]/10 text-[#F0C75E] transition hover:bg-[#D4A72C]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:size-10 md:inline-flex" aria-label={cartItemCount > 0 ? `Cart, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'}` : 'Cart'}>
            <ShoppingBag className="size-[18px]" strokeWidth={1.8} />
            {cartItemCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#0B0D0F] bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
          </Link>
          <Link href="/profile" className="hidden size-9 items-center justify-center rounded-xl text-[#B7BCC3] transition hover:bg-[#171B1F] hover:text-[#F0C75E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:size-10 md:inline-flex" aria-label="Account">
            <UserRound className="size-[18px]" strokeWidth={1.8} />
          </Link>
        </div>
      </div>

    </header>
  );
}
