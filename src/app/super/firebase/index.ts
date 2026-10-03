'use client';

import { app, auth, db } from '@/lib/firebase';
import type { FirebaseApp } from 'firebase/app';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!app || !auth || !db) throw new Error('Firebase is not configured.');
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: auth!,
    firestore: db!
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';