import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { verifyMarketplaceSession, requestActorHash } from '@/lib/server/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { RateLimitError, enforceActorRateLimit } from '@/lib/server/rate-limit';
import { searchProductsByImage, VisualSearchStageError } from '@/lib/server/visual-search';
import { validateVisualSearchImage, VISUAL_SEARCH_MAX_BYTES } from '@/lib/visual-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function readBoundedBody(request: Request, maxBytes: number) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function handleVisualSearchRequest(
  request: Request,
  requestId: string,
  setFailureStage: (stage: string) => void
) {
  const requestMaxBytes = VISUAL_SEARCH_MAX_BYTES + 100_000;
  const rawContentLength = request.headers.get('content-length');
  const contentLength = rawContentLength ? Number(rawContentLength) : 0;
  if (!Number.isFinite(contentLength) || contentLength > requestMaxBytes) {
    return NextResponse.json({ error: 'Choose an image smaller than 4 MB.' }, { status: 413 });
  }

  setFailureStage('session_verification');
  const identity = await verifyMarketplaceSession();
  const startedAt = Date.now();
  setFailureStage('rate_limit');
  try {
    await enforceActorRateLimit({
      scope: 'visual-product-search',
      actorId: identity?.uid || requestActorHash(request),
      limit: identity ? 10 : 5,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfterSeconds) },
      });
    }
    throw error;
  }

  setFailureStage('upload_read');
  const boundedBody = await readBoundedBody(request, requestMaxBytes);
  if (!boundedBody) {
    return NextResponse.json({ error: 'Choose an image smaller than 4 MB.' }, { status: 413 });
  }

  let formData: FormData;
  try {
    const boundedRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: boundedBody,
    });
    formData = await boundedRequest.formData();
  } catch {
    return NextResponse.json({ error: 'Upload a JPEG, PNG, or WebP image.' }, { status: 400 });
  }

  const upload = formData.get('image');
  if (!(upload instanceof File)) {
    return NextResponse.json({ error: 'Choose a product image to search.' }, { status: 400 });
  }

  if (upload.size > VISUAL_SEARCH_MAX_BYTES) {
    return NextResponse.json({ error: 'Choose an image smaller than 4 MB.' }, { status: 413 });
  }

  const bytes = new Uint8Array(await upload.arrayBuffer());
  const validationError = validateVisualSearchImage(bytes, upload.type);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let result;
  setFailureStage('image_and_catalog_search');
  try {
    result = await searchProductsByImage(bytes, upload.type);
  } catch (error) {
    if (error instanceof Error && error.name === 'VisualSearchConfigurationError') {
      await getAdminDb().collection('aiVisualSearchAudit').doc(requestId).create({
        requestId,
        actorId: identity?.uid || null,
        result: 'configuration_missing',
        latencyMs: Date.now() - startedAt,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    setFailureStage('audit_write');
    await getAdminDb().collection('aiVisualSearchAudit').doc(requestId).create({
      requestId,
      actorId: identity?.uid || null,
      result: 'failure',
      failureStage: error instanceof VisualSearchStageError ? error.stage : 'unknown',
      errorCategory: error instanceof Error ? error.name : 'unknown',
      latencyMs: Date.now() - startedAt,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    console.error(JSON.stringify({
      event: 'visual_product_search_failure',
      requestId,
      failureStage: error instanceof VisualSearchStageError ? error.stage : 'unknown',
      errorCategory: error instanceof Error ? error.name : 'unknown',
      causeCategory: error instanceof VisualSearchStageError && error.cause instanceof Error
        ? error.cause.name
        : undefined,
    }));
    return NextResponse.json({
      error: error instanceof VisualSearchStageError
        ? error.stage === 'image_analysis'
          ? `Image analysis failed. Check the Google AI key and quota in Vercel, then try again. Reference: ${requestId}`
          : `Catalog search failed. Please try again. Reference: ${requestId}`
        : `Visual search could not complete. Please try again. Reference: ${requestId}`,
    }, { status: 502 });
  }
  await getAdminDb().collection('aiVisualSearchAudit').doc(requestId).create({
    requestId,
    actorId: identity?.uid || null,
    result: 'success',
    productIds: result.shopping.matches.map((match) => match.product.id),
    latencyMs: Date.now() - startedAt,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  let failureStage = 'request_validation';
  try {
    return await handleVisualSearchRequest(request, requestId, (stage) => {
      failureStage = stage;
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: 'visual_product_search_request_failure',
      requestId,
      failureStage,
      errorCategory: error instanceof Error ? error.name : 'unknown',
    }));
    return NextResponse.json({
      error: `Visual search failed during ${failureStage.replace(/_/g, ' ')}. Please try again. Reference: ${requestId}`,
    }, { status: 503 });
  }
}
