import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { ArrowRight, Instagram, Facebook, MessageCircle, House, Layers3, Search as SearchIcon, Store, UserRound } from 'lucide-react';

const mobileNavItems = [
  { href: '/', label: 'Home', icon: House },
  { href: '/categories', label: 'Categories', icon: Layers3 },
  { href: '/search', label: 'Search', icon: SearchIcon },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/sign-in', label: 'Account', icon: UserRound },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pb-24 md:pb-16">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-2">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <footer className="border-t bg-muted/40">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">Agora Marketplace</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Discover curated products from trusted local and regional sellers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Quick Links</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/categories" className="hover:text-foreground">Categories</Link>
                <Link href="/products" className="hover:text-foreground">Products</Link>
                <Link href="/stores" className="hover:text-foreground">Stores</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Stay Connected</h3>
              <div className="mt-3 flex gap-3">
                <Button size="icon" variant="outline" asChild>
                  <Link href="/" aria-label="Facebook"><Facebook className="size-4" /></Link>
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <Link href="/" aria-label="Instagram"><Instagram className="size-4" /></Link>
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <Link href="/" aria-label="WhatsApp"><MessageCircle className="size-4" /></Link>
                </Button>
              </div>
              <Button variant="link" className="mt-3 px-0" asChild>
                <Link href="/sign-up">
                  Join as a seller <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
