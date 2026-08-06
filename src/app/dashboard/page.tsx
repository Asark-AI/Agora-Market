
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Store,
  Edit,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  Wrench,
  TrendingUp,
  Sparkles,
  BellRing,
  Boxes,
  type LucideIcon,
} from 'lucide-react';
import { usePageLoaderStore } from '@/hooks/use-page-loader';
import {
  MetricCard,
  QuickActionButton,
  SectionHeader,
  InsightCard,
  NotificationCard,
  EmptyState,
  BusinessBadge,
} from '@/components/dashboard/overview-components';

export default function DashboardPage() {
  const {
    user,
    seller,
    loading: authLoading,
    sellerOrders,
    sellerProducts,
    sellerMessages,
    sellerRepairRequests,
  } = useAuth();

  const { show: showLoader } = usePageLoaderStore();

  const loading = authLoading;

  if (loading || !seller || !user) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const isRepairShop = seller.businessType === 'repairs';
  const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';

  const unreadMessagesCount = sellerMessages.filter((message) => !message.read && message.senderId !== user.id).length;
  const pendingOrdersCount = sellerOrders.filter((order) => order.status === 'pending').length;
  const pendingRepairsCount = sellerRepairRequests.filter((request) => request.status === 'pending').length;
  const productsWithStock = sellerProducts.filter((product) => 'stock' in product) as Product[];
  const lowStockCount = productsWithStock.filter((product) => product.stock > 0 && product.stock <= 5).length;
  const outOfStockCount = productsWithStock.filter((product) => product.stock === 0).length;
  const activeProducts = sellerProducts.filter((product) => product.status === 'active').length;

  const actionItems = useMemo(() => {
    const items: Array<{ text: string; href: string; icon: LucideIcon }> = [];

    if (!isRepairShop && pendingOrdersCount > 0) {
      items.push({
        text: `${pendingOrdersCount} new order${pendingOrdersCount > 1 ? 's' : ''} to process`,
        href: '/dashboard/orders',
        icon: ShoppingCart,
      });
    }

    if (isRepairShop && pendingRepairsCount > 0) {
      items.push({
        text: `${pendingRepairsCount} new repair request${pendingRepairsCount > 1 ? 's' : ''}`,
        href: '/dashboard/repairs',
        icon: Wrench,
      });
    }

    if (unreadMessagesCount > 0) {
      items.push({
        text: `${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`,
        href: '/dashboard/messages',
        icon: MessageSquare,
      });
    }

    if (isStore) {
      if (lowStockCount > 0) {
        items.push({
          text: `${lowStockCount} item${lowStockCount > 1 ? 's are' : ' is'} running low on stock`,
          href: '/dashboard/stock',
          icon: AlertTriangle,
        });
      }
      if (outOfStockCount > 0) {
        items.push({
          text: `${outOfStockCount} item${outOfStockCount > 1 ? 's are' : ' is'} out of stock`,
          href: '/dashboard/stock',
          icon: Package,
        });
      }
    }

    const isProfileIncomplete = !seller.description || !seller.logoUrl || !seller.storefrontBannerUrl;
    if (isProfileIncomplete) {
      items.push({
        text: 'Complete your business profile to attract more buyers',
        href: '/dashboard/storefront',
        icon: Edit,
      });
    }

    return items;
  }, [isRepairShop, pendingOrdersCount, pendingRepairsCount, unreadMessagesCount, lowStockCount, outOfStockCount, seller.description, seller.logoUrl, seller.storefrontBannerUrl]);

  const totalRevenue = sellerOrders
    .filter((order) => order.status === 'fulfilled' || order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  const businessModeLabel = isRepairShop ? 'Repair shop' : isStore ? 'Storefront' : 'Service studio';
  const quickActions = [
    { label: `New ${isStore ? 'Product' : 'Service'}`, href: '/dashboard/add-product', icon: PlusCircle },
    { label: isRepairShop ? 'Repair requests' : 'Orders', href: isRepairShop ? '/dashboard/repairs' : '/dashboard/orders', icon: ShoppingCart },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Storefront', href: `/store/${seller.id}`, icon: Store },
  ];

  return (
    <div className="space-y-4 pb-24">
      <section className="rounded-[28px] border border-border/70 bg-background/80 p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.30)]">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Live business pulse
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Good morning, {user.name.split(' ')[0]}.</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {businessModeLabel} performance at a glance.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Your key metrics are ready. Use the actions below to move orders, stock, and messages forward without leaving the dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <BusinessBadge label="Business type" detail={businessModeLabel} />
              <BusinessBadge label="Plan" detail={seller.subscriptionPlan} />
              <BusinessBadge label="Status" detail="Healthy" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Revenue</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">GHS {totalRevenue.toFixed(2)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Confirmed sales</p>
            </div>
            <div className="rounded-[22px] border border-border/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Active products</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{activeProducts}</p>
              <p className="mt-2 text-sm text-muted-foreground">Your current listings</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => (
            <QuickActionButton key={item.label} label={item.label} href={item.href as Route} icon={item.icon} onNavigate={showLoader} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value={`GHS ${totalRevenue.toFixed(2)}`} subtitle="Confirmed sales" trend="+18%" icon={DollarSign} accent="bg-emerald-50 text-emerald-600" />
        <MetricCard label={isRepairShop ? 'Jobs' : 'Orders'} value={isRepairShop ? sellerRepairRequests.length : sellerOrders.length} subtitle="Open tasks" trend={isRepairShop ? '+9%' : '+6%'} icon={ShoppingCart} accent="bg-sky-50 text-sky-600" />
        <MetricCard label="Products" value={activeProducts} subtitle="Live listings" trend="Stable" icon={Package} accent="bg-violet-50 text-violet-600" />
        <MetricCard label="Messages" value={unreadMessagesCount} subtitle="Unread" trend="+4%" icon={Users} accent="bg-amber-50 text-amber-600" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-background/80">
          <CardHeader className="pb-3">
            <SectionHeader title="Focus queue" actionLabel="Manage tasks" actionHref={isRepairShop ? '/dashboard/repairs' : '/dashboard/orders'} onAction={showLoader} />
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.length > 0 ? (
              actionItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-background p-2 text-primary">
                      <item.icon className="size-4" />
                    </div>
                    <p className="text-sm font-medium text-slate-950">{item.text}</p>
                  </div>
                  <Button size="sm" variant="ghost" asChild onClick={showLoader}>
                    <Link href={item.href as Route}>Open</Link>
                  </Button>
                </div>
              ))
            ) : (
              <EmptyState title="Smooth operations" description="Everything is up to date. No immediate actions required." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/80">
          <CardHeader className="pb-3">
            <SectionHeader title="Essential health" />
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightCard title="Pending orders" value={`${pendingOrdersCount}`} detail="Awaiting fulfilment" icon={ShoppingCart} />
            <InsightCard title="Low stock" value={`${lowStockCount}`} detail="Restock soon" icon={Boxes} />
            <InsightCard title="Unread messages" value={`${unreadMessagesCount}`} detail="Respond quickly" icon={MessageSquare} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-background/80">
          <CardHeader className="pb-3">
            <SectionHeader title="Recent activity" actionLabel="Open messages" actionHref="/dashboard/messages" onAction={showLoader} />
          </CardHeader>
          <CardContent className="space-y-2">
            <NotificationCard title="Order awaiting shipment" description="A new order has been paid and needs fulfilment." badge="Action" />
            <NotificationCard title="Customer question received" description="A buyer asked about delivery timing for an item." badge="Message" />
            <NotificationCard title="Store profile needs finishing" description="Add a banner and logo to improve buyer trust." badge="Improve" />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/80">
          <CardHeader className="pb-3">
            <SectionHeader title="Performance highlights" />
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightCard title="Most viewed item" value="Wireless headset" detail="17% of visits" icon={Sparkles} />
            <InsightCard title="Conversion lift" value="+12.4%" detail="Compared with last week" icon={TrendingUp} />
            <InsightCard title="Customer care" value="96%" detail="Response rate" icon={BellRing} />
          </CardContent>
        </Card>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 px-4 py-3 shadow-[0_-14px_32px_-20px_rgba(15,23,42,0.30)] md:hidden">
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90" onClick={showLoader}>
            <Link href="/dashboard/add-product" className="inline-flex flex-col items-center gap-1 text-center">
              <PlusCircle className="size-6" />
              <span className="inline-block sm:hidden">Add</span>
              <span className="hidden sm:inline-block">Create</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" className="flex-1 rounded-2xl border border-border/70 bg-slate-100 px-3 py-3 text-sm font-semibold transition hover:bg-slate-200" onClick={showLoader}>
            <Link href="/dashboard/orders" className="inline-flex flex-col items-center gap-1 text-center text-slate-900">
              <ShoppingCart className="size-6" />
              Orders
            </Link>
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button asChild variant="ghost" className="flex-1 rounded-2xl border border-border/70 bg-slate-100 px-3 py-3 text-sm font-semibold transition hover:bg-slate-200" onClick={showLoader}>
            <Link href="/dashboard/products" className="inline-flex flex-col items-center gap-1 text-center text-slate-900">
              <Package className="size-6" />
              Products
            </Link>
          </Button>
          <Button asChild variant="ghost" className="flex-1 rounded-2xl border border-border/70 bg-slate-100 px-3 py-3 text-sm font-semibold transition hover:bg-slate-200" onClick={showLoader}>
            <Link href="/dashboard/messages" className="inline-flex flex-col items-center gap-1 text-center text-slate-900">
              <MessageSquare className="size-6" />
              Messages
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
