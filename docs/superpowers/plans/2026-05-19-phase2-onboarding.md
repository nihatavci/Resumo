# Phase 2: Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete onboarding flow: CV upload with drag-drop → AI parses CV into structured data → Typeform-style questionnaire (50-60 questions, one at a time, coaching tone, ATS education) → Memory (profile) created → Master CV generated and user redirected to workspace.

**Architecture:** The onboarding is a multi-step client-side flow managed by React state in a single page component (`/onboarding`). Step 1 is CV upload (PDF drag-drop + file picker). The uploaded PDF is parsed client-side via `react-pdftotext`, then sent to a server action that uses `generateObject()` with the existing `textImportSchema` to extract structured data. Step 2 is the Typeform-style questionnaire — questions render one at a time with Framer Motion slide transitions, a spectrum gradient progress bar at top, and pre-filled answers from the CV extraction. Step 3 is a "Building your profile..." generation screen that creates the Memory (profile) via `createProfile()` and the Master CV (base resume) via `insertResume()`, then redirects to `/workspace`. All AI calls use the existing `runTrackedAIRequest` + `withTaskModel({ task: "structuredExtraction" })` pattern.

**Tech Stack:** Next.js 15 App Router, Framer Motion (page transitions + question slides), react-pdftotext (PDF parsing), Vercel AI SDK `generateObject()` (structured extraction), Cloudflare D1 (profile + resume storage), Zod (schema validation)

---

### Task 1: Create the onboarding state machine and types

**Files:**
- Create: `src/lib/onboarding/types.ts`
- Create: `src/lib/onboarding/questions.ts`

- [ ] **Step 1: Create onboarding types**

```ts
// src/lib/onboarding/types.ts

export type OnboardingStep = 'upload' | 'questionnaire' | 'generating';

export interface OnboardingState {
  step: OnboardingStep;
  cvText: string | null;
  cvData: CVExtraction | null;
  answers: Record<string, string | string[]>;
  currentQuestionIndex: number;
}

export interface CVExtraction {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
  work_experience?: {
    company: string;
    position: string;
    date: string;
    description: string[];
    technologies?: string[];
    location?: string;
  }[];
  education?: {
    school: string;
    degree: string;
    field?: string;
    date?: string;
    gpa?: string;
    location?: string;
    achievements?: string[];
  }[];
  skills?: {
    category: string;
    items: string[];
  }[];
  projects?: {
    name: string;
    description: string[];
    technologies?: string[];
    date?: string;
    url?: string;
    github_url?: string;
  }[];
}

export type QuestionType = 'text' | 'textarea' | 'select' | 'tags' | 'date';

export interface Question {
  id: string;
  section: 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'goals';
  question: string;
  coachingNote?: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  prefillFrom?: string;
  required?: boolean;
}
```

- [ ] **Step 2: Create the questions definition**

