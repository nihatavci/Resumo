import { NextRequest, NextResponse } from 'next/server'


/**
 * GET /stop-impersonation
 *
 * In single-user mode with Cloudflare Access, impersonation is not supported.
 * Redirects to home.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/', request.url))
}
