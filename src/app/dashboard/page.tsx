
'use client';

import { useAuth } from '@/hooks/use-auth';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { KPIGrid } from '@/components/dashboard/kpi-grid';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { DashboardEmptyState } from '@/components/dashboard/empty-state';
import { Rocket } from 'lucide-react';

export default function DashboardPage() {
  const {
    user,
    seller,
    loading: authLoading,
    sellerOrders,
    sellerProducts,
    sellerMessages,
  } = useAuth();

  const loading = authLoading;

  if (loading || !seller || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-48" />
        <div className="grid gap-4 grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const activeProducts = sellerProducts.filter((product) => product.status === 'active').length;
  const totalRevenue = sellerOrders
    .filter((order) => order.status === 'fulfilled' || order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  // Empty state: no products
  if (activeProducts === 0 && sellerOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Good morning, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground">Here's what's happening with your business today.</p>
        </div>

        <div className="space-y-6">
          <DashboardEmptyState
            icon={<Rocket className="h-12 w-12 text-primary mx-auto mb-4" />}
            title="Start selling on Agora 🚀"
            description="You haven't listed any products yet. Add your first product and start reaching buyers."
            actionLabel="Add Your First Product"
            actionHref="/dashboard/add-product"
          />

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Setup Guide</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">1.</span>
                <span>Add your first product with photos and descriptions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">2.</span>
                <span>Set competitive prices and manage inventory</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">3.</span>
                <span>Start receiving orders and building your reputation</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Greeting Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Good morning, {user.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground">Here's what's happening with your business today.</p>
      </div>

      {/* Revenue Summary */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-transparent border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium mb-2">Total Revenue</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-emerald-900">GH₵{totalRevenue.toFixed(2)}</span>
          {totalRevenue > 0 && <span className="text-sm text-emerald-600">↑ 12% compared to last week</span>}
        </div>
      </Card>

      {/* KPI Grid */}
      <KPIGrid
        seller={seller}
        revenue={totalRevenue}
        orders={sellerOrders}
        products={sellerProducts}
        messages={sellerMessages}
        userId={user.id}
      />

      {/* Needs Your Attention */}
      <NeedsAttention
        orders={sellerOrders}
        messages={sellerMessages}
        products={sellerProducts}
        userId={user.id}
      />

      {/* Quick Actions */}
      <QuickActions hasProducts={activeProducts > 0} />

      {/* Performance Section */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Performance</p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-2">This Week</p>
            <p className="text-2xl font-bold mb-1">GH₵{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{sellerOrders.length} orders</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-2">Conversion Rate</p>
            <p className="text-2xl font-bold mb-1">—</p>
            <p className="text-xs text-muted-foreground">No data yet</p>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity
        orders={sellerOrders}
        products={sellerProducts}
        messages={sellerMessages}
      />
    </div>
  );
}
