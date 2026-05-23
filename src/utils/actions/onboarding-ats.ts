// src/utils/actions/onboarding-ats.ts
'use server';

import { z } from 'zod';
import { generateObject, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import { getAuthenticatedUser } from '@/utils/auth';
import type { WorkExperience, Skill } from '@/lib/types';
import { HUMANIZATION_INSTRUCTIONS } from '@/lib/ai/humanization';

// Schema for ATS-optimized bullet rewrite
const atsWorkSchema = z.object({
  work_experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      date: z.string(),
      location: z.string().optional(),
      description: z.array(z.string()),
      technologies: z.array(z.string()).optional(),
    })
  ),
});

const atsSkillsSchema = z.object({
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ),
});

const ATS_WORK_PROMPT = `You are an ATS resume specialist. Rewrite the candidate's work experience bullets to be ATS-optimized for the given target role.

CRITICAL ATS RULES:
1. PRESERVE ALL FACTS — numbers, percentages, dollar amounts, dates, company names, achievements. NEVER invent or inflate.
2. LEAD with strong action verbs (Achieved, Led, Built, Designed, Reduced, Increased, Launched, Developed, Drove, Managed, Shipped, Grew).
3. QUANTIFY where possible (use the candidate's original numbers — do NOT make up new ones).
4. KEYWORD MATCH the target role — naturally incorporate relevant industry terms IF they correspond to what the candidate actually did.
5. CONCISE — one strong line per bullet (max ~25 words). Cut filler words.
6. VARIED structure — most bullets start with an action verb, but vary the pattern: some lead with the result, some use a two-part structure. See writing style rules below.
7. RESULT-ORIENTED — what was achieved, not just what was done.

DO NOT:
- Invent achievements or skills the candidate doesn't have
- Add metrics that weren't in the original
- Change job titles, companies, or dates
- Reword something that's already strong

INPUT: candidate's existing work experience.
OUTPUT: the same work experience entries with description bullets rewritten to ATS standards.
Keep company/position/date/location identical. Only the description bullets get rewritten.

${HUMANIZATION_INSTRUCTIONS}`;

const ATS_SKILLS_PROMPT = `You are an ATS resume specialist. Reorganize the candidate's skills into ATS-friendly categories and order.

RULES:
1. Use industry-standard category names. Examples by field:
   - Software engineering: "Programming Languages", "Frameworks & Libraries", "Tools & Platforms", "Cloud & DevOps", "Databases"
   - Marketing: "Marketing Channels", "Analytics & Reporting", "Marketing Tools", "Campaign Management"
   - Design: "Design Tools", "Design Systems", "Research Methods"
   - Data: "Programming Languages", "Data Tools", "Visualization", "Databases", "Statistics & ML"
2. Group skills logically — don't dump everything under one category.
3. PRESERVE all skills from the input. Do NOT add new skills.
4. Within each category, order by relevance to the target role (most relevant first).
5. Use the candidate's terminology (e.g. if they say "Google Ads", use that, not "AdWords").
6. Skills that are clearly the candidate's strong suit (mentioned multiple times in their experience) should be in their own category if there are 5+.`;

async function runATSCall<S extends z.ZodTypeAny>(
  route: string,
  userId: string,
  schema: S,
  systemPrompt: string,
  prompt: string
): Promise<z.infer<S> | null> {
  const { model, usageEventId, telemetry } = await startAIUsageRequest({
    route,
    userId,
    isPro: true,
  });

  try {
    const { object, usage } = await generateObject({
      model: model as LanguageModelV1,
      experimental_telemetry: telemetry as TelemetrySettings,
      schema,
      system: systemPrompt,
      prompt,
    });
    await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });
    console.log(`[${route}] success`);
    return object;
  } catch (err) {
    console.error(`[${route}] FAILED:`, err instanceof Error ? err.message : err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'ats_failed',
    });
    return null;
  }
}

/**
 * Apply ATS optimization to work experience bullets.
 * Returns optimized bullets, or the original input if AI fails.
 */
export async function optimizeWorkForATS(
  workExperience: WorkExperience[],
  targetRole: string
): Promise<WorkExperience[]> {
  if (workExperience.length === 0) return workExperience;

  const user = await getAuthenticatedUser();
  console.log('[optimizeWorkForATS] entries:', workExperience.length, 'role:', targetRole);

  const result = await runATSCall(
    'actions.onboarding.optimizeWork',
    user.id,
    atsWorkSchema,
    ATS_WORK_PROMPT,
    `TARGET ROLE: ${targetRole || 'General professional role'}\n\nCANDIDATE'S WORK EXPERIENCE:\n${JSON.stringify(workExperience, null, 2)}`
  );

  if (!result || !result.work_experience || result.work_experience.length === 0) {
    console.warn('[optimizeWorkForATS] ATS optimization failed, returning original');
    return workExperience;
  }

  // Verify ATS didn't drop any entries — if count mismatch, return original
  if (result.work_experience.length !== workExperience.length) {
    console.warn(
      '[optimizeWorkForATS] count mismatch, ATS dropped entries — returning original',
      { original: workExperience.length, ats: result.work_experience.length }
    );
    return workExperience;
  }

  return result.work_experience as WorkExperience[];
}

/**
 * Reorganize skills using ATS-friendly categories.
 */
export async function optimizeSkillsForATS(
  skills: Skill[],
  targetRole: string
): Promise<Skill[]> {
  if (skills.length === 0) return skills;

  const user = await getAuthenticatedUser();
  console.log('[optimizeSkillsForATS] categories:', skills.length, 'role:', targetRole);

  const result = await runATSCall(
    'actions.onboarding.optimizeSkills',
    user.id,
    atsSkillsSchema,
    ATS_SKILLS_PROMPT,
    `TARGET ROLE: ${targetRole || 'General professional role'}\n\nCANDIDATE'S SKILLS:\n${JSON.stringify(skills, null, 2)}`
  );

  if (!result || !result.skills || result.skills.length === 0) {
    console.warn('[optimizeSkillsForATS] failed, returning original');
    return skills;
  }

  return result.skills as Skill[];
}
