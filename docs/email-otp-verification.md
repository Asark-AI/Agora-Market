# Email OTP verification

Agora sign-up verifies the Firebase account email with a six-digit code delivered through Resend. The browser must already be authenticated as the unverified Firebase user; send and verify endpoints derive the recipient and UID from the verified Firebase ID token and never accept a client-selected recipient.

## Required server environment

- `RESEND_API_KEY`: Resend API key stored only in the server/deployment secret manager.
- `EMAIL_FROM`: sender address on a domain verified with Resend.
- `EMAIL_OTP_HMAC_SECRET`: independent secret of at least 32 characters, generated randomly and stored only on the server.
- Firebase Admin SDK credentials pointing at the same environment's Firebase project.

Never use production Firebase or Resend credentials in local/staging environments. `.env.example` and `.env.staging.example` contain placeholders only.

## Flow and protections

1. Sign-up creates the Firebase account and profile, then requests an OTP for the email on that authenticated account.
2. The server generates a cryptographically random six-digit code. Firestore stores only a salted HMAC, the account UID/email, attempt count, expiry, and resend cooldown in the Admin-only `emailVerificationOtps` collection.
3. Resend delivers the code via the Resend API. Codes expire after 10 minutes; a new code invalidates the previous challenge.
4. Verification is authenticated, limited to five guesses per challenge and ten requests per user per 15-minute rate-limit window. Sending is limited to three attempts per user per 15-minute window and a 60-second resend cooldown.
5. A correct code is atomically marked verified before Firebase Admin marks the same account email verified. The challenge is deleted after successful Firebase update. Firebase ID token refresh and the existing server-session endpoint then establish the signed-in session.

No OTP is written to logs, returned by an API, or stored in plaintext. The Firebase verification-link flow is still recognized for users who already received an older link.

## Deployment checks

Configure all server variables in the appropriate secret manager. Deploy the Firestore TTL field override for `emailVerificationOtps.expiresAt` along with the existing indexes/rules. The staging preflight (`npm run check:staging-env`) requires a staging Resend key, verified sender, and strong OTP HMAC secret in addition to the existing isolated Firebase and test Paystack settings. A successful build/unit test does not prove that Resend has authorized the sender domain or that delivery reaches a mailbox; verify those in an isolated staging deployment before enabling sign-up.
