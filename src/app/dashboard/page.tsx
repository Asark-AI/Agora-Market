
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Eye,
  Edit,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const StorefrontPreviewCard = ({ seller }: { seller: any }) => {
  const { show: showLoader } = usePageLoaderStore();
  return (
  <Card>
    <CardHeader>
      <CardTitle>Your Storefront</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="relative aspect-video w-full rounded-md overflow-hidden border">
        <Image src={seller.storefrontBannerUrl || 'https://placehold.co/600x400.png'} alt="Storefront banner preview" fill objectFit="cover" data-ai-hint="store banner industrial" />
      </div>
    </CardContent>
    <CardFooter className="flex gap-2">
      <Button asChild className="flex-1" variant="outline" onClick={showLoader}>
        <Link href={`/store/${seller.id}`} target="_blank"><Eye className="mr-2 size-4" /> View Store</Link>
      </Button>
      <Button asChild className="flex-1" onClick={showLoader}>
        <Link href="/dashboard/storefront"><Edit className="mr-2 size-4" /> Edit Theme</Link>
      </Button>
    </CardFooter>
  </Card>
)};

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
    const items = [];
    
    // Pending Orders/Jobs
    const isRepairShop = seller.businessType === 'repairs';
    const pendingOrdersCount = sellerOrders.filter(o => o.status === 'pending').length;
    const pendingRepairsCount = sellerRepairRequests.filter(r => r.status === 'pending').length;

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

    // Unread Messages
    const unreadMessagesCount = sellerMessages.filter(m => !m.read && m.senderId !== user.id).length;
    if (unreadMessagesCount > 0) {
        items.push({
            text: `${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`,
            href: '/dashboard/messages',
            icon: MessageSquare,
        });
    }

    // Low Stock / Out of Stock
    if (seller.businessType === 'store' || seller.businessType === 'manufacturing') {
        const productsWithStock = sellerProducts.filter(p => 'stock' in p) as Product[];
        const outOfStockCount = productsWithStock.filter(p => p.stock === 0).length;
        const lowStockCount = productsWithStock.filter(p => p.stock > 0 && p.stock <= 5).length;
        
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
    
    // Profile Completion
    const isProfileIncomplete = !seller.description || !seller.logoUrl || !seller.storefrontBannerUrl;
    if (isProfileIncomplete) {
        items.push({ 
            text: 'Complete your store profile to attract more buyers', 
            href: '/dashboard/storefront',
            icon: Edit,
        });
    }
    
    return items;
  }, [seller, sellerOrders, sellerProducts, sellerMessages, sellerRepairRequests, user.id]);

  const totalRevenue = sellerOrders
    .filter(o => o.status === 'fulfilled' || o.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  const activeProducts = sellerProducts.filter(p => p.status === 'active').length;
  
  const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';

  const ActionItems = () => (
    <Card>
      <CardHeader>
        <CardTitle>Action Center</CardTitle>
        <CardDescription>A prioritized list of tasks to keep your store running smoothly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionItems.length > 0 ? actionItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <item.icon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">{item.text}</span>
            </div>
            <Button size="sm" variant="outline" asChild onClick={showLoader}>
              <Link href={item.href as Route}>View</Link>
            </Button>
          </div>
        )) : (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle className="size-8 text-green-500" />
            <p className="font-medium text-foreground">All Caught Up!</p>
            <p className="text-sm">No pending actions. Great job!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline md:text-3xl">
            Welcome Back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's a quick overview of your store's performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild onClick={showLoader}>
                <Link href="/dashboard/add-product">
                <PlusCircle className="mr-2 size-4" />
                New {isStore ? 'Product' : 'Service'}
                </Link>
            </Button>
            <Button asChild variant="outline" onClick={showLoader}>
                <Link href={`/store/${seller.id}`} target="_blank">
                <Eye className="mr-2 size-4" />
                View Storefront
                </Link>
            </Button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Orders" value={sellerOrders.length} icon={ShoppingCart} />
          <StatCard title="Total Revenue" value={`GHS ${totalRevenue.toFixed(2)}`} icon={DollarSign} />
          <StatCard title="Active Products" value={activeProducts} icon={Package} />
          <StatCard title="Store Visits" value="2,103" icon={Users} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
              <ActionItems />
          </div>
          <StorefrontPreviewCard seller={seller} />
          <Card>
            <CardHeader>
                <CardTitle>Your Plan</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-base">You are currently on the <span className="font-semibold capitalize text-primary">{seller.subscriptionPlan}</span> plan.</p>
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" onClick={showLoader}>
                    <Link href="/dashboard/subscription">Manage Subscription</Link>
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
