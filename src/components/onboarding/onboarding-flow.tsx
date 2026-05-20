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
 * Regex fallback: extract basic contact info from raw CV text.
 * Used when the AI extraction fails or times out so the review form
 * is never completely empty.
 */
function extractBasicInfoFromText(text: string): Partial<CVExtraction> {
  const result: Partial<CVExtraction> = {};

  // Email
  const email = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0];
  if (email) result.email = email;

  // Phone — match common formats
  const phone = text.match(/(\+?\d[\d\s\-().]{8,}\d)/)?.[0]?.trim();
  if (phone) result.phone_number = phone;

  // LinkedIn
  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w\-]+)/)?.[0];
  if (linkedin) result.linkedin_url = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;

  // GitHub
  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([\w\-]+)/)?.[0];
  if (github) result.github_url = github.startsWith('http') ? github : `https://${github}`;

  // Website (generic URL, not linkedin/github)
  const website = text.match(/https?:\/\/(?!.*(?:linkedin|github))[^\s,)>]+/)?.[0];
  if (website) result.website = website;

  return result;
}

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
    } catch (err) {
      console.error('AI extraction failed, falling back to regex:', err);
      // AI failed — use regex to get at least the contact fields
      const basic = extractBasicInfoFromText(cvText);
      if (Object.keys(basic).length > 0) {
        setCvData(basic as CVExtraction);
      }
      toast({
        title: 'Partial extraction',
        description: 'AI analysis timed out — contact fields were extracted. Check and complete the rest.',
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
