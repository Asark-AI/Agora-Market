import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { ArrowRight, Instagram, Facebook, MessageCircle } from 'lucide-react';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pb-16">{children}</main>
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
                <Link href="/search" className="hover:text-foreground">Search</Link>
                <Link href="/wishlist" className="hover:text-foreground">Wishlist</Link>
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
