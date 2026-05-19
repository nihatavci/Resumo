import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId, getResumesByUserId } from '@/lib/db';
import { WorkspaceClient } from '@/components/workspace/workspace-client';

export default async function WorkspacePage() {
  let masterResume;
  try {
    const user = await getAuthenticatedUser();
    const profile = await getProfileByUserId(user.id);
    if (!profile) redirect('/onboarding');

    const baseResumes = await getResumesByUserId(user.id, true);
    if (baseResumes.length === 0) redirect('/onboarding');

    masterResume = baseResumes[0];
  } catch {
    redirect('/onboarding');
  }

  return <WorkspaceClient masterResume={masterResume} />;
}
