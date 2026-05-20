// src/utils/actions/onboarding-extract.ts
'use server';

import { z } from 'zod';
import { generateObject, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import { getAuthenticatedUser } from '@/utils/auth';
import type { CVExtraction } from '@/lib/onboarding/types';

// ============================================================================
// Sub-schemas
// ============================================================================

const contactSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin_url: z.string().optional(),
  github_url: z.string().optional(),
  professional_summary: z.string().optional(),
});

const workExperienceSchema = z.object({
  work_experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      date: z.string(),
      description: z.array(z.string()),
      technologies: z.array(z.string()).optional(),
      location: z.string().optional(),
    })
  ),
});

const educationSchema = z.object({
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      field: z.string().optional(),
      date: z.string().optional(),
      gpa: z.string().optional(),
      location: z.string().optional(),
      achievements: z.array(z.string()).optional(),
    })
  ),
});

const skillsSchema = z.object({
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ),
});

const projectsSchema = z.object({
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.array(z.string()),
      technologies: z.array(z.string()).optional(),
      date: z.string().optional(),
      url: z.string().optional(),
      github_url: z.string().optional(),
    })
  ),
});

// ============================================================================
// Generic extraction runner
// ============================================================================

async function runExtraction<S extends z.ZodTypeAny>(
  route: string,
  userId: string,
  schema: S,
  systemPrompt: string,
  cvText: string
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
      prompt: `CV TEXT:\n\n${cvText}`,
    });
    await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });
    console.log(`[${route}] success`);
    return object;
  } catch (err) {
    console.error(`[${route}] FAILED:`, err instanceof Error ? err.message : err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'extraction_failed',
    });
    return null;
  }
}

// ============================================================================
// Section prompts
// ============================================================================

const CONTACT_PROMPT = `Extract contact information AND the professional summary from the CV.

CONTACT FIELDS:
- first_name and last_name: split the candidate's full name (almost always the largest text at the top)
- email: matches user@domain.tld
- phone_number: digits with separators (+, ., -, parentheses, spaces)
- location: "City, Country" or "City, Region" — usually near the top
- linkedin_url: any linkedin.com URL
- github_url: any github.com URL
- website: any other personal URL

PROFESSIONAL SUMMARY:
- professional_summary: the introductory paragraph at the top of the CV (right after contact info, before WORK EXPERIENCE).
- Typically starts with phrases like "Accomplished X with Y years of experience…", "Senior X specializing in…", "Experienced X passionate about…"
- Preserve it VERBATIM — do not paraphrase or shorten.
- Usually 2-4 sentences, 30-80 words.
- If the CV has no such paragraph, omit this field.

Omit fields not present. Do NOT invent any data.`;

const WORK_PROMPT = `Extract EVERY work experience entry from this CV. Do not skip ANY role.
For each role:
- company: exact company name as written
- position: exact job title as written
- date: date range as written (e.g. "03/2024 – Present", "Jan 2020 - Dec 2021", "2018-2020")
- location: "City/Country" if shown
- description: ARRAY of strings — ONE element per bullet point. Preserve the original wording verbatim. Do NOT paraphrase, summarize, or rewrite.
- technologies: array of tools/tech mentioned in that role, if any

Critical rules:
1. If the CV has 4 jobs, return 4 entries. If it has 6, return 6.
2. Never combine multiple jobs into one entry.
3. Never paraphrase or rewrite bullet points — keep them word-for-word.
4. The candidate may have non-engineering jobs (marketing, sales, design). Extract them as-is.`;

const EDU_PROMPT = `Extract EVERY education entry: degrees, universities, schools, bootcamps.
For each entry:
- school: institution name
- degree: qualification ("BSc", "MBA", "PhD", "Bachelor of Arts", "MA", etc.)
- field: subject ("Computer Science", "Business Administration", "Marketing", etc.)
- date: date range as written
- location: city/country
- gpa: if shown
- achievements: array of honors, awards, GPA notes, relevant coursework

Return ONE entry per degree/program. If the CV has only a BSc, return one entry — but if it also has an MBA, return both.`;

const SKILLS_PROMPT = `Extract ALL skills mentioned in the CV, grouped by the categories that ACTUALLY APPEAR in the CV.

Critical rules:
1. category: use the heading as written in the CV ("Technical Skills", "Programming Languages", "Tools & Software", "Languages", "Marketing", etc.)
2. items: array of skills under that category — extract EVERY skill listed
3. If skills are uncategorized in the CV, group them under "Skills"
4. DO NOT invent categories or skills not in the CV
5. DO NOT assume the candidate is a software engineer. They might be:
   - A marketing person (skills: SEO, SEM, Google Ads, Facebook Ads, HubSpot)
   - A designer (skills: Figma, Sketch, Photoshop, Illustrator)
   - A sales person (skills: Salesforce, cold outreach, account management)
   - A data analyst (skills: SQL, Tableau, Python, Excel)
6. Extract literally what's in the CV. Marketing skills like "PMAX campaigns", "Google Ads", "CTR optimization", "HubSpot CRM" are valid skills.`;

const PROJECTS_PROMPT = `Extract project entries if present (side projects, portfolio work, open source contributions, freelance work).
For each project:
- name: project name
- description: array of strings, one per bullet
- technologies: tech stack used
- date: when worked on
- url: if shown
- github_url: if shown

Return an empty array if no projects section exists in the CV.`;

// ============================================================================
// Public API: run all 5 in parallel
// ============================================================================

/**
 * Run all 5 section extractions in parallel via Promise.allSettled.
 * If any one fails, the rest still return their data. We never lose
 * everything because one schema validation failed.
 */
export async function extractCVSectioned(cvText: string): Promise<CVExtraction> {
  const user = await getAuthenticatedUser();
  console.log('[extractCVSectioned] input length:', cvText.length);
  console.log('[extractCVSectioned] first 500 chars:', cvText.slice(0, 500));

  const [contact, work, edu, skills, projects] = await Promise.allSettled([
    runExtraction('actions.onboarding.extractContact', user.id, contactSchema, CONTACT_PROMPT, cvText),
    runExtraction('actions.onboarding.extractWork', user.id, workExperienceSchema, WORK_PROMPT, cvText),
    runExtraction('actions.onboarding.extractEducation', user.id, educationSchema, EDU_PROMPT, cvText),
    runExtraction('actions.onboarding.extractSkills', user.id, skillsSchema, SKILLS_PROMPT, cvText),
    runExtraction('actions.onboarding.extractProjects', user.id, projectsSchema, PROJECTS_PROMPT, cvText),
  ]);

  const contactData = contact.status === 'fulfilled' ? contact.value : null;
  const workData = work.status === 'fulfilled' ? work.value : null;
  const eduData = edu.status === 'fulfilled' ? edu.value : null;
  const skillsData = skills.status === 'fulfilled' ? skills.value : null;
  const projectsData = projects.status === 'fulfilled' ? projects.value : null;

  const result: CVExtraction = {
    ...(contactData ?? {}),
    work_experience: workData?.work_experience ?? [],
    education: eduData?.education ?? [],
    skills: skillsData?.skills ?? [],
    projects: projectsData?.projects ?? [],
  };

  console.log('[extractCVSectioned] result summary:', {
    has_name: !!(result.first_name || result.last_name),
    has_email: !!result.email,
    has_summary: !!result.professional_summary,
    work_count: result.work_experience?.length ?? 0,
    edu_count: result.education?.length ?? 0,
    skill_categories: result.skills?.length ?? 0,
    project_count: result.projects?.length ?? 0,
  });

  return result;
}
