'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/app/super/firebase/provider';
import { initializeFirebase } from '@/app/super/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    try {
      return initializeFirebase();
    } catch (error) {
      if (error instanceof Error && error.message === 'Firebase is not configured.') return null;
      throw error;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  if (!firebaseServices) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <section role="alert" className="max-w-lg rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-lg font-semibold">Firebase configuration required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set the NEXT_PUBLIC_FIREBASE_* values for this environment, matching the server-side Firebase project, then restart the app.
            Do not use production Firebase credentials for staging.
          </p>
        </section>
      </main>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
