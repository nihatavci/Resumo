import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId } from '@/lib/db';
import { MemoryClient } from '@/components/memory/memory-client';

export default async function MemoryPage() {
  let profile;
  try {
    const user = await getAuthenticatedUser();
    profile = await getProfileByUserId(user.id);
    if (!profile) redirect('/onboarding');
  } catch {
    redirect('/onboarding');
  }

  return <MemoryClient profile={profile} />;
}
