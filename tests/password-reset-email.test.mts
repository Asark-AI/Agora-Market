import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordResetEmail } from '../src/lib/password-reset-email.ts';

test('password reset email uses Agora branding and includes clear security guidance', () => {
  const template = passwordResetEmail({
    resetUrl: 'https://agora.example/reset-password?mode=resetPassword&oobCode=one-time-code',
    supportUrl: 'https://agora.example/support',
    year: 2026,
  });

  assert.equal(template.subject, 'Reset your Agora password');
  assert.match(template.html, /Reset My Password/);
  assert.match(template.html, /The Agora Ghana Team/);
  assert.match(template.html, /© 2026 Agora Ghana/);
  assert.match(template.text, /If you did not request a password reset/);
  assert.match(template.text, /one-time-code/);
});

test('password reset email safely escapes action and support URLs in HTML', () => {
  const template = passwordResetEmail({
    resetUrl: 'https://agora.example/reset?x=1&y=<unsafe>',
    supportUrl: 'https://agora.example/support?from=a&to=b',
    year: 2026,
  });

  assert.match(template.html, /x=1&amp;y=&lt;unsafe&gt;/);
  assert.match(template.html, /from=a&amp;to=b/);
  assert.doesNotMatch(template.html, /href="https:\/\/agora\.example\/reset\?x=1&y=/);
});
