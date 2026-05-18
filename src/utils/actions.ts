'use server'

import { getAuthenticatedUser } from "@/utils/auth";
import { getProfileByUserId, createProfile, getResumesByUserId } from "@/lib/db";
import { Profile, ResumeSummary } from "@/lib/types";

interface DashboardData {
  profile: Profile | null;
  baseResumes: ResumeSummary[];
  tailoredResumes: ResumeSummary[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getAuthenticatedUser();

  try {
    // Fetch profile data
    let profile = await getProfileByUserId(user.id);

    // If profile doesn't exist, create one
    if (!profile) {
      profile = await createProfile(user.id, {
        email: user.email,
      });
    }

    // Fetch resumes data
    const resumes = await getResumesByUserId(user.id);

    const sanitizedResumes: ResumeSummary[] =
      resumes.map((resume) => ({
        id: resume.id,
        user_id: resume.user_id,
        name: resume.name,
        target_role: resume.target_role || '',
        is_base_resume: resume.is_base_resume,
        job_id: resume.job_id,
        created_at: resume.created_at,
        updated_at: resume.updated_at,
      }));

    const baseResumes = sanitizedResumes.filter((resume) => resume.is_base_resume);
    const tailoredResumes = sanitizedResumes.filter((resume) => !resume.is_base_resume);

    return {
      profile,
      baseResumes,
      tailoredResumes,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return {
        profile: null,
        baseResumes: [],
        tailoredResumes: []
      };
    }
    throw error;
  }
}
