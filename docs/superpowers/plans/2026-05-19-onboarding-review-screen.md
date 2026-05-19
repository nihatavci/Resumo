# Onboarding Review Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 12-question one-by-one questionnaire with a single review screen that shows all CV-extracted data pre-filled — user reviews and approves in one shot.

**Architecture:** After CV upload and extraction, instead of stepping through questions, render a `CVReviewForm` component that displays all fields (personal info, skills, target role) in a compact two-column form. All fields are editable. One "Generate my CV" button submits everything. If no CV was uploaded, the same form renders empty. The `questionnaire` step is replaced by `review`; the `Questionnaire` component is retired.

**Tech Stack:** Next.js 15, React 19, TypeScript, Framer Motion, Tailwind CSS, Dia design tokens (`bg-dia-canvas`, `border-dia-divider`, `text-foreground`, etc.)

---

## File Structure

- **Modify:** `src/lib/onboarding/types.ts` — add `'review'` to `OnboardingStep`
- **Create:** `src/components/onboarding/cv-review-form.tsx` — the full review screen
- **Modify:** `src/components/onboarding/onboarding-flow.tsx` — replace `questionnaire` step with `review`, render `CVReviewForm`
- **Modify:** `src/utils/actions/onboarding.ts` — `completeOnboarding` must accept the review form's data shape (already compatible — no change needed if we pass same `answers` shape)

The `questionnaire.tsx` and `question-card.tsx` files are left in place (not deleted) to avoid breaking anything, but they are no longer rendered.

---

### Task 1: Add `review` step to types

**Files:**
- Modify: `src/lib/onboarding/types.ts`

- [ ] **Step 1: Update `OnboardingStep` union**

Replace line 1 in `src/lib/onboarding/types.ts`:

```typescript
export type OnboardingStep = 'upload' | 'review' | 'generating';
```

