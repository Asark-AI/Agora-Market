import { getActiveProducts, getProductBySlug, getRelatedProducts } from '@/lib/storefront';
import { PublicShell } from '@/components/public-shell';
import { ProductDetailView } from '@/components/product-detail-view';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);

  return (
    <PublicShell>
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <ProductDetailView product={product} relatedProducts={relatedProducts} />
      </div>
    </PublicShell>
  );
}
