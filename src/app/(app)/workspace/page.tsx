import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId, getResumesByUserId } from '@/lib/db';
import { WorkspaceClient } from '@/components/workspace/workspace-client';
import Link from 'next/link';

export default async function WorkspacePage() {
  // Auth never throws — always returns the single user
  const user = await getAuthenticatedUser();

  let profile, baseResumes;
  try {
    profile = await getProfileByUserId(user.id);
    if (!profile) redirect('/onboarding');
    baseResumes = await getResumesByUserId(user.id, true);
  } catch (err) {
    // Distinguish redirect (which throws internally in Next.js) from real DB errors
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
    // DB error — show error state, don't redirect to onboarding (would overwrite data)
    return (
      <main className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-sm text-foreground/50">Could not load workspace. Please refresh.</p>
      </main>
    );
  }

  if (baseResumes.length === 0) {
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
}
