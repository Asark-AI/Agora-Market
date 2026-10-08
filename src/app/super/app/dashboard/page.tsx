'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileClock,
  Package,
  RefreshCw,
  Store,
  Trash2,
  Users,
  Search,
} from 'lucide-react';
import { useSuperAdmin } from '@/hooks/use-super-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Seller, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { AdminRecord } from '@/hooks/use-super-admin';
import { deleteSolutionDefinition, saveSolutionDefinition } from '@/lib/server/solutions';

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
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
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

type RequirementDraft = {
  id: string;
  name: string;
  description: string;
  type: 'required' | 'optional' | 'conditional';
  required: boolean;
  minQuantity: string;
  maxQuantity: string;
  quantity: string;
  keywords: string;
  categoryIds: string;
  notes: string;
};

type SolutionDraft = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'archived';
  image: string;
  budgetHint: string;
  budgetMin: string;
  budgetMax: string;
  targetAudience: string;
  useCases: string;
  outcomes: string;
  questions: string;
  requirements: RequirementDraft[];
};

const emptySolutionDraft: SolutionDraft = {
  id: '',
  slug: '',
  name: '',
  description: '',
  category: 'Computing',
  status: 'draft',
  image: '',
  budgetHint: '',
  budgetMin: '',
  budgetMax: '',
  targetAudience: '',
  useCases: '',
  outcomes: '',
  questions: 'What is your budget?\nWhat are you trying to achieve?\nDo you already own any equipment?',
  requirements: [],
};

const createRequirementDraft = (): RequirementDraft => ({
  id: '',
  name: '',
  description: '',
  type: 'required',
  required: true,
  minQuantity: '1',
  maxQuantity: '',
  quantity: '1',
  keywords: '',
  categoryIds: '',
  notes: '',
});

