import assert from 'node:assert/strict';
import { test } from 'node:test';
import { trustedAppOrigin } from '../src/lib/server/trusted-app-origin.ts';

test('production callback origin requires an explicit HTTPS origin', () => {
  assert.equal(trustedAppOrigin(undefined, true), null);
  assert.equal(trustedAppOrigin('https://shop.example', true), 'https://shop.example');
  assert.equal(trustedAppOrigin('http://shop.example', true), null);
});

test('callback origin rejects paths, credentials, query strings and malformed URLs', () => {
  for (const value of [
    'https://shop.example/attacker',
    'https://user:password@shop.example',
    'https://shop.example?next=https://attacker.example',
    'not a URL',
  ]) {
    assert.equal(trustedAppOrigin(value, true), null);
  }
});

test('development falls back only to the local checkout origin', () => {
  assert.equal(trustedAppOrigin(undefined, false), 'http://localhost:3000');
  assert.equal(trustedAppOrigin('http://localhost:4000', false), 'http://localhost:4000');
});
