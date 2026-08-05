
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
                <div className="lg:col-span-2"><Skeleton className="h-48 w-full" /></div>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  const actionItems = useMemo(() => {
    const items: Array<{ text: string; href: string; icon: LucideIcon }> = [];

    const isRepairShop = seller.businessType === 'repairs';
    const pendingOrdersCount = sellerOrders.filter((order) => order.status === 'pending').length;
    const pendingRepairsCount = sellerRepairRequests.filter((request) => request.status === 'pending').length;

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

    const unreadMessagesCount = sellerMessages.filter((message) => !message.read && message.senderId !== user.id).length;
    if (unreadMessagesCount > 0) {
      items.push({
        text: `${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`,
        href: '/dashboard/messages',
        icon: MessageSquare,
      });
    }

    if (seller.businessType === 'store' || seller.businessType === 'manufacturing') {
      const productsWithStock = sellerProducts.filter((product) => 'stock' in product) as Product[];
      const outOfStockCount = productsWithStock.filter((product) => product.stock === 0).length;
      const lowStockCount = productsWithStock.filter((product) => product.stock > 0 && product.stock <= 5).length;

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
  }, [seller, sellerOrders, sellerProducts, sellerMessages, sellerRepairRequests, user.id]);

  const totalRevenue = sellerOrders
    .filter((order) => order.status === 'fulfilled' || order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  const activeProducts = sellerProducts.filter((product) => product.status === 'active').length;
  const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';
  const pendingOrdersCount = sellerOrders.filter((order) => order.status === 'pending').length;
  const lowStockCount = sellerProducts.filter((product) => 'stock' in product && product.stock > 0 && product.stock <= 5).length;

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(30,41,59,0.04),rgba(14,116,144,0.08),rgba(255,255,255,1))] p-4 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.30)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              <Sparkles className="size-3.5" />
              Operations overview
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Good morning, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {seller.name} is performing smoothly. Focus on the items that need attention most.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BusinessBadge label="Live status" detail="Healthy" />
            <BusinessBadge label="Plan" detail={seller.subscriptionPlan} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <QuickActionButton label={`New ${isStore ? 'Product' : 'Service'}`} href="/dashboard/add-product" icon={PlusCircle} onNavigate={showLoader} />
          <QuickActionButton label="Orders" href="/dashboard/orders" icon={ShoppingCart} onNavigate={showLoader} />
          <QuickActionButton label="Inventory" href="/dashboard/stock" icon={Boxes} onNavigate={showLoader} />
          <QuickActionButton label="Analytics" href="/dashboard/analytics" icon={TrendingUp} onNavigate={showLoader} />
          <QuickActionButton label="Business" href="/dashboard/storefront" icon={Store} onNavigate={showLoader} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value={`GHS ${totalRevenue.toFixed(2)}`} subtitle="Today’s sales" trend="+18%" icon={DollarSign} accent="bg-emerald-50 text-emerald-600" />
        <MetricCard label="Orders" value={sellerOrders.length} subtitle="Live orders" trend="+6%" icon={ShoppingCart} accent="bg-sky-50 text-sky-600" />
        <MetricCard label="Products" value={activeProducts} subtitle="Active listings" trend="Stable" icon={Package} accent="bg-violet-50 text-violet-600" />
        <MetricCard label="Visitors" value="2,103" subtitle="This week" trend="+12%" icon={Users} accent="bg-amber-50 text-amber-600" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 bg-background/80">
          <CardHeader className="pb-3">
            <SectionHeader title="What needs attention" actionLabel="View all" actionHref="/dashboard/orders" onAction={showLoader} />
          </CardHeader>
          <CardContent className="space-y-2">
            {actionItems.length > 0 ? actionItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-background p-2 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <p className="text-sm font-medium">{item.text}</p>
                </div>
                <Button size="sm" variant="ghost" asChild onClick={showLoader}>
                  <Link href={item.href as Route}>Open</Link>
                </Button>
              </div>
            )) : (
              <EmptyState title="Everything looks healthy" description="No urgent actions right now. Great work." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/80">
          <CardHeader className="pb-3">
            <SectionHeader title="Seller essentials" />
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightCard title="Pending orders" value={`${pendingOrdersCount}`} detail="Ready to fulfil" icon={ShoppingCart} />
            <InsightCard title="Low stock" value={`${lowStockCount}`} detail="Need replenishment" icon={Boxes} />
            <InsightCard title="Unread messages" value={`${sellerMessages.filter((message) => !message.read && message.senderId !== user.id).length}`} detail="Customer follow-up" icon={MessageSquare} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 bg-background/80">
          <CardHeader className="pb-3">
            <SectionHeader title="Recent activity" actionLabel="Open messages" actionHref="/dashboard/messages" onAction={showLoader} />
          </CardHeader>
          <CardContent className="space-y-2">
            <NotificationCard title="Order awaiting shipment" description="A new order has been paid and needs fulfilment." badge="Action" />
            <NotificationCard title="Customer question received" description="A buyer asked about delivery timing for an item." badge="Message" />
            <NotificationCard title="Store profile needs finishing" description="Add a banner and logo to improve buyer trust." badge="Improve" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/80">
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
    </div>
  );
}
