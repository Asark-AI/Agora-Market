'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { PlusCircle, BarChart3, Boxes, MessageSquare, Zap } from 'lucide-react';

interface QuickActionsProps {
  hasProducts: boolean;
}

export function QuickActions({ hasProducts }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Quick Actions</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Primary action: Add Product */}
        <Link href="/dashboard/add-product" className="col-span-2 sm:col-span-1">
          <Button className="w-full h-auto flex-col gap-2 py-4 bg-primary hover:bg-primary/90 transition">
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs font-semibold">Add Product</span>
          </Button>
        </Link>

        {/* Secondary actions */}
        {hasProducts && (
          <>
            <Link href="/dashboard/orders" className="col-span-1">
              <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 transition hover:border-primary/50">
                <Boxes className="h-5 w-5" />
                <span className="text-xs font-semibold">Orders</span>
              </Button>
            </Link>

            <Link href="/dashboard/products" className="col-span-1">
              <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 transition hover:border-primary/50">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs font-semibold">Products</span>
              </Button>
            </Link>

            <Link href="/dashboard/messages" className="col-span-1">
              <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 transition hover:border-primary/50">
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs font-semibold">Messages</span>
              </Button>
            </Link>

            <Link href="/dashboard/analytics" className="col-span-1">
              <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 transition hover:border-primary/50">
                <Zap className="h-5 w-5" />
                <span className="text-xs font-semibold">Analytics</span>
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
