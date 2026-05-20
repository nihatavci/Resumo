// src/utils/actions/onboarding.ts
'use server';

import { z } from 'zod';
import { generateObject, type LanguageModelUsage, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { textImportSchema } from '@/lib/zod-schemas';
import { getAuthenticatedUser } from '@/utils/auth';
import {
  finishAIUsageRequest,
  startAIUsageRequest,
} from '@/lib/ai/usage-ledger';
import * as db from '@/lib/db';
import type { Profile, Education, WorkExperience, Skill, Project } from '@/lib/types';
import type { CVExtraction } from '@/lib/onboarding/types';
import type { AIConfig } from '@/utils/ai-tools';

async function runTrackedAIRequest<T extends { usage?: LanguageModelUsage }>(
  input: {
    route: string;
    userId: string;
    isPro: boolean;
    config?: AIConfig;
  },
  task: (model: LanguageModelV1, telemetry: TelemetrySettings) => Promise<T>
) {
  const { model, usageEventId, telemetry } = await startAIUsageRequest(input);

  try {
    const result = await task(model, telemetry);
    await finishAIUsageRequest({
      usageEventId,
      status: 'succeeded',
      usage: result.usage,
    });
    return result;
  } catch (error) {
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: error instanceof Error ? error.message : 'ai_request_failed',
    });
    throw error;
  }
}

export async function extractCVData(cvText: string): Promise<CVExtraction> {
  const user = await getAuthenticatedUser();

  const { object } = await runTrackedAIRequest(
    {
      route: 'actions.onboarding.extractCVData',
      userId: user.id,
      isPro: true,
      // Use the default 70B model — structured extraction from messy CV text
      // needs reasoning capability the 8B model lacks.
    },
    (aiClient, telemetry) =>
      generateObject({
        model: aiClient,
        experimental_telemetry: telemetry,
        schema: z.object({ content: textImportSchema }),
        system: `You parse resumes. Your output MUST match the schema exactly.

CRITICAL RULES:
1. The CANDIDATE'S NAME is almost always the largest text at the very top. Split it into first_name and last_name. NEVER skip the name.
2. Email is anything matching user@domain.tld pattern.
3. Phone numbers contain + or parentheses or 10+ digits with separators.
4. URLs starting with linkedin.com → linkedin_url. github.com → github_url. Others → website.
5. Location is "City, Region" or "City, Country" — usually near the top under the name.
6. For work_experience: each role gets ONE entry. "date" is the date range as written ("Jan 2020 - Present", "2018-2021", etc.). "description" is an array — one string per bullet point.
7. For education: "school" is the institution name. "degree" is the qualification ("BSc", "MA", "PhD", "MBA"). "field" is the subject ("Computer Science").
8. For skills: group by visible category. If no category given, use "Technical Skills".
9. PRESERVE original wording. Do not paraphrase, summarize, or invent.
10. If a section is missing in the CV, omit it (don't fabricate).

The CV text below may have layout artifacts from PDF parsing. Use context to determine what's a heading vs body text.`,
        prompt: `Parse this CV:\n\n${cvText}`,
      })
  );

  return object.content;
}

