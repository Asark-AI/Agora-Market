'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BadgeCheck, CircleAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  accent?: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value, subtitle, trend, accent, icon: Icon }: MetricCardProps) {
  return (
    <Card className="overflow-hidden rounded-[22px] border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.28)]">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={cn('rounded-2xl p-2.5 shadow-sm', accent ?? 'bg-primary/10 text-primary')}>
            <Icon className="size-4" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{subtitle}</span>
          {trend ? <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-600">{trend}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

type QuickActionButtonProps = {
  label: string;
  href: Route;
  icon: LucideIcon;
  onNavigate?: () => void;
};

export function QuickActionButton({ label, href, icon: Icon, onNavigate }: QuickActionButtonProps) {
  return (
    <Button asChild variant="outline" className="h-10 shrink-0 rounded-full border-border/70 bg-background/90 px-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" onClick={onNavigate}>
      <Link href={href} className="inline-flex items-center gap-2 whitespace-nowrap">
        <Icon className="size-4" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionHref?: Route;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, actionHref, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {actionLabel && actionHref ? (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={onAction}>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

type InsightCardProps = {
  title: string;
  value: string;
  detail: string;
  icon?: LucideIcon;
};

export function InsightCard({ title, value, detail, icon: Icon }: InsightCardProps) {
  return (
    <Card className="rounded-[20px] border border-border/70 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {Icon ? <Icon className="size-4 text-primary" /> : <Sparkles className="size-4 text-primary" />}
          <span>{title}</span>
        </div>
        <p className="mt-3 text-xl font-semibold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

type NotificationCardProps = {
  title: string;
  description: string;
  badge?: string;
};

export function NotificationCard({ title, description, badge }: NotificationCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[18px] border border-border/70 bg-gradient-to-r from-background to-muted/20 p-3 shadow-sm">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {badge ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">{badge}</span> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-border/70 bg-gradient-to-br from-background to-muted/25 p-6 text-center shadow-sm">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CircleAlert className="size-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function SkeletonLoader({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
      ))}
    </div>
  );
}

export function BusinessBadge({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/95 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{detail}</p>
    </div>
  );
}
