'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileClock,
  RefreshCw,
  Store,
  Trash2,
  Users,
  Search,
} from 'lucide-react';
import { SuperAdminShell } from '@/components/super-admin-shell';
import { useSuperAdmin } from '@/hooks/use-super-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Seller } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

type SellerWithCreatedAt = Seller & { createdAt?: unknown };

function getStatus(record: Record<string, unknown>) {
  return typeof record.status === 'string' ? record.status : 'unknown';
}

function getRecordName(record: Record<string, unknown>, fallback: string) {
  const candidates = ['name', 'businessName', 'title', 'email'];
  const value = candidates.map((key) => record[key]).find((candidate) => typeof candidate === 'string' && candidate.trim());
  return typeof value === 'string' ? value : fallback;
}

function formatDate(value: unknown) {
  if (!value) return 'No date';
  const date = value instanceof Date ? value : new Date(typeof value === 'string' || typeof value === 'number' ? value : '');
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-GH', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function statusTone(status: string) {
  if (['active', 'approved', 'resolved'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['pending', 'open', 'under-review'].includes(status)) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (['suspended', 'rejected', 'closed'].includes(status)) return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function StatCard({ label, value, detail, icon: Icon, accent }: { label: string; value: number; detail: string; icon: typeof Users; accent: string }) {
  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)]">
      <CardContent className="relative p-5">
        <div className={`absolute right-0 top-0 h-20 w-20 rounded-bl-[32px] ${accent}`} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 font-headline text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingOverview() {
  return (
    <div className="space-y-8">
      <div><Skeleton className="h-10 w-72" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}</div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
    </div>
  );
}

