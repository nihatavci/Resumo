import { redirect } from 'next/navigation'


// Supabase email OTP confirmation is no longer needed with CF Access auth.
// Redirect any requests to this route back to the home page.
export async function GET() {
  redirect('/')
}