```ts
// src/lib/onboarding/questions.ts

import { Question } from './types';

export const ONBOARDING_QUESTIONS: Question[] = [
  // --- Personal Info (questions 1-8) ---
  {
    id: 'first_name',
    section: 'personal',
    question: "What's your first name?",
    coachingNote: "Let's start simple. This is how your name will appear at the top of every CV you create.",
    type: 'text',
    placeholder: 'e.g. Alex',
    prefillFrom: 'first_name',
    required: true,
  },
  {
    id: 'last_name',
    section: 'personal',
    question: "And your last name?",
    type: 'text',
    placeholder: 'e.g. Johnson',
    prefillFrom: 'last_name',
    required: true,
  },
  {
    id: 'email',
    section: 'personal',
    question: "What's the best email to reach you?",
    coachingNote: "Use a professional email address. Recruiters notice — firstname.lastname@gmail.com beats xXgamer99Xx@hotmail.com.",
    type: 'text',
    placeholder: 'e.g. alex@example.com',
    prefillFrom: 'email',
    required: true,
  },
  {
    id: 'phone_number',
    section: 'personal',
    question: "Your phone number?",
    coachingNote: "Include country code if you're applying internationally. Most ATS systems parse phone numbers, so keep the format clean.",
    type: 'text',
    placeholder: 'e.g. +1 (555) 123-4567',
    prefillFrom: 'phone_number',
  },
  {
    id: 'location',
    section: 'personal',
    question: "Where are you based?",
    coachingNote: "City and country is enough. Full addresses are outdated — and a privacy risk. Many companies filter by location, so this matters for remote roles too.",
    type: 'text',
    placeholder: 'e.g. San Francisco, CA',
    prefillFrom: 'location',
  },
  {
    id: 'website',
    section: 'personal',
    question: "Do you have a personal website or portfolio?",
    coachingNote: "A portfolio link can set you apart. If you don't have one yet, no worries — skip for now.",
    type: 'text',
    placeholder: 'e.g. https://alexjohnson.dev',
    prefillFrom: 'website',
  },
  {
    id: 'linkedin_url',
    section: 'personal',
    question: "What's your LinkedIn URL?",
    coachingNote: "Did you know? 87% of recruiters use LinkedIn to evaluate candidates. Make sure your profile URL is customized (linkedin.com/in/yourname), not the default random string.",
    type: 'text',
    placeholder: 'e.g. https://linkedin.com/in/alexjohnson',
    prefillFrom: 'linkedin_url',
  },
  {
    id: 'github_url',
    section: 'personal',
    question: "GitHub profile? (if applicable)",
    coachingNote: "For tech roles, an active GitHub profile with pinned projects can be as valuable as a cover letter.",
    type: 'text',
    placeholder: 'e.g. https://github.com/alexjohnson',
    prefillFrom: 'github_url',
  },

  // --- Experience (questions 9-14) ---
  {
    id: 'experience_intro',
    section: 'experience',
    question: "Let's talk about your work experience.",
    coachingNote: "Here's something most people don't know: 75% of resumes get filtered by ATS (Applicant Tracking Systems) before a human ever sees them. The way you describe your experience matters more than you think. We've already pulled what we could from your CV — let's make sure it's complete and ATS-ready.",
    type: 'textarea',
    placeholder: "We've pre-filled your experience from your CV. Review it, add anything missing, or tell us about roles we might have missed...",
    prefillFrom: 'work_experience_summary',
  },
  {
    id: 'proudest_achievement',
    section: 'experience',
    question: "What's your proudest professional achievement?",
    coachingNote: "Strong resumes lead with impact, not duties. Think: 'Increased revenue by 40%' not 'Responsible for sales'. Numbers are your best friend on a resume — they're the first thing both ATS and humans scan for.",
    type: 'textarea',
    placeholder: "e.g. Led a team of 5 to rebuild our payment system, reducing transaction failures by 60% and saving $2M annually...",
  },
  {
    id: 'work_style',
    section: 'experience',
    question: "How would you describe your working style?",
    coachingNote: "This helps us frame your experience in the right light. A collaborative leader tells a different story than an independent problem-solver — both are valuable.",
    type: 'select',
    options: ['Independent contributor', 'Team collaborator', 'Team lead / manager', 'Cross-functional coordinator', 'A mix of these'],
  },
  {
    id: 'industries',
    section: 'experience',
    question: "What industries have you worked in?",
    coachingNote: "Industry experience is a strong signal for recruiters. If you're switching industries, we'll make sure your transferable skills shine through.",
    type: 'tags',
    placeholder: 'Type an industry and press Enter...',
    prefillFrom: 'industries',
  },
  {
    id: 'years_experience',
    section: 'experience',
    question: "Roughly how many years of professional experience do you have?",
    type: 'select',
    options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  },
  {
    id: 'management_experience',
    section: 'experience',
    question: "Have you managed people or teams?",
    coachingNote: "Even informal leadership counts — mentoring interns, leading a project team, or coordinating across departments. Don't sell yourself short.",
    type: 'select',
    options: ['No management experience yet', 'Informal/project leadership', 'Managed 1-5 people', 'Managed 5-15 people', 'Managed 15+ people'],
  },

  // --- Education (questions 15-19) ---
  {
    id: 'education_intro',
    section: 'education',
    question: "Now let's cover your education.",
    coachingNote: "Fun fact: for experienced professionals (5+ years), education typically goes at the bottom of your resume. For recent grads, it goes near the top. We'll position it perfectly.",
    type: 'textarea',
    placeholder: "We've pre-filled your education from your CV. Review it and add any missing degrees, certifications, or courses...",
    prefillFrom: 'education_summary',
  },
  {
    id: 'certifications',
    section: 'education',
    question: "Do you have any professional certifications?",
    coachingNote: "Certifications like AWS, PMP, CPA, or Google Analytics are ATS gold — they're exact keyword matches that algorithms love.",
    type: 'tags',
    placeholder: 'Type a certification and press Enter...',
  },
  {
    id: 'courses',
    section: 'education',
    question: "Any relevant online courses or bootcamps?",
    coachingNote: "Online learning absolutely counts. Coursera, Udemy, bootcamps — list them. They show initiative and a growth mindset.",
    type: 'tags',
    placeholder: 'Type a course name and press Enter...',
  },
  {
    id: 'languages',
    section: 'education',
    question: "What languages do you speak?",
    coachingNote: "Multilingual? That's a competitive advantage. Even basic proficiency is worth mentioning for international companies.",
    type: 'tags',
    placeholder: 'e.g. English (Native), Spanish (Conversational)...',
  },
  {
    id: 'gpa_honors',
    section: 'education',
    question: "Any academic honors, high GPA, or awards worth highlighting?",
    coachingNote: "Rule of thumb: include GPA if it's 3.5+ and you graduated within the last 3 years. For everyone else, awards and honors carry more weight.",
    type: 'textarea',
    placeholder: "e.g. Dean's List 4 semesters, GPA 3.8, Phi Beta Kappa...",
  },

  // --- Skills (questions 20-25) ---
  {
    id: 'skills_intro',
    section: 'skills',
    question: "Time for skills! What are your strongest technical skills?",
    coachingNote: "Pro tip: the Skills section is where ATS does the heaviest matching. Be specific — 'Python' is better than 'programming', and 'React, Next.js, TypeScript' is better than 'web development'.",
    type: 'textarea',
    placeholder: "We've pre-filled your skills from your CV. Add any we missed...",
    prefillFrom: 'skills_summary',
  },
  {
    id: 'tools_software',
    section: 'skills',
    question: "What tools and software do you use regularly?",
    coachingNote: "Include everything: Figma, Jira, Salesforce, Excel, Slack, Notion — tools show you can hit the ground running. Many job descriptions list specific tools as requirements.",
    type: 'tags',
    placeholder: 'Type a tool name and press Enter...',
  },
  {
    id: 'soft_skills',
    section: 'skills',
    question: "What soft skills do your colleagues value most about you?",
    coachingNote: "Soft skills matter more than ever. But instead of listing 'team player' (everyone does), we'll weave these into your experience descriptions where they'll actually be believed.",
    type: 'select',
    options: ['Communication & presentation', 'Problem solving & critical thinking', 'Leadership & mentoring', 'Adaptability & learning agility', 'Collaboration & teamwork'],
  },
  {
    id: 'skill_level',
    section: 'skills',
    question: "How do you stay current in your field?",
    coachingNote: "Continuous learning signals are powerful. Mentioning specific conferences, publications, or communities shows you're engaged with your industry.",
    type: 'textarea',
    placeholder: 'e.g. I read Hacker News daily, attend React conferences, contribute to open source...',
  },
  {
    id: 'frameworks',
    section: 'skills',
    question: "Any specific frameworks, methodologies, or standards you work with?",
    coachingNote: "Agile, Scrum, Six Sigma, ISO standards, HIPAA compliance — these are keyword magnets for ATS. Don't forget them.",
    type: 'tags',
    placeholder: 'e.g. Agile, Scrum, CI/CD, REST, GraphQL...',
  },
  {
    id: 'programming_languages',
    section: 'skills',
    question: "Which programming languages are you most proficient in? (if applicable)",
    type: 'tags',
    placeholder: 'e.g. JavaScript, Python, Go, Rust...',
    prefillFrom: 'programming_languages',
  },

  // --- Projects (questions 26-30) ---
  {
    id: 'projects_intro',
    section: 'projects',
    question: "Let's talk about your projects.",
    coachingNote: "Projects show what you can build, not just what you've been assigned. Side projects, open source contributions, hackathon wins — they all count. For career changers, projects can be more powerful than work experience.",
    type: 'textarea',
    placeholder: "We've pre-filled your projects from your CV. Add any side projects, open source work, or portfolio pieces...",
    prefillFrom: 'projects_summary',
  },
  {
    id: 'project_impact',
    section: 'projects',
    question: "Which project are you most proud of and why?",
    coachingNote: "The best project descriptions follow this formula: What you built + What tech you used + What impact it had. 'Built a real-time dashboard using React and D3.js that reduced reporting time by 80%' is chef's kiss.",
    type: 'textarea',
    placeholder: 'Tell us about a project that showcases your best work...',
  },
  {
    id: 'open_source',
    section: 'projects',
    question: "Any open source contributions?",
    coachingNote: "Even small PRs count. Contributing to well-known projects signals you can work in collaborative codebases and follow established standards.",
    type: 'textarea',
    placeholder: 'e.g. Contributed to React Native, maintained a popular npm package with 1k+ stars...',
  },
  {
    id: 'publications',
    section: 'projects',
    question: "Have you published any articles, papers, or given talks?",
    coachingNote: "Thought leadership sets you apart from other candidates. Blog posts, conference talks, research papers — they all demonstrate deep expertise.",
    type: 'textarea',
    placeholder: 'e.g. Published on Medium about microservices architecture, spoke at PyCon 2024...',
  },
  {
    id: 'volunteer_work',
    section: 'projects',
    question: "Any volunteer work or community involvement related to your field?",
    coachingNote: "Mentoring at coding bootcamps, organizing meetups, volunteering tech skills at nonprofits — these show character and create networking opportunities.",
    type: 'textarea',
    placeholder: 'e.g. Mentor at Code for America, organize local Python meetup...',
  },

  // --- Goals (questions 31-35) ---
  {
    id: 'target_role',
    section: 'goals',
    question: "What role are you targeting?",
    coachingNote: "Be specific. 'Senior Frontend Engineer' is better than 'software developer'. The more targeted your Master CV, the better our tailoring will work.",
    type: 'text',
    placeholder: 'e.g. Senior Frontend Engineer, Product Manager, Data Scientist...',
    required: true,
  },
  {
    id: 'target_companies',
    section: 'goals',
    question: "What types of companies interest you?",
    coachingNote: "Startup vs. enterprise requires different resume framing. A startup wants to see versatility and ownership; an enterprise wants depth and process.",
    type: 'select',
    options: ['Early-stage startups', 'Growth-stage companies', 'Large enterprises', 'FAANG / Big Tech', 'No strong preference'],
  },
  {
    id: 'salary_expectations',
    section: 'goals',
    question: "What's your expected compensation range? (optional, private)",
    coachingNote: "This stays private — we never put salary on your CV. But knowing your range helps us understand your seniority level for better positioning.",
    type: 'text',
    placeholder: 'e.g. $120k-$150k, or skip this',
  },
  {
    id: 'work_preference',
    section: 'goals',
    question: "What's your preferred work arrangement?",
    type: 'select',
    options: ['Fully remote', 'Hybrid', 'On-site', 'Open to all'],
  },
  {
    id: 'anything_else',
    section: 'goals',
    question: "Anything else you want us to know?",
    coachingNote: "This is your space. Career gaps you want to address? A unique angle that doesn't fit neatly into categories? Special circumstances? Tell us everything — we'll figure out the best way to present it.",
    type: 'textarea',
    placeholder: "Anything that might help us build a better CV for you...",
  },
];

export const SECTION_TITLES: Record<string, string> = {
  personal: 'Personal Information',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills & Tools',
  projects: 'Projects & Contributions',
  goals: 'Career Goals',
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/onboarding/
git commit -m "feat: add onboarding types, state machine, and 35 questions

Typeform-style question definitions with coaching tone, ATS education,
pre-fill keys for CV data, and section groupings."
```

