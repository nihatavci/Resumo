'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { CVUpload } from './cv-upload';
import { CVReviewForm } from './cv-review-form';
import { GeneratingScreen } from './generating-screen';
import { extractCVData, completeOnboarding } from '@/utils/actions/onboarding';
import { toast } from '@/hooks/use-toast';
import type { OnboardingStep, CVExtraction } from '@/lib/onboarding/types';

/**
 * Regex extraction of contact info from raw CV text.
 * Used UNCONDITIONALLY to harden against AI mistakes — the LLM may miss
 * obvious patterns (email, phone, URLs), but regex never does.
 * The AI's output is preferred where both exist; regex fills any gaps.
 */
function extractBasicInfoFromText(text: string): Partial<CVExtraction> {
  const result: Partial<CVExtraction> = {};

  // Email
  const email = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0];
  if (email) result.email = email;

  // Phone — at least 10 digits with optional + and separators
  const phone = text.match(/(\+?\d[\d\s\-().]{8,}\d)/)?.[0]?.trim();
  if (phone) result.phone_number = phone;

  // LinkedIn — match optional protocol/www, then linkedin.com/in/<slug>
  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-_%]+/i)?.[0];
  if (linkedin) result.linkedin_url = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;

  // GitHub — same idea
  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-_]+/i)?.[0];
  if (github) result.github_url = github.startsWith('http') ? github : `https://${github}`;

  // Website (any http(s) URL that isn't LinkedIn or GitHub)
  const website = text.match(/https?:\/\/(?!.*(?:linkedin|github))[^\s,)>]+/i)?.[0];
  if (website) result.website = website;

  // Name heuristic: first non-empty line near the top usually contains the candidate name.
  // Pattern: 2+ capitalized words, no digits, no special chars.
  const lines = text.split('\n').slice(0, 10).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Skip lines that look like contact info or section headers
    if (line.includes('@') || /\d/.test(line) || line.length > 60) continue;
    // Match "Firstname Lastname" or "First Middle Last" — 2-4 words, each starting capital
    const nameMatch = line.match(/^([A-ZÀ-ÝŞĞÜÇÖİ][a-zà-ÿşğüçöı]+(?:\s+[A-ZÀ-ÝŞĞÜÇÖİ][a-zà-ÿşğüçöı]+){1,3})$/);
    if (nameMatch) {
      const parts = nameMatch[1].split(/\s+/);
      result.first_name = parts[0];
      result.last_name = parts.slice(1).join(' ');
      break;
    }
  }

  return result;
}

/**
 * Merge AI and regex extractions. AI wins where both have a value;
 * regex fills any field the AI missed.
 */
function mergeExtractions(ai: CVExtraction | null, regex: Partial<CVExtraction>): CVExtraction {
  const merged: CVExtraction = { ...(ai ?? {}) };
  if (!merged.first_name && regex.first_name) merged.first_name = regex.first_name;
  if (!merged.last_name && regex.last_name) merged.last_name = regex.last_name;
  if (!merged.email && regex.email) merged.email = regex.email;
  if (!merged.phone_number && regex.phone_number) merged.phone_number = regex.phone_number;
  if (!merged.linkedin_url && regex.linkedin_url) merged.linkedin_url = regex.linkedin_url;
  if (!merged.github_url && regex.github_url) merged.github_url = regex.github_url;
  if (!merged.website && regex.website) merged.website = regex.website;
  return merged;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('upload');
  const [cvData, setCvData] = useState<CVExtraction | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleCVUploaded = useCallback(async (cvText: string) => {
    setIsExtracting(true);
    const regexFallback = extractBasicInfoFromText(cvText);

    try {
      const aiExtracted = await extractCVData(cvText);
      // Merge — AI wins on structured fields; regex fills gaps in contact fields
      const merged = mergeExtractions(aiExtracted, regexFallback);
      setCvData(merged);
    } catch (err) {
      console.error('AI extraction failed, using regex-only fallback:', err);
      if (Object.keys(regexFallback).length > 0) {
        setCvData(regexFallback as CVExtraction);
      }
      toast({
        title: 'Partial extraction',
        description: 'AI analysis timed out — contact fields were extracted from your CV. Please review.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
      setStep('review');
    }
  }, []);

  const handleSkipUpload = useCallback(() => {
    setStep('review');
  }, []);

  const handleReviewComplete = useCallback(
    async (answers: Record<string, string | string[]>) => {
      setStep('generating');
      try {
        const targetRole = (answers.target_role as string) || '';
        await completeOnboarding(answers, cvData, targetRole);
        router.push('/workspace');
      } catch (error) {
        console.error('Onboarding completion error:', error);
        toast({
          title: 'Something went wrong',
          description: 'Failed to save your profile. Please try again.',
          variant: 'destructive',
        });
        setStep('review');
      }
    },
    [cvData, router]
  );

  return (
    <div className="min-h-screen bg-dia-canvas overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <CVUpload
            key="upload"
            onComplete={handleCVUploaded}
            onSkip={handleSkipUpload}
            isExtracting={isExtracting}
          />
        )}
        {step === 'review' && (
          <CVReviewForm
            key="review"
            cvData={cvData}
            onComplete={handleReviewComplete}
          />
        )}
        {step === 'generating' && (
          <GeneratingScreen key="generating" />
        )}
      </AnimatePresence>
    </div>
  );
}
