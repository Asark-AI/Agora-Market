'use server';

import type { Query, QuerySnapshot } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireSuperAdmin } from '@/lib/server/admin-auth';

export type AdminView = 'overview' | 'users' | 'sellers' | 'products' | 'applications' | 'reports' | 'solutions';
export type AdminDataRecord = Record<string, unknown> & { id: string };
export type AdminAnalyticsPeriod = '30d' | '90d' | '12m';

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
  return snapshot.docs.map((document) => ({ id: document.id, ...(serialize(document.data()) as Record<string, unknown>) })) as AdminDataRecord[];
}

function isAdminProfile(record: AdminDataRecord) {
  const role = typeof record.role === 'string' ? record.role.toLowerCase() : '';
  const roles = record.roles && typeof record.roles === 'object' ? record.roles as Record<string, unknown> : {};
  return role === 'admin' || role === 'superadmin' || record.superAdmin === true || roles.admin === true;
}

function applySearch(query: Query, field: string, search: string) {
  if (!search) return query;
  return query.orderBy(field).startAt(search).endAt(`${search}\uf8ff`);
}

export async function getAdminData(view: AdminView = 'overview', search = '', pageSize = 25) {
  const adminIdentity = await requireSuperAdmin();
  const db = getAdminDb();
  const limit = safePageSize(pageSize);
  const normalizedSearch = search.trim().slice(0, 80);

  if (view === 'products') {
    let query = db.collectionGroup('products').limit(limit);
    if (normalizedSearch) query = applySearch(query, 'name', normalizedSearch).limit(limit);
    const snapshot = await query.get();
    return { records: snapshot.docs.map((document) => ({ id: document.id, sellerId: document.ref.parent.parent?.id || '', ...(serialize(document.data()) as Record<string, unknown>) })) as AdminDataRecord[], hasMore: snapshot.size === limit };
  }

  if (view === 'solutions') {
    let query: Query = db.collection('solutions');
    if (normalizedSearch) {
      query = query.orderBy('name').startAt(normalizedSearch).endAt(`${normalizedSearch}\uf8ff`);
    } else {
      query = query.orderBy('updatedAt', 'desc');
    }
    const snapshot = await query.limit(limit).get();
    return { records: serializeDocs(snapshot), hasMore: snapshot.size === limit };
  }

  if (view === 'users') {
    let userQuery: Query = db.collection('users');
    if (normalizedSearch) userQuery = applySearch(userQuery, 'email', normalizedSearch);
    const records: AdminDataRecord[] = [];
    let cursor;
    let hasMorePages = true;
    while (records.length <= limit && hasMorePages) {
      let pageQuery = userQuery.limit(100);
      if (cursor) pageQuery = pageQuery.startAfter(cursor);
      const page = await pageQuery.get();
      if (page.empty) break;
      records.push(...serializeDocs(page).filter((record) => record.id !== adminIdentity.uid && !isAdminProfile(record)));
      cursor = page.docs[page.docs.length - 1];
      hasMorePages = page.size === 100;
    }
    return { records: records.slice(0, limit), hasMore: records.length > limit || hasMorePages };
  }

  const collectionName = view === 'sellers' ? 'sellers' : view === 'applications' ? 'sellerApplications' : 'reports';
  let query = db.collection(collectionName).limit(limit);
  if (normalizedSearch) query = applySearch(query, 'name', normalizedSearch).limit(limit);
  const snapshot = await query.get();
  return { records: serializeDocs(snapshot), hasMore: snapshot.size === limit };
}

export async function getAdminOverview() {
  const adminIdentity = await requireSuperAdmin();
  const db = getAdminDb();
  const [users, adminProfiles, currentAdminProfile, sellers, products, applications, reports, solutions] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('users').where('role', '==', 'Admin').count().get(),
    db.collection('users').doc(adminIdentity.uid).get(),
    db.collection('sellers').count().get(),
    db.collectionGroup('products').count().get(),
    db.collection('sellerApplications').count().get(),
    db.collection('reports').count().get(),
    db.collection('solutions').count().get(),
  ]);
  const [activeSellers, pendingApplications, openReports] = await Promise.all([
    db.collection('sellers').where('status', '==', 'active').count().get(),
    db.collection('sellerApplications').where('status', 'in', ['pending', 'under-review']).count().get(),
    db.collection('reports').where('status', 'in', ['open', 'pending', 'under-review']).count().get(),
  ]);
  return {
    users: Math.max(0, users.data().count - adminProfiles.data().count - (currentAdminProfile.exists && !isAdminProfile({ id: currentAdminProfile.id, ...(currentAdminProfile.data() || {}) }) ? 1 : 0)),
    sellers: sellers.data().count,
    products: products.data().count,
    applications: applications.data().count,
    reports: reports.data().count,
    solutions: solutions.data().count,
    activeSellers: activeSellers.data().count,
    pendingApplications: pendingApplications.data().count,
    openReports: openReports.data().count,
  };
}

export async function getAdminActivity() {
  await requireSuperAdmin();
  const snapshot = await getAdminDb()
    .collection('adminAuditLogs')
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();
  return serializeDocs(snapshot);
}