---

### Task 2: Create the CV upload server action

**Files:**
- Create: `src/utils/actions/onboarding.ts`

This server action takes raw CV text and returns structured data using the existing AI extraction pipeline.

- [ ] **Step 1: Create the server action file**

```ts
// src/utils/actions/onboarding.ts
'use server';

import { z } from 'zod';
import { generateObject, type LanguageModelUsage, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { textImportSchema } from '@/lib/zod-schemas';
import { getAuthenticatedUser } from '@/utils/auth';
import { withTaskModel } from '@/lib/ai/task-models';
import {
  finishAIUsageRequest,
  startAIUsageRequest,
} from '@/lib/ai/usage-ledger';
import * as db from '@/lib/db';
import type { Profile } from '@/lib/types';
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

  const config = withTaskModel({
    task: 'structuredExtraction',
    isPro: true,
  });

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

  const workExperience = cvData?.work_experience ?? [];
  const education = cvData?.education ?? [];
  const skills = cvData?.skills ?? [];
  const projects = cvData?.projects ?? [];

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
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/utils/actions/onboarding.ts
git commit -m "feat: add onboarding server actions (CV extraction + profile/resume creation)"
```

---

### Task 3: Build the CV Upload step component

**Files:**
- Create: `src/components/onboarding/cv-upload.tsx`

