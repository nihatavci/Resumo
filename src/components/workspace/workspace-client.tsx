'use client';

import { useState } from 'react';
import { Resume } from '@/lib/types';
import { applyTailoring } from '@/utils/actions/workspace';
import { ResumePreview } from '@/components/resume/editor/preview/resume-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanels } from '@/components/resume/editor/layout/ResizablePanels';
import { ResumePDFDocument } from '@/components/resume/editor/preview/resume-pdf-document';
import { pdf } from '@react-pdf/renderer';
import { TailorChat } from './tailor-chat';
import { toast } from 'sonner';
import { Download, RotateCcw, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProposedChanges } from './types';

interface WorkspaceClientProps {
  masterResume: Resume;
}

type ViewMode = 'original' | 'pending';

export function WorkspaceClient({ masterResume }: WorkspaceClientProps) {
  const [pendingChanges, setPendingChanges] = useState<ProposedChanges | null>(null);
  const [applyReady, setApplyReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [applying, setApplying] = useState(false);

  function handleProposedChanges(changes: ProposedChanges | null) {
    setPendingChanges(changes);
    if (changes) setViewMode('pending');
  }

  // Compose preview resume from master + pending changes (when viewing pending)
  const displayResume: Resume =
    viewMode === 'pending' && pendingChanges
      ? {
          ...masterResume,
          professional_summary:
            pendingChanges.professional_summary ?? masterResume.professional_summary,
          work_experience: pendingChanges.work_experience,
          skills: pendingChanges.skills,
        }
      : masterResume;

  async function handleApply() {
    if (!pendingChanges) return;
    setApplying(true);
    try {
      await applyTailoring(masterResume.id, pendingChanges);
      toast.success('Tailored CV saved');
      setPendingChanges(null);
      setApplyReady(false);
      setViewMode('original');
    } catch (err) {
      console.error('Apply failed:', err);
      toast.error('Failed to save tailored CV');
    } finally {
      setApplying(false);
    }
  }

  function handleDiscard() {
    setPendingChanges(null);
    setApplyReady(false);
    setViewMode('original');
  }

  async function handleDownload() {
    try {
      const blob = await pdf(<ResumePDFDocument resume={displayResume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const label = viewMode === 'pending' ? 'Tailored' : 'Master_CV';
      link.download = `${displayResume.first_name}_${displayResume.last_name}_${label}.pdf`;
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

  return (
    <main className="h-[calc(100vh-3.5rem)] relative">
      <ResizablePanels
        isBaseResume={!pendingChanges}
        editorPanel={
          <TailorChat
            masterResume={masterResume}
            onProposedChanges={handleProposedChanges}
            onApplyReady={setApplyReady}
          />
        }
        previewPanel={(width) => (
          <div className="relative h-full">
            <ScrollArea className="h-full bg-dia-canvas">
              <ResumePreview resume={displayResume} containerWidth={width} />
            </ScrollArea>

            {/* Top center — view toggle */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <AnimatePresence>
                {pendingChanges && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="pointer-events-auto flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm border border-dia-divider p-1 shadow-lg"
                  >
                    <button
                      onClick={() => setViewMode('original')}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        viewMode === 'original'
                          ? 'bg-foreground text-background'
                          : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setViewMode('pending')}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                        viewMode === 'pending'
                          ? 'bg-foreground text-background'
                          : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      Tailored (pending)
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Top right — actions */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm border border-dia-divider text-foreground text-sm font-medium px-3.5 py-2 shadow-md hover:bg-white transition-all"
                title="Download as PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">Download</span>
              </button>

              <AnimatePresence>
                {pendingChanges && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2"
                  >
                    <button
                      onClick={handleDiscard}
                      className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm border border-dia-divider text-foreground text-sm font-medium px-3.5 py-2 shadow-md hover:bg-white transition-all"
                      title="Discard pending changes"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="hidden lg:inline">Discard</span>
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applying || !applyReady}
                      className="flex items-center gap-2 rounded-full bg-foreground text-background text-sm font-medium px-3.5 py-2 shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {applying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Apply
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      />
    </main>
  );
}
