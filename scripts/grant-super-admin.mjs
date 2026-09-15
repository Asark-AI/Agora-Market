#!/usr/bin/env node

import dotenv from 'dotenv';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config({ path: '.env.local' });

function printHelp() {
  console.log(`
Grant or reset super-admin access for a Firebase user.

Usage:
  npm run admin:promote -- user@example.com
  npm run admin:grant -- --email user@example.com
  npm run admin:grant -- --uid SOME_UID
  npm run admin:grant -- --email user@example.com --dry-run
  npm run admin:reset -- --email user@example.com
  npm run admin:reset -- --uid SOME_UID

Options:
  --email <email>   Look up a Firebase user by email
  --uid <uid>       Grant/reset access directly by UID
  --dry-run         Show the target but do not write changes
  --reset           Remove the superAdmin claim and downgrade the user role
  --help            Show this message

Environment:
  This script uses the following server-only env vars:
  FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
`);
}

function parseArgs(argv) {
  const options = {
    email: null,
    uid: null,
    dryRun: false,
    reset: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--reset') {
      options.reset = true;
      continue;
    }
    if (arg === '--email') {
      options.email = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--uid') {
      options.uid = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

async function resolveUidByEmail(email) {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  return user.uid;
}

async function ensureAdminApp() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const missing = [
    ['FIREBASE_ADMIN_PROJECT_ID', projectId],
    ['FIREBASE_ADMIN_CLIENT_EMAIL', clientEmail],
    ['FIREBASE_ADMIN_PRIVATE_KEY', privateKey],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')}`);
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  let options = { reset: false };
  try {
    options = parseArgs(process.argv.slice(2));
    if (options.help || (!options.email && !options.uid)) {
      printHelp();
      process.exit(options.help ? 0 : 1);
    }

    await ensureAdminApp();

    const uid = options.uid || (await resolveUidByEmail(options.email));
    const auth = getAuth();
    const user = await auth.getUser(uid);
    const userEmail = user.email || options.email || 'unknown@example.com';

    console.log(`Target user: ${user.displayName || 'Unnamed user'} (${userEmail})`);
    console.log(`UID: ${uid}`);

    if (options.dryRun) {
      console.log(options.reset ? 'Dry run only: no Firebase changes were made.' : 'Dry run only: no Firebase custom claims were changed.');
      return;
    }

    const nextCustomClaims = { ...user.customClaims };
    if (options.reset) {
      delete nextCustomClaims.superAdmin;
    } else {
      nextCustomClaims.superAdmin = true;
    }

    await auth.setCustomUserClaims(uid, nextCustomClaims);

    const verifiedUser = await auth.getUser(uid);
    const claimMatches = options.reset
      ? verifiedUser.customClaims?.superAdmin !== true
      : verifiedUser.customClaims?.superAdmin === true;
    if (!claimMatches) {
      throw new Error('The Firebase custom claim could not be verified after the update.');
    }

    const firestore = getFirestore();
    await firestore.collection('users').doc(uid).set({
      role: options.reset ? 'Owner' : 'Admin',
      email: userEmail,
      updatedAt: new Date(),
    }, { merge: true });

    if (options.reset) {
      console.log('Success: superAdmin custom claim was removed and the Firestore role was reset to Owner.');
      console.log('Next: sign the user out and back in so the claim is refreshed.');
      return;
    }

    console.log('Success: superAdmin custom claim was granted and the Firestore role was updated to Admin.');
    console.log('Next: sign the user out and back in so the new claim is refreshed.');
  } catch (error) {
    console.error(options.reset ? 'Unable to reset super-admin access.' : 'Unable to grant super-admin access.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void main();
