import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySuperAdminSession } from '@/lib/server/admin-auth';

export async function GET() {
  try {
    const identity = await verifySuperAdminSession();
    if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const snapshot = await getAdminDb().collection('sellers').limit(500).get();
    const sellers = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: String(data.storeName || data.businessName || data.name || document.id),
          status: String(data.status || 'unknown'),
        };
      })
      .filter((seller) => ['approved', 'active'].includes(seller.status))
      .sort((left, right) => left.name.localeCompare(right.name));
    return NextResponse.json({ sellers }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to load seller accounts.' }, { status: 500 });
  }
}
