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
    } catch {
      toast({
        title: 'CV Processing Error',
        description: 'We had trouble reading your CV. You can still fill in your details manually.',
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
