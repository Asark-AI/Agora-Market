
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search, Heart, House, Layers3, Store, UserRound, Package, ChevronDown, ShieldCheck, Award, Sparkles, TrendingUp, Menu, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLogo } from './app-logo';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';

const productCategories = [
  { href: '/categories?category=building-materials', label: 'Building materials' },
  { href: '/categories?category=machinery', label: 'Heavy machinery' },
  { href: '/categories?category=electronics', label: 'Electronics & components' },
  { href: '/categories?category=apparel', label: 'Apparel & uniforms' },
];

const sellerResources = [
  { href: '/stores', label: 'Verified stores' },
  { href: '/seller-signup', label: 'Sell on Agora' },
  { href: '/seller-support', label: 'Seller support' },
  { href: '/reports', label: 'Performance insights' },
];

const businessLinks = [
  { href: '/about', label: 'About Agora' },
  { href: '/contact', label: 'Contact sales' },
  { href: '/terms', label: 'Terms of service' },
  { href: '/privacy', label: 'Privacy policy' },
];

export function SiteHeader() {
  const { items } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const itemCount = isClient ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 py-3">
        <div className="hidden items-center justify-between lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-9 w-9 text-primary" />
            <span className="text-lg font-semibold tracking-tight">Agora</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full px-4">
              <Link href="/stores"><Store className="mr-2 size-4" /> Stores</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full px-4">
              <Link href="/profile?tab=orders"><Package className="mr-2 size-4" /> Orders</Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative rounded-full" aria-label="Cart">
              <Link href="/cart">
                <ShoppingCart className="size-5" />
                {itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{itemCount}</span>}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={user ? '/profile' : '/sign-in'}><UserRound className="mr-2 size-4" /> {user ? 'Account' : 'Sign in'}</Link>
            </Button>
          </div>
        </div>

        {/* Mobile compact header: logo + wishlist + cart */}
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold">Agora</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full p-2">
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="relative rounded-full p-2">
              <Link href="/cart" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile search bar (prominent but compact) */}
        <div className="mt-3 lg:hidden">
          <form action="/search" className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder="Search products, stores & brands" className="h-10 w-full rounded-full pl-10 pr-10 text-sm" />
              <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-sm">Search</Button>
            </div>
            <Button variant="ghost" className="rounded-full p-2">
              <Camera className="h-5 w-5 text-muted-foreground" />
            </Button>
          </form>
        </div>

        <div className="mt-4 hidden gap-2 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
                Products <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="!w-screen max-w-5xl overflow-hidden rounded-[28px] border border-border/70 bg-popover p-0 shadow-xl transition duration-200 ease-out data-[state=open]:shadow-2xl data-[state=closed]:scale-95 data-[state=open]:scale-100 data-[state=closed]:shadow-lg data-[state=open]:delay-75 hover:bg-popover/95">
              <div className="grid gap-4 p-6 lg:grid-cols-[1.4fr_1fr_1fr]">
                <div className="space-y-4">
                  <DropdownMenuLabel className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Product categories</DropdownMenuLabel>
                  {productCategories.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/80 hover:bg-primary/5"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="space-y-4">
                  <DropdownMenuLabel className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Top shopper paths</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/products" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-primary/5">Browse all products</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/flash-deals" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-primary/5">Flash deals</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/categories" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-primary/5">Curated categories</Link>
                  </DropdownMenuItem>
                </div>
                <div className="rounded-[28px] bg-primary/5 p-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    <ShieldCheck className="h-4 w-4" /> Trusted sellers
                  </div>
                  <p className="mt-4 text-lg font-semibold text-foreground">Everything from verified vendors to clear shipping timelines.</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Accelerate search and conversion with a streamlined catalog experience for enterprise buyers.
                  </p>
                  <Button asChild variant="secondary" className="mt-5 rounded-full px-5 py-3 text-sm">
                    <Link href="/products">Start shopping</Link>
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
                Stores <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="!w-screen max-w-5xl overflow-hidden rounded-[28px] border border-border/70 bg-popover p-0 shadow-xl transition duration-200 ease-out data-[state=open]:shadow-2xl data-[state=closed]:scale-95 data-[state=open]:scale-100 data-[state=closed]:shadow-lg data-[state=open]:delay-75 hover:bg-popover/95">
              <div className="grid gap-4 p-6 lg:grid-cols-[1.3fr_1fr_1fr]">
                <div className="space-y-4">
                  <DropdownMenuLabel className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Store spotlight</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/stores" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-primary/5">Browse verified stores</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/store/featured" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-primary/5">Top-rated vendor hubs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/store-collections" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-primary/5">Shop by collection</Link>
                  </DropdownMenuItem>
                </div>
                <div className="space-y-4">
                  <DropdownMenuLabel className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Seller support</DropdownMenuLabel>
                  {sellerResources.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/80 hover:bg-primary/5"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="rounded-[28px] bg-background/90 p-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    <Award className="h-4 w-4" /> Seller excellence
                  </div>
                  <p className="mt-4 text-lg font-semibold text-foreground">Grow with credibility and performance.</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    List products, manage inventory, and connect with high-intent buyers on Agora’s trusted platform.
                  </p>
                  <Button asChild variant="secondary" className="mt-5 rounded-full px-5 py-3 text-sm">
                    <Link href="/seller-signup">Become a seller</Link>
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
                Explore <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="!w-screen max-w-5xl overflow-hidden rounded-[28px] border border-border/70 bg-popover p-0 shadow-xl transition duration-200 ease-out data-[state=open]:shadow-2xl data-[state=closed]:scale-95 data-[state=open]:scale-100 data-[state=closed]:shadow-lg data-[state=open]:delay-75 hover:bg-popover/95">
              <div className="grid gap-4 p-6 lg:grid-cols-[1.2fr_1fr_1fr]">
                <div className="space-y-4">
                  <DropdownMenuLabel className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Business resources</DropdownMenuLabel>
                  {businessLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/80 hover:bg-primary/5"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="col-span-2 rounded-[28px] border border-border/70 bg-background/80 p-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    <TrendingUp className="h-4 w-4" /> Growth insights
                  </div>
                  <p className="mt-4 text-lg font-semibold text-foreground">Enterprise-ready commerce resources</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Find onboarding guidance, payment options, and support for scaling your business across West Africa.
                  </p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