export default function SuperAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'overview';
  const pageTitle = view === 'overview' ? 'Admin overview' : `${view.charAt(0).toUpperCase()}${view.slice(1)} management`;
  const { user, logOut, isSuperAdmin, authLoading, claimsLoading, dataLoading, snapshot, error, refresh, deleteUser, deleteProduct, moderate } = useSuperAdmin();
  const { toast } = useToast();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading || claimsLoading) return;
    if (!user) router.replace('/sign-in');
    else if (!isSuperAdmin) router.replace('/dashboard');
  }, [authLoading, claimsLoading, isSuperAdmin, router, user]);

  const recentSellers = useMemo(
    () => [...snapshot.sellers].sort((left, right) => String((right as SellerWithCreatedAt).createdAt || '').localeCompare(String((left as SellerWithCreatedAt).createdAt || ''))).slice(0, 6),
    [snapshot.sellers]
  );
  const recentApplications = useMemo(
    () => [...snapshot.applications].slice(0, 6),
    [snapshot.applications]
  );
  const recentUsers = useMemo(() => snapshot.users.slice(0, 6), [snapshot.users]);
  const recentProducts = useMemo(() => snapshot.products.slice(0, 6), [snapshot.products]);
  const focusedRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const records = view === 'sellers' ? snapshot.sellers : view === 'users' ? snapshot.users : view === 'applications' ? snapshot.applications : snapshot.reports;
    if (!term) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }, [searchTerm, snapshot, view]);

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Delete the Firestore profile for ${name}? This does not delete their Firebase Authentication account.`)) return;
    const reason = window.prompt(`Reason for deleting ${name} (minimum 5 characters):`, 'Policy violation');
    if (!reason || reason.trim().length < 5) return;
    setDeletingKey(`user:${userId}`);
    try {
      await deleteUser(userId, reason);
      toast({ title: 'User profile deleted', description: `${name}'s Firestore profile was removed.` });
    } catch (deleteError) {
      toast({ variant: 'destructive', title: 'Unable to delete user', description: deleteError instanceof Error ? deleteError.message : 'Please try again.' });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleDeleteProduct = async (product: AdminRecord) => {
    const name = getRecordName(product, 'this product');
    if (!window.confirm(`Delete ${name} permanently from the seller catalog?`)) return;
    const reason = window.prompt(`Reason for deleting ${name} (minimum 5 characters):`, 'Marketplace policy violation');
    if (!reason || reason.trim().length < 5) return;
    setDeletingKey(`product:${product.id}`);
    try {
      await deleteProduct(String(product.sellerId), product.id, reason);
      toast({ title: 'Product deleted', description: `${name} was removed from the catalog.` });
    } catch (deleteError) {
      toast({ variant: 'destructive', title: 'Unable to delete product', description: deleteError instanceof Error ? deleteError.message : 'Please try again.' });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleModerate = async (type: 'seller' | 'product' | 'user', record: AdminRecord, nextStatus: string) => {
    const name = getRecordName(record, 'this record');
    const reason = window.prompt(`Reason for changing ${name} to ${nextStatus} (minimum 5 characters):`);
    if (!reason || reason.trim().length < 5) return;
    try {
      await moderate(type, record.id, nextStatus, reason, typeof record.sellerId === 'string' ? record.sellerId : undefined);
      toast({ title: 'Moderation action completed', description: `${name} is now ${nextStatus}.` });
    } catch (moderationError) {
      toast({ variant: 'destructive', title: 'Action not completed', description: moderationError instanceof Error ? moderationError.message : 'Please try again.' });
    }
  };

  if (authLoading || claimsLoading || !user) return <LoadingOverview />;
  if (!isSuperAdmin) return null;

  return (
    <SuperAdminShell userName={user.name || user.email} onLogOut={logOut}>
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live platform view
            </div>
            <h2 className="font-headline text-3xl font-semibold tracking-tight sm:text-4xl">{pageTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A clear read on Agora&apos;s marketplace health, seller activity, and items waiting for review.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Secure super-admin session</div>
        </section>

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 shrink-0" /><span>{error}</span></div>
            <Button variant="outline" onClick={() => void refresh()} disabled={dataLoading} className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
          </div>
        )}

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={`Search ${view === 'overview' ? 'the admin workspace' : view}...`} className="h-10 border-slate-200 bg-slate-50 pl-9" /></div>
          <Button variant="outline" onClick={() => void refresh()} disabled={dataLoading} className="shrink-0"><RefreshCw className={`mr-2 h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />Refresh data</Button>
        </section>

        {view !== 'overview' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Operations workspace</p><h2 className="mt-2 font-headline text-2xl font-semibold capitalize">{view}</h2><p className="mt-1 text-sm text-slate-500">Search and review live marketplace records.</p></div>
            {dataLoading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div> : focusedRecords.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No matching {view} records found.</div> : <div className="divide-y divide-slate-100">{focusedRecords.map((record) => <div key={record.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold">{getRecordName(record, 'Unnamed record')}</p><p className="mt-1 truncate text-xs text-slate-500">{getStatus(record)} · {formatDate(record.createdAt)}</p></div><div className="flex items-center gap-3"><Badge variant="outline" className={statusTone(getStatus(record))}>{getStatus(record)}</Badge>{view === 'sellers' && getStatus(record) === 'pending' && <Button size="sm" onClick={() => void handleModerate('seller', record, 'approved')}>Approve</Button>}{view === 'sellers' && getStatus(record) === 'active' && <Button size="sm" variant="outline" onClick={() => void handleModerate('seller', record, 'suspended')}>Suspend</Button>}{view === 'users' && getStatus(record) !== 'suspended' && <Button size="sm" variant="outline" onClick={() => void handleModerate('user', record, 'suspended')}>Suspend</Button>}{view === 'users' && getStatus(record) === 'suspended' && <Button size="sm" onClick={() => void handleModerate('user', record, 'active')}>Restore</Button>}{view === 'products' && getStatus(record) === 'pending_review' && <Button size="sm" onClick={() => void handleModerate('product', record, 'approved')}>Approve</Button>}</div></div>)}</div>}
          </section>
        )}

        <section className={`${view === 'overview' ? '' : 'hidden'} grid gap-4 sm:grid-cols-2 xl:grid-cols-4`}>
          <StatCard label="Total users" value={snapshot.metrics.users} detail="Registered marketplace accounts" icon={Users} accent="bg-emerald-100/70" />
          <StatCard label="Active sellers" value={snapshot.metrics.activeSellers} detail={`${snapshot.metrics.sellers} seller profiles in total`} icon={Store} accent="bg-sky-100/70" />
          <StatCard label="Applications to review" value={snapshot.metrics.pendingApplications} detail={`${snapshot.metrics.applications} applications in total`} icon={FileClock} accent="bg-amber-100/80" />
          <StatCard label="Open reports" value={snapshot.metrics.openReports} detail={`${snapshot.metrics.reports} reports in total`} icon={AlertTriangle} accent="bg-rose-100/80" />
        </section>

        <section className={`${view === 'overview' ? '' : 'hidden'} grid gap-5 xl:grid-cols-[1.35fr_1fr]`}>
          <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div><CardTitle className="font-headline text-xl">Seller network</CardTitle><p className="mt-1 text-sm text-slate-500">The latest businesses connected to Agora.</p></div>
              <Button variant="ghost" size="sm" className="text-emerald-700">View all <ArrowUpRight className="ml-1 h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="p-0">
              {dataLoading ? <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : recentSellers.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No seller profiles have been created yet.</div> : (
                <div className="divide-y divide-slate-100">{recentSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4efe6] text-sm font-bold text-[#24553d]">{seller.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{seller.name}</p><p className="truncate text-xs text-slate-500">{seller.businessType} · {seller.regionId || 'Region not set'}</p></div></div>
                    <div className="text-right"><Badge variant="outline" className={statusTone(seller.status)}>{seller.status || 'unknown'}</Badge><p className="mt-1 text-[11px] text-slate-400">{formatDate((seller as SellerWithCreatedAt).createdAt)}</p></div>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6"><CardTitle className="font-headline text-xl">Review queue</CardTitle><p className="mt-1 text-sm text-slate-500">Applications and platform reports.</p></CardHeader>
            <CardContent className="p-0">{dataLoading ? <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : recentApplications.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Your review queue is clear.</div> : <div className="divide-y divide-slate-100">{recentApplications.map((application) => <div key={application.id} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold">{getRecordName(application, 'Seller application')}</p><p className="mt-1 text-xs text-slate-500">Seller application · {formatDate(application.createdAt)}</p></div><Badge variant="outline" className={statusTone(getStatus(application))}>{getStatus(application)}</Badge></div>)}</div>}</CardContent>
          </Card>
        </section>

        <section className={`${view === 'overview' ? '' : 'hidden'} grid gap-5 xl:grid-cols-2`}>
          <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6"><CardTitle className="font-headline text-xl">User profiles</CardTitle><p className="mt-1 text-sm text-slate-500">Remove platform profiles that should no longer be active.</p></CardHeader>
            <CardContent className="p-0">{recentUsers.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No user profiles found.</div> : <div className="divide-y divide-slate-100">{recentUsers.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.name || 'Unnamed user'}</p><p className="truncate text-xs text-slate-500">{account.email} · {account.role}</p></div><Button type="button" variant="ghost" size="icon" className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${account.name || 'user'}`} disabled={deletingKey === `user:${account.id}`} onClick={() => handleDeleteUser(account.id, account.name || account.email)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}</CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6"><CardTitle className="font-headline text-xl">Product catalog</CardTitle><p className="mt-1 text-sm text-slate-500">Remove listings that violate marketplace standards.</p></CardHeader>
            <CardContent className="p-0">{recentProducts.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No product listings found.</div> : <div className="divide-y divide-slate-100">{recentProducts.map((product) => <div key={`${product.sellerId}:${product.id}`} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold">{getRecordName(product, 'Unnamed product')}</p><p className="truncate text-xs text-slate-500">{String(product.sellerName || 'Unknown seller')} · {typeof product.price === 'number' ? `₵${product.price.toFixed(2)}` : 'Price unavailable'}</p></div><Button type="button" variant="ghost" size="icon" className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${getRecordName(product, 'product')}`} disabled={deletingKey === `product:${product.id}`} onClick={() => handleDeleteProduct(product)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}</CardContent>
          </Card>
        </section>
      </div>
    </SuperAdminShell>
  );
}