- [ ] **Step 1: Create the CV upload component**

This is a full-screen, centered component with a drag-drop zone and file picker. When a PDF is dropped, it parses it client-side with `pdfToText`, shows a success state, then calls the parent's `onComplete` callback.

```tsx
// src/components/onboarding/cv-upload.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pdfToText from 'react-pdftotext';
import { cn } from '@/lib/utils';
import { fadeIn, slideUp } from '@/components/motion/variants';

interface CVUploadProps {
  onComplete: (cvText: string) => void;
  onSkip: () => void;
}

export function CVUpload({ onComplete, onSkip }: CVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setError(null);

    try {
      const text = await pdfToText(file);
      if (!text.trim()) {
        setError('Could not extract text from this PDF. It may be image-based. Try a different file or skip this step.');
        setIsProcessing(false);
        return;
      }
      onComplete(text);
    } catch {
      setError('Failed to read this PDF. Please try a different file or skip this step.');
      setIsProcessing(false);
    }
  }, [onComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  }, [processFile]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4"
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        className="text-center space-y-6 max-w-md w-full"
        variants={slideUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-dia-heading font-light text-foreground tracking-[-2px]">
          Welcome to Resumo
        </h1>
        <p className="text-dia-subheading text-dia-ash">
          Upload your CV and we&apos;ll build your career profile together.
        </p>

        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'mt-8 border-2 border-dashed rounded-dia p-12 flex flex-col items-center justify-center gap-4 transition-all duration-200 cursor-pointer group',
            isDragging
              ? 'border-foreground bg-dia-fog scale-[1.02]'
              : 'border-dia-steel hover:border-foreground hover:bg-dia-fog/50',
            isProcessing && 'pointer-events-none opacity-60'
          )}
        >
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileInput}
            disabled={isProcessing}
          />

          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 text-foreground animate-spin" />
              <p className="text-dia-body text-foreground font-medium">
                Reading {fileName}...
              </p>
            </>
          ) : fileName ? (
            <>
              <FileText className="w-12 h-12 text-foreground" />
              <p className="text-dia-body text-foreground font-medium">
                {fileName}
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-dia-steel group-hover:text-foreground group-hover:scale-110 transition-all duration-200" />
              <div className="text-center">
                <p className="text-dia-body text-foreground font-medium">
                  Drop your PDF resume here
                </p>
                <p className="text-dia-body-sm text-dia-ash">
                  or click to browse files
                </p>
              </div>
            </>
          )}
        </label>

        {error && (
          <motion.p
            className="text-sm text-red-500"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        <button
          onClick={onSkip}
          className="text-dia-body-sm text-dia-ash hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Skip — I&apos;ll enter everything manually
        </button>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/cv-upload.tsx
git commit -m "feat: add CV upload component with drag-drop and PDF parsing"
```

