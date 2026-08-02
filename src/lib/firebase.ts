
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyCgXWI7AkBhlfMjX0VDG4ETp-63jI3dyqE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'ghana-trade-37f20.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'ghana-trade-37f20',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'ghana-trade-37f20.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '15751349335',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:15751349335:web:5ee881e5b0fc4996c80f12',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-DRDCSJG8N2',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  const hasValidApiKey = typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.startsWith('AIza');
  if (hasValidApiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });
    storage = getStorage(app);
  } else {
    // Avoid throwing during SSR when env vars are not set.
    // App components that require Firebase should guard against null values.
    // This keeps the app from failing to render when Firebase isn't configured.
    // eslint-disable-next-line no-console
    console.warn('Firebase not configured: NEXT_PUBLIC_FIREBASE_API_KEY missing.');
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Firebase initialization error:', e);
  app = null;
  auth = null;
  db = null;
  storage = null;
}

export { app, auth, db, storage };
