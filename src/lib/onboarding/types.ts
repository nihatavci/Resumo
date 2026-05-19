export type OnboardingStep = 'upload' | 'review' | 'generating';

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
