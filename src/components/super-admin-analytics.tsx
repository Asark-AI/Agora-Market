'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, ChartNoAxesCombined, Clock3, CreditCard, RefreshCw, ShoppingBag, Store } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminAnalytics, type AdminAnalyticsPeriod } from '@/app/super/data-actions';

type AnalyticsData = Awaited<ReturnType<typeof getAdminAnalytics>>;

const periods: { value: AdminAnalyticsPeriod; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
];

const currency = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact', maximumFractionDigits: 1 });

function AnalyticsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading platform analytics">
      <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-lg" />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]"><Skeleton className="h-[380px] rounded-lg" /><Skeleton className="h-[380px] rounded-lg" /></div>
      <div className="grid gap-4 xl:grid-cols-2"><Skeleton className="h-72 rounded-lg" /><Skeleton className="h-72 rounded-lg" /></div>
    </div>
  );
}

function Metric({ title, value, detail, icon: Icon, accent }: { title: string; value: string; detail: string; icon: typeof Activity; accent: string }) {
  return (
    <div className="border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>
        <span className={`flex size-9 shrink-0 items-center justify-center ${accent}`}><Icon className="size-4" /></span>
      </div>
    </div>
  );
}

function Breakdown({ title, icon: Icon, items }: { title: string; icon: typeof Activity; items: { label: string; count: number }[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Icon className="size-4 text-emerald-700" /><div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{total.toLocaleString()} orders in this period</p></div></header>
      {items.length ? <div className="divide-y divide-slate-100 px-5">{items.map((item) => <div key={item.label} className="py-3"><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="capitalize text-slate-700">{item.label.replaceAll('_', ' ')}</span><span className="tabular-nums text-slate-500">{item.count.toLocaleString()} <span className="text-xs">{total ? `(${Math.round(item.count / total * 100)}%)` : ''}</span></span></div><div className="h-1.5 overflow-hidden bg-slate-100"><div className="h-full bg-emerald-600" style={{ width: `${total ? item.count / total * 100 : 0}%` }} /></div></div>)}</div> : <p className="px-5 py-8 text-sm text-slate-500">No order data for this period.</p>}
    </section>
  );
}

export function SuperAdminAnalytics() {
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    setIsLoading(true);
    setError('');
    getAdminAnalytics(period).then((result) => {
      if (current) setData(result);
    }).catch(() => {
      if (current) setError('Platform analytics could not be loaded. Retry the request.');
    }).finally(() => {
      if (current) setIsLoading(false);
    });
    return () => { current = false; };
  }, [period]);

  const refresh = () => {
    setIsLoading(true);
    setError('');
    getAdminAnalytics(period).then(setData).catch(() => setError('Platform analytics could not be loaded. Retry the request.')).finally(() => setIsLoading(false));
  };

  return (
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800"><ChartNoAxesCombined className="size-4" /> Marketplace intelligence</div><h2 className="font-headline text-3xl font-semibold tracking-tight text-slate-950">Platform analytics</h2><p className="mt-2 max-w-2xl text-sm text-slate-600">Order volume, sales value, fulfilment, and payment activity from marketplace records.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex border border-slate-200 bg-white p-1" role="group" aria-label="Analytics date range">{periods.map((item) => <Button key={item.value} type="button" size="sm" variant={period === item.value ? 'default' : 'ghost'} className="h-8 rounded-none px-3" aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</Button>)}</div>
            <Button type="button" size="icon" variant="outline" aria-label="Refresh analytics" title="Refresh analytics" onClick={refresh} disabled={isLoading}><RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
          </div>
        </header>

        {isLoading ? <AnalyticsLoading /> : error ? <div role="alert" className="flex flex-col gap-3 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button variant="outline" onClick={refresh}>Retry</Button></div> : data ? <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Orders placed" value={data.orderCount.toLocaleString()} detail={`${data.cancelledOrders.toLocaleString()} cancelled or refunded`} icon={ShoppingBag} accent="bg-sky-50 text-sky-800" />
            <Metric title="Order value" value={currency.format(data.orderValue)} detail="Excludes cancelled and refunded orders" icon={Activity} accent="bg-emerald-50 text-emerald-800" />
            <Metric title="Completed value" value={currency.format(data.completedValue)} detail={`${data.completedOrders.toLocaleString()} completed orders`} icon={ArrowUpRight} accent="bg-amber-50 text-amber-800" />
            <Metric title="Average order value" value={currency.format(data.averageOrderValue)} detail="Non-cancelled orders" icon={ArrowDownRight} accent="bg-rose-50 text-rose-800" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
            <section className="min-w-0 border border-slate-200 bg-white">
              <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Marketplace order value</h2><p className="mt-1 text-xs text-slate-500">Daily for short ranges, weekly for 90 days, monthly for 12 months</p></div><span className="text-xs font-medium text-slate-500">GHS</span></header>
              <div className="h-[300px] px-2 pb-3 pt-5 sm:px-4" aria-busy={isLoading}>
                {data.trend.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}><defs><linearGradient id="adminOrderValue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16825d" stopOpacity={0.2} /><stop offset="100%" stopColor="#16825d" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8edf0" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#697780', fontSize: 11 }} minTickGap={22} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#697780', fontSize: 11 }} tickFormatter={(value: number) => compactCurrency.format(value)} width={68} /><Tooltip formatter={(value) => [currency.format(Number(value)), 'Order value']} contentStyle={{ border: '1px solid #dce4e7', borderRadius: 4, fontSize: 12 }} /><Area type="monotone" dataKey="value" stroke="#16825d" strokeWidth={2.5} fill="url(#adminOrderValue)" activeDot={{ r: 4, fill: '#16825d' }} /></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-500">No orders recorded in this date range.</div>}
              </div>
            </section>

            <section className="border border-slate-200 bg-white">
              <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Store className="size-4 text-emerald-700" /><div><h2 className="text-sm font-semibold text-slate-900">Top sellers</h2><p className="mt-0.5 text-xs text-slate-500">Ranked by order value</p></div></header>
              {data.topSellers.length ? <div className="divide-y divide-slate-100">{data.topSellers.map((seller, index) => <div key={seller.id || index} className="flex items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="flex size-7 shrink-0 items-center justify-center bg-slate-100 text-xs font-semibold tabular-nums text-slate-600">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{seller.name}</p><p className="mt-1 text-xs text-slate-500">{seller.orders} orders</p></div></div><p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{currency.format(seller.value)}</p></div>)}</div> : <p className="px-5 py-8 text-sm text-slate-500">No seller orders in this date range.</p>}
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2"><Breakdown title="Order status" icon={Clock3} items={data.statuses.map(({ status, count }) => ({ label: status, count }))} /><Breakdown title="Payment methods" icon={CreditCard} items={data.paymentMethods.map(({ method, count }) => ({ label: method, count }))} /></div>
          <p className="text-right text-xs text-slate-500">Updated {new Intl.DateTimeFormat('en-GH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))}{isLoading ? ' · Refreshing' : ''}</p>
        </> : null}
      </div>
  );
}