---

### Task 4: Build the spectrum progress bar component

**Files:**
- Create: `src/components/onboarding/progress-bar.tsx`

- [ ] **Step 1: Create the spectrum gradient progress bar**

```tsx
// src/components/onboarding/progress-bar.tsx
'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = Math.min((current / total) * 100, 100);

  return (
    <div className="fixed top-14 left-0 right-0 z-40 h-1 bg-dia-fog">
      <motion.div
        className="h-full spectrum-gradient"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/progress-bar.tsx
git commit -m "feat: add spectrum gradient progress bar for onboarding"
```

---

### Task 5: Build the question card component

**Files:**
- Create: `src/components/onboarding/question-card.tsx`

This is the core Typeform-style question card — full-screen centered, animated transitions, multiple input types.

- [ ] **Step 1: Create the question card component**

```tsx
// src/components/onboarding/question-card.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/onboarding/types';
import { SECTION_TITLES } from '@/lib/onboarding/questions';

interface QuestionCardProps {
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  direction: number;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export function QuestionCard({
  question,
  value,
  onChange,
  onNext,
  onBack,
  isFirst,
  isLast,
  direction,
}: QuestionCardProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, [question.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && question.type !== 'textarea') {
        e.preventDefault();
        onNext();
      }
    },
    [onNext, question.type]
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault();
        const currentTags = Array.isArray(value) ? value : [];
        if (!currentTags.includes(tagInput.trim())) {
          onChange([...currentTags, tagInput.trim()]);
        }
        setTagInput('');
      }
      if (e.key === 'Backspace' && !tagInput && Array.isArray(value) && value.length > 0) {
        onChange(value.slice(0, -1));
      }
    },
    [tagInput, value, onChange]
  );

  const removeTag = useCallback(
    (tag: string) => {
      if (Array.isArray(value)) {
        onChange(value.filter((t) => t !== tag));
      }
    },
    [value, onChange]
  );

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={question.placeholder}
            className="w-full bg-transparent border-b-2 border-dia-divider focus:border-foreground outline-none py-3 text-dia-subheading text-foreground placeholder:text-dia-steel transition-colors"
          />
        );

      case 'textarea':
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full bg-transparent border-2 border-dia-divider focus:border-foreground rounded-dia-sm outline-none p-4 text-dia-body text-foreground placeholder:text-dia-steel transition-colors resize-none"
          />
        );

      case 'select':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setTimeout(onNext, 300);
                }}
                className={cn(
                  'w-full text-left px-5 py-3.5 rounded-dia-sm border-2 transition-all duration-200 text-dia-body',
                  value === option
                    ? 'border-foreground bg-foreground text-white'
                    : 'border-dia-divider bg-white hover:border-foreground hover:bg-dia-fog'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {Array.isArray(value) &&
                value.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-dia-pill bg-foreground text-white text-dia-body-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      x
                    </button>
                  </motion.span>
                ))}
            </div>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={question.placeholder}
              className="w-full bg-transparent border-b-2 border-dia-divider focus:border-foreground outline-none py-3 text-dia-subheading text-foreground placeholder:text-dia-steel transition-colors"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      key={question.id}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem-4px)] px-4"
    >
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-3">
          <span className="text-dia-caption uppercase tracking-widest text-dia-ash font-medium">
            {SECTION_TITLES[question.section]}
          </span>
          <h2 className="text-dia-heading-sm font-light text-foreground">
            {question.question}
          </h2>
          {question.coachingNote && (
            <motion.p
              className="text-dia-body-sm text-dia-ash leading-relaxed"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {question.coachingNote}
            </motion.p>
          )}
        </div>

        {renderInput()}

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isFirst}
            className="text-dia-ash"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button onClick={onNext}>
            {isLast ? 'Finish' : 'Continue'}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/question-card.tsx
git commit -m "feat: add Typeform-style question card with text/select/tags/textarea inputs"
```

