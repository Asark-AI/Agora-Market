import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  generateEmailOtp,
  generateEmailOtpSalt,
  hashEmailOtp,
  matchesEmailOtp,
} from '../src/lib/server/email-otp-crypto.ts';

const secret = 'test-only-hmac-secret-with-at-least-32-characters';

test('generated verification codes are six numeric digits including leading zeroes', () => {
  for (let index = 0; index < 500; index += 1) {
    assert.match(generateEmailOtp(), /^\d{6}$/);
  }
});

test('salted HMAC matches the code and rejects another code or salt', () => {
  const code = '004821';
  const salt = generateEmailOtpSalt();
  const hash = hashEmailOtp(code, salt, secret);

  assert.equal(matchesEmailOtp(code, salt, hash, secret), true);
  assert.equal(matchesEmailOtp('004820', salt, hash, secret), false);
  assert.equal(matchesEmailOtp(code, generateEmailOtpSalt(), hash, secret), false);
  assert.equal(matchesEmailOtp('bad', salt, hash, secret), false);
});

test('OTP hashing rejects malformed input and undersized signing secrets', () => {
  assert.throws(() => hashEmailOtp('4821', generateEmailOtpSalt(), secret), /six digits/);
  assert.throws(() => hashEmailOtp('004821', 'bad-salt', secret), /salt/);
  assert.throws(() => hashEmailOtp('004821', generateEmailOtpSalt(), 'short'), /32 characters/);
});
