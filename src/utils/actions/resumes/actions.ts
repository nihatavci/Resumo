'use server'

import * as db from "@/lib/db";
import { getAuthenticatedUser } from "@/utils/auth";
import { Profile, Resume, WorkExperience, Education, Skill, Project, Job } from "@/lib/types";
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { simplifiedResumeSchema, Job as ZodJob } from "@/lib/zod-schemas";
import { AIConfig } from "@/utils/ai-tools";
import { generateObject, type LanguageModelUsage, type LanguageModelV1, type TelemetrySettings } from "ai";
import { resumeScoreSchema } from "@/lib/zod-schemas";
import {
  finishAIUsageRequest,
  startAIUsageRequest,
} from "@/lib/ai/usage-ledger";
import { withTaskModel } from "@/lib/ai/task-models";
import { AnalyticsEvents } from "@/lib/analytics/events";
import {
  captureServerAnalyticsEvent,
  getSubscriptionAnalyticsProperties,
} from "@/lib/analytics/server";

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


export async function getResumeById(resumeId: string): Promise<{ resume: Resume; profile: Profile; job: Job | null }> {
  const user = await getAuthenticatedUser();

  const [resume, profile] = await Promise.all([
    db.getResumeById(resumeId, user.id),
    db.getProfileByUserId(user.id),
  ]);

  if (!resume) {
    throw new Error('Resume not found');
  }

  if (!profile) {
    throw new Error('Profile not found');
  }

  let job: Job | null = null;

  if (resume.job_id) {
    try {
      job = await db.getJobById(resume.job_id, user.id);
    } catch (jobError) {
      console.error('Failed to fetch associated job:', jobError);
    }
  }

  return { resume, profile, job };
}

export async function updateResume(resumeId: string, data: Partial<Resume>): Promise<Resume> {
  const user = await getAuthenticatedUser();

  const resume = await db.updateResume(resumeId, user.id, data);

  if (!resume) {
    throw new Error('Failed to update resume');
  }

  return resume;
}

export async function deleteResume(resumeId: string): Promise<void> {
  const user = await getAuthenticatedUser();

  const resume = await db.getResumeById(resumeId, user.id);

  if (!resume) {
    throw new Error('Resume not found or access denied');
  }

  if (!resume.is_base_resume && resume.job_id) {
    try {
      await db.deleteJob(resume.job_id, user.id);
    } catch (jobDeleteError) {
      console.error('Failed to delete associated job:', jobDeleteError);
    }
  }

  await db.deleteResume(resumeId, user.id);

  revalidatePath('/', 'layout');
  revalidatePath('/resumes', 'layout');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/resumes/base', 'layout');
  revalidatePath('/resumes/tailored', 'layout');
  revalidatePath('/jobs', 'layout');
}

