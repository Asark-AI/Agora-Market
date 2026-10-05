import 'server-only';

import { createHash } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("You're making requests too quickly. Please try again shortly.");
    this.name = 'RateLimitError';
  }
}

export async function enforceActorRateLimit(input: {
  scope: string;
  actorId: string;
  limit: number;
  windowMs: number;
}) {
  if (!input.scope || !input.actorId || !Number.isSafeInteger(input.limit) || input.limit < 1 || !Number.isSafeInteger(input.windowMs) || input.windowMs < 1) {
    throw new Error('Invalid rate-limit configuration.');
  }

  const now = Date.now();
  const windowStart = Math.floor(now / input.windowMs) * input.windowMs;
  const bucketId = createHash('sha256').update(`${input.scope}:${input.actorId}`).digest('hex');
  const db = getAdminDb();
  const bucketRef = db.collection('apiRateLimits').doc(bucketId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bucketRef);
    const data = snapshot.data();
    const count = Number(data?.windowStart) === windowStart ? Number(data?.count || 0) : 0;
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('Invalid rate-limit bucket state.');
    }
    if (count >= input.limit) {
      throw new RateLimitError(Math.max(1, Math.ceil((windowStart + input.windowMs - now) / 1000)));
    }
    transaction.set(bucketRef, {
      scope: input.scope,
      windowStart,
      count: count + 1,
      expiresAt: new Date(windowStart + Math.max(input.windowMs * 2, 3_600_000)),
    });
  });
}
