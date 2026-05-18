'use server';

import { getAuthenticatedUser } from '@/utils/auth';
import {
  getProfileByUserId,
  getAllProfiles,
  getResumeCountForUser as dbGetResumeCountForUser,
  getResumeSummariesForUser,
  getTotalResumeCount as dbGetTotalResumeCount,
  getBaseResumeCount as dbGetBaseResumeCount,
  getTailoredResumeCount as dbGetTailoredResumeCount,
} from '@/lib/db';
import { redirect } from 'next/navigation';

/**
 * Checks if the currently authenticated user is an admin.
 * Looks up the profile in D1 and checks the is_admin flag.
 */
export async function checkAdminStatus(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    const profile = await getProfileByUserId(user.id);
    return profile?.is_admin === true;
  } catch (error) {
    console.error('Admin check failed', error);
    return false;
  }
}

/**
 * Ensures the current user is an admin, otherwise redirects.
 */
export async function ensureAdmin() {
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) {
    redirect('/');
  }
}

// Define interfaces for return types
import type { Profile } from '@/lib/types';

interface ProfileWithResumeCount {
  user: {
    id: string;
    email: string | null;
    created_at: string;
  };
  profile: Profile | null;
  resume_count: number;
}

export async function getUsersWithProfilesAndSubscriptions(): Promise<ProfileWithResumeCount[]> {
  const { profiles } = await getAllProfiles(10000, 0);

  const results: ProfileWithResumeCount[] = [];

  for (const profile of profiles) {
    const resumeCount = await dbGetResumeCountForUser(profile.user_id);
    results.push({
      user: {
        id: profile.user_id,
        email: profile.email ?? null,
        created_at: profile.created_at,
      },
      profile,
      resume_count: resumeCount,
    });
  }

  return results;
}

export async function getUserDetailsById(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const profile = await getProfileByUserId(userId);

  if (!profile) {
    return null;
  }

  return {
    user: {
      id: profile.user_id,
      email: profile.email ?? null,
      created_at: profile.created_at,
    },
    profile,
  };
}

export async function getResumeCountForUser(userId: string): Promise<number> {
  if (!userId) {
    console.error('Attempted to get resume count without user ID.');
    return 0;
  }
  return dbGetResumeCountForUser(userId);
}

export async function getResumesForUser(userId: string) {
  if (!userId) {
    console.error('Attempted to get resumes without user ID.');
    return [];
  }

  const resumes = await getResumeSummariesForUser(userId);
  return resumes.map((r) => ({
    id: r.id,
    name: r.name,
    created_at: r.created_at,
    is_base_resume: r.is_base_resume,
  }));
}

export async function getTotalUserCount(): Promise<number> {
  const { total } = await getAllProfiles(1, 0);
  return total;
}

export async function getTotalResumeCount(): Promise<number> {
  return dbGetTotalResumeCount();
}

export async function getBaseResumeCount(): Promise<number> {
  return dbGetBaseResumeCount();
}

export async function getTailoredResumeCount(): Promise<number> {
  return dbGetTailoredResumeCount();
}
