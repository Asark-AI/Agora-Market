'use server';

import type { Query, QuerySnapshot } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireSuperAdmin } from '@/lib/server/admin-auth';

export type AdminView = 'overview' | 'users' | 'sellers' | 'products' | 'applications' | 'reports';
export type AdminDataRecord = Record<string, unknown> & { id: string };

const MAX_PAGE_SIZE = 100;

function safePageSize(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) return 25;
  return Math.min(value, MAX_PAGE_SIZE);
}

function serialize(value: unknown): unknown {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  return value;
}

function serializeDocs(snapshot: QuerySnapshot) {
  return snapshot.docs.map((document) => ({ id: document.id, ...serialize(document.data()) })) as AdminDataRecord[];
}

function applySearch(query: Query, field: string, search: string) {
  if (!search) return query;
  return query.orderBy(field).startAt(search).endAt(`${search}\uf8ff`);
}

export async function getAdminData(view: AdminView = 'overview', search = '', pageSize = 25) {
  await requireSuperAdmin();
  const db = getAdminDb();
  const limit = safePageSize(pageSize);
  const normalizedSearch = search.trim().slice(0, 80);

  if (view === 'products') {
    let query = db.collectionGroup('products').limit(limit);
    if (normalizedSearch) query = applySearch(query, 'name', normalizedSearch).limit(limit);
    const snapshot = await query.get();
    return { records: snapshot.docs.map((document) => ({ id: document.id, sellerId: document.ref.parent.parent?.id || '', ...serialize(document.data()) })) as AdminDataRecord[], hasMore: snapshot.size === limit };
  }

  const collectionName = view === 'users' ? 'users' : view === 'sellers' ? 'sellers' : view === 'applications' ? 'sellerApplications' : 'reports';
  let query = db.collection(collectionName).limit(limit);
  if (normalizedSearch) query = applySearch(query, view === 'users' ? 'email' : 'name', normalizedSearch).limit(limit);
  const snapshot = await query.get();
  return { records: serializeDocs(snapshot), hasMore: snapshot.size === limit };
}

export async function getAdminOverview() {
  await requireSuperAdmin();
  const db = getAdminDb();
  const [users, sellers, products, applications, reports] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('sellers').count().get(),
    db.collectionGroup('products').count().get(),
    db.collection('sellerApplications').count().get(),
    db.collection('reports').count().get(),
  ]);
  const [activeSellers, pendingApplications, openReports] = await Promise.all([
    db.collection('sellers').where('status', '==', 'active').count().get(),
    db.collection('sellerApplications').where('status', 'in', ['pending', 'under-review']).count().get(),
    db.collection('reports').where('status', 'in', ['open', 'pending', 'under-review']).count().get(),
  ]);
  return {
    users: users.data().count,
    sellers: sellers.data().count,
    products: products.data().count,
    applications: applications.data().count,
    reports: reports.data().count,
    activeSellers: activeSellers.data().count,
    pendingApplications: pendingApplications.data().count,
    openReports: openReports.data().count,
  };
}
