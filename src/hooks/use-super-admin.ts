'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { approveAdminSeller, deleteAdminProduct, deleteAdminSeller, deleteAdminUser, deleteAdminUsers, moderateProduct, moderateSeller, moderateUser } from '@/app/admin/actions';
import { getAdminData, getAdminOverview, type AdminDataRecord, type AdminView } from '@/app/admin/data-actions';
import type { Seller, User } from '@/lib/types';

export type AdminRecord = AdminDataRecord;
export type SuperAdminSnapshot = {
  users: User[];
  sellers: Seller[];
  products: AdminRecord[];
  applications: AdminRecord[];
  reports: AdminRecord[];
  solutions: AdminRecord[];
  metrics: { users: number; sellers: number; products: number; applications: number; reports: number; solutions: number; activeSellers: number; pendingApplications: number; openReports: number };
};

const emptySnapshot: SuperAdminSnapshot = { users: [], sellers: [], products: [], applications: [], reports: [], solutions: [], metrics: { users: 0, sellers: 0, products: 0, applications: 0, reports: 0, solutions: 0, activeSellers: 0, pendingApplications: 0, openReports: 0 } };

export function useSuperAdmin() {
  const { user, firebaseUser, loading: authLoading, logOut } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<SuperAdminSnapshot>(emptySnapshot);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadClaims() {
      if (!firebaseUser) {
        setIsSuperAdmin(false);
        setClaimsLoading(false);
        return;
      }
      setClaimsLoading(true);
      try {
        const token = await firebaseUser.getIdTokenResult(true);
        if (active) setIsSuperAdmin(token.claims.superAdmin === true);
      } catch (claimError) {
        console.error('Unable to verify admin claims:', claimError);
        if (active) setIsSuperAdmin(false);
      } finally {
        if (active) setClaimsLoading(false);
      }
    }
    void loadClaims();
    return () => { active = false; };
  }, [firebaseUser, user?.role]);

  const refresh = async (view: AdminView = 'overview', search = '') => {
    if (!isSuperAdmin) return;
    setDataLoading(true);
    setError(null);
    try {
      if (view === 'overview') {
        const [metrics, sellers, applications, users, products, reports, solutions] = await Promise.all([
          getAdminOverview(),
          getAdminData('sellers', '', 100),
          getAdminData('applications'),
          getAdminData('users', '', 100),
          getAdminData('products'),
          getAdminData('reports'),
          getAdminData('solutions'),
        ]);
        setSnapshot({ users: users.records as User[], sellers: sellers.records as Seller[], products: products.records, applications: applications.records, reports: reports.records, solutions: solutions.records, metrics });
      } else {
        const result = await getAdminData(view, search);
        setSnapshot((current) => ({ ...current, [view]: result.records }));
      }
    } catch (dataError) {
      console.error('Unable to load admin data:', dataError);
      setError('Unable to load admin data. Please retry.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) void refresh();
  }, [isSuperAdmin]);

  const deleteUser = async (userId: string, reason: string) => {
    const idToken = await firebaseUser?.getIdToken();
    if (!idToken) throw new Error('Your session has expired. Please sign in again.');
    await deleteAdminUser(idToken, userId, reason);
    setSnapshot((current) => ({
      ...current,
      users: current.users.filter((account) => account.id !== userId),
      metrics: { ...current.metrics, users: Math.max(0, current.metrics.users - 1) },
    }));
  };

  const deleteUsers = async (userIds: string[], reason: string) => {
    const idToken = await firebaseUser?.getIdToken();
    if (!idToken) throw new Error('Your session has expired. Please sign in again.');
    const result = await deleteAdminUsers(idToken, userIds, reason);
    if (result.deletedIds.length) {
      const deletedIds = new Set(result.deletedIds);
      setSnapshot((current) => ({
        ...current,
        users: current.users.filter((account) => !deletedIds.has(account.id)),
        metrics: { ...current.metrics, users: Math.max(0, current.metrics.users - result.deletedIds.length) },
      }));
    }
    return result;
  };

  const deleteProduct = async (sellerId: string, productId: string, reason: string) => {
    const idToken = await firebaseUser?.getIdToken(true);
    if (!idToken) throw new Error('Your session has expired. Please sign in again.');
    await deleteAdminProduct(idToken, sellerId, productId, reason);
    await refresh('products');
  };

  const deleteSeller = async (sellerId: string, reason: string) => {
    const idToken = await firebaseUser?.getIdToken();
    if (!idToken) throw new Error('Your session has expired. Please sign in again.');
    await deleteAdminSeller(idToken, sellerId, reason);
    const deletedSeller = snapshot.sellers.find((seller) => seller.id === sellerId);
    setSnapshot((current) => ({
      ...current,
      sellers: current.sellers.filter((seller) => seller.id !== sellerId),
      products: current.products.filter((product) => product.sellerId !== sellerId),
      metrics: {
        ...current.metrics,
        sellers: Math.max(0, current.metrics.sellers - 1),
        activeSellers: Math.max(0, current.metrics.activeSellers - (deletedSeller?.status === 'active' ? 1 : 0)),
        products: Math.max(0, current.metrics.products - snapshot.products.filter((product) => product.sellerId === sellerId).length),
      },
    }));
  };

  const moderate = async (type: 'seller' | 'product' | 'user', targetId: string, nextStatus: string, reason: string, sellerId?: string) => {
    const idToken = await firebaseUser?.getIdToken(true);
    if (!idToken) throw new Error('Your session has expired. Please sign in again.');
    if (type === 'seller' && nextStatus === 'approved') {
      await approveAdminSeller(idToken, targetId, reason);
      await Promise.all([refresh('sellers'), refresh('applications')]);
      return;
    }
    if (type === 'seller') await moderateSeller(idToken, targetId, nextStatus, reason);
    if (type === 'product') await moderateProduct(idToken, sellerId || '', targetId, nextStatus, reason);
    if (type === 'user') await moderateUser(idToken, targetId, nextStatus, reason);
    await refresh(type === 'product' ? 'products' : type === 'seller' ? 'sellers' : 'users');
  };

  return { user, logOut, isSuperAdmin, authLoading, claimsLoading, dataLoading, snapshot, error, refresh, deleteUser, deleteUsers, deleteProduct, deleteSeller, moderate };
}