export async function createBaseResume(
  name: string,
  importOption: 'import-profile' | 'fresh' | 'import-resume' = 'import-profile',
  selectedContent?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    location?: string;
    website?: string;
    linkedin_url?: string;
    github_url?: string;
    work_experience: WorkExperience[];
    education: Education[];
    skills: Skill[];
    projects: Project[];
  }
): Promise<Resume> {
  const user = await getAuthenticatedUser();

  let profile: Profile | null = null;
  if (importOption !== 'fresh') {
    try {
      profile = await db.getProfileByUserId(user.id);
    } catch (profileError) {
      console.error('Profile fetch error:', profileError);
    }
  }

  const newResume: Partial<Resume> & { user_id: string; name: string } = {
    user_id: user.id,
    name,
    target_role: name,
    is_base_resume: true,
    first_name: importOption === 'import-resume' ? selectedContent?.first_name || '' : importOption === 'fresh' ? '' : profile?.first_name || '',
    last_name: importOption === 'import-resume' ? selectedContent?.last_name || '' : importOption === 'fresh' ? '' : profile?.last_name || '',
    email: importOption === 'import-resume' ? selectedContent?.email || '' : importOption === 'fresh' ? '' : profile?.email || '',
    phone_number: importOption === 'import-resume' ? selectedContent?.phone_number || '' : importOption === 'fresh' ? '' : profile?.phone_number || '',
    location: importOption === 'import-resume' ? selectedContent?.location || '' : importOption === 'fresh' ? '' : profile?.location || '',
    website: importOption === 'import-resume' ? selectedContent?.website || '' : importOption === 'fresh' ? '' : profile?.website || '',
    linkedin_url: importOption === 'import-resume' ? selectedContent?.linkedin_url || '' : importOption === 'fresh' ? '' : profile?.linkedin_url || '',
    github_url: importOption === 'import-resume' ? selectedContent?.github_url || '' : importOption === 'fresh' ? '' : profile?.github_url || '',
    work_experience: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent
      ? selectedContent.work_experience
      : [],
    education: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent
      ? selectedContent.education
      : [],
    skills: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent
      ? selectedContent.skills
      : [],
    projects: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent
      ? selectedContent.projects
      : [],
    section_order: [
      'work_experience',
      'education',
      'skills',
      'projects',
    ],
    section_configs: {
      work_experience: { visible: (selectedContent?.work_experience?.length ?? 0) > 0 },
      education: { visible: (selectedContent?.education?.length ?? 0) > 0 },
      skills: { visible: (selectedContent?.skills?.length ?? 0) > 0 },
      projects: { visible: (selectedContent?.projects?.length ?? 0) > 0 },
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
      document_margin_vertical: 36,
      experience_margin_bottom: 0,
      skills_margin_horizontal: 0,
      document_margin_horizontal: 28,
      header_name_bottom_spacing: 20,
      projects_margin_horizontal: 0,
      education_margin_horizontal: 0,
      experience_margin_horizontal: 0
    }
  };

  const resume = await db.insertResume(newResume);

  await captureServerAnalyticsEvent({
    distinctId: user.id,
    event: AnalyticsEvents.ResumeCreated,
    properties: {
      ...(await getSubscriptionAnalyticsProperties(user.id)),
      resume_type: "base",
      has_job: false,
    },
  });

  return resume;
}

export async function createTailoredResume(
  baseResume: Resume,
  jobId: string | null,
  jobTitle: string,
  companyName: string,
  tailoredContent: z.infer<typeof simplifiedResumeSchema>
) {
  console.log('[createTailoredResume] Received jobId:', jobId);
  console.log('[createTailoredResume] baseResume ID:', baseResume?.id);
  console.log('[createTailoredResume] Is jobId valid UUID?:', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId || ''));

  const user = await getAuthenticatedUser();

  const now = new Date().toISOString();

  const newResume = {
    ...tailoredContent,
    user_id: user.id,
    job_id: jobId,
    is_base_resume: false,
    first_name: baseResume.first_name,
    last_name: baseResume.last_name,
    email: baseResume.email,
    phone_number: baseResume.phone_number,
    location: baseResume.location,
    website: baseResume.website,
    linkedin_url: baseResume.linkedin_url,
    github_url: baseResume.github_url,
    document_settings: baseResume.document_settings,
    section_configs: baseResume.section_configs,
    section_order: baseResume.section_order,
    name: `${jobTitle} at ${companyName}`,
    created_at: now,
    updated_at: now,
  };

  const data = await db.insertResume(newResume as Parameters<typeof db.insertResume>[0]);

  await captureServerAnalyticsEvent({
    distinctId: user.id,
    event: AnalyticsEvents.ResumeTailored,
    properties: {
      ...(await getSubscriptionAnalyticsProperties(user.id)),
      resume_type: "tailored",
      has_job: Boolean(jobId),
    },
  });

  return data;
}

export async function copyResume(resumeId: string): Promise<Resume> {
  const user = await getAuthenticatedUser();

  const sourceResume = await db.getResumeById(resumeId, user.id);

  if (!sourceResume) {
    throw new Error('Resume not found or access denied');
  }

  // Exclude auto-generated fields that shouldn't be copied
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _created_at, updated_at: _updated_at, ...resumeDataToCopy } = sourceResume;

  const now = new Date().toISOString();
  const newResume = {
    ...resumeDataToCopy,
    name: `${sourceResume.name} (Copy)`,
    user_id: user.id,
    created_at: now,
    updated_at: now,
  };

  const copiedResume = await db.insertResume(newResume);

  revalidatePath('/', 'layout');
  revalidatePath('/resumes', 'layout');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/resumes/base', 'layout');
  revalidatePath('/resumes/tailored', 'layout');

  return copiedResume;
}