export async function completeOnboarding(
  answers: Record<string, string | string[]>,
  cvData: CVExtraction | null,
  targetRole: string
): Promise<{ profileId: string; resumeId: string }> {
  const user = await getAuthenticatedUser();

  const workExperience = (cvData?.work_experience ?? []) as WorkExperience[];
  const education = (cvData?.education ?? []).map((e) => ({
    ...e,
    field: e.field ?? '',
    date: e.date ?? '',
  })) as Education[];
  const projects = (cvData?.projects ?? []) as Project[];

  // Build skills: start with CV-extracted data, then merge form answers.
  // Form answers WIN for their specific categories (they come from the review screen
  // where the user explicitly confirmed/edited the values). We replace any CV category
  // whose name overlaps with the same canonical category name.
  const cvSkills = (cvData?.skills ?? []) as Skill[];

  const formCategories: { category: string; key: keyof typeof answers; match: string[] }[] = [
    { category: 'Programming Languages', key: 'programming_languages', match: ['language', 'programming'] },
    { category: 'Frameworks & Methodologies', key: 'frameworks', match: ['framework', 'methodolog', 'standard', 'agile', 'scrum', 'librar'] },
    { category: 'Tools & Software', key: 'tools_software', match: ['tool', 'software', 'platform', 'database', 'cloud', 'devops'] },
    { category: 'Certifications', key: 'certifications', match: ['certif', 'license'] },
  ];

  // Drop CV skill categories that are superseded by form answers
  const supersededKeywords = formCategories.flatMap((fc) => fc.match);
  const baseSkills = cvSkills.filter((s) => {
    const cat = s.category.toLowerCase();
    return !supersededKeywords.some((kw) => cat.includes(kw));
  });

  // Append form answer categories (only if non-empty)
  const skills: Skill[] = [...baseSkills];
  for (const { category, key, } of formCategories) {
    const val = answers[key];
    if (Array.isArray(val) && val.length > 0) {
      skills.push({ category, items: val });
    }
  }

  const profileData: Partial<Profile> = {
    first_name: (answers.first_name as string) || cvData?.first_name || null,
    last_name: (answers.last_name as string) || cvData?.last_name || null,
    email: (answers.email as string) || cvData?.email || null,
    phone_number: (answers.phone_number as string) || cvData?.phone_number || null,
    location: (answers.location as string) || cvData?.location || null,
    website: (answers.website as string) || cvData?.website || null,
    linkedin_url: (answers.linkedin_url as string) || cvData?.linkedin_url || null,
    github_url: (answers.github_url as string) || cvData?.github_url || null,
    work_experience: workExperience,
    education: education,
    skills: skills,
    projects: projects,
  };

  // Upsert profile — update if exists, create if not
  const existingProfile = await db.getProfileByUserId(user.id);
  const profile = existingProfile
    ? await db.updateProfile(user.id, profileData).then(p => p!)
    : await db.createProfile(user.id, profileData);

  // Also upsert the Master CV — update the existing base resume if any
  const existingBaseResumes = await db.getResumesByUserId(user.id, true);

  const resume = existingBaseResumes.length > 0
    ? await db.updateResume(existingBaseResumes[0].id, user.id, {
        target_role: targetRole || 'General',
        first_name: profileData.first_name ?? '',
        last_name: profileData.last_name ?? '',
        email: profileData.email ?? '',
        phone_number: profileData.phone_number ?? '',
        location: profileData.location ?? '',
        website: profileData.website ?? '',
        linkedin_url: profileData.linkedin_url ?? '',
        github_url: profileData.github_url ?? '',
        work_experience: workExperience,
        education: education,
        skills: skills,
        projects: projects,
      }).then(r => r!)
    : await db.insertResume({
    user_id: user.id,
    name: 'Master CV',
    target_role: targetRole || 'General',
    is_base_resume: true,
    first_name: profileData.first_name ?? '',
    last_name: profileData.last_name ?? '',
    email: profileData.email ?? '',
    phone_number: profileData.phone_number ?? '',
    location: profileData.location ?? '',
    website: profileData.website ?? '',
    linkedin_url: profileData.linkedin_url ?? '',
    github_url: profileData.github_url ?? '',
    work_experience: workExperience,
    education: education,
    skills: skills,
    projects: projects,
    section_order: ['work_experience', 'education', 'skills', 'projects'],
    section_configs: {
      work_experience: { visible: workExperience.length > 0 },
      education: { visible: education.length > 0 },
      skills: { visible: skills.length > 0 },
      projects: { visible: projects.length > 0 },
    },
    document_settings: {
      footer_width: 0,
      show_ubc_footer: false,
      header_name_size: 24,
      skills_margin_top: 0,
      document_font_size: 10,
      projects_margin_top: 0,
      skills_item_spacing: 0,
      document_line_height: 1.2,
      education_margin_top: 0,
      skills_margin_bottom: 2,
      experience_margin_top: 2,
      projects_item_spacing: 0,
      education_item_spacing: 0,
      projects_margin_bottom: 0,
      education_margin_bottom: 0,
      experience_item_spacing: 1,
      document_margin_vertical: 20,
      experience_margin_bottom: 0,
      skills_margin_horizontal: 0,
      document_margin_horizontal: 28,
      header_name_bottom_spacing: 16,
      projects_margin_horizontal: 0,
      education_margin_horizontal: 0,
      experience_margin_horizontal: 0,
    },
  });

  return { profileId: profile.id, resumeId: resume.id };
}
