'use client';

import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import type { Order, Product } from '@/lib/types';

interface RecentActivityItem {
  id: string;
  type: 'order' | 'product' | 'message';
  title: string;
  timestamp: Date;
  icon: string;
}

interface RecentActivityProps {
  orders: Order[];
  products: Product[];
  messages: { timestamp?: Date | string; createdAt?: Date | string; senderId: string; userId: string; text?: string }[];
}

export function RecentActivity({ orders, products, messages }: RecentActivityProps) {
  const activities: RecentActivityItem[] = [];

  // Add recent orders
  orders.slice(0, 3).forEach((order) => {
    activities.push({
      id: `order-${order.id}`,
      type: 'order',
      title: `New order #${order.id.slice(0, 8)}`,
      timestamp: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt),
      icon: '📦',
    });
  });

  // Add recently added products
  products
    .filter((p) => p.status === 'active')
    .slice(0, 2)
    .forEach((product) => {
      activities.push({
        id: `product-${product.id}`,
        type: 'product',
        title: `Product published: ${product.name}`,
        timestamp: product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt || Date.now()),
        icon: '🛍️',
      });
    });

  // Add recent messages
  messages
    .slice(0, 2)
    .forEach((message, index) => {
      const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp || Date.now());
      activities.push({
        id: `message-${index}`,
        type: 'message',
        title: `New customer message`,
        timestamp,
        icon: '💬',
      });
    });

  // Sort by timestamp (newest first)
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (activities.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Recent Activity</p>
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No activity yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Start by adding your first product.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Recent Activity</p>
      <div className="space-y-2">
        {activities.slice(0, 5).map((activity) => (
          <Card key={activity.id} className="p-3 border transition hover:border-primary/50">
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