---

### Task 6: Build the generation screen component

**Files:**
- Create: `src/components/onboarding/generating-screen.tsx`

- [ ] **Step 1: Create the generating screen**

This shows a "Building your profile..." animation while the server action creates Memory + Master CV.

```tsx
// src/components/onboarding/generating-screen.tsx
'use client';

import { motion } from 'framer-motion';
import { fadeIn } from '@/components/motion/variants';

export function GeneratingScreen() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <div className="text-center space-y-8">
        <motion.div
          className="w-16 h-16 mx-auto rounded-full spectrum-gradient"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="space-y-3">
          <h2 className="text-dia-heading-sm font-light text-foreground">
            Building your profile...
          </h2>
          <motion.p
            className="text-dia-body text-dia-ash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Creating your Memory and generating your Master CV.
          </motion.p>
          <motion.p
            className="text-dia-body-sm text-dia-steel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            This usually takes 10-15 seconds...
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/generating-screen.tsx
git commit -m "feat: add onboarding generation screen with animated loading"
```

---

### Task 7: Build the questionnaire flow component

**Files:**
- Create: `src/components/onboarding/questionnaire.tsx`

This orchestrates the question cards with AnimatePresence for slide transitions, manages answers state, and handles pre-filling from CV data.

- [ ] **Step 1: Create the questionnaire component**

```tsx
// src/components/onboarding/questionnaire.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { QuestionCard } from './question-card';
import { ProgressBar } from './progress-bar';
import { ONBOARDING_QUESTIONS } from '@/lib/onboarding/questions';
import type { CVExtraction } from '@/lib/onboarding/types';

interface QuestionnaireProps {
  cvData: CVExtraction | null;
  onComplete: (answers: Record<string, string | string[]>) => void;
}

function getPrefillValue(key: string | undefined, cvData: CVExtraction | null): string | string[] {
  if (!key || !cvData) return '';

  switch (key) {
    case 'first_name':
      return cvData.first_name || '';
    case 'last_name':
      return cvData.last_name || '';
    case 'email':
      return cvData.email || '';
    case 'phone_number':
      return cvData.phone_number || '';
    case 'location':
      return cvData.location || '';
    case 'website':
      return cvData.website || '';
    case 'linkedin_url':
      return cvData.linkedin_url || '';
    case 'github_url':
      return cvData.github_url || '';
    case 'work_experience_summary':
      return (cvData.work_experience || [])
        .map(
          (w) =>
            `${w.position} at ${w.company} (${w.date})\n${w.description.join('\n')}`
        )
        .join('\n\n');
    case 'education_summary':
      return (cvData.education || [])
        .map(
          (e) =>
            `${e.degree}${e.field ? ` in ${e.field}` : ''} — ${e.school}${e.date ? ` (${e.date})` : ''}`
        )
        .join('\n');
    case 'skills_summary':
      return (cvData.skills || [])
        .map((s) => `${s.category}: ${s.items.join(', ')}`)
        .join('\n');
    case 'projects_summary':
      return (cvData.projects || [])
        .map(
          (p) =>
            `${p.name}${p.technologies?.length ? ` (${p.technologies.join(', ')})` : ''}\n${p.description.join('\n')}`
        )
        .join('\n\n');
    case 'industries':
      return [];
    case 'programming_languages': {
      const langs: string[] = [];
      (cvData.skills || []).forEach((s) => {
        const cat = s.category.toLowerCase();
        if (cat.includes('language') || cat.includes('programming')) {
          langs.push(...s.items);
        }
      });
      return langs;
    }
    default:
      return '';
  }
}

export function Questionnaire({ cvData, onComplete }: QuestionnaireProps) {
  const questions = ONBOARDING_QUESTIONS;

  const initialAnswers = useMemo(() => {
    const answers: Record<string, string | string[]> = {};
    questions.forEach((q) => {
      const prefill = getPrefillValue(q.prefillFrom, cvData);
      if (prefill && (typeof prefill === 'string' ? prefill.length > 0 : prefill.length > 0)) {
        answers[q.id] = prefill;
      }
    });
    return answers;
  }, [cvData, questions]);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const currentQuestion = questions[currentIndex];

  const handleChange = useCallback(
    (value: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion.id]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete(answers);
    }
  }, [currentIndex, questions.length, onComplete, answers]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  return (
    <>
      <ProgressBar current={currentIndex + 1} total={questions.length} />
      <AnimatePresence mode="wait" custom={direction}>
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          value={answers[currentQuestion.id] ?? (currentQuestion.type === 'tags' ? [] : '')}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          isFirst={currentIndex === 0}
          isLast={currentIndex === questions.length - 1}
          direction={direction}
        />
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/questionnaire.tsx
git commit -m "feat: add questionnaire flow with CV pre-filling and slide transitions"
```