(Remove `'questionnaire'` — it's replaced by `'review'`.)

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
pnpm build 2>&1 | grep -E "error TS"
```

Expected: no `error TS` lines (any errors about `questionnaire` will be fixed in Task 3).

- [ ] **Step 3: Commit**

```bash
git add src/lib/onboarding/types.ts
git commit -m "feat: add review step to OnboardingStep type"
```

---

### Task 2: Build `CVReviewForm` component

**Files:**
- Create: `src/components/onboarding/cv-review-form.tsx`

The form collects the same fields the old 12 questions collected. Layout: clean card, two-column grid for personal info fields, full-width for skills/tags, full-width for target role. No pagination — everything visible at once.

- [ ] **Step 1: Create the file**

```typescript
// src/components/onboarding/cv-review-form.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { CVExtraction } from '@/lib/onboarding/types';

interface CVReviewFormProps {
  cvData: CVExtraction | null;
  onComplete: (answers: Record<string, string | string[]>) => void;
}

// Tag input helper — inline, no deps
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-dia-divider bg-white/60 p-2 focus-within:border-foreground/30 transition-colors min-h-[44px]">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-dia-canvas border border-dia-divider px-2.5 py-0.5 text-xs font-medium text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="text-foreground/40 hover:text-foreground transition-colors leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-foreground/30 px-1"
        value={input}
        placeholder={value.length === 0 ? placeholder : 'Add more...'}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="h-10 rounded-2xl border border-dia-divider bg-white/60 px-3 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-foreground/30"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function extractTags(cvData: CVExtraction | null, categoryKeywords: string[]): string[] {
  if (!cvData?.skills) return [];
  const tags: string[] = [];
  cvData.skills.forEach((s) => {
    const cat = s.category.toLowerCase();
    if (categoryKeywords.some((kw) => cat.includes(kw))) {
      tags.push(...s.items);
    }
  });
  return [...new Set(tags)];
}

export function CVReviewForm({ cvData, onComplete }: CVReviewFormProps) {
  const [fields, setFields] = useState({
    first_name: cvData?.first_name ?? '',
    last_name: cvData?.last_name ?? '',
    email: cvData?.email ?? '',
    phone_number: cvData?.phone_number ?? '',
    location: cvData?.location ?? '',
    linkedin_url: cvData?.linkedin_url ?? '',
    github_url: cvData?.github_url ?? '',
    target_role: '',
    tools_software: extractTags(cvData, ['tool', 'software', 'platform']),
    frameworks: extractTags(cvData, ['framework', 'methodolog', 'standard', 'agile', 'scrum']),
    programming_languages: extractTags(cvData, ['language', 'programming']),
    certifications: extractTags(cvData, ['certif', 'license']),
  });

  const set = useCallback(<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = () => {
    const answers: Record<string, string | string[]> = {
      first_name: fields.first_name,
      last_name: fields.last_name,
      email: fields.email,
      phone_number: fields.phone_number,
      location: fields.location,
      linkedin_url: fields.linkedin_url,
      github_url: fields.github_url,
      target_role: fields.target_role,
      tools_software: fields.tools_software,
      frameworks: fields.frameworks,
      programming_languages: fields.programming_languages,
      certifications: fields.certifications,
    };
    onComplete(answers);
  };

  const canSubmit = fields.first_name.trim() && fields.last_name.trim() && fields.email.trim() && fields.target_role.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6"
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-medium text-foreground">
          {cvData ? 'Your CV, extracted' : 'Tell us about yourself'}
        </h2>
        <p className="text-sm text-foreground/50">
          {cvData
            ? "We've pre-filled everything we found. Review and confirm."
            : 'Fill in your details to generate your Master CV.'}
        </p>
      </div>

      {/* Personal Info */}
      <div className="rounded-3xl border border-dia-divider bg-white/70 backdrop-blur-sm p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Personal</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <TextInput value={fields.first_name} onChange={(v) => set('first_name', v)} placeholder="Alex" />
          </Field>
          <Field label="Last name">
            <TextInput value={fields.last_name} onChange={(v) => set('last_name', v)} placeholder="Johnson" />
          </Field>
          <Field label="Email">
            <TextInput value={fields.email} onChange={(v) => set('email', v)} placeholder="alex@example.com" />
          </Field>
          <Field label="Phone">
            <TextInput value={fields.phone_number} onChange={(v) => set('phone_number', v)} placeholder="+1 555 123 4567" />
          </Field>
          <Field label="Location">
            <TextInput value={fields.location} onChange={(v) => set('location', v)} placeholder="San Francisco, CA" />
          </Field>
          <Field label="LinkedIn">
            <TextInput value={fields.linkedin_url} onChange={(v) => set('linkedin_url', v)} placeholder="linkedin.com/in/..." />
          </Field>
          <Field label="GitHub (optional)">
            <TextInput value={fields.github_url} onChange={(v) => set('github_url', v)} placeholder="github.com/..." />
          </Field>
        </div>
      </div>

      {/* Skills */}
      <div className="rounded-3xl border border-dia-divider bg-white/70 backdrop-blur-sm p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Skills</p>
        <Field label="Programming languages">
          <TagInput
            value={fields.programming_languages}
            onChange={(v) => set('programming_languages', v)}
            placeholder="e.g. JavaScript, Python..."
          />
        </Field>
        <Field label="Frameworks & methodologies">
          <TagInput
            value={fields.frameworks}
            onChange={(v) => set('frameworks', v)}
            placeholder="e.g. React, Agile, CI/CD..."
          />
        </Field>
        <Field label="Tools & software">
          <TagInput
            value={fields.tools_software}
            onChange={(v) => set('tools_software', v)}
            placeholder="e.g. Figma, Jira, AWS..."
          />
        </Field>
        <Field label="Certifications">
          <TagInput
            value={fields.certifications}
            onChange={(v) => set('certifications', v)}
            placeholder="e.g. AWS Solutions Architect, PMP..."
          />
        </Field>
      </div>

      {/* Target Role */}
      <div className="rounded-3xl border border-dia-divider bg-white/70 backdrop-blur-sm p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Goal</p>
        <Field label="Target role *">
          <TextInput
            value={fields.target_role}
            onChange={(v) => set('target_role', v)}
            placeholder="e.g. Senior Frontend Engineer, Product Manager..."
          />
        </Field>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full h-12 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 active:scale-[0.98] transition-all"
      >
        Generate my CV
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
pnpm build 2>&1 | grep -E "error TS|cv-review"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/cv-review-form.tsx
git commit -m "feat: add CVReviewForm component with pre-filled fields"
```

---

### Task 3: Wire `CVReviewForm` into `OnboardingFlow`

**Files:**
- Modify: `src/components/onboarding/onboarding-flow.tsx`

The `questionnaire` step is replaced with `review`. The `CVReviewForm` is rendered when `step === 'review'`.

- [ ] **Step 1: Replace the file content**

```typescript
// src/components/onboarding/onboarding-flow.tsx
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
          description: 'Failed to save your profile. Please refresh and try again.',
          variant: 'destructive',
        });
        setStep('generating');
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
```

- [ ] **Step 2: Build to confirm no errors**

```bash
pnpm build 2>&1 | grep -E "error TS|onboarding-flow"
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/onboarding-flow.tsx
git commit -m "feat: replace questionnaire steps with single CVReviewForm"
```

---

### Task 4: Deploy

- [ ] **Step 1: Full production build**

```bash
pnpm build 2>&1 | tail -15
```

Expected: all routes compile, no errors.

- [ ] **Step 2: OpenNext + Wrangler deploy**

```bash
npx opennextjs-cloudflare build 2>&1 | tail -3
npx wrangler deploy 2>&1 | grep -E "Deployed|Error"
```

Expected: `Deployed resumelm triggers`

- [ ] **Step 3: Merge to main and push**

```bash
git checkout main
git merge --no-ff claude/gallant-franklin-195096 -m "feat: onboarding review screen"
git push origin main
```
