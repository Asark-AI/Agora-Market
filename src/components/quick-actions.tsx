
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart, MessageSquare, Briefcase, Calendar, BarChart, Eye, Database } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface QuickActionsProps {
  isStore: boolean;
}

export function QuickActions({ isStore }: QuickActionsProps) {
  const { user, seller } = useAuth();
  
  if (!seller) return null;
  
  return (
    <div className="flex items-center gap-2">
      <Button asChild>
        <Link href="/dashboard/add-product">
          <PlusCircle className="mr-2 size-4" />
          New {isStore ? 'Product' : 'Service'}
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="#">
          <Database className="mr-2 size-4" />
          Connect Data
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/dashboard/orders">
          <ShoppingCart className="mr-2 size-4" />
          Review Orders
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/store/${seller.id}`} target="_blank">
          <Eye className="mr-2 size-4" />
          View Storefront
        </Link>
      </Button>
    </div>
  );
}
