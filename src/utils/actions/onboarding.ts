// src/utils/actions/onboarding.ts
'use server';

import { getAuthenticatedUser } from '@/utils/auth';
import * as db from '@/lib/db';
import type { Profile, Education, WorkExperience, Skill, Project } from '@/lib/types';
import type { CVExtraction } from '@/lib/onboarding/types';
import { extractCVSectioned } from './onboarding-extract';
import { optimizeWorkForATS, optimizeSkillsForATS } from './onboarding-ats';

/**
 * Stage 1 of the pipeline: parse CV text via 5 parallel AI extractions.
 * Each section (contact, work, education, skills, projects) gets its own
 * focused prompt. Failures in one don't cascade to the others.
 */
export async function extractCVData(cvText: string): Promise<CVExtraction> {
  return extractCVSectioned(cvText);
}

export async function completeOnboarding(
  answers: Record<string, string | string[]>,
  cvData: CVExtraction | null,
  targetRole: string
): Promise<{ profileId: string; resumeId: string }> {
  const user = await getAuthenticatedUser();
  console.log('[completeOnboarding] start, targetRole:', targetRole);

  const rawWorkExperience = (cvData?.work_experience ?? []) as WorkExperience[];
  const education = (cvData?.education ?? []).map((e) => ({
    ...e,
    field: e.field ?? '',
    date: e.date ?? '',
  })) as Education[];
  const projects = (cvData?.projects ?? []) as Project[];
  const cvSkills = (cvData?.skills ?? []) as Skill[];

  // Build skills: start with CV-extracted, then merge form answers.
  // Form answers WIN for their specific categories.
  const formCategories: { category: string; key: keyof typeof answers; match: string[] }[] = [
    { category: 'Programming Languages', key: 'programming_languages', match: ['language', 'programming'] },
    { category: 'Frameworks & Methodologies', key: 'frameworks', match: ['framework', 'methodolog', 'standard', 'agile', 'scrum', 'librar'] },
    { category: 'Tools & Software', key: 'tools_software', match: ['tool', 'software', 'platform', 'database', 'cloud', 'devops'] },
    { category: 'Certifications', key: 'certifications', match: ['certif', 'license'] },
  ];

  const supersededKeywords = formCategories.flatMap((fc) => fc.match);
  const baseSkills = cvSkills.filter((s) => {
    const cat = s.category.toLowerCase();
    return !supersededKeywords.some((kw) => cat.includes(kw));
  });

  const mergedSkills: Skill[] = [...baseSkills];
  for (const { category, key } of formCategories) {
    const val = answers[key];
    if (Array.isArray(val) && val.length > 0) {
      mergedSkills.push({ category, items: val });
    }
  }

  // ========================================================================
  // Stage 2: ATS optimization pass
  // Rewrite work bullets and reorganize skills using ATS science.
  // If AI fails, original data is returned (already guaranteed by the helpers).
  // ========================================================================
  console.log('[completeOnboarding] running ATS optimization…');
  const [atsWork, atsSkills] = await Promise.allSettled([
    optimizeWorkForATS(rawWorkExperience, targetRole),
    optimizeSkillsForATS(mergedSkills, targetRole),
  ]);

  const workExperience = atsWork.status === 'fulfilled' ? atsWork.value : rawWorkExperience;
  const skills = atsSkills.status === 'fulfilled' ? atsSkills.value : mergedSkills;

  console.log('[completeOnboarding] post-ATS counts:', {
    work: workExperience.length,
    edu: education.length,
    skills: skills.length,
    projects: projects.length,
  });

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

  // Upsert profile
  const existingProfile = await db.getProfileByUserId(user.id);
  const profile = existingProfile
    ? await db.updateProfile(user.id, profileData).then((p) => p!)
    : await db.createProfile(user.id, profileData);

  // Upsert Master CV
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
        section_configs: {
          work_experience: { visible: workExperience.length > 0 },
          education: { visible: education.length > 0 },
          skills: { visible: skills.length > 0 },
          projects: { visible: projects.length > 0 },
        },
      }).then((r) => r!)
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

  console.log('[completeOnboarding] saved profile + resume', { profile_id: profile.id, resume_id: resume.id });
  return { profileId: profile.id, resumeId: resume.id };
}
