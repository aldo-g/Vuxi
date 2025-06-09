import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // The URL to redirect to after logout
  const redirectURL = new URL('/', request.url);

  // Create the redirect response
  const response = NextResponse.redirect(redirectURL, {
    // Use status 303 to instruct the browser to use a GET request for the new location
    status: 303, 
  });

  // Clear the authentication cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return response;
}