const splitDraftLines = (value: string) => value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
const splitDraftList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const solutionSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function SuperAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'overview';
  const pageTitle = view === 'overview' ? 'Admin overview' : `${view.charAt(0).toUpperCase()}${view.slice(1)} management`;
  const { user, isSuperAdmin, authLoading, claimsLoading, dataLoading, snapshot, error, refresh, deleteUser, deleteUsers, deleteProduct, deleteSeller, moderate } = useSuperAdmin();
  const { toast } = useToast();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [moderatingKey, setModeratingKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [solutionDraft, setSolutionDraft] = useState<SolutionDraft>(emptySolutionDraft);
  const [solutionFormSaving, setSolutionFormSaving] = useState(false);

  useEffect(() => {
    if (authLoading || claimsLoading) return;
    if (!user) router.replace('/admin/sign-in');
    else if (!isSuperAdmin) router.replace('/');
  }, [authLoading, claimsLoading, isSuperAdmin, router, user]);

  const recentSellers = useMemo(
    () => [...snapshot.sellers].sort((left, right) => String((right as SellerWithCreatedAt).createdAt ?? '').localeCompare(String((left as SellerWithCreatedAt).createdAt ?? ''))).slice(0, 6),
    [snapshot.sellers]
  );
  const recentApplications = useMemo(
    () => snapshot.applications.filter((application) => ['pending', 'under-review'].includes(getStatus(application).toLowerCase())).slice(0, 6),
    [snapshot.applications]
  );
  const recentUsers = useMemo(
    () => [...snapshot.users].sort((left, right) => String((right as User & { createdAt?: unknown }).createdAt ?? '').localeCompare(String((left as User & { createdAt?: unknown }).createdAt ?? ''))).slice(0, 6),
    [snapshot.users]
  );
  const recentProducts = useMemo(() => snapshot.products.slice(0, 6), [snapshot.products]);
  const focusedRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const records = view === 'sellers' ? snapshot.sellers : view === 'users' ? snapshot.users : view === 'products' ? snapshot.products : view === 'applications' ? snapshot.applications : view === 'solutions' ? snapshot.solutions : snapshot.reports;
    if (!term) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }, [searchTerm, snapshot, view]);
  const selectableUserIds = useMemo(
    () => view === 'users' ? focusedRecords.filter((record) => record.id !== user?.id).map((record) => record.id) : [],
    [focusedRecords, user?.id, view]
  );
  const selectedVisibleCount = selectableUserIds.filter((id) => selectedUserIds.includes(id)).length;
  const allVisibleUsersSelected = selectableUserIds.length > 0 && selectedVisibleCount === selectableUserIds.length;

  useEffect(() => {
    setSelectedUserIds((current) => current.filter((id) => selectableUserIds.includes(id)));
  }, [selectableUserIds]);

  const handleDeleteUser = async (userId: string, name: string) => {
    if (userId === user?.id) {
      toast({ variant: 'destructive', title: 'Cannot delete your own account', description: 'Use a different super-admin account to manage this account.' });
      return;
    }
    if (!window.confirm(`Permanently delete ${name}'s Agora account and sign-in access? This also removes their Firestore profile and cannot be undone.`)) return;
    const reason = window.prompt(`Reason for deleting ${name} (minimum 5 characters):`, 'Policy violation');
    if (!reason || reason.trim().length < 5) return;
    setDeletingKey(`user:${userId}`);
    try {
      await deleteUser(userId, reason);
      toast({ title: 'User account deleted', description: `${name}'s sign-in access and Firestore profile were removed.` });
    } catch (deleteError) {
      toast({ variant: 'destructive', title: 'Unable to delete user', description: deleteError instanceof Error ? deleteError.message : 'Please try again.' });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleBulkDeleteUsers = async () => {
    const selectedRecords = focusedRecords.filter((record) => selectedUserIds.includes(record.id) && record.id !== user?.id);
    if (!selectedRecords.length) return;
    const count = selectedRecords.length;
    if (!window.confirm(`Permanently delete ${count} selected user account${count === 1 ? '' : 's'} and remove their sign-in access? This cannot be undone.`)) return;
    const reason = window.prompt(`Reason for deleting ${count} user account${count === 1 ? '' : 's'} (minimum 5 characters):`, 'Policy violation');
    if (!reason || reason.trim().length < 5) return;
    setDeletingKey('users:bulk');
    try {
      const result = await deleteUsers(selectedRecords.map((record) => record.id), reason);
      setSelectedUserIds([]);
      if (result.failedIds.length) {
        toast({ variant: 'destructive', title: 'Some accounts were not deleted', description: `${result.deletedIds.length} deleted; ${result.failedIds.length} failed.` });
      } else {
        toast({ title: 'User accounts deleted', description: `${result.deletedIds.length} account${result.deletedIds.length === 1 ? '' : 's'} deleted.` });
      }
    } catch (deleteError) {
      toast({ variant: 'destructive', title: 'Unable to delete selected users', description: deleteError instanceof Error ? deleteError.message : 'Please try again.' });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleDeleteProduct = async (product: AdminRecord) => {
    const typedProduct = product as AdminRecord & { sellerId?: string; id: string };
    const name = getRecordName(product, 'this product');
    if (!window.confirm(`Delete ${name} permanently from the seller catalog?`)) return;
    const reason = window.prompt(`Reason for deleting ${name} (minimum 5 characters):`, 'Marketplace policy violation');
    if (!reason || reason.trim().length < 5) return;
    setDeletingKey(`product:${product.id}`);
    try {
      await deleteProduct(String(typedProduct.sellerId), typedProduct.id, reason);
      toast({ title: 'Product deleted', description: `${name} was removed from the catalog.` });
    } catch (deleteError) {
      toast({ variant: 'destructive', title: 'Unable to delete product', description: deleteError instanceof Error ? deleteError.message : 'Please try again.' });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleDeleteSeller = async (record: AdminRecord) => {
    const name = getRecordName(record, 'this seller');
    if (!window.confirm(`Delete ${name}'s seller profile and product listings? Historical orders will be retained, but the storefront and product catalog will be removed.`)) return;
    const reason = window.prompt(`Reason for deleting ${name} (minimum 5 characters):`, 'Marketplace policy violation');
    if (!reason || reason.trim().length < 5) return;
    setDeletingKey(`seller:${record.id}`);
    try {
      await deleteSeller(record.id, reason);
      toast({ title: 'Seller deleted', description: `${name}'s seller profile and product listings were removed. Order history was retained.` });
    } catch (deleteError) {
      toast({ variant: 'destructive', title: 'Unable to delete seller', description: deleteError instanceof Error ? deleteError.message : 'Please try again.' });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleModerate = async (type: 'seller' | 'product' | 'user', record: AdminRecord, nextStatus: string) => {
    const typedRecord = record as AdminRecord & { sellerId?: string; createdAt?: unknown };
    const name = getRecordName(record, 'this record');
    if (type === 'seller' && nextStatus === 'approved' && !window.confirm(`Approve ${name} as an Agora seller? This enables Seller Center access and activates their storefront.`)) return;
    const reason = window.prompt(`Reason for changing ${name} to ${nextStatus} (minimum 5 characters):`);
    if (!reason || reason.trim().length < 5) return;
    setModeratingKey(`${type}:${record.id}`);
    try {
      await moderate(type, record.id, nextStatus, reason, typeof typedRecord.sellerId === 'string' ? typedRecord.sellerId : undefined);
      toast({ title: type === 'seller' && nextStatus === 'approved' ? 'Seller approved' : 'Moderation action completed', description: type === 'seller' && nextStatus === 'approved' ? `${name} is approved and active, Seller Center is enabled, and the application status is updated.` : `${name} is now ${nextStatus}.` });
    } catch (moderationError) {
      toast({ variant: 'destructive', title: 'Action not completed', description: moderationError instanceof Error ? moderationError.message : 'Please try again.' });
    } finally {
      setModeratingKey(null);
    }
  };

  const saveSolution = async () => {
    const name = solutionDraft.name.trim();
    const slug = solutionSlug(solutionDraft.slug || name) || 'solution';
    const description = solutionDraft.description.trim();
    const questions = splitDraftLines(solutionDraft.questions);
    const parseNumber = (value: string) => value.trim() ? Number(value) : undefined;
    const budgetHint = parseNumber(solutionDraft.budgetHint);
    const budgetMin = parseNumber(solutionDraft.budgetMin);
    const budgetMax = parseNumber(solutionDraft.budgetMax);

    if (!name) {
      toast({ variant: 'destructive', title: 'Solution title required', description: 'Add a name before saving the template.' });
      return;
    }

    if ([budgetHint, budgetMin, budgetMax].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0)) || (budgetMin !== undefined && budgetMax !== undefined && budgetMax < budgetMin)) {
      toast({ variant: 'destructive', title: 'Check the budget values', description: 'Budgets must be non-negative numbers, and the maximum cannot be below the minimum.' });
      return;
    }

    const invalidRequirement = solutionDraft.requirements.find((requirement) => {
      const minQuantity = Number(requirement.minQuantity);
      const quantity = Number(requirement.quantity);
      const maxQuantity = requirement.maxQuantity.trim() ? Number(requirement.maxQuantity) : undefined;
      return !requirement.name.trim() || !Number.isInteger(minQuantity) || minQuantity < 0 || !Number.isInteger(quantity) || quantity < Math.max(1, minQuantity) || (maxQuantity !== undefined && (!Number.isInteger(maxQuantity) || maxQuantity < minQuantity || quantity > maxQuantity));
    });

    if (invalidRequirement) {
      toast({ variant: 'destructive', title: 'Check the requirements', description: 'Each requirement needs a name and valid whole-number quantities. Maximum quantity must be at least the minimum and selected quantity.' });
      return;
    }

    const requirementIds = solutionDraft.requirements.map((requirement) => solutionSlug(requirement.id || requirement.name));
    if (new Set(requirementIds).size !== requirementIds.length) {
      toast({ variant: 'destructive', title: 'Requirement names must be unique', description: 'Each requirement needs a unique name or identifier.' });
      return;
    }

    setSolutionFormSaving(true);
    try {
      const payload = {
        id: solutionDraft.id || undefined,
        slug,
        name,
        description: description || 'Goal-based shopping experience for buyers.',
        category: solutionDraft.category || 'Computing',
        status: solutionDraft.status,
        image: solutionDraft.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        version: 1,
        questions: questions.length ? questions : ['What is your budget?', 'What are you trying to achieve?'],
        budgetHint,
        metadata: {
          targetAudience: solutionDraft.targetAudience.trim(),
          useCases: splitDraftLines(solutionDraft.useCases),
          outcomes: splitDraftLines(solutionDraft.outcomes),
          budgetRange: { currency: 'GHS' as const, min: budgetMin, max: budgetMax },
        },
        requirements: solutionDraft.requirements.map((requirement, index) => ({
          id: requirementIds[index],
          name: requirement.name.trim(),
          description: requirement.description.trim(),
          type: requirement.type,
          required: requirement.required,
          minQuantity: Number(requirement.minQuantity),
          maxQuantity: requirement.maxQuantity.trim() ? Number(requirement.maxQuantity) : undefined,
          quantity: Number(requirement.quantity),
          keywords: splitDraftList(requirement.keywords),
          categoryIds: splitDraftList(requirement.categoryIds),
          notes: splitDraftLines(requirement.notes),
        })),
      };
      await saveSolutionDefinition(payload);
      toast({ title: solutionDraft.id ? 'Solution updated' : 'Solution created', description: `${name} is now available to the marketplace.` });
      setSolutionDraft(emptySolutionDraft);
      await refresh('solutions');
    } catch (solutionError) {
      toast({ variant: 'destructive', title: 'Solution not saved', description: solutionError instanceof Error ? solutionError.message : 'Please try again.' });
    } finally {
      setSolutionFormSaving(false);
    }
  };

  const removeSolution = async (record: AdminRecord) => {
    if (!record.id) return;
    const label = getRecordName(record, 'this solution');
    if (!window.confirm(`Delete ${label}? This removes the template from the public catalog.`)) return;
    try {
      await deleteSolutionDefinition(record.id);
      toast({ title: 'Solution deleted', description: `${label} was removed from the solution library.` });
      await refresh('solutions');
    } catch (solutionError) {
      toast({ variant: 'destructive', title: 'Solution not deleted', description: solutionError instanceof Error ? solutionError.message : 'Please try again.' });
    }
  };

  const fillSolutionDraft = (record: AdminRecord) => {
    const solutionRecord = record as AdminRecord & {
      slug?: string;
      name?: string;
      description?: string;
      category?: string;
      status?: string;
      image?: string;
      budgetHint?: number | string;
      questions?: string[] | string;
      metadata?: {
        targetAudience?: string;
        useCases?: string[];
        outcomes?: string[];
        budgetRange?: { min?: number; max?: number };
      };
      requirements?: Array<{
        id?: string;
        name?: string;
        description?: string;
        type?: string;
        required?: boolean;
        minQuantity?: number;
        maxQuantity?: number;
        quantity?: number;
        keywords?: string[];
        categoryIds?: string[];
        notes?: string[];
      }>;
    };
    const nextStatus = solutionRecord.status === 'active' || solutionRecord.status === 'archived'
      ? solutionRecord.status
      : 'draft';

    setSolutionDraft({
      id: String(solutionRecord.id || ''),
      slug: String(solutionRecord.slug || ''),
      name: String(solutionRecord.name || ''),
      description: String(solutionRecord.description || ''),
      category: String(solutionRecord.category || 'Computing'),
      status: nextStatus as 'draft' | 'active' | 'archived',
      image: String(solutionRecord.image || ''),
      budgetHint: typeof solutionRecord.budgetHint === 'number' ? String(solutionRecord.budgetHint) : '',
      budgetMin: typeof solutionRecord.metadata?.budgetRange?.min === 'number' ? String(solutionRecord.metadata.budgetRange.min) : '',
      budgetMax: typeof solutionRecord.metadata?.budgetRange?.max === 'number' ? String(solutionRecord.metadata.budgetRange.max) : '',
      targetAudience: String(solutionRecord.metadata?.targetAudience || ''),
      useCases: Array.isArray(solutionRecord.metadata?.useCases) ? solutionRecord.metadata.useCases.join('\n') : '',
      outcomes: Array.isArray(solutionRecord.metadata?.outcomes) ? solutionRecord.metadata.outcomes.join('\n') : '',
      questions: Array.isArray(solutionRecord.questions) ? String(solutionRecord.questions.join('\n')) : (typeof solutionRecord.questions === 'string' ? solutionRecord.questions : emptySolutionDraft.questions),
      requirements: Array.isArray(solutionRecord.requirements) ? solutionRecord.requirements.map((requirement) => ({
        id: String(requirement.id || ''),
        name: String(requirement.name || ''),
        description: String(requirement.description || ''),
        type: requirement.type === 'optional' || requirement.type === 'conditional' ? requirement.type : 'required',
        required: requirement.required ?? requirement.type !== 'optional',
        minQuantity: String(requirement.minQuantity ?? 1),
        maxQuantity: typeof requirement.maxQuantity === 'number' ? String(requirement.maxQuantity) : '',
        quantity: String(requirement.quantity ?? 1),
        keywords: Array.isArray(requirement.keywords) ? requirement.keywords.join(', ') : '',
        categoryIds: Array.isArray(requirement.categoryIds) ? requirement.categoryIds.join(', ') : '',
        notes: Array.isArray(requirement.notes) ? requirement.notes.join('\n') : '',
      })) : [],
    });
  };

  if (authLoading || claimsLoading || !user) return <LoadingOverview />;
  if (!isSuperAdmin) return null;

  return (
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
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Operations workspace</p><h2 className="mt-2 font-headline text-2xl font-semibold capitalize">{view}</h2><p className="mt-1 text-sm text-slate-500">{view === 'solutions' ? 'Manage goal-based shopping templates for the public storefront.' : 'Search and review live marketplace records.'}</p></div>{view === 'users' && <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-slate-600"><Checkbox checked={allVisibleUsersSelected ? true : selectedVisibleCount > 0 ? 'indeterminate' : false} onCheckedChange={(checked) => setSelectedUserIds(checked === true ? selectableUserIds : [])} aria-label="Select all visible users" />Select visible users</label><Button type="button" variant="destructive" size="sm" onClick={() => void handleBulkDeleteUsers()} disabled={selectedVisibleCount === 0 || deletingKey === 'users:bulk'}><Trash2 className="mr-2 size-4" />Delete selected ({selectedVisibleCount})</Button></div>}</div>

            {view === 'solutions' && (
              <div className="border-b border-slate-100 bg-slate-50 p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Template name</label>
                    <Input value={solutionDraft.name} onChange={(event) => setSolutionDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Gaming PC" className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Slug</label>
                    <Input value={solutionDraft.slug} onChange={(event) => setSolutionDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="gaming-pc" className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Category</label>
                    <Input value={solutionDraft.category} onChange={(event) => setSolutionDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Computing" className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</label>
                    <select value={solutionDraft.status} onChange={(event) => setSolutionDraft((current) => ({ ...current, status: event.target.value as 'draft' | 'active' | 'archived' }))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Budget hint (GHS)</label>
                    <Input value={solutionDraft.budgetHint} onChange={(event) => setSolutionDraft((current) => ({ ...current, budgetHint: event.target.value }))} placeholder="10000" className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Typical budget minimum (GHS)</label>
                    <Input type="number" min="0" value={solutionDraft.budgetMin} onChange={(event) => setSolutionDraft((current) => ({ ...current, budgetMin: event.target.value }))} placeholder="5000" className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Typical budget maximum (GHS)</label>
                    <Input type="number" min="0" value={solutionDraft.budgetMax} onChange={(event) => setSolutionDraft((current) => ({ ...current, budgetMax: event.target.value }))} placeholder="15000" className="border-slate-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Target audience</label>
                    <Input value={solutionDraft.targetAudience} onChange={(event) => setSolutionDraft((current) => ({ ...current, targetAudience: event.target.value }))} placeholder="First-time PC builders, students, or home offices" className="border-slate-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Use cases (one per line)</label>
                    <Textarea value={solutionDraft.useCases} onChange={(event) => setSolutionDraft((current) => ({ ...current, useCases: event.target.value }))} placeholder={'1080p gaming\nSchool and productivity'} className="min-h-[90px] border-slate-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Intended outcomes (one per line)</label>
                    <Textarea value={solutionDraft.outcomes} onChange={(event) => setSolutionDraft((current) => ({ ...current, outcomes: event.target.value }))} placeholder={'A balanced build within budget\nRoom to upgrade later'} className="min-h-[90px] border-slate-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Image URL</label>
                    <Input value={solutionDraft.image} onChange={(event) => setSolutionDraft((current) => ({ ...current, image: event.target.value }))} placeholder="https://..." className="border-slate-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Description</label>
                    <Textarea value={solutionDraft.description} onChange={(event) => setSolutionDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the goal-based shopping flow..." className="min-h-[90px] border-slate-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Questions (one per line)</label>
                    <Textarea value={solutionDraft.questions} onChange={(event) => setSolutionDraft((current) => ({ ...current, questions: event.target.value }))} placeholder="What is your budget?" className="min-h-[110px] border-slate-200" />
                  </div>
                  <div className="space-y-4 md:col-span-2 xl:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Product requirements</h3>
                        <p className="mt-1 text-xs text-slate-500">Each requirement filters real products by keywords and optional category IDs.</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setSolutionDraft((current) => ({ ...current, requirements: [...current.requirements, createRequirementDraft()] }))}>Add requirement</Button>
                    </div>
                    {solutionDraft.requirements.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">No product requirements yet. Add one to generate marketplace recommendations.</p>
                    ) : solutionDraft.requirements.map((requirement, index) => (
                      <div key={`${requirement.id}-${index}`} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">Requirement {index + 1}</p>
                          <Button type="button" variant="ghost" size="sm" className="text-rose-700 hover:bg-rose-50" onClick={() => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.filter((_, requirementIndex) => requirementIndex !== index) }))}>Remove</Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-medium text-slate-600">Name</label>
                            <Input value={requirement.name} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} placeholder="Graphics card" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">Requirement type</label>
                            <select value={requirement.type} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as RequirementDraft['type'] } : item) }))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                              <option value="required">Required</option><option value="optional">Optional</option><option value="conditional">Conditional</option>
                            </select>
                          </div>
                          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
                            <Checkbox checked={requirement.required} onCheckedChange={(checked) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, required: checked === true } : item) }))} />Must be included
                          </label>
                          <div className="space-y-1.5 sm:col-span-2 xl:col-span-4">
                            <label className="text-xs font-medium text-slate-600">Description</label>
                            <Input value={requirement.description} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) }))} placeholder="What this component contributes to the solution" />
                          </div>
                          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">Minimum quantity</label><Input type="number" min="0" step="1" value={requirement.minQuantity} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, minQuantity: event.target.value } : item) }))} /></div>
                          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">Suggested quantity</label><Input type="number" min="0" step="1" value={requirement.quantity} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item) }))} /></div>
                          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">Maximum quantity (optional)</label><Input type="number" min="0" step="1" value={requirement.maxQuantity} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, maxQuantity: event.target.value } : item) }))} placeholder="No limit" /></div>
                          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">Keywords (comma-separated)</label><Input value={requirement.keywords} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, keywords: event.target.value } : item) }))} placeholder="gpu, graphics card" /></div>
                          <div className="space-y-1.5 sm:col-span-2"><label className="text-xs font-medium text-slate-600">Category IDs (comma-separated)</label><Input value={requirement.categoryIds} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, categoryIds: event.target.value } : item) }))} placeholder="electronics-hardware" /></div>
                          <div className="space-y-1.5 sm:col-span-2"><label className="text-xs font-medium text-slate-600">Selection notes (one per line)</label><Textarea value={requirement.notes} onChange={(event) => setSolutionDraft((current) => ({ ...current, requirements: current.requirements.map((item, itemIndex) => itemIndex === index ? { ...item, notes: event.target.value } : item) }))} placeholder="Compatibility details or buyer guidance" className="min-h-[72px]" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={() => void saveSolution()} disabled={solutionFormSaving} className="bg-emerald-700 text-white hover:bg-emerald-800">
                    {solutionFormSaving ? 'Saving…' : solutionDraft.id ? 'Update template' : 'Create template'}
                  </Button>
                  {solutionDraft.id && (
                    <Button type="button" variant="outline" onClick={() => setSolutionDraft(emptySolutionDraft)}>
                      Reset form
                    </Button>
                  )}
                </div>
              </div>
            )}

            {dataLoading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div> : error ? <div role="status" className="p-12 text-center text-sm text-rose-700">Records are unavailable until the data request succeeds.</div> : focusedRecords.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No matching {view} records found.</div> : <div className="divide-y divide-slate-100">{focusedRecords.map((record) => {
              const recordWithMeta = record as Record<string, unknown> & { createdAt?: unknown };
              const solutionRecord = view === 'solutions' ? record as AdminRecord & { category?: string; status?: string } : null;
              return (
                <div key={record.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    {view === 'users' && record.id !== user.id && <Checkbox checked={selectedUserIds.includes(record.id)} onCheckedChange={(checked) => setSelectedUserIds((current) => checked === true ? [...new Set([...current, record.id])] : current.filter((id) => id !== record.id))} aria-label={`Select ${getRecordName(record, 'user')}`} disabled={deletingKey === 'users:bulk'} />}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{getRecordName(record, 'Unnamed record')}{view === 'users' && record.id === user.id && <span className="ml-2 text-xs font-medium text-emerald-700">You</span>}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{view === 'solutions' ? `${String(solutionRecord?.category || 'Computing')} · ${solutionRecord?.status || 'draft'}` : `${getStatus(record)} · ${formatDate(recordWithMeta.createdAt)}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {view === 'solutions' ? (
                      <>
                        <Badge variant="outline" className={statusTone(getStatus(record))}>{getStatus(record)}</Badge>
                        <Button size="sm" variant="outline" onClick={() => fillSolutionDraft(record)}>Edit</Button>
                        <Button type="button" size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete solution ${getRecordName(record, 'solution')}`} title="Delete solution template" onClick={() => void removeSolution(record)}><Trash2 className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className={statusTone(getStatus(record))}>{getStatus(record)}</Badge>
                        {view === 'sellers' && getStatus(record) === 'pending' && <Button size="sm" disabled={moderatingKey === `seller:${record.id}`} onClick={() => void handleModerate('seller', record, 'approved')}>{moderatingKey === `seller:${record.id}` ? 'Approving…' : 'Approve'}</Button>}
                        {view === 'sellers' && getStatus(record) === 'active' && <Button size="sm" variant="outline" onClick={() => void handleModerate('seller', record, 'suspended')}>Suspend</Button>}
                        {view === 'sellers' && <Button type="button" size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete seller ${getRecordName(record, 'seller')}`} title="Delete seller profile and listings" disabled={deletingKey === `seller:${record.id}`} onClick={() => void handleDeleteSeller(record)}><Trash2 className="h-4 w-4" /></Button>}
                        {view === 'users' && record.id !== user.id && getStatus(record) !== 'suspended' && <Button size="sm" variant="outline" onClick={() => void handleModerate('user', record, 'suspended')}>Suspend</Button>}
                        {view === 'users' && record.id !== user.id && getStatus(record) === 'suspended' && <Button size="sm" onClick={() => void handleModerate('user', record, 'active')}>Restore</Button>}
                        {view === 'users' && record.id !== user.id && <Button type="button" size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Permanently delete ${getRecordName(record, 'user')}`} title="Permanently delete user" disabled={deletingKey === `user:${record.id}` || deletingKey === 'users:bulk'} onClick={() => void handleDeleteUser(record.id, getRecordName(record, 'this user'))}><Trash2 className="h-4 w-4" /></Button>}
                        {view === 'products' && getStatus(record) === 'pending_review' && <Button size="sm" onClick={() => void handleModerate('product', record, 'approved')}>Approve</Button>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}</div>}
          </section>
        )}

        {view === 'overview' && dataLoading && <LoadingOverview />}

        <section className={`${view === 'overview' && !dataLoading && !error ? '' : 'hidden'} grid gap-4 sm:grid-cols-2 xl:grid-cols-4`}>
          <StatCard label="Total users" value={snapshot.metrics.users} detail="Registered marketplace accounts" icon={Users} accent="bg-emerald-100/70" />
          <StatCard label="Active sellers" value={snapshot.metrics.activeSellers} detail={`${snapshot.metrics.sellers} seller profiles in total`} icon={Store} accent="bg-sky-100/70" />
          <StatCard label="Applications to review" value={snapshot.metrics.pendingApplications} detail={`${snapshot.metrics.applications} applications in total`} icon={FileClock} accent="bg-amber-100/80" />
          <StatCard label="Open reports" value={snapshot.metrics.openReports} detail={`${snapshot.metrics.reports} reports in total`} icon={AlertTriangle} accent="bg-rose-100/80" />
          <StatCard label="Solution library" value={snapshot.metrics.solutions} detail="Goal-based shopping templates" icon={Package} accent="bg-violet-100/80" />
        </section>

        <section className={`${view === 'overview' && !dataLoading && !error ? '' : 'hidden'} grid gap-5 xl:grid-cols-[1.35fr_1fr]`}>
          <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div><CardTitle className="font-headline text-xl">Seller network</CardTitle><p className="mt-1 text-sm text-slate-500">Seller profiles currently connected to Agora.</p></div>
              <Button asChild variant="ghost" size="sm" className="text-emerald-700"><Link href="/super/app/dashboard?view=sellers">View all <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              {dataLoading ? <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : recentSellers.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No seller profiles have been created yet.</div> : (
                <div className="divide-y divide-slate-100">{recentSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4efe6] text-sm font-bold text-[#24553d]">{seller.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{seller.name}</p>
                        <p className="truncate text-xs text-slate-500">{seller.businessType} · {seller.regionId || 'Region not set'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={statusTone(seller.status)}>{seller.status || 'unknown'}</Badge>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDate((seller as SellerWithCreatedAt).createdAt)}</p>
                    </div>
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

        <section className={`${view === 'overview' && !dataLoading && !error ? '' : 'hidden'} grid gap-5 xl:grid-cols-2`}>
          <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <CardHeader className="flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6"><div><CardTitle className="font-headline text-xl">Buyer profiles</CardTitle><p className="mt-1 text-sm text-slate-500">Registered marketplace accounts.</p></div><Button asChild variant="ghost" size="sm" className="shrink-0 text-emerald-700"><Link href="/super/app/dashboard?view=users">View all <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button></CardHeader>
            <CardContent className="p-0">{recentUsers.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No user profiles found.</div> : <div className="divide-y divide-slate-100">{recentUsers.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.name || 'Unnamed user'}</p><p className="truncate text-xs text-slate-500">{account.email} · {account.role}</p></div><Button type="button" variant="ghost" size="icon" className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${account.name || 'user'}`} disabled={deletingKey === `user:${account.id}`} onClick={() => handleDeleteUser(account.id, account.name || account.email)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}</CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6"><CardTitle className="font-headline text-xl">Product catalog</CardTitle><p className="mt-1 text-sm text-slate-500">Remove listings that violate marketplace standards.</p></CardHeader>
            <CardContent className="p-0">{recentProducts.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No product listings found.</div> : <div className="divide-y divide-slate-100">{recentProducts.map((product) => <div key={`${product.sellerId}:${product.id}`} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold">{getRecordName(product, 'Unnamed product')}</p><p className="truncate text-xs text-slate-500">{String(product.sellerName || 'Unknown seller')} · {typeof product.price === 'number' ? `₵${product.price.toFixed(2)}` : 'Price unavailable'}</p></div><Button type="button" variant="ghost" size="icon" className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${getRecordName(product, 'product')}`} disabled={deletingKey === `product:${product.id}`} onClick={() => handleDeleteProduct(product)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}</CardContent>
          </Card>
        </section>
      </div>
  );
}
