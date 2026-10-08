
'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowRight, ArrowUpRight, Check, Circle, CreditCard, Package, Rocket, ShoppingCart, Sparkles, Star, Store, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { DashboardOverviewSkeleton } from '@/components/loading-skeletons';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { NeedsAttention } from '@/components/dashboard/needs-attention';

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 }).format(value);
}

function formatOrderDate(value: string | Date | null | undefined) {
  if (!value) return 'Date unavailable';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-GH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusStyle(status: string) {
  if (['fulfilled', 'completed', 'delivered'].includes(status)) return 'dashboard-status--green';
  if (['shipped', 'in-progress', 'awaiting-parts'].includes(status)) return 'dashboard-status--blue';
  if (['pending', 'upcoming', 'awaiting-quote', 'ready-for-pickup'].includes(status)) return 'dashboard-status--amber';
  if (status === 'cancelled') return 'dashboard-status--red';
  return 'dashboard-status--neutral';
}

export default function DashboardPage() {
  const {
    user,
    seller,
    loading: authLoading,
    sellerOrders,
    sellerProducts,
    sellerMessages,
    sellerCustomers,
  } = useAuth();

  if (authLoading || !seller || !user) {
    return <DashboardOverviewSkeleton />;
  }

  const activeProducts = sellerProducts.filter((product) => product.status === 'active').length;
  const totalRevenue = sellerOrders
    .filter((order) => order.status === 'fulfilled' || order.status === 'completed' || order.status === 'delivered')
    .reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = sellerOrders.filter((order) => order.status === 'pending').length;
  const pendingPayoutOrders = sellerOrders.filter((order) => order.payoutStatus === 'PENDING');
  const missingPayoutAmount = pendingPayoutOrders.some((order) => typeof order.financialBreakdown?.sellerNetAmountMinor !== 'number');
  const pendingPayoutAmount = pendingPayoutOrders.reduce((sum, order) => {
    const amount = order.financialBreakdown?.sellerNetAmountMinor;
    return sum + (typeof amount === 'number' ? amount : 0);
  }, 0) / 100;
  const isNewSeller = activeProducts === 0 && sellerOrders.length === 0;
  const completionSteps = [
    { label: 'Create seller account', done: true },
    { label: 'Add your first product', done: activeProducts > 0 },
    { label: 'Set up payments', done: false },
    { label: 'Publish your first product', done: activeProducts > 0 },
  ];
  const completionCount = completionSteps.filter((step) => step.done).length;
  const completionPercent = Math.round((completionCount / completionSteps.length) * 100);

  if (isNewSeller) {
    return (
      <div className="dashboard-enter mx-auto max-w-[1440px] space-y-7 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Welcome, {user.name.split(' ')[0]}</p>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-[26px]">Overview</h1>
            <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your store today.</p>
          </div>
          <Button asChild className="min-h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-[#e0b746] sm:w-auto">
            <Link href="/dashboard/add-product"><Package className="mr-2 h-4 w-4" />Add product</Link>
          </Button>
        </div>

        <GlassCard accent="gold" className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Selling progress</p>
              <span className="text-sm font-semibold text-primary">{completionPercent}%</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {completionSteps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${step.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-muted-foreground'}`}>
                  {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                {index < completionSteps.length - 1 && <div className={`h-px w-8 ${step.done ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {completionSteps.map((step) => (
              <div key={step.label} className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-[#171b1f] px-3 py-2">
                {step.done ? <Check className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm ${step.done ? 'text-foreground line-through decoration-muted-foreground/60' : 'text-muted-foreground'}`}>{step.label}</span>
              </div>
            ))}
          </div>

          <Link href="/dashboard/add-product" className="mt-5 block">
            <Button className="w-full justify-between rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
              <span className="flex items-center gap-2"><Rocket className="h-4 w-4" /> Add your first product</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Next step
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">Add clear photos and a strong description.</p>
          <p className="mt-2 text-sm text-muted-foreground">A polished product listing helps buyers trust your store and discover your products faster.</p>
        </GlassCard>
      </div>
    );
  }

  const recentOrders = [...sellerOrders].sort((left, right) => {
    const leftDate = new Date(left.createdAt || left.date).getTime();
    const rightDate = new Date(right.createdAt || right.date).getTime();
    return rightDate - leftDate;
  }).slice(0, 5);
  const topProducts = [...sellerProducts].sort((left, right) => {
    const leftSales = 'soldCount' in left ? left.soldCount || 0 : 0;
    const rightSales = 'soldCount' in right ? right.soldCount || 0 : 0;
    return rightSales - leftSales || (right.views || 0) - (left.views || 0);
  }).slice(0, 4);

  const getProductImage = (product: (typeof sellerProducts)[number]) =>
    ('coverImageUrl' in product ? product.coverImageUrl : product.images?.[0]) || '';
  const getProductPrice = (product: (typeof sellerProducts)[number]) => {
    if ('price' in product && typeof product.price === 'number') return product.discountPrice ?? product.price;
    if ('flatFee' in product && typeof product.flatFee === 'number') return product.flatFee;
    if ('hourlyRate' in product && typeof product.hourlyRate === 'number') return product.hourlyRate;
    return null;
  };

  return (
    <div className="dashboard-enter mx-auto max-w-[1440px] space-y-7 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Welcome back, {user.name.split(' ')[0]}</p>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-[26px]">Overview</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <Button asChild className="min-h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-[#e0b746] sm:w-auto">
          <Link href="/dashboard/add-product"><Package className="mr-2 h-4 w-4" />Add product</Link>
        </Button>
      </div>

      <section aria-label="Store metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total sales', value: formatMoney(totalRevenue), note: 'Fulfilled and completed orders', icon: TrendingUp },
          { label: 'Orders', value: String(sellerOrders.length), note: `${pendingOrders} awaiting processing`, icon: ShoppingCart },
          { label: 'Products', value: String(sellerProducts.length), note: `${activeProducts} active listings`, icon: Package },
          { label: 'Pending payouts', value: missingPayoutAmount ? '—' : formatMoney(pendingPayoutAmount), note: missingPayoutAmount ? `${pendingPayoutOrders.length} pending orders; amount unavailable` : `${pendingPayoutOrders.length} pending payout orders`, icon: CreditCard },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <GlassCard key={metric.label} className="min-w-0 p-4 transition-colors hover:border-primary/25 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">{metric.label}</p>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-4 truncate text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{metric.value}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">{metric.note}</p>
            </GlassCard>
          );
        })}
      </section>

      <NeedsAttention
        orders={sellerOrders}
        messages={sellerMessages}
        products={sellerProducts}
        userId={user.id}
      />

      <section aria-labelledby="recent-orders-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div><h2 id="recent-orders-title" className="text-base font-semibold">Recent orders</h2><p className="mt-1 text-sm text-muted-foreground">Latest activity across your store.</p></div>
          <Button asChild variant="ghost" className="min-h-11 shrink-0 text-primary hover:bg-accent hover:text-primary"><Link href="/dashboard/orders">All orders<ArrowUpRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
        <GlassCard className="divide-y divide-border/80">
          {recentOrders.length > 0 ? recentOrders.map((order) => {
            const status = String(order.status).replaceAll('-', ' ');
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
                <div key={order.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-4 sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] sm:items-center sm:px-5">
                <div className="min-w-0"><p className="truncate text-sm font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 truncate text-xs text-muted-foreground">{sellerCustomers.find((customer) => customer.userId === order.buyerId)?.name || 'Customer details unavailable'}</p></div>
                <p className="text-sm text-muted-foreground">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
                <p className="text-sm font-semibold tabular-nums">{formatMoney(order.total)}</p>
                <p className="text-xs text-muted-foreground">{formatOrderDate(order.createdAt || order.date)}</p>
                <span className={`dashboard-status w-fit ${statusStyle(order.status)}`}>{status}</span>
              </div>
            );
          }) : (
            <div className="px-5 py-10 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[#171b1f] text-muted-foreground"><Store className="h-5 w-5" /></div><p className="mt-3 text-sm font-medium">No orders yet</p><p className="mt-1 text-sm text-muted-foreground">Orders will appear here when a customer purchases from your store.</p></div>
          )}
        </GlassCard>
      </section>

      <section aria-labelledby="top-products-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div><h2 id="top-products-title" className="text-base font-semibold">Top products</h2><p className="mt-1 text-sm text-muted-foreground">Your strongest listings by recorded sales and views.</p></div>
          <Button asChild variant="ghost" className="min-h-11 shrink-0 text-primary hover:bg-accent hover:text-primary"><Link href="/dashboard/products">All products<ArrowUpRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
        {topProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {topProducts.map((product) => {
              const image = getProductImage(product);
              const price = getProductPrice(product);
              const sales = 'soldCount' in product ? product.soldCount : undefined;
              return (
                <Link key={product.id} href={`/dashboard/products/${product.id}/edit`} className="group min-w-0">
                  <GlassCard className="h-full transition-colors group-hover:border-primary/30">
                    <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-[#171b1f]">
                      {image ? <NextImage src={image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="size-6" /></div>}
                    </div>
                    <div className="space-y-2 p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-medium">{product.name}</p><span className={`dashboard-status shrink-0 ${product.status === 'active' ? 'dashboard-status--green' : product.status === 'draft' || product.status === 'scheduled' ? 'dashboard-status--amber' : 'dashboard-status--neutral'}`}>{product.status}</span></div>
                      <p className="text-sm font-semibold">{price === null ? 'Price unavailable' : formatMoney(price)}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{sales === undefined ? 'Sales unavailable' : `${sales} sold`}</span>
                        <span className="inline-flex items-center gap-1">{product.ratingAverage ? <><Star className="size-3.5 fill-current text-primary" />{product.ratingAverage.toFixed(1)}</> : 'Not rated'}</span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        ) : (
          <GlassCard className="flex flex-col items-center px-5 py-8 text-center">
            <Package className="size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add a listing to start building your catalog.</p>
            <Button asChild className="mt-4 min-h-11 bg-primary text-primary-foreground"><Link href="/dashboard/add-product">Add product</Link></Button>
          </GlassCard>
        )}
      </section>
    </div>
  );
}
