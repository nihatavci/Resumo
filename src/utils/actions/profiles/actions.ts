'use server';

import { Profile } from "@/lib/types";
import * as db from "@/lib/db";
import { getAuthenticatedUser } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { AnalyticsEvents } from "@/lib/analytics/events";
import {
  captureServerAnalyticsEvent,
  getSubscriptionAnalyticsProperties,
} from "@/lib/analytics/server";

function isProfileComplete(profile: Partial<Profile> | null | undefined) {
  return Boolean(profile?.first_name && profile?.last_name && profile?.email);
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  const user = await getAuthenticatedUser();

  const currentProfile = await db.getProfileByUserId(user.id);

  const profile = await db.updateProfile(user.id, data);

  if (!profile) {
    throw new Error('Failed to update profile');
  }

  if (!isProfileComplete(currentProfile) && isProfileComplete(profile)) {
    await captureServerAnalyticsEvent({
      distinctId: user.id,
      event: AnalyticsEvents.ProfileCreated,
      properties: await getSubscriptionAnalyticsProperties(user.id),
    });
  }

  // Revalidate all routes that might display profile data
  revalidatePath('/', 'layout');
  revalidatePath('/profile/edit', 'layout');
  revalidatePath('/resumes', 'layout');
  revalidatePath('/profile', 'layout');

  return profile;
}

export async function importResume(data: Partial<Profile>): Promise<Profile> {
  const user = await getAuthenticatedUser();

  // First, get the current profile
  const currentProfile = await db.getProfileByUserId(user.id);

  if (!currentProfile) {
    throw new Error('Failed to fetch current profile: profile not found');
  }

  // Prepare the update data
  const updateData: Partial<Profile> = {};

  // Handle simple string fields - only update if current value is null/empty
  const simpleFields = ['first_name', 'last_name', 'email', 'phone_number',
    'location', 'website', 'linkedin_url', 'github_url'] as const;

  simpleFields.forEach((field) => {
    if (data[field] !== undefined) {
      // Only update if current value is null or empty string
      if (!currentProfile[field]) {
        updateData[field] = data[field];
      }
    }
  });

  // Handle array fields - append to existing arrays
  const arrayFields = ['work_experience', 'education', 'skills',
    'projects'] as const;

  arrayFields.forEach((field) => {
    if (data[field]?.length) {
      // Simply append new items to the existing array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updateData as any)[field] = [
        ...(currentProfile[field] || []),
        ...data[field]
      ];
    }
  });

  // Only proceed with update if there are changes
  if (Object.keys(updateData).length === 0) {
    return currentProfile;
  }

  const profile = await db.updateProfile(user.id, updateData);

  if (!profile) {
    throw new Error('Failed to update profile');
  }

  // Revalidate all routes that might display profile data
  revalidatePath('/', 'layout');
  revalidatePath('/profile/edit', 'layout');
  revalidatePath('/resumes', 'layout');
  revalidatePath('/profile', 'layout');

  return profile;
}


export async function resetProfile(): Promise<Profile> {
  const user = await getAuthenticatedUser();

  const emptyProfile: Partial<Profile> = {
    first_name: null,
    last_name: null,
    email: null,
    phone_number: null,
    location: null,
    website: null,
    linkedin_url: null,
    github_url: null,
    work_experience: [],
    education: [],
    skills: [],
    projects: [],
  };

  const profile = await db.updateProfile(user.id, emptyProfile);

  if (!profile) {
    throw new Error('Failed to reset profile');
  }

  return profile;
}
