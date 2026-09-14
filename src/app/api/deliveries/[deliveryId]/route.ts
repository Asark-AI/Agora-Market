'use server';

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAdminAuth } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/server/admin-auth';
import { assertDeliveryTransition } from '@/lib/delivery/state-machine';
import type { DeliveryStatus } from '@/lib/types';

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

async function getIdentity(request: NextRequest) {
  const sessionIdentity = await verifySession();
  if (sessionIdentity) return sessionIdentity;
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return await getAdminAuth().verifyIdToken(header.slice(7), true);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: { deliveryId: string } }) {
  const identity = await getIdentity(request);
  if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  const deliveryRef = getAdminDb().collection('deliveries').doc(params.deliveryId);
  const snapshot = await deliveryRef.get();
  if (!snapshot.exists) return NextResponse.json({ error: 'Delivery not found.' }, { status: 404 });
  const delivery = snapshot.data() as Record<string, unknown>;
  const isAdmin = identity.superAdmin === true || identity.admin === true;
  const isAuthorized = isAdmin || delivery.buyerId === identity.uid || delivery.riderId === identity.uid;
  if (!isAuthorized) return NextResponse.json({ error: 'You are not authorized to view this delivery.' }, { status: 403 });

  const response = { id: snapshot.id, ...delivery } as Record<string, unknown>;
  if (response.deliveryCodeHash) delete response.deliveryCodeHash;
  if (delivery.buyerId === identity.uid && delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELLED') {
    response.deliveryCode = delivery.deliveryCode;
  } else {
    delete response.deliveryCode;
  }
  return NextResponse.json({ delivery: response });
}

export async function PATCH(request: NextRequest, { params }: { params: { deliveryId: string } }) {
  const identity = await getIdentity(request);
  if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  const body = await request.json() as { status?: DeliveryStatus; code?: string };
  const nextStatus = body.status;
  if (!nextStatus) return NextResponse.json({ error: 'A delivery status is required.' }, { status: 400 });

  const db = getAdminDb();
  const deliveryRef = db.collection('deliveries').doc(params.deliveryId);
  const snapshot = await deliveryRef.get();
  if (!snapshot.exists) return NextResponse.json({ error: 'Delivery not found.' }, { status: 404 });
  const delivery = snapshot.data() as Record<string, unknown>;
  const isAdmin = identity.superAdmin === true || identity.admin === true;
  const isAssignedRider = delivery.riderId === identity.uid;
  if (!isAdmin && !isAssignedRider) return NextResponse.json({ error: 'You are not authorized to update this delivery.' }, { status: 403 });

  const currentStatus = delivery.status as DeliveryStatus;
  try {
    assertDeliveryTransition(currentStatus, nextStatus);
  } catch {
    return NextResponse.json({ error: `Cannot change delivery from ${currentStatus} to ${nextStatus}.` }, { status: 409 });
  }

  if (nextStatus === 'DELIVERED') {
    if (!body.code || !delivery.deliveryCodeHash || hashCode(body.code) !== delivery.deliveryCodeHash) {
      await deliveryRef.collection('events').add({ type: 'DELIVERY_CODE_FAILED', actorId: identity.uid, createdAt: new Date() });
      return NextResponse.json({ error: 'Incorrect delivery code.' }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = { status: nextStatus, updatedAt: new Date() };
  if (nextStatus === 'DELIVERED') {
    updates.deliveryCodeHash = null;
    updates.deliveryCode = null;
    updates.deliveredAt = new Date();
  }
  await deliveryRef.update(updates);
  await deliveryRef.collection('events').add({ type: `DELIVERY_${nextStatus}`, status: nextStatus, actorId: identity.uid, createdAt: new Date() });
  return NextResponse.json({ delivery: { id: params.deliveryId, ...delivery, ...updates } });
}

