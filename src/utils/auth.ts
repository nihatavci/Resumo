import { auth, currentUser } from '@clerk/nextjs/server';
import { getProfileByUserId, createProfile } from '@/lib/db';

/**
 * Returns the authenticated user's Clerk ID and primary email.
 * Throws if the request is unauthenticated — but middleware should prevent
 * unauthenticated requests from reaching protected routes that call this.
 */
export async function getAuthenticatedUser(): Promise<{ id: string; email: string | null }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('UNAUTHENTICATED');
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  return { id: userId, email };
}

export async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('UNAUTHENTICATED');
  return userId;
}

export async function ensureProfile(): Promise<void> {
  const user = await getAuthenticatedUser();
  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    await createProfile(user.id, {
      email: user.email,
    });
  }
}
