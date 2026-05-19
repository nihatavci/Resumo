import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId } from '@/lib/db';

export default async function RootPage() {
  try {
    const user = await getAuthenticatedUser();
    const profile = await getProfileByUserId(user.id);
    if (profile) {
      redirect('/workspace');
    } else {
      redirect('/onboarding');
    }
  } catch {
    redirect('/onboarding');
  }
}