export async function getAdminAnalytics(period: AdminAnalyticsPeriod = '30d') {
  await requireSuperAdmin();
  const db = getAdminDb();
  if (!['30d', '90d', '12m'].includes(period)) throw new Error('Unsupported analytics period.');
  const now = new Date();
  const start = new Date(now);
  if (period === '12m') start.setUTCFullYear(start.getUTCFullYear() - 1);
  else start.setUTCDate(start.getUTCDate() - (period === '90d' ? 89 : 29));

  const startIso = start.toISOString();
  const ordersByPath = new Map<string, { data: Record<string, unknown>; sellerId: string }>();
  const dateQueries = [
    { field: 'createdAt', minimum: Timestamp.fromDate(start) },
    { field: 'createdAt', minimum: startIso },
    { field: 'date', minimum: Timestamp.fromDate(start) },
    { field: 'date', minimum: startIso },
  ] as const;
  for (const { field, minimum } of dateQueries) {
    const query = db.collectionGroup('orders')
      .where(field, '>=', minimum)
      .orderBy(field, 'asc');
    let page = await query.limit(500).get();
    while (!page.empty) {
      for (const document of page.docs) {
        const data = document.data() as Record<string, unknown>;
        ordersByPath.set(document.ref.path, {
          data,
          sellerId: document.ref.parent.parent?.id || String(data.sellerId || ''),
        });
      }
      if (page.size < 500) break;
      page = await query.startAfter(page.docs[page.docs.length - 1]).limit(500).get();
    }
  }
  const orders = [...ordersByPath.values()];

  const buckets = new Map<string, { label: string; orders: number; value: number }>();
  const statuses = new Map<string, number>();
  const paymentMethods = new Map<string, number>();
  const sellerTotals = new Map<string, { orders: number; value: number }>();
  let orderValue = 0;
  let completedValue = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let eligibleOrders = 0;

  for (const { data, sellerId } of orders) {
    const rawDate = data.createdAt || data.date;
    const date = rawDate && typeof rawDate === 'object' && 'toDate' in rawDate && typeof rawDate.toDate === 'function'
      ? rawDate.toDate()
      : new Date(String(rawDate || ''));
    if (Number.isNaN(date.getTime())) continue;
    const status = String(data.status || 'unknown').toLowerCase();
    const value = Number(data.total || 0);
    const validValue = Number.isFinite(value) ? value : 0;
    const isCancelled = ['cancelled', 'canceled', 'rejected', 'refunded'].includes(status);
    const isCompleted = ['completed', 'fulfilled', 'shipped', 'delivered'].includes(status);

    statuses.set(status, (statuses.get(status) || 0) + 1);
    const paymentMethod = String(data.paymentMethod || 'unknown').toLowerCase();
    paymentMethods.set(paymentMethod, (paymentMethods.get(paymentMethod) || 0) + 1);
    if (!isCancelled) {
      orderValue += validValue;
      eligibleOrders += 1;
    }
    if (isCompleted) {
      completedOrders += 1;
      completedValue += validValue;
    }
    if (isCancelled) cancelledOrders += 1;

    const sellerTotal = sellerTotals.get(sellerId) || { orders: 0, value: 0 };
    sellerTotal.orders += 1;
    sellerTotal.value += validValue;
    sellerTotals.set(sellerId, sellerTotal);

    let bucketDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    if (period === '12m') bucketDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    if (period === '90d') {
      const dayOfWeek = (bucketDate.getUTCDay() + 6) % 7;
      bucketDate.setUTCDate(bucketDate.getUTCDate() - dayOfWeek);
    }
    const key = period === '12m'
      ? bucketDate.toISOString().slice(0, 7)
      : bucketDate.toISOString().slice(0, 10);
    const label = period === '12m'
      ? new Intl.DateTimeFormat('en-GH', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(bucketDate)
      : new Intl.DateTimeFormat('en-GH', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(bucketDate);
    const bucket = buckets.get(key) || { label, orders: 0, value: 0 };
    bucket.orders += 1;
    if (!isCancelled) bucket.value += validValue;
    buckets.set(key, bucket);
  }

  const sellerEntries = [...sellerTotals.entries()].sort((left, right) => right[1].value - left[1].value).slice(0, 5);
  const topSellers = await Promise.all(sellerEntries.map(async ([sellerId, totals]) => {
    if (!sellerId) return { id: sellerId, name: 'Unknown seller', ...totals };
    const seller = await db.collection('sellers').doc(sellerId).get();
    return { id: sellerId, name: String(seller.get('name') || 'Unnamed seller'), ...totals };
  }));

  return {
    period,
    orderCount: orders.length,
    orderValue,
    completedOrders,
    completedValue,
    cancelledOrders,
    averageOrderValue: eligibleOrders ? orderValue / eligibleOrders : 0,
    trend: [...buckets.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, bucket]) => bucket),
    statuses: [...statuses.entries()].map(([status, count]) => ({ status, count })).sort((left, right) => right.count - left.count),
    paymentMethods: [...paymentMethods.entries()].map(([method, count]) => ({ method, count })).sort((left, right) => right.count - left.count),
    topSellers,
    generatedAt: now.toISOString(),
  };
}
