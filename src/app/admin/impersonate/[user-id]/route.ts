import { NextRequest, NextResponse } from 'next/server'


/**
 * GET /admin/impersonate/:user-id
 *
 * In single-user mode with Cloudflare Access, impersonation is not supported.
 * Redirects back to admin.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/admin', request.url))
}
