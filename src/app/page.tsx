import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId } from '@/lib/db';

export default async function RootPage() {
  // Auth never throws — always returns the single user
  const user = await getAuthenticatedUser();
  try {
    const profile = await getProfileByUserId(user.id);
    if (profile) {
      redirect('/workspace');
    } else {
      redirect('/onboarding');
    }
  } catch {
    // DB error — don't send to onboarding (would overwrite data).
    // Send to workspace and let it handle the empty state gracefully.
    redirect('/workspace');
  }
}
