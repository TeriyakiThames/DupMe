import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const session = req.cookies.get('connect.sid')?.value; 
  const { pathname } = req.nextUrl;

  // Only protect /main and its subroutes
  if (pathname.startsWith('/main')) {
    if (!session) {
      console.log('User is not authenticated');
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Allow everything else (public, static, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: ['/main/:path*'],
};


