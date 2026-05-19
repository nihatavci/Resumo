import { redirect } from 'next/navigation';
import { getProfileByUserId } from '@/lib/db';
import { getAuthenticatedUser } from '@/utils/auth';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';

export default async function OnboardingPage() {
  let hasProfile = false;
  try {
    const user = await getAuthenticatedUser();
    const profile = await getProfileByUserId(user.id);
    hasProfile = !!profile;
  } catch {
    // Not authenticated or no profile — show onboarding
  }

  if (hasProfile) {
    redirect('/workspace');
  }

  return <OnboardingFlow />;
}
