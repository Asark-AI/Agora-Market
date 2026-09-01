'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Package, MessageSquare } from 'lucide-react';
import type { Seller, Order, Product } from '@/lib/types';

interface KPIGridProps {
  seller: Seller | null;
  revenue: number;
  orders: Order[];
  products: Product[];
  messages: { read: boolean; senderId: string; userId: string }[];
  userId: string;
}

export function KPIGrid({ seller, revenue, orders, products, messages, userId }: KPIGridProps) {
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const unreadMessages = messages.filter((m) => !m.read && m.senderId !== userId).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  const kpis = [
    {
      label: 'Revenue',
      value: `GH₵${revenue.toFixed(2)}`,
      icon: DollarSign,
      href: '/dashboard/analytics',
      color: 'text-emerald-600',
      trend: revenue > 0 ? '↑ 12%' : null,
    },
    {
      label: 'Orders',
      value: orders.length,
      badge: pendingOrders > 0 ? `${pendingOrders} pending` : undefined,
      icon: ShoppingCart,
      href: '/dashboard/orders',
      color: 'text-blue-600',
    },
    {
      label: 'Products',
      value: activeProducts,
      badge: activeProducts === 0 ? 'Add first' : undefined,
      icon: Package,
      href: '/dashboard/products',
      color: 'text-purple-600',
    },
    {
      label: 'Messages',
      value: unreadMessages > 0 ? unreadMessages : 0,
      badge: unreadMessages > 0 ? 'unread' : undefined,
      icon: MessageSquare,
      href: '/dashboard/messages',
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {kpis.map(({ label, value, badge, icon: Icon, href, color }) => (
        <Link key={label} href={href as Route}>
          <Card className="h-full transition hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold mb-1">
                  {typeof value === 'number' ? value : value}
                </div>
                {badge && (
                  <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
                    {badge}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
