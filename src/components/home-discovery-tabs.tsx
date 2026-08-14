'use client';

import React, { useMemo, useState } from 'react';
import { ProductCard } from './product-card';
import { Button } from '@/components/ui/button';

type Product = any;

export default function HomeDiscoveryTabs({ products }: { products: Product[] }) {
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'deals', label: '🔥 Deals' },
    { key: '5star', label: '⭐ 5-Star' },
    { key: 'best', label: 'Best-Selling' },
    { key: 'new', label: 'New Arrivals' },
  ];

  const [active, setActive] = useState('all');

  const filtered = useMemo(() => {
    switch (active) {
      case 'deals':
        return products.filter(p => p.discountPrice != null);
      case '5star':
        return products.filter(p => (p.ratingAverage ?? 0) >= 4.5);
      case 'best':
        return products.slice().sort((a,b)=> (b.soldCount||0)-(a.soldCount||0));
      case 'new':
        return products.slice().sort((a,b)=> (new Date(b.createdAt||0) as any)-(new Date(a.createdAt||0) as any));
      default:
        return products;
    }
  }, [active, products]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-3 overflow-x-auto py-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${active===t.key? 'bg-primary text-primary-foreground' : 'bg-background border border-border/70 text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.slice(0, 24).map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
