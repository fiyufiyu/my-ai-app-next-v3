import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for the chat page
  if (request.nextUrl.pathname.startsWith('/chat')) {
    // Check for session cookie
    const sessionToken = request.cookies.get('symbiont-session');
    
    if (!sessionToken) {
      // Redirect to home page if no session
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat/:path*',
  ],
};

