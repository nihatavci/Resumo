'use client';

import { useState, useRef } from 'react';
import { Resume } from '@/lib/types';
import { tailorResume } from '@/utils/actions/workspace';
import { PreviewPanel } from '@/components/resume/editor/panels/preview-panel';
import { ResizablePanels } from '@/components/resume/editor/layout/ResizablePanels';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface WorkspaceClientProps {
  masterResume: Resume;
}

type TailoringStep = 'input' | 'loading' | 'done';

export function WorkspaceClient({ masterResume }: WorkspaceClientProps) {
  const [step, setStep] = useState<TailoringStep>('input');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredResume, setTailoredResume] = useState<Resume | null>(null);
  const displayResume = tailoredResume ?? masterResume;

  const jobTitleRef = useRef<HTMLInputElement>(null);

  async function handleTailor() {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast.error('Please fill in the job title and description.');
      return;
    }
    setStep('loading');
    try {
      const result = await tailorResume(masterResume, jobTitle.trim(), company.trim() || 'Unknown Company', jobDescription.trim());
      setTailoredResume(result);
      setStep('done');
    } catch {
      toast.error('Failed to tailor CV. Please try again.');
      setStep('input');
    }
  }

  function handleReset() {
    setStep('input');
    setTailoredResume(null);
    setJobTitle('');
    setCompany('');
    setJobDescription('');
    setTimeout(() => jobTitleRef.current?.focus(), 100);
  }

  const editorPanel = (
    <div className="h-full overflow-y-auto bg-dia-canvas p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-dia-heading-sm font-light text-foreground mb-1">Tailor CV</h2>
        <p className="text-sm text-dia-muted">Paste a job description and {"we'll"} reshape your Master CV to match — without inventing anything.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Job Title</label>
              <input
                ref={jobTitleRef}
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Product Designer"
                className="w-full border-0 border-b border-dia-divider bg-transparent pb-2 text-base text-foreground placeholder:text-dia-muted focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Company</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full border-0 border-b border-dia-divider bg-transparent pb-2 text-base text-foreground placeholder:text-dia-muted focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={12}
                className="w-full rounded-dia-sm border border-dia-divider bg-white p-4 text-sm text-foreground placeholder:text-dia-muted focus:outline-none focus:border-foreground transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleTailor}
              disabled={!jobTitle.trim() || !jobDescription.trim()}
              className="w-full rounded-full bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-dia-graphite disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Tailor CV
            </button>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-6 py-16"
          >
            <div className="relative h-16 w-16">
              <motion.div
                className="absolute inset-0 rounded-full spectrum-gradient opacity-40"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute inset-2 rounded-full bg-dia-canvas" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-light text-foreground">Tailoring your CV</p>
              <p className="text-sm text-dia-muted">Reshaping your experience for {jobTitle} at {company || 'this role'}…</p>
            </div>
          </motion.div>
        )}

        {step === 'done' && tailoredResume && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-dia-sm border border-dia-divider bg-white p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">CV tailored</p>
              <p className="text-xs text-dia-muted">
                Your Master CV has been reshaped for <strong>{jobTitle}</strong>{company ? ` at ${company}` : ''}. The preview shows the tailored version.
              </p>
              <p className="text-xs text-dia-muted/70">
                Nothing was invented — only reframed from your existing experience.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full rounded-full border border-dia-divider bg-transparent py-3 text-sm font-medium text-foreground transition-colors hover:bg-dia-fog"
            >
              Tailor for another role
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <main className="h-[calc(100vh-3.5rem)]">
      <ResizablePanels
        isBaseResume={!tailoredResume}
        editorPanel={editorPanel}
        previewPanel={(width) => (
          <PreviewPanel
            resume={displayResume}
            onResumeChange={() => {}}
            width={width}
          />
        )}
      />
    </main>
  );
}
