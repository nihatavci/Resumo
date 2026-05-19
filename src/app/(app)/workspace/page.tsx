import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId, getResumesByUserId } from '@/lib/db';
import { WorkspaceClient } from '@/components/workspace/workspace-client';
import Link from 'next/link';

export default async function WorkspacePage() {
  try {
    const user = await getAuthenticatedUser();
    const profile = await getProfileByUserId(user.id);

    if (!profile) redirect('/onboarding');

    const baseResumes = await getResumesByUserId(user.id, true);

    if (baseResumes.length === 0) {
      // Profile exists but no Master CV yet — show empty state (no redirect, avoids loop)
      return (
        <main className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <h1 className="text-dia-heading-sm font-light text-foreground">No Master CV yet</h1>
            <p className="text-sm text-dia-muted">
              Complete onboarding to generate your Master CV. It only takes a few minutes.
            </p>
            <Link
              href="/onboarding"
              className="inline-block rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:bg-dia-graphite transition-colors"
            >
              Go to Onboarding
            </Link>
          </div>
        </main>
      );
    }

    return <WorkspaceClient masterResume={baseResumes[0]} />;
  } catch {
    redirect('/onboarding');
  }
}
