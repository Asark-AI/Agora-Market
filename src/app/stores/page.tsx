import { getActiveSellers, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, Search, Store, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function StoresPage() {
  const sellers = await getActiveSellers();

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="rounded-[28px] border bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Stores</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">Discover trusted sellers</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Browse seller storefronts, review their reputation, and connect with the brands that matter to you.
              </p>
            </div>
            <form action="/search" className="w-full max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" placeholder="Search stores" className="h-10 rounded-full pl-9" />
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sellers.map((seller) => (
            <Card key={seller.id} className="overflow-hidden transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative h-36 bg-muted">
                <Image src={getImageUrl(seller.storefrontBannerUrl)} alt={seller.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                    {seller.logoUrl ? (
                      <Image src={getImageUrl(seller.logoUrl)} alt={`${seller.name} logo`} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary">{seller.name.slice(0, 1)}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{seller.name}</h3>
                      {seller.isVerifiedArtisan && <BadgeCheck className="size-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{seller.businessType}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{seller.description || 'Trusted seller on Agora Marketplace.'}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Store className="size-4" /> {seller.followerCount || 0} followers</span>
                  <span className="inline-flex items-center gap-1"><Users className="size-4" /> Verified</span>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button asChild className="flex-1" variant="outline">
                    <Link href={`/store/${seller.id}`}>Visit store</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/search">Browse products</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
