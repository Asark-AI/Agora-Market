import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminPasswordResetEmail } from '../src/lib/admin-password-reset-email.ts';

test('admin reset email uses Agora Admin branding and does not expose the Firebase project name', () => {
  const email = adminPasswordResetEmail({
    resetUrl: 'https://ghana-trade-insights.firebaseapp.com/action?mode=resetPassword&oobCode=one-time-code',
    supportUrl: 'https://agora.example/support',
    year: 2026,
  });

  assert.equal(email.subject, 'Agora Admin — Password Reset');
  assert.match(email.text, /Agora Admin/);
  assert.match(email.html, /Reset Admin Password/);
  assert.match(email.text, /sign in again and complete TOTP verification/i);
  assert.doesNotMatch(email.text, /project-15751349335/);
});

test('admin reset email escapes all dynamic links in HTML', () => {
  const email = adminPasswordResetEmail({
    resetUrl: 'https://agora.example/reset?a=1&b=<script>',
    supportUrl: 'https://agora.example/help?a=1&b="quoted"',
  });

  assert.match(email.html, /&amp;/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /&quot;quoted&quot;/);
  assert.doesNotMatch(email.html, /<script>/);
});
