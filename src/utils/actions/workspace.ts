// src/utils/actions/workspace.ts
'use server';

import { getAuthenticatedUser } from '@/utils/auth';
import { Resume } from '@/lib/types';
import * as db from '@/lib/db';
import type { ProposedChanges } from '@/components/workspace/types';

/**
 * Save a tailored resume from chat-proposed changes.
 * The AI already produced the changes via the chat tool call —
 * this just persists them as a new (non-base) resume row.
 */
export async function applyTailoring(
  masterResumeId: string,
  changes: ProposedChanges
): Promise<Resume> {
  const user = await getAuthenticatedUser();
  console.log('[applyTailoring] for master:', masterResumeId);

  const master = await db.getResumeById(masterResumeId, user.id);
  if (!master) {
    throw new Error('Master resume not found');
  }

  const saved = await db.insertResume({
    user_id: user.id,
    name: `Tailored — ${new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    target_role: master.target_role,
    is_base_resume: false,
    first_name: master.first_name,
    last_name: master.last_name,
    email: master.email,
    phone_number: master.phone_number,
    location: master.location,
    website: master.website,
    linkedin_url: master.linkedin_url,
    github_url: master.github_url,
    professional_summary: changes.professional_summary ?? master.professional_summary,
    work_experience: changes.work_experience,
    education: master.education,
    skills: changes.skills,
    projects: master.projects,
    section_order:
      master.section_order ?? ['summary', 'work_experience', 'education', 'skills', 'projects'],
    section_configs: master.section_configs ?? {
      work_experience: { visible: changes.work_experience.length > 0 },
      education: { visible: (master.education?.length ?? 0) > 0 },
      skills: { visible: changes.skills.length > 0 },
      projects: { visible: (master.projects?.length ?? 0) > 0 },
    },
    document_settings: master.document_settings,
  });

  console.log('[applyTailoring] saved id:', saved.id);
  return saved;
}
