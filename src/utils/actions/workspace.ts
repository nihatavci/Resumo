// src/utils/actions/workspace.ts
'use server';

import { z } from 'zod';
import { generateObject, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { getAuthenticatedUser } from '@/utils/auth';
import { Resume, WorkExperience, Skill } from '@/lib/types';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import * as db from '@/lib/db';

/**
 * Schema for tailoring output. Only the parts we let the AI modify:
 * - work_experience bullets (rewritten/reordered, never invented)
 * - skills (reordered/reprioritized for the JD; no new skills added)
 */
const tailoringSchema = z.object({
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
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ),
});

const TAILORING_SYSTEM = `You are an ATS resume tailoring expert.
You receive (1) a candidate's MASTER RESUME (already complete and accurate) and (2) a JOB DESCRIPTION.
Your job: rewrite the work_experience bullets and reorder skills to match the job description.

CRITICAL RULES:
1. PRESERVE ALL FACTS — every company, position, date, location, and metric must remain exactly as in the master. Never invent achievements.
2. Return the SAME NUMBER of work_experience entries as the master. Never drop or merge jobs.
3. For each work_experience entry:
   - Keep company/position/date/location unchanged.
   - REWRITE bullets to use action verbs and keywords from the job description WHERE THE CANDIDATE ACTUALLY DID THAT WORK. Don't add fake claims.
   - Reorder bullets so the most JD-relevant ones come first.
   - You may merge two similar bullets if they're redundant, or split one bullet into two for clarity.
   - Use quantified results when present in the original.
4. For skills:
   - Reorder so JD-relevant categories and items come first.
   - You may RENAME a category to match JD terminology (e.g. "Marketing Tools" → "Marketing Tech Stack").
   - Do NOT add skills the candidate doesn't have.
   - Do NOT remove skills unless completely irrelevant to any role.
5. Match the JD's tone and vocabulary where it aligns with the candidate's real experience.`;

export async function tailorResume(
  masterResume: Resume,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<Resume> {
  const user = await getAuthenticatedUser();
  const targetRole = `${jobTitle}${company ? ` at ${company}` : ''}`;
  console.log('[tailorResume] target:', targetRole);

  const { model, usageEventId, telemetry } = await startAIUsageRequest({
    route: 'actions.workspace.tailorResume',
    userId: user.id,
    isPro: true,
  });

  let tailored: z.infer<typeof tailoringSchema>;
  try {
    const { object, usage } = await generateObject({
      model: model as LanguageModelV1,
      experimental_telemetry: telemetry as TelemetrySettings,
      schema: tailoringSchema,
      system: TAILORING_SYSTEM,
      prompt: `MASTER RESUME (JSON):
${JSON.stringify(
  {
    work_experience: masterResume.work_experience,
    skills: masterResume.skills,
  },
  null,
  2
)}

JOB DESCRIPTION:
Title: ${jobTitle}
Company: ${company}

${jobDescription}

Now produce the tailored version. Preserve all facts. Match the job description's language where it overlaps with the candidate's real experience.`,
    });
    await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });
    tailored = object;
    console.log('[tailorResume] AI returned work_count:', tailored.work_experience.length);
  } catch (err) {
    console.error('[tailorResume] AI failed:', err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'tailor_failed',
    });
    throw err;
  }

  // Safety: if AI dropped work entries, fall back to master's work experience
  const finalWork =
    tailored.work_experience.length === masterResume.work_experience.length
      ? (tailored.work_experience as WorkExperience[])
      : (masterResume.work_experience as WorkExperience[]);

  const finalSkills =
    tailored.skills.length > 0 ? (tailored.skills as Skill[]) : (masterResume.skills as Skill[]);

  // Build the tailored resume — clone master and overlay tailored fields.
  // Strip id/created_at/updated_at so D1 generates fresh ones on insert.
  const saved = await db.insertResume({
    user_id: user.id,
    name: `${jobTitle}${company ? ` at ${company}` : ''}`,
    target_role: targetRole,
    is_base_resume: false,
    first_name: masterResume.first_name ?? '',
    last_name: masterResume.last_name ?? '',
    email: masterResume.email ?? '',
    phone_number: masterResume.phone_number ?? '',
    location: masterResume.location ?? '',
    website: masterResume.website ?? '',
    linkedin_url: masterResume.linkedin_url ?? '',
    github_url: masterResume.github_url ?? '',
    work_experience: finalWork,
    education: masterResume.education,
    skills: finalSkills,
    projects: masterResume.projects,
    section_order: masterResume.section_order ?? ['work_experience', 'education', 'skills', 'projects'],
    section_configs: masterResume.section_configs ?? {
      work_experience: { visible: finalWork.length > 0 },
      education: { visible: (masterResume.education?.length ?? 0) > 0 },
      skills: { visible: finalSkills.length > 0 },
      projects: { visible: (masterResume.projects?.length ?? 0) > 0 },
    },
    document_settings: masterResume.document_settings,
  });

  console.log('[tailorResume] saved resume id:', saved.id);
  return saved;
}
