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
