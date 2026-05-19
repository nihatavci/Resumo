'use server';

import { getAuthenticatedUser } from '@/utils/auth';
import { Profile, WorkExperience, Education, Skill, Project } from '@/lib/types';
import { updateProfile, getProfileByUserId } from '@/lib/db';

export async function getMemoryData(): Promise<Profile> {
  const user = await getAuthenticatedUser();
  const profile = await getProfileByUserId(user.id);
  if (!profile) throw new Error('No profile found');
  return profile;
}

export async function updateBasicInfo(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
}): Promise<Profile> {
  const user = await getAuthenticatedUser();
  const updated = await updateProfile(user.id, data);
  if (!updated) throw new Error('Failed to update profile');
  return updated;
}

export async function updateWorkExperience(work_experience: WorkExperience[]): Promise<Profile> {
  const user = await getAuthenticatedUser();
  const updated = await updateProfile(user.id, { work_experience });
  if (!updated) throw new Error('Failed to update profile');
  return updated;
}

export async function updateEducation(education: Education[]): Promise<Profile> {
  const user = await getAuthenticatedUser();
  const updated = await updateProfile(user.id, { education });
  if (!updated) throw new Error('Failed to update profile');
  return updated;
}

export async function updateSkills(skills: Skill[]): Promise<Profile> {
  const user = await getAuthenticatedUser();
  const updated = await updateProfile(user.id, { skills });
  if (!updated) throw new Error('Failed to update profile');
  return updated;
}

export async function updateProjects(projects: Project[]): Promise<Profile> {
  const user = await getAuthenticatedUser();
  const updated = await updateProfile(user.id, { projects });
  if (!updated) throw new Error('Failed to update profile');
  return updated;
}