export async function countResumes(type: 'base' | 'tailored' | 'all'): Promise<number> {
  const user = await getAuthenticatedUser();
  return db.countResumes(user.id, type);
}


export async function generateResumeScore(
  resume: Resume, 
  job?: ZodJob | null,
  config?: AIConfig
) {
  

  const user = await getAuthenticatedUser();
  const id = user.id;
  const isPro = true;

  const isTailoredResume = job && !resume.is_base_resume;

  const resumeForScoring = {
    target_role: resume.target_role,
    is_base_resume: resume.is_base_resume,
    contact: {
      first_name: resume.first_name,
      last_name: resume.last_name,
      email: resume.email,
      phone_number: resume.phone_number,
      location: resume.location,
      website: resume.website,
      linkedin_url: resume.linkedin_url,
      github_url: resume.github_url,
    },
    work_experience: resume.work_experience,
    education: resume.education,
    skills: resume.skills,
    projects: resume.projects,
  };

  const jobForScoring = job
    ? {
        company_name: job.company_name,
        position_title: job.position_title,
        description: job.description,
        location: job.location,
        salary_range: job.salary_range,
        keywords: job.keywords,
        work_location: job.work_location,
        employment_type: job.employment_type,
      }
    : null;

  try {
    let prompt = `
    Generate a comprehensive score for this resume: ${JSON.stringify(resumeForScoring)}
    
    MUST include a 'miscellaneous' field with 2-3 metrics following this format:
    {
      "metricName": {
        "score": number,
        "reason": "string explanation"
      }
    }
    Example: 
    "keywordOptimization": {
      "score": 85,
      "reason": "Good use of industry keywords but could add more variation"
    }
    `;

    // Enhanced prompt for tailored resumes with job context
    if (isTailoredResume) {
      prompt += `
      
      THIS IS A TAILORED RESUME FOR A SPECIFIC JOB. Job details: ${JSON.stringify(jobForScoring)}
      
      IMPORTANT: Since this is a tailored resume, you MUST include the 'jobAlignment' field with detailed analysis:
      
      1. KEYWORD MATCH ANALYSIS:
         - Compare resume content with job description keywords
         - Identify matched keywords and missing critical keywords
         - Score based on keyword density and relevance
      
      2. REQUIREMENTS MATCH ANALYSIS:
         - Analyze how well the resume addresses job requirements
         - Identify which requirements are clearly addressed
         - Highlight gaps where requirements aren't demonstrated
      
      3. COMPANY FIT ANALYSIS:
         - Assess alignment with company culture/values (if mentioned in job description)
         - Evaluate positioning for this specific role
         - Suggest improvements for better company alignment
      
      ALSO INCLUDE:
      - Set 'isTailoredResume' to true
      - Provide 'jobSpecificImprovements' with 3-5 specific suggestions for this job
      - Weight the overall score more heavily on job alignment factors
      
      Focus on actionable insights that help the candidate better align their resume with this specific opportunity.
      `;
    } else {
      prompt += `
      
      This is a base resume (not tailored to a specific job).
      - Set 'isTailoredResume' to false
      - Do NOT include the 'jobAlignment' field
      - Focus on general resume best practices and improvements
      `;
    }

    const { object } = await runTrackedAIRequest({
      route: 'actions.resumes.generateResumeScore',
      userId: id,
      isPro,
      config: withTaskModel({ task: "resumeScoring", isPro, config }),
    }, (aiClient, telemetry) => generateObject({
      model: aiClient,
      experimental_telemetry: telemetry,
      schema: resumeScoreSchema,
      prompt
    }));

    // console.log("THE OUTPUTTED object", object);
    return object
  } catch (error) {
    console.error('Error SCORING resume:', error);
    throw error;
  }
}