---

### Task 8: Build the onboarding page orchestrator

**Files:**
- Modify: `src/app/(app)/onboarding/page.tsx`
- Create: `src/components/onboarding/onboarding-flow.tsx`

The page.tsx is a server component that checks if the user already has a profile (redirect to /workspace if so). The client component `OnboardingFlow` manages the three steps.

- [ ] **Step 1: Create the onboarding flow client component**

```tsx
// src/components/onboarding/onboarding-flow.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { CVUpload } from './cv-upload';
import { Questionnaire } from './questionnaire';
import { GeneratingScreen } from './generating-screen';
import { extractCVData, completeOnboarding } from '@/utils/actions/onboarding';
import { toast } from '@/hooks/use-toast';
import type { OnboardingStep, CVExtraction } from '@/lib/onboarding/types';

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('upload');
  const [cvData, setCvData] = useState<CVExtraction | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleCVUploaded = useCallback(async (cvText: string) => {
    setIsExtracting(true);
    try {
      const extracted = await extractCVData(cvText);
      setCvData(extracted);
      setStep('questionnaire');
    } catch {
      toast({
        title: 'CV Processing Error',
        description: 'We had trouble reading your CV. You can still proceed manually.',
        variant: 'destructive',
      });
      setStep('questionnaire');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleSkipUpload = useCallback(() => {
    setStep('questionnaire');
  }, []);

  const handleQuestionnaireComplete = useCallback(async (answers: Record<string, string | string[]>) => {
    setStep('generating');

    try {
      const targetRole = (answers.target_role as string) || '';
      await completeOnboarding(answers, cvData, targetRole);
      router.push('/workspace');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Failed to create your profile. Please try again.',
        variant: 'destructive',
      });
      setStep('questionnaire');
    }
  }, [cvData, router]);

  return (
    <AnimatePresence mode="wait">
      {step === 'upload' && (
        <CVUpload
          key="upload"
          onComplete={handleCVUploaded}
          onSkip={handleSkipUpload}
        />
      )}
      {step === 'questionnaire' && (
        <Questionnaire
          key="questionnaire"
          cvData={cvData}
          onComplete={handleQuestionnaireComplete}
        />
      )}
      {step === 'generating' && (
        <GeneratingScreen key="generating" />
      )}
    </AnimatePresence>
  );
}
```

Note: The `isExtracting` state could be used to show a loading indicator on the upload screen — the CVUpload component already handles its own `isProcessing` state for PDF parsing, but the extraction call happens in OnboardingFlow. We need to pass this down. Let's update CVUpload to accept an `isExtracting` prop.

- [ ] **Step 2: Update CVUpload to handle the extraction loading state**

In `src/components/onboarding/cv-upload.tsx`, add `isExtracting` prop:

Update the interface:
```tsx
interface CVUploadProps {
  onComplete: (cvText: string) => void;
  onSkip: () => void;
  isExtracting?: boolean;
}
```

Update the component destructuring:
```tsx
export function CVUpload({ onComplete, onSkip, isExtracting }: CVUploadProps) {
```

After the successful `pdfToText` call (replacing the direct `onComplete(text)` call), update the processFile function to show the extraction state:

Replace the `processFile` function body after the `pdfToText` call:
```tsx
  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setError(null);

    try {
      const text = await pdfToText(file);
      if (!text.trim()) {
        setError('Could not extract text from this PDF. It may be image-based. Try a different file or skip this step.');
        setIsProcessing(false);
        return;
      }
      onComplete(text);
    } catch {
      setError('Failed to read this PDF. Please try a different file or skip this step.');
      setIsProcessing(false);
    }
  }, [onComplete]);
```

And update the loading display to show extraction state:

