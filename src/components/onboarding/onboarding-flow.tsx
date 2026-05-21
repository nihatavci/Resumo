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
 * Runs UNCONDITIONALLY alongside the AI. AI wins where it has data; regex fills any gaps.
 */
function extractBasicInfoFromText(text: string): Partial<CVExtraction> {
  const result: Partial<CVExtraction> = {};

  const email = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0];
  if (email) result.email = email;

  const phone = text.match(/(\+?\d[\d\s\-().]{8,}\d)/)?.[0]?.trim();
  if (phone) result.phone_number = phone;

  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-_%]+/i)?.[0];
  if (linkedin) result.linkedin_url = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;

  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-_]+/i)?.[0];
  if (github) result.github_url = github.startsWith('http') ? github : `https://${github}`;

  const website = text.match(/https?:\/\/(?!.*(?:linkedin|github))[^\s,)>]+/i)?.[0];
  if (website) result.website = website;

  // Name heuristic — supports Turkish/European chars (Ş Ğ Ü Ç Ö İ etc.)
  const lines = text.split('\n').slice(0, 10).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.includes('@') || /\d/.test(line) || line.length > 60) continue;
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
    console.log('[onboarding-flow] PDF text length:', cvText.length);
    console.log('[onboarding-flow] PDF first 800 chars:', cvText.slice(0, 800));

    setIsExtracting(true);
    const regexFallback = extractBasicInfoFromText(cvText);
    console.log('[onboarding-flow] regex extracted:', regexFallback);

    try {
      const aiExtracted = await extractCVData(cvText);
      console.log('[onboarding-flow] AI extracted:', {
        name: `${aiExtracted.first_name ?? '?'} ${aiExtracted.last_name ?? '?'}`,
        email: aiExtracted.email,
        work_count: aiExtracted.work_experience?.length ?? 0,
        edu_count: aiExtracted.education?.length ?? 0,
        skill_categories: aiExtracted.skills?.length ?? 0,
        project_count: aiExtracted.projects?.length ?? 0,
      });
      const merged = mergeExtractions(aiExtracted, regexFallback);
      setCvData(merged);
    } catch (err) {
      console.error('[onboarding-flow] AI extraction failed, using regex-only fallback:', err);
      if (Object.keys(regexFallback).length > 0) {
        setCvData(regexFallback as CVExtraction);
      }
      toast({
        title: 'Partial extraction',
        description: 'AI analysis failed — contact fields were extracted. Please review and add the rest.',
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
    async (
      answers: Record<string, string | string[]>,
      editedCV?: Partial<CVExtraction>
    ) => {
      setStep('generating');
      try {
        const targetRole = (answers.target_role as string) || '';
        // Merge user's edits over the original AI extraction
        const finalCV: CVExtraction = { ...(cvData ?? {}), ...(editedCV ?? {}) };
        console.log('[onboarding-flow] final CV being saved:', {
          name: `${finalCV.first_name ?? '?'} ${finalCV.last_name ?? '?'}`,
          work_count: finalCV.work_experience?.length ?? 0,
          edu_count: finalCV.education?.length ?? 0,
        });
        await completeOnboarding(answers, finalCV, targetRole);
        router.push('/workspace');
      } catch (error) {
        console.error('[onboarding-flow] completion error:', error);
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
