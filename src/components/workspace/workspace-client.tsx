'use client';

import { useState, useRef } from 'react';
import { Resume } from '@/lib/types';
import { tailorResume } from '@/utils/actions/workspace';
import { ResumePreview } from '@/components/resume/editor/preview/resume-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanels } from '@/components/resume/editor/layout/ResizablePanels';
import { ResumePDFDocument } from '@/components/resume/editor/preview/resume-pdf-document';
import { pdf } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Clock, X, ChevronRight, Download } from 'lucide-react';

interface HistoryEntry {
  resume: Resume;
  jobTitle: string;
  company: string;
  tailoredAt: string;
}

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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
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
      setHistory(prev => [
        { resume: result, jobTitle: jobTitle.trim(), company: company.trim() || 'Unknown Company', tailoredAt: new Date().toISOString() },
        ...prev.slice(0, 19),
      ]);
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

  function loadFromHistory(entry: HistoryEntry) {
    setTailoredResume(entry.resume);
    setJobTitle(entry.jobTitle);
    setCompany(entry.company);
    setStep('done');
    setHistoryOpen(false);
  }

  async function handleDownload() {
    try {
      const blob = await pdf(<ResumePDFDocument resume={displayResume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileLabel = tailoredResume
        ? `${displayResume.first_name}_${displayResume.last_name}_${jobTitle.replace(/\s+/g, '_')}`
        : `${displayResume.first_name}_${displayResume.last_name}_Master_CV`;
      link.download = `${fileLabel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to generate PDF');
    }
  }

  const editorPanel = (
    <div className="relative h-full overflow-y-auto bg-dia-canvas flex flex-col">
      {/* Panel header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between flex-shrink-0">
        <div>
          <h2 className="text-dia-heading-sm font-light text-foreground mb-1">Tailor CV</h2>
          <p className="text-sm text-dia-muted">Paste a job description and {"we'll"} reshape your Master CV to match — without inventing anything.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 text-xs text-dia-muted hover:text-foreground transition-colors mt-1 flex-shrink-0 ml-4"
          >
            <Clock className="h-3.5 w-3.5" />
            History ({history.length})
          </button>
        )}
      </div>

      <div className="px-6 pb-6 flex-1">
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
                <p className="text-sm text-dia-muted">Reshaping your experience for {jobTitle}{company ? ` at ${company}` : ''}…</p>
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
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-sm font-medium text-foreground">CV tailored</p>
                </div>
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

      {/* History Drawer */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 z-10"
              onClick={() => setHistoryOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-full bg-white z-20 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-dia-divider">
                <h3 className="text-sm font-medium text-foreground">Tailoring History</h3>
                <button onClick={() => setHistoryOpen(false)} className="text-dia-muted hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {history.map((entry, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadFromHistory(entry)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-dia-fog transition-colors border-b border-dia-divider text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.jobTitle}</p>
                      <p className="text-xs text-dia-muted">{entry.company}</p>
                      <p className="text-xs text-dia-muted/60 mt-0.5">
                        {new Date(entry.tailoredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-dia-muted flex-shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <main className="h-[calc(100vh-3.5rem)] relative">
      <ResizablePanels
        isBaseResume={!tailoredResume}
        editorPanel={editorPanel}
        previewPanel={(width) => (
          <div className="relative h-full">
            <ScrollArea className="h-full bg-dia-canvas">
              <ResumePreview resume={displayResume} containerWidth={width} />
            </ScrollArea>
            {/* Floating download button */}
            <button
              onClick={handleDownload}
              className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full bg-foreground text-background text-sm font-medium px-4 py-2.5 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
              title="Download as PDF"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        )}
      />
    </main>
  );
}
