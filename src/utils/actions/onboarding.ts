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

async function runTrackedAIRequest<T extends { usage?: LanguageModelUsage }>(
  input: {
    route: string;
    userId: string;
    isPro: boolean;
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
    },
    (aiClient, telemetry) =>
      generateObject({
        model: aiClient,
        experimental_telemetry: telemetry,
        schema: z.object({ content: textImportSchema }),
        system: `You are an expert CV parser. Extract ALL structured information from the provided CV text into the schema format.

Be thorough:
- Extract every work experience entry with company, position, dates, and all bullet points
- Extract every education entry with school, degree, field, dates
- Extract all skills, grouped by category (e.g. "Programming Languages", "Frameworks", "Tools")
- Extract all projects with descriptions and technologies
- Extract all contact information (name, email, phone, location, URLs)

Preserve the original wording exactly. Do not rephrase, summarize, or embellish anything.`,
        prompt: cvText,
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
  const skills = (cvData?.skills ?? []) as Skill[];
  const projects = (cvData?.projects ?? []) as Project[];

  const certifications = answers.certifications;
  if (certifications && Array.isArray(certifications) && certifications.length > 0) {
    skills.push({ category: 'Certifications', items: certifications });
  }
  const tools = answers.tools_software;
  if (tools && Array.isArray(tools) && tools.length > 0) {
    skills.push({ category: 'Tools & Software', items: tools });
  }
  const frameworks = answers.frameworks;
  if (frameworks && Array.isArray(frameworks) && frameworks.length > 0) {
    skills.push({ category: 'Frameworks & Methodologies', items: frameworks });
  }
  const progLangs = answers.programming_languages;
  if (progLangs && Array.isArray(progLangs) && progLangs.length > 0) {
    skills.push({ category: 'Programming Languages', items: progLangs });
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

  const profile = await db.createProfile(user.id, profileData);

  const resume = await db.insertResume({
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
