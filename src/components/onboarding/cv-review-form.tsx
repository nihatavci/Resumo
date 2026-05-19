// src/components/onboarding/cv-review-form.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { CVExtraction } from '@/lib/onboarding/types';

interface CVReviewFormProps {
  cvData: CVExtraction | null;
  onComplete: (answers: Record<string, string | string[]>) => void;
}

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

  const canSubmit =
    fields.first_name.trim() &&
    fields.last_name.trim() &&
    fields.email.trim() &&
    fields.target_role.trim();

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
