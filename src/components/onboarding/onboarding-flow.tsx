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
        description: 'Failed to save your profile. Tap retry below.',
        variant: 'destructive',
      });
      // Stay on generating screen — don't send back to question 1
      // The user will see an error toast and can refresh to retry
      setStep('generating');
    }
  }, [cvData, router]);

  return (
    <AnimatePresence mode="wait">
      {step === 'upload' && (
        <CVUpload
          key="upload"
          onComplete={handleCVUploaded}
          onSkip={handleSkipUpload}
          isExtracting={isExtracting}
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
