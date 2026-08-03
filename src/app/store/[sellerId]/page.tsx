
import { getSellerBySlug, getActiveProducts, getImageUrl } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductCard } from '@/components/product-card';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { BadgeCheck, MessageCircle, Store, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SellerFollowButton } from '@/components/seller-follow-button';

interface StorePageProps {
  params: { sellerId: string };
}

export default async function StorefrontPage({ params }: StorePageProps) {
  const seller = await getSellerBySlug(params.sellerId);

  if (!seller) {
    notFound();
  }

  const products = (await getActiveProducts()).filter((product) => product.sellerId === seller.id);

  const rating = ((seller.trustScore || 80) / 20).toFixed(1);
  const location = seller.pickupLocation || seller.regionId || 'Ghana';

  return (
    <PublicShell>
      <div className="border-b bg-muted/40">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="relative overflow-hidden rounded-3xl border bg-background">
            <div className="relative h-56 bg-muted">
              <Image src={getImageUrl(seller.storefrontBannerUrl)} alt={seller.name} fill className="object-cover" />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
                    {seller.logoUrl ? (
                      <Image src={getImageUrl(seller.logoUrl)} alt={`${seller.name} logo`} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">{seller.name.slice(0, 1)}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-semibold">{seller.name}</h1>
                      {seller.isVerifiedArtisan && <BadgeCheck className="size-5 text-primary" />}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{location}</span>
                      <span>{rating} ★ seller rating</span>
                      <span>{seller.followerCount || 0} followers</span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{seller.description || 'Trusted seller on Agora Marketplace'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button asChild>
                    <a href={`mailto:${seller.email || ''}`} className="inline-flex items-center gap-2"><MessageCircle className="size-4" /> Message seller</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/search">Browse products</Link>
                  </Button>
                  <SellerFollowButton seller={seller} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Store className="size-5 text-primary" />
                <div>
                  <div className="font-semibold">{products.length} products</div>
                  <div className="text-sm text-muted-foreground">Active inventory</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-primary" />
                <div>
                  <div className="font-semibold">{seller.followerCount || 0} followers</div>
                  <div className="text-sm text-muted-foreground">Community</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <BadgeCheck className="size-5 text-primary" />
                <div>
                  <div className="font-semibold">Verified seller</div>
                  <div className="text-sm text-muted-foreground">Trusted marketplace partner</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-muted p-8 text-center text-muted-foreground">
            No active products found yet. Check back later or browse other stores.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
