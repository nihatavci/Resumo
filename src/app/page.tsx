import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId } from '@/lib/db';

export default async function RootPage() {
  // Middleware ensures user is authenticated by the time we get here
  const user = await getAuthenticatedUser();

  try {
    const profile = await getProfileByUserId(user.id);
    if (profile) {
      redirect('/workspace');
    } else {
      redirect('/onboarding');
    }
  } catch (err) {
    // redirect() throws internally — re-throw it
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
    // Real DB error — go to onboarding (safer than workspace which expects data)
    redirect('/onboarding');
  }
}
