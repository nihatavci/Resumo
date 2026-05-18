import { NextRequest, NextResponse } from 'next/server'


// Supabase OAuth callback is no longer needed with CF Access auth.
// Redirect any requests to this route back to the home page.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