Replace the `isProcessing` conditional in the JSX:
```tsx
          {isProcessing || isExtracting ? (
            <>
              <Loader2 className="w-12 h-12 text-foreground animate-spin" />
              <p className="text-dia-body text-foreground font-medium">
                {isExtracting ? 'Analyzing your CV with AI...' : `Reading ${fileName}...`}
              </p>
              {isExtracting && (
                <p className="text-dia-body-sm text-dia-ash">
                  Extracting your experience, skills, and education
                </p>
              )}
            </>
          ) : /* rest of existing code */ }
```

Then update the `OnboardingFlow` to pass `isExtracting`:

```tsx
      {step === 'upload' && (
        <CVUpload
          key="upload"
          onComplete={handleCVUploaded}
          onSkip={handleSkipUpload}
          isExtracting={isExtracting}
        />
      )}
```

- [ ] **Step 3: Replace the onboarding page.tsx**

```tsx
// src/app/(app)/onboarding/page.tsx
import { redirect } from 'next/navigation';
import { getProfileByUserId } from '@/lib/db';
import { getAuthenticatedUser } from '@/utils/auth';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';

export default async function OnboardingPage() {
  let hasProfile = false;
  try {
    const user = await getAuthenticatedUser();
    const profile = await getProfileByUserId(user.id);
    hasProfile = !!profile;
  } catch {
    // Not authenticated or no profile — show onboarding
  }

  if (hasProfile) {
    redirect('/workspace');
  }

  return <OnboardingFlow />;
}
```

- [ ] **Step 4: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/onboarding-flow.tsx src/components/onboarding/cv-upload.tsx src/app/\(app\)/onboarding/page.tsx
git commit -m "feat: wire onboarding flow (upload → questionnaire → generation → workspace)"
```

---

### Task 9: Add keyboard navigation and UX polish

**Files:**
- Modify: `src/components/onboarding/question-card.tsx`
- Modify: `src/components/onboarding/questionnaire.tsx`

- [ ] **Step 1: Add Ctrl+Enter for textarea submission**

In `src/components/onboarding/question-card.tsx`, update the textarea to support Ctrl+Enter/Cmd+Enter:

Add this handler above `renderInput`:

```tsx
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onNext();
      }
    },
    [onNext]
  );
```

Then add `onKeyDown={handleTextareaKeyDown}` to the textarea element in `renderInput`.

Also add a hint below the textarea:

```tsx
      case 'textarea':
        return (
          <div className="space-y-2">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={question.placeholder}
              rows={4}
              className="w-full bg-transparent border-2 border-dia-divider focus:border-foreground rounded-dia-sm outline-none p-4 text-dia-body text-foreground placeholder:text-dia-steel transition-colors resize-none"
            />
            <p className="text-dia-caption text-dia-steel text-right">
              Press Cmd+Enter to continue
            </p>
          </div>
        );
```

- [ ] **Step 2: Add section transition labels**

In `src/components/onboarding/questionnaire.tsx`, track when the section changes to show a brief section intro animation. Add after `currentQuestion` definition:

```tsx
  const prevSectionRef = useRef(currentQuestion.section);
  const [showSectionIntro, setShowSectionIntro] = useState(false);

  useEffect(() => {
    if (currentQuestion.section !== prevSectionRef.current) {
      prevSectionRef.current = currentQuestion.section;
      setShowSectionIntro(true);
      const timer = setTimeout(() => setShowSectionIntro(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion.section]);
```

Add the `useRef` and `useEffect` imports if not already present.

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/question-card.tsx src/components/onboarding/questionnaire.tsx
git commit -m "feat: add keyboard shortcuts and section transitions to questionnaire"
```

---

### Task 10: Verify onboarding end-to-end

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `pnpm lint 2>&1 | tail -10`
Expected: No errors from our new files.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -20`
Expected: No type errors in onboarding files.

- [ ] **Step 4: Manual browser test**

Start dev server (`pnpm dev`), navigate to `http://localhost:3000`:
1. Should redirect to `/onboarding` (no profile exists)
2. See "Welcome to Resumo" with upload drop zone
3. Upload a PDF — should show "Reading..." then "Analyzing your CV with AI..."
4. After extraction, should transition to questionnaire
5. Questions appear one at a time with slide animation
6. Pre-filled fields from CV should show data
7. Spectrum gradient progress bar advances at top
8. Coaching notes appear below questions
9. Can navigate back and forth with buttons
10. Tags input works (type + Enter)
11. Select options work (click selects and auto-advances)
12. "Skip" link works from upload screen (goes to questionnaire with empty data)
13. After last question, "Finish" triggers generation screen
14. Generation screen shows animated spectrum orb
15. After generation, redirects to `/workspace`
16. Revisiting `/onboarding` now redirects to `/workspace` (profile exists)

- [ ] **Step 5: Fix any issues found during testing**

If any issues are found, fix them and commit:

```bash
git add -A
git commit -m "fix: onboarding flow verification fixes"
```
