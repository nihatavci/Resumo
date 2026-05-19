'use server';

import { getAuthenticatedUser } from '@/utils/auth';
import { Resume } from '@/lib/types';
import { convertTextToResume } from './resumes/ai';
import * as db from '@/lib/db';

export async function tailorResume(
  masterResume: Resume,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<Resume> {
  const user = await getAuthenticatedUser();

  const targetRole = `${jobTitle} at ${company}`;
  const prompt = `
JOB DESCRIPTION:
Title: ${jobTitle}
Company: ${company}

${jobDescription}

EXISTING RESUME:
${JSON.stringify(masterResume, null, 2)}
`.trim();

  const tailored = await convertTextToResume(prompt, masterResume, targetRole);
  const now = new Date().toISOString();

  const saved = await db.insertResume({
    ...tailored,
    user_id: user.id,
    name: `${jobTitle} at ${company}`,
    is_base_resume: false,
    created_at: now,
    updated_at: now,
  } as Parameters<typeof db.insertResume>[0]);

  return saved;
}
