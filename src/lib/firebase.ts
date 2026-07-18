
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  const hasValidApiKey = typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'string' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith('AIza');
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
