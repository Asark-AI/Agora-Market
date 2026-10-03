import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const redirectUrl = new URL('/sign-in?error=client-required', request.url);
  return NextResponse.redirect(redirectUrl, 303);
}
