
'use client';

import Link from 'next/link';
import { ArrowRight, Check, Circle, MessageSquare, PackageCheck, Rocket, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function DashboardPage() {
  const {
    user,
    seller,
    loading: authLoading,
    sellerOrders,
    sellerProducts,
    sellerMessages,
  } = useAuth();

  if (authLoading || !seller || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-48" />
        <div className="grid gap-4 grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  const activeProducts = sellerProducts.filter((product) => product.status === 'active').length;
  const totalRevenue = sellerOrders
    .filter((order) => order.status === 'fulfilled' || order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  const unreadMessages = sellerMessages.filter((message) => !message.read && message.senderId !== user.id).length;
  const pendingOrders = sellerOrders.filter((order) => order.status === 'pending').length;
  const lowStockProducts = sellerProducts.filter((product) => 'stock' in product && product.stock !== undefined && product.stock > 0 && product.stock <= 5).length;

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
      <div className="space-y-5 pb-20">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Good morning, {user.name.split(' ')[0]} 👋</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Let&apos;s get your store ready to sell.</h1>
        </div>

        <Card className="overflow-hidden border-border bg-gradient-to-br from-primary/5 via-background to-background p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Selling progress</p>
            <span className="text-sm font-semibold text-primary">{completionPercent}%</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {completionSteps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${step.done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-background text-muted-foreground'}`}>
                  {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                {index < completionSteps.length - 1 && <div className={`h-px w-8 ${step.done ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {completionSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2">
                {step.done ? <Check className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm ${step.done ? 'text-foreground line-through decoration-muted-foreground/60' : 'text-muted-foreground'}`}>{step.label}</span>
              </div>
            ))}
          </div>

          <Link href="/dashboard/add-product" className="mt-5 block">
            <Button className="w-full justify-between rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
              <span className="flex items-center gap-2"><Rocket className="h-4 w-4" /> Add Your First Product</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Next step
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">Add clear photos and a strong description.</p>
          <p className="mt-2 text-sm text-muted-foreground">A polished product listing helps buyers trust your store and discover your products faster.</p>
        </Card>
      </div>
    );
  }

  const recentOrders = sellerOrders.slice(0, 3);
  const recentMessages = sellerMessages.slice(0, 2);

  return (
    <div className="space-y-5 pb-20">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Good morning, {user.name.split(' ')[0]} 👋</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Your business snapshot</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Revenue</p>
          <p className="mt-3 text-[28px] font-semibold tracking-tight">GH₵{totalRevenue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-emerald-600">{sellerOrders.length} orders</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Products</p>
          <p className="mt-3 text-[28px] font-semibold tracking-tight">{activeProducts}</p>
          <p className="mt-1 text-xs text-muted-foreground">Active listings</p>
        </Card>
      </div>

      <NeedsAttention
        orders={sellerOrders}
        messages={sellerMessages}
        products={sellerProducts}
        userId={user.id}
      />

      {(pendingOrders > 0 || unreadMessages > 0 || lowStockProducts > 0) && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">What needs attention</p>
          <div className="space-y-2">
            {pendingOrders > 0 && (
              <Link href="/dashboard/orders" className="block">
                <Card className="flex items-center justify-between gap-3 border-amber-200 bg-amber-50/60 p-3">
                  <div className="flex items-center gap-3">
                    <PackageCheck className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-medium text-amber-900">{pendingOrders} order{pendingOrders > 1 ? 's' : ''} waiting for processing</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-700" />
                </Card>
              </Link>
            )}

            {unreadMessages > 0 && (
              <Link href="/dashboard/messages" className="block">
                <Card className="flex items-center justify-between gap-3 border-sky-200 bg-sky-50/60 p-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-sky-700" />
                    <span className="text-sm font-medium text-sky-900">{unreadMessages} unread customer message{unreadMessages > 1 ? 's' : ''}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-sky-700" />
                </Card>
              </Link>
            )}

            {lowStockProducts > 0 && (
              <Link href="/dashboard/products" className="block">
                <Card className="flex items-center justify-between gap-3 border-orange-200 bg-orange-50/60 p-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-orange-700" />
                    <span className="text-sm font-medium text-orange-900">{lowStockProducts} product{lowStockProducts > 1 ? 's' : ''} running low</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-orange-700" />
                </Card>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recent activity</p>
        <div className="space-y-2">
          {recentOrders.length > 0 || recentMessages.length > 0 ? (
            <>
              {recentOrders.map((order) => (
                <Card key={order.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">New order received</p>
                      <p className="text-xs text-muted-foreground">GH₵{Number(order.total || 0).toFixed(2)}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Just now</span>
                  </div>
                </Card>
              ))}
              {recentMessages.map((message) => (
                <Card key={message.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">New customer message</p>
                      <p className="text-xs text-muted-foreground">{message.text?.slice(0, 36) || 'Customer inquiry'}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Now</span>
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <Card className="p-4 text-sm text-muted-foreground">No recent activity yet. Add your first product to start attracting customers.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
