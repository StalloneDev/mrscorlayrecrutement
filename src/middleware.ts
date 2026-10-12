import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

const PUBLIC_ROUTES = ['/', '/login', '/invitation', '/assessment'];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get('mrs-session')?.value;
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySession(token);
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('mrs-session');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|logo-mrs.png).*)',
  ],
};
