import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { requireApprovedRider } from '@/lib/server/authorization';
import type { DecodedIdToken } from 'firebase-admin/auth';

class RiderAuthenticationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function authenticate(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new RiderAuthenticationError('Authentication is required.', 401);
  }
  let identity: DecodedIdToken;
  try {
    identity = await getAdminAuth().verifyIdToken(authorization.slice(7), true);
  } catch {
    throw new RiderAuthenticationError('Authentication is required.', 401);
  }
  if (identity.superAdmin === true) {
    throw new RiderAuthenticationError('Super Admin accounts cannot access Rider Center.', 403);
  }
  if (identity.email_verified !== true) {
    throw new RiderAuthenticationError('Verify your email before accessing rider features.', 403);
  }
  return identity;
}

function publicProfile(data: FirebaseFirestore.DocumentData | undefined) {
  if (!data) return null;
  return {
    userId: data.userId,
    status: data.status,
    riderType: data.riderType,
    storeId: data.storeId || null,
    isOnline: data.isOnline === true,
    vehicleType: data.vehicleType || null,
    vehicleRegistration: data.vehicleRegistration || null,
    ratingAverage: data.ratingAverage || 0,
    completedDeliveries: data.completedDeliveries || 0,
    submittedAt: data.submittedAt?.toDate?.()?.toISOString?.() || data.submittedAt || null,
  };
}

export async function GET(request: Request) {
  try {
    const identity = await authenticate(request);
    const snapshot = await getAdminDb().collection('riderProfiles').doc(identity.uid).get();
    return NextResponse.json({ profile: publicProfile(snapshot.data()) });
  } catch (error) {
    const authError = error instanceof RiderAuthenticationError ? error : null;
    return NextResponse.json({ error: authError?.message || 'Unable to load rider access.' }, { status: authError?.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await authenticate(request);
    const body = await request.json() as { phone?: unknown; vehicleType?: unknown; vehicleRegistration?: unknown };
    const profileRef = getAdminDb().collection('riderProfiles').doc(identity.uid);
    const existing = await profileRef.get();
    const existingStatus = existing.data()?.status;

    if (existing.exists && existingStatus && existingStatus !== 'rejected') {
      return NextResponse.json({ error: 'A rider application already exists.', profile: publicProfile(existing.data()) }, { status: 409 });
    }

    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : '';
    const vehicleType = typeof body.vehicleType === 'string' ? body.vehicleType : 'other';
    const vehicleRegistration = typeof body.vehicleRegistration === 'string' ? body.vehicleRegistration.trim().slice(0, 40) : '';
    const allowedVehicleTypes = ['motorcycle', 'car', 'van', 'bicycle', 'other'];

    if (!phone || !allowedVehicleTypes.includes(vehicleType) || !vehicleRegistration) {
      return NextResponse.json({ error: 'Phone, vehicle type, and vehicle registration are required.' }, { status: 400 });
    }

    await profileRef.set({
      userId: identity.uid,
      riderType: 'AGORA',
      status: 'pending',
      isOnline: false,
      phone,
      vehicleType,
      vehicleRegistration,
      submittedAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    const profile = await profileRef.get();
    return NextResponse.json({ profile: publicProfile(profile.data()) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit rider application.';
    const status = error instanceof RiderAuthenticationError ? error.status : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await authenticate(request);
    const rider = await requireApprovedRider(identity);
    const body = await request.json() as { isOnline?: unknown };
    if (typeof body.isOnline !== 'boolean') {
      return NextResponse.json({ error: 'Availability must be true or false.' }, { status: 400 });
    }

    await rider.ref.update({ isOnline: body.isOnline, updatedAt: new Date() });
    const updated = await rider.ref.get();
    return NextResponse.json({ profile: publicProfile(updated.data()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update availability.';
    const status = error instanceof RiderAuthenticationError ? error.status : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
