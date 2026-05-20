import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId } from '@/lib/db';
import { MemoryClient } from '@/components/memory/memory-client';

export default async function MemoryPage() {
  // Auth never throws — always returns the single user
  const user = await getAuthenticatedUser();

  let profile;
  try {
    profile = await getProfileByUserId(user.id);
  } catch {
    // DB error — render an error state rather than destructively redirecting to onboarding
    return (
      <div className="min-h-screen bg-dia-canvas flex items-center justify-center">
        <p className="text-sm text-foreground/50">Could not load profile. Please refresh.</p>
      </div>
    );
  }

  if (!profile) redirect('/onboarding');

  return <MemoryClient profile={profile} />;
}
