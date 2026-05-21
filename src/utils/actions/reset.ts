'use server';

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { deleteProfileByUserId, deleteResumesByUserId } from '@/lib/db';

/**
 * Wipes the current user's profile + all their resumes.
 * After deletion, redirects to /onboarding to start fresh.
 * The Clerk account itself is NOT deleted — only the app data.
 */
export async function resetMyData() {
  const user = await getAuthenticatedUser();
  console.log('[resetMyData] wiping data for user:', user.id);

  await deleteResumesByUserId(user.id);
  await deleteProfileByUserId(user.id);

  redirect('/onboarding');
}
