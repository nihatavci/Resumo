import type { WorkExperience, Skill } from '@/lib/types';

export interface ProposedChanges {
  professional_summary?: string;
  work_experience: WorkExperience[];
  skills: Skill[];
  rationale: string;
}
