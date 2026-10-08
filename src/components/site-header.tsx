'use client';

import Link from 'next/link';
import { Search, ShoppingBag, UserRound, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';

const navLinks = [
  { href: '/search', label: 'Explore' },
  { href: '/categories', label: 'Categories' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/profile?tab=orders', label: 'Orders' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[#0B0D0F]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-4 sm:py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4A72C]/40 bg-[#D4A72C]/10 text-sm font-bold text-[#F0C75E] shadow-[0_0_24px_rgba(212,167,44,0.22)]">
            A
          </div>
          <div className="leading-none">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4A72C]">Agora</div>
            <div className="mt-1 text-sm font-semibold text-white">Buyer</div>
          </div>
        </Link>

        <form action="/search" className="hidden min-w-0 flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#B7BCC3]" />
            <Input
              name="q"
              placeholder="Search products, sellers, and deals"
              aria-label="Search products, sellers, and deals"
              className="h-11 w-full rounded-full border border-[#2a2f34] bg-[#101316] pl-11 pr-4 text-sm text-white placeholder:text-[#858B94] focus-visible:ring-2 focus-visible:ring-[#D4A72C]/40"
            />
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

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <Link href="/wishlist" className="inline-flex size-10 items-center justify-center rounded-full border border-[#2a2f34] bg-[#101316] text-[#B7BCC3] transition hover:border-[#D4A72C]/50 hover:text-[#F0C75E]" aria-label="Wishlist">
            <Heart className="size-4" />
          </Link>
          <Link href="/cart" className="inline-flex size-10 items-center justify-center rounded-full border border-[#D4A72C]/40 bg-[#D4A72C]/10 text-[#F0C75E] transition hover:bg-[#D4A72C]/20" aria-label="Cart">
            <ShoppingBag className="size-4" />
          </Link>
          <Link href="/profile" className="inline-flex size-10 items-center justify-center rounded-full border border-[#2a2f34] bg-[#101316] text-[#B7BCC3] transition hover:border-[#D4A72C]/50 hover:text-[#F0C75E]" aria-label="Account">
            <UserRound className="size-4" />
          </Link>
        </div>
      </div>

      <div className="border-t border-[#1a1f24] px-3 py-2 md:hidden">
        <form action="/search" className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#B7BCC3]" />
          <Input
            name="q"
            placeholder="Search Agora"
            aria-label="Search Agora"
            className="h-10 w-full rounded-full border border-[#2a2f34] bg-[#101316] pl-11 pr-4 text-sm text-white placeholder:text-[#858B94]"
          />
        </form>
      </div>
    </header>
  );
}
