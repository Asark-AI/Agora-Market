import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/server/admin-auth';

export async function GET(_request: Request, { params }: { params: { orderId: string } }) {
  const identity = await verifySession();
  if (!identity) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  try {
    const snapshot = await getAdminDb().collectionGroup('orders').where('buyerId', '==', identity.uid).limit(100).get();
    const orders = snapshot.docs
      .filter((document) => document.id === params.orderId || document.data().marketplaceOrderId === params.orderId)
      .map((document) => ({ id: document.id, ...document.data() }));
    if (orders.length === 0) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ orderGroupId: params.orderId, orders });
  } catch {
    return NextResponse.json({ error: 'Unable to load this order.' }, { status: 500 });
  }
}
