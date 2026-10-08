import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  decryptMarketingSecret,
  encryptMarketingSecret,
} from '../src/lib/marketing-crypto.ts';

const key = Buffer.from('0123456789abcdef0123456789abcdef');

test('marketing credentials are encrypted and decrypt only with the configured key', () => {
  const token = 'live-access-token-do-not-expose';
  const encrypted = encryptMarketingSecret(token, key);

  assert.match(encrypted, /^v1\./);
  assert.equal(encrypted.includes(token), false);
  assert.equal(decryptMarketingSecret(encrypted, key), token);
  assert.throws(() => decryptMarketingSecret(encrypted, Buffer.alloc(32, 1)));
});

test('marketing credential encryption rejects malformed ciphertext and key lengths', () => {
  assert.throws(() => encryptMarketingSecret('secret', Buffer.alloc(16)), /32 bytes/);
  assert.throws(() => decryptMarketingSecret('not-a-ciphertext', key), /invalid/);
  const encrypted = encryptMarketingSecret('secret', key);
  const parts = encrypted.split('.');
  parts[3] = `${parts[3].slice(0, -2)}AA`;
  assert.throws(() => decryptMarketingSecret(parts.join('.'), key));
});
