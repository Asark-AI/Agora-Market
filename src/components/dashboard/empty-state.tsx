'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: Route;
}

export function DashboardEmptyState({
  icon = <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="p-8 text-center">
      {icon}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>
            <span>＋</span> {actionLabel}
          </Button>
        </Link>
      )}
    </Card>
  );
}
