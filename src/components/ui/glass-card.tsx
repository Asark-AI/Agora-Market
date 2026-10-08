'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  accent?: 'gold' | 'none';
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ accent = 'none', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('agora-glass-card text-card-foreground', accent === 'gold' && 'border-primary/25', className)}
      {...props}
    />
  )
);

GlassCard.displayName = 'GlassCard';
