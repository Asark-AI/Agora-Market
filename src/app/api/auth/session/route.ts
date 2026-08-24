import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE } from '@/lib/server/admin-auth';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    const idToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!idToken) return NextResponse.json({ error: 'Authentication token is required.' }, { status: 401 });

    const decodedToken = await getAdminAuth().verifyIdToken(idToken, true);
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn: 5 * 24 * 60 * 60 * 1000 });
    const response = NextResponse.json({ ok: true, uid: decodedToken.uid });
    response.cookies.set(SESSION_COOKIE, sessionCookie, { ...cookieOptions, maxAge: 5 * 24 * 60 * 60 });
    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to establish a secure session.' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
