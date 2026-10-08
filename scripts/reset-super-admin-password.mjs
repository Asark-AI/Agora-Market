#!/usr/bin/env node

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function printHelp() {
  console.log(`
Request an Agora Admin password-reset email.

Usage:
  npm run admin:reset-password -- user@example.com

This command never sets or prints a password, reset code, or authentication token.
It submits the address to the same rate-limited, enumeration-safe endpoint used by
/admin/forgot-password. Set AGORA_APP_URL to the configured Agora application origin.
`);
}

async function main() {
  const email = process.argv[2]?.trim();
  if (!email || email === '--help' || email === '-h') {
    printHelp();
    process.exitCode = email ? 0 : 1;
    return;
  }
  if (process.argv.length > 3) throw new Error('Provide only one administrator email address.');

  const configuredOrigin = process.env.AGORA_APP_URL?.trim();
  if (!configuredOrigin) throw new Error('AGORA_APP_URL must be configured.');
  const parsedOrigin = new URL(configuredOrigin);
  if (
    parsedOrigin.username
    || parsedOrigin.password
    || parsedOrigin.pathname !== '/'
    || parsedOrigin.search
    || parsedOrigin.hash
    || (process.env.NODE_ENV === 'production' && parsedOrigin.protocol !== 'https:')
    || (parsedOrigin.protocol !== 'https:' && parsedOrigin.protocol !== 'http:')
  ) {
    throw new Error('AGORA_APP_URL must be a valid Agora origin.');
  }

  const response = await fetch(`${parsedOrigin.origin}/api/admin/auth/password-reset`, {
    method: 'POST',
    headers: {
      Origin: parsedOrigin.origin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`The admin reset request was rejected (HTTP ${response.status}).`);
  }
  console.log('If the address belongs to an eligible Super Admin, a reset email will be sent.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unable to request an admin password reset.');
  process.exitCode = 1;
});
