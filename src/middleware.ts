import { NextResponse } from 'next/server'

export async function middleware() {
  // In single-user mode with Cloudflare Access, auth is handled at the edge.
  // This middleware is a pass-through. Cloudflare Access blocks unauthenticated
  // requests before they reach the application.
  //
  // For local development without CF Access, all requests are allowed
  // (the auth layer treats every request as the single user).
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
