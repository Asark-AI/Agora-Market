#!/usr/bin/env node

import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config({ path: '.env.local' });

const PASSWORD_LENGTH = 20;

function printHelp() {
  console.log(`
Reset a Super Admin password using Firebase Admin SDK.

Usage:
  npm run admin:reset-password -- user@example.com
  npm run admin:reset-password -- user@example.com --password "TemporaryPassword"

Options:
  --password <value>  Use a supplied temporary password instead of generating one
  --help              Show this message

This command is local/server-side only. It does not expose a public API route.
Required environment:
  FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
`);
}

function parseArgs(argv) {
  const options = { email: '', password: '', help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) continue;
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--password') {
      const password = argv[++index];
      if (!password) throw new Error('Missing value for --password. Quote the complete password.');
      options.password = password;
    } else if (arg.startsWith('--password=')) {
      options.password = arg.slice('--password='.length);
      if (!options.password) throw new Error('Missing value for --password.');
    } else if (!arg.startsWith('--') && !options.email) {
      options.email = arg;
    } else {
      throw new Error(`Unknown or misplaced argument: ${arg}`);
    }
  }
  return options;
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const bytes = crypto.randomBytes(PASSWORD_LENGTH);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function validatePassword(password) {
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z\d]/.test(password)) {
    throw new Error('The temporary password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol.');
  }
}

function initializeAdminApp() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const missing = [
    ['FIREBASE_ADMIN_PROJECT_ID', projectId],
    ['FIREBASE_ADMIN_CLIENT_EMAIL', clientEmail],
    ['FIREBASE_ADMIN_PRIVATE_KEY', privateKey],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) throw new Error(`Missing ${missing.join(', ')}`);

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.email) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  initializeAdminApp();
  const auth = getAuth();
  const user = await auth.getUserByEmail(options.email.trim().toLowerCase());
  if (user.customClaims?.superAdmin !== true) {
    throw new Error('The target account does not have the superAdmin claim. No password was changed.');
  }
  if (user.disabled) throw new Error('The target Super Admin account is disabled.');

  const temporaryPassword = options.password || generateTemporaryPassword();
  validatePassword(temporaryPassword);
  await auth.updateUser(user.uid, { password: temporaryPassword, emailVerified: true });
  await auth.revokeRefreshTokens(user.uid);

  console.log(`Super Admin password reset for ${user.email || options.email}.`);
  console.log(`UID: ${user.uid}`);
  console.log('Temporary password (displayed once in this local terminal):');
  console.log(`----- BEGIN TEMPORARY PASSWORD -----\n${temporaryPassword}\n----- END TEMPORARY PASSWORD -----`);
  console.log('Sign in with it, then immediately change it in Admin Settings. Existing sessions have been revoked.');
}

main().catch((error) => {
  console.error(`Unable to reset Super Admin password: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
