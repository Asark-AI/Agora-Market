'use client';

import { useEffect } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { getOfflineActions, removeOfflineAction, updateOfflineAction } from '@/lib/offline/storage';

const MAX_ATTEMPTS = 5;

export function OfflineSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db) return;
    let syncing = false;

    const sync = async () => {
      if (syncing || !navigator.onLine) return;
      syncing = true;
      try {
        const actions = await getOfflineActions();
        for (const action of actions) {
          if (action.nextAttemptAt > Date.now()) continue;
          try {
            const productId = String(action.payload.productId || '');
            if (!productId) throw new Error('Missing wishlist product.');
            const itemRef = doc(db, 'wishlist', user.id, 'items', productId);
            if (action.type === 'wishlist-add') {
              await setDoc(itemRef, { product: action.payload.product, userId: user.id, updatedAt: new Date().toISOString() });
            } else if (action.type === 'wishlist-remove') {
              await deleteDoc(itemRef);
            }
            await removeOfflineAction(action.id);
          } catch {
            const nextAttempt = action.attempts + 1;
            if (nextAttempt >= MAX_ATTEMPTS) {
              await removeOfflineAction(action.id);
            } else {
              await updateOfflineAction({ ...action, attempts: nextAttempt, nextAttemptAt: Date.now() + (2 ** nextAttempt) * 1000 });
            }
          }
        }
      } finally {
        syncing = false;
      }
    };

    void sync();
    window.addEventListener('online', sync);
    const interval = window.setInterval(sync, 15000);
    return () => {
      window.removeEventListener('online', sync);
      window.clearInterval(interval);
    };
  }, [user]);

  return null;
}
