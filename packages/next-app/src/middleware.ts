/**
 * Next.js Middleware - Authentication Guard
 * 
 * Provides JWT-based authentication protection for protected routes.
 * Automatically redirects unauthenticated users to the login page and 
 * validates JWT tokens for dashboard access.
 * 
 * @responsibilities
 * - Intercepts requests to protected routes (/dashboard/*)
 * - Validates JWT tokens from cookies
 * - Redirects unauthorized users to /login
 * - Allows authenticated users to proceed to requested pages
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Redirect to login if no token is found
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    // Verify the token
    await jose.jwtVerify(token, secret);
    // If token is valid, continue to the requested page
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    console.error('JWT Verification Error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*', // Protects all dashboard routes
  ],
};