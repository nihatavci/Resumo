import { Question } from './types';

export const ONBOARDING_QUESTIONS: Question[] = [
  // --- Personal Info ---
  {
    id: 'first_name',
    section: 'personal',
    question: "What's your first name?",
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
    question: "Your email address?",
    type: 'text',
    placeholder: 'e.g. alex@example.com',
    prefillFrom: 'email',
    required: true,
  },
  {
    id: 'phone_number',
    section: 'personal',
    question: "Your phone number?",
    type: 'text',
    placeholder: 'e.g. +1 (555) 123-4567',
    prefillFrom: 'phone_number',
  },
  {
    id: 'location',
    section: 'personal',
    question: "Where are you based?",
    type: 'text',
    placeholder: 'e.g. San Francisco, CA',
    prefillFrom: 'location',
  },
  {
    id: 'linkedin_url',
    section: 'personal',
    question: "LinkedIn URL?",
    type: 'text',
    placeholder: 'e.g. https://linkedin.com/in/alexjohnson',
    prefillFrom: 'linkedin_url',
  },
  {
    id: 'github_url',
    section: 'personal',
    question: "GitHub profile? (optional)",
    type: 'text',
    placeholder: 'e.g. https://github.com/alexjohnson',
    prefillFrom: 'github_url',
  },

  // --- Skills ---
  {
    id: 'tools_software',
    section: 'skills',
    question: "What tools and software do you use regularly?",
    type: 'tags',
    placeholder: 'Type a tool and press Enter...',
  },
  {
    id: 'frameworks',
    section: 'skills',
    question: "Frameworks or methodologies you work with?",
    type: 'tags',
    placeholder: 'e.g. Agile, React, CI/CD...',
  },
  {
    id: 'programming_languages',
    section: 'skills',
    question: "Programming languages? (if applicable)",
    type: 'tags',
    placeholder: 'e.g. JavaScript, Python, Go...',
    prefillFrom: 'programming_languages',
  },
  {
    id: 'certifications',
    section: 'skills',
    question: "Any professional certifications?",
    type: 'tags',
    placeholder: 'e.g. AWS, PMP, CPA...',
  },

  // --- Goals ---
  {
    id: 'target_role',
    section: 'goals',
    question: "What role are you targeting?",
    coachingNote: "Be specific — 'Senior Frontend Engineer' tailors better than 'developer'.",
    type: 'text',
    placeholder: 'e.g. Senior Frontend Engineer, Product Manager...',
    required: true,
  },
];

export const SECTION_TITLES: Record<string, string> = {
  personal: 'Personal Information',
  skills: 'Skills & Tools',
  goals: 'Career Goals',
};
