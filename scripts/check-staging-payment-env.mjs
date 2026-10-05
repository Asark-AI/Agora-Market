const PLACEHOLDER_PATTERN = /replace_with|placeholder|your[_-]|changeme/i;

function value(env, name) {
  return typeof env[name] === 'string' ? env[name].trim() : '';
}

function isPlaceholder(input) {
  return !input || PLACEHOLDER_PATTERN.test(input);
}

function isHttpsOrigin(input) {
  try {
    const url = new URL(input);
    return url.protocol === 'https:'
      && url.username === ''
      && url.password === ''
      && url.pathname === '/'
      && url.search === ''
      && url.hash === '';
  } catch {
    return false;
  }
}

export function validateStagingPaymentEnvironment(env) {
  const errors = [];
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'PAYSTACK_SECRET_KEY',
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'EMAIL_OTP_HMAC_SECRET',
    'AGORA_APP_URL',
    'AGORA_PRODUCTION_APP_URL',
    'AGORA_PRODUCTION_FIREBASE_PROJECT_ID',
  ];

  if (value(env, 'AGORA_ENVIRONMENT') !== 'staging') {
    errors.push('AGORA_ENVIRONMENT must be explicitly set to staging.');
  }
  if (value(env, 'PAYSTACK_MODE') !== 'test') {
    errors.push('PAYSTACK_MODE must be test for staging.');
  }
  for (const name of required) {
    if (isPlaceholder(value(env, name))) errors.push(`${name} is missing or still a placeholder.`);
  }
  if (value(env, 'EMAIL_OTP_HMAC_SECRET').length < 32) {
    errors.push('EMAIL_OTP_HMAC_SECRET must contain at least 32 characters.');
  }
  const publicSecretNames = Object.keys(env).filter((name) => /^NEXT_PUBLIC_.*(SECRET|PRIVATE_KEY|CREDENTIAL|TOKEN)/i.test(name));
  for (const name of publicSecretNames) {
    if (value(env, name)) errors.push(`${name} must not be exposed as a public environment variable.`);
  }

  const secret = value(env, 'PAYSTACK_SECRET_KEY');
  const publicKey = value(env, 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY');
  if (secret && !secret.startsWith('sk_test_')) errors.push('PAYSTACK_SECRET_KEY must be a Paystack test-mode secret key.');
  if (publicKey && !publicKey.startsWith('pk_test_')) errors.push('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY must be a Paystack test-mode public key.');

  const appUrl = value(env, 'AGORA_APP_URL');
  const productionUrl = value(env, 'AGORA_PRODUCTION_APP_URL');
  if (appUrl && !isHttpsOrigin(appUrl)) errors.push('AGORA_APP_URL must be an HTTPS origin without a path, query, or fragment.');
  if (productionUrl && !isHttpsOrigin(productionUrl)) errors.push('AGORA_PRODUCTION_APP_URL must be an HTTPS origin without a path, query, or fragment.');
  if (appUrl && productionUrl && appUrl.toLowerCase() === productionUrl.toLowerCase()) {
    errors.push('The staging application origin must differ from the production origin.');
  }

  const webProject = value(env, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const adminProject = value(env, 'FIREBASE_ADMIN_PROJECT_ID') || value(env, 'FIREBASE_PROJECT_ID');
  const productionProject = value(env, 'AGORA_PRODUCTION_FIREBASE_PROJECT_ID');
  if (isPlaceholder(adminProject)) errors.push('FIREBASE_ADMIN_PROJECT_ID or FIREBASE_PROJECT_ID must identify the staging Firebase project.');
  if (webProject && adminProject && webProject !== adminProject) {
    errors.push('The Firebase client and Admin SDK project IDs must match in staging.');
  }
  if (webProject && productionProject && webProject === productionProject) {
    errors.push('The staging Firebase project ID must differ from the production project ID.');
  }

  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = validateStagingPaymentEnvironment(process.env);
  if (errors.length) {
    console.error('Staging payment environment is not safe to use:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log('Staging payment environment passed preflight. No credential values were printed.');
  }
}
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
