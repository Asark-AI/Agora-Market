'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, MessageSquare, Package, FileText, AlertTriangle } from 'lucide-react';
import type { Order, Product, ServiceProduct } from '@/lib/types';

interface AttentionItem {
  id: string;
  type: 'order' | 'message' | 'stock' | 'draft' | 'review';
  text: string;
  href: Route;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

interface NeedsAttentionProps {
  orders: Order[];
  messages: { read: boolean; senderId: string; userId: string }[];
  products: Array<Product | ServiceProduct>;
  userId: string;
}

export function NeedsAttention({ orders, messages, products, userId }: NeedsAttentionProps) {
  const items: AttentionItem[] = [];

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  if (pendingOrders.length > 0) {
    items.push({
      id: 'pending-orders',
      type: 'order',
      text: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} waiting for processing`,
      href: '/dashboard/orders',
      icon: <Package className="size-4 text-amber-700" />,
      priority: 'high',
    });
  }

  const unreadMessages = messages.filter((m) => !m.read && m.senderId !== userId);
  if (unreadMessages.length > 0) {
    items.push({
      id: 'unread-messages',
      type: 'message',
      text: `${unreadMessages.length} unread message${unreadMessages.length > 1 ? 's' : ''}`,
      href: '/dashboard/messages',
      icon: <MessageSquare className="size-4 text-sky-700" />,
      priority: 'high',
    });
  }

  const productsWithStock = products.filter((p) => 'stock' in p) as Product[];
  const lowStockProducts = productsWithStock.filter((p) => p.stock > 0 && p.stock <= 5);
  if (lowStockProducts.length > 0) {
    items.push({
      id: 'low-stock',
      type: 'stock',
      text: `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''} running low`,
      href: '/dashboard/products',
      icon: <AlertTriangle className="size-4 text-orange-700" />,
      priority: 'medium',
    });
  }

  const draftProducts = products.filter((p) => p.status === 'draft');
  if (draftProducts.length > 0) {
    items.push({
      id: 'drafts',
      type: 'draft',
      text: `${draftProducts.length} draft${draftProducts.length > 1 ? 's' : ''} waiting to be published`,
      href: '/dashboard/products',
      icon: <FileText className="size-4 text-muted-foreground" />,
      priority: 'medium',
    });
  }

  if (items.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-emerald-900">You're all caught up</p>
            <p className="text-sm text-emerald-700">No actions requiring your attention right now.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Needs Your Attention</p>
      <div className="space-y-2">
        {items.map((item) => (
          <Link key={item.id} href={item.href}>
            <Card className={`p-3 transition cursor-pointer hover:border-primary/50 hover:shadow-sm ${
              item.priority === 'high' ? 'border-orange-200 bg-orange-50/50' : 'border-border'
            }`}>
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center bg-muted">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.text}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
