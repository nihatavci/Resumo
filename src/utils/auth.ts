import { headers } from 'next/headers';
import { getProfileByUserId, createProfile } from '@/lib/db';

const SINGLE_USER_ID = process.env.SINGLE_USER_ID || 'default-user';

export async function getAuthenticatedUser(): Promise<{ id: string; email: string | null }> {
  const headersList = await headers();

  // Cloudflare Access sets this header with the authenticated user's JWT
  const cfAccessEmail = headersList.get('cf-access-authenticated-user-email');

  if (cfAccessEmail) {
    // Cloudflare Access authenticated — use email as identity
    // In single-user mode, we still use a fixed user ID for DB consistency
    return { id: SINGLE_USER_ID, email: cfAccessEmail };
  }

  // Fallback: single-user mode without Cloudflare Access (local dev)
  // All requests are treated as the single user
  return { id: SINGLE_USER_ID, email: process.env.USER_EMAIL || null };
}

export async function getUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  return user.id;
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
