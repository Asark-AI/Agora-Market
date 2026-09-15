#!/usr/bin/env node

import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config({ path: '.env.local' });

function getRequiredConfiguration() {
  const required = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());

  console.log('Firebase Admin configuration check');
  console.log(`Project ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID ? 'configured' : 'missing'}`);
  console.log(`Client email: ${process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'configured' : 'missing'}`);
  console.log(`Private key: ${process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'configured' : 'missing'}`);

  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')}`);
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is not in the expected service-account format.');
  }

  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey,
  };
}

function initializeAdmin(configuration) {
  if (getApps().length > 0) return;

  initializeApp({
    credential: cert(configuration),
  });
}

async function main() {
  const configuration = getRequiredConfiguration();
  initializeAdmin(configuration);

  const matches = [];
  let pageToken;
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    for (const user of page.users) {
      if (user.customClaims?.superAdmin === true) {
        matches.push({
          uid: user.uid,
          email: user.email || null,
          disabled: user.disabled,
          emailVerified: user.emailVerified,
          creationTime: user.metadata.creationTime || null,
          lastSignInTime: user.metadata.lastSignInTime || null,
        });
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  if (matches.length === 0) {
    console.log('No Firebase Authentication accounts with superAdmin: true were found.');
    return;
  }

  console.log('\nAgora Super Admin Accounts');
  for (const user of matches) {
    console.log(`Email: ${user.email || '(no email)'}`);
    console.log(`UID: ${user.uid}`);
    console.log(`Disabled: ${user.disabled}`);
    console.log(`Email verified: ${user.emailVerified}`);
    console.log(`Created: ${user.creationTime || 'unknown'}`);
    console.log(`Last sign-in: ${user.lastSignInTime || 'never'}`);
    console.log('');
  }
}

main().catch((error) => {
  const code = error?.code;
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (message.startsWith('Missing ') || message.includes('FIREBASE_ADMIN_PRIVATE_KEY')) {
    console.error(`Firebase Admin configuration error: ${message}`);
  } else if (code === 'auth/permission-denied' || code === 'permission-denied') {
    console.error('Firebase Admin permission error. Check the service account/project configuration.');
  } else if (code === 'auth/invalid-credential' || code === 'app/invalid-credential') {
    console.error('Firebase Admin authentication failed. Check the service account credentials.');
  } else if (code?.startsWith('auth/')) {
    console.error(`Firebase Authentication request failed: ${message}`);
  } else {
    console.error(`Firebase Admin request failed${code ? ` (${code})` : ''}: ${message}`);
  }
  process.exitCode = 1;
});
