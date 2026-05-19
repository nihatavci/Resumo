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
