'use client';

import { useState, useCallback } from 'react';
import { Resume } from '@/lib/types';
import { applyTailoring } from '@/utils/actions/workspace';
import { ResumePreview } from '@/components/resume/editor/preview/resume-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanels } from '@/components/resume/editor/layout/ResizablePanels';
import { ResumePDFDocument } from '@/components/resume/editor/preview/resume-pdf-document';
import { pdf } from '@react-pdf/renderer';
import { TailorChat } from './tailor-chat';
import { TailoredDiffView } from './tailored-diff-view';
import { GeneratingSkeleton } from './generating-skeleton';
import { ConversationHeader } from './conversation-header';
import { useConversations, type CompanyIntel } from '@/hooks/use-conversations';
import { toast } from 'sonner';
import { Download, RotateCcw, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProposedChanges } from './types';
import type { Message } from '@ai-sdk/react';
import { getThemeById, type ResumeTheme } from '@/lib/resume-themes';
import { ThemePicker } from './theme-picker';
import { getStoredLanguage, type LanguageCode } from '@/components/settings/language-form';

interface WorkspaceClientProps {
  masterResume: Resume;
}

type ViewMode = 'original' | 'diff' | 'tailored';

export function WorkspaceClient({ masterResume }: WorkspaceClientProps) {
  const [pendingChanges, setPendingChanges] = useState<ProposedChanges | null>(null);
  const [applyReady, setApplyReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [applying, setApplying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'classic';
    return localStorage.getItem('resumo_theme') ?? 'classic';
  });
  const [responseLanguage] = useState<LanguageCode | null>(() => getStoredLanguage());

  // Conversation persistence
  const {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    saveConversation,
    deleteConversation,
    selectConversation,
  } = useConversations(masterResume.id);

  // Ensure there's always at least one conversation
  const effectiveConvoId = activeId ?? (() => {
    // This path shouldn't normally be reached — useConversations auto-selects
    return 'default';
  })();

  const handleConversationChange = useCallback(
    (patch: { messages?: Message[]; companyIntel?: CompanyIntel | null; memoryPoints?: string[] }) => {
      if (!activeId) return;
      saveConversation(activeId, patch);
    },
    [activeId, saveConversation],
  );

  function handleCreateConversation() {
    // Reset pending changes when starting a new conversation
    setPendingChanges(null);
    setApplyReady(false);
    setViewMode('original');
    createConversation();
  }

  function handleSelectConversation(id: string) {
    // Reset pending changes when switching conversations
    setPendingChanges(null);
    setApplyReady(false);
    setViewMode('original');
    selectConversation(id);
  }

  const selectedTheme: ResumeTheme = getThemeById(selectedThemeId);

  function handleThemeChange(id: string) {
    setSelectedThemeId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resumo_theme', id);
    }
  }

  function handleProposedChanges(changes: ProposedChanges | null) {
    setPendingChanges(changes);
    if (changes) setViewMode('diff');
  }

  // Compose the resume shown in PDF preview
  const tailoredResume: Resume = pendingChanges
    ? {
        ...masterResume,
        professional_summary:
          pendingChanges.professional_summary ?? masterResume.professional_summary,
        work_experience: pendingChanges.work_experience,
        skills: pendingChanges.skills,
      }
    : masterResume;

  const displayResume = viewMode === 'original' ? masterResume : tailoredResume;

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
      const blob = await pdf(<ResumePDFDocument resume={displayResume} theme={selectedTheme} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const label = viewMode === 'original' ? 'Master_CV' : 'Tailored';
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
          <div className="h-full flex flex-col">
            <ConversationHeader
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelectConversation}
              onCreate={handleCreateConversation}
              onDelete={deleteConversation}
            />
            <TailorChat
              key={effectiveConvoId}
              masterResume={masterResume}
              initialMessages={activeConversation?.messages}
              initialCompanyIntel={activeConversation?.companyIntel}
              responseLanguage={responseLanguage ?? undefined}
              onProposedChanges={handleProposedChanges}
              onApplyReady={setApplyReady}
              onGenerating={(g, p) => { setGenerating(g); setGenerateProgress(p); }}
              onConversationChange={handleConversationChange}
            />
          </div>
        }
        previewPanel={(width) => (
          <div className="relative h-full flex flex-col">
            {/* ── Top action bar ── */}
            <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-dia-divider bg-dia-canvas/80 backdrop-blur-sm z-50">

              {/* Left: view mode toggle (only when pending exists) */}
              <AnimatePresence mode="wait">
                {pendingChanges ? (
                  <motion.div
                    key="tabs"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="flex items-center gap-0.5 rounded-full bg-foreground/5 border border-dia-divider p-0.5"
                  >
                    <TabBtn
                      active={viewMode === 'original'}
                      onClick={() => setViewMode('original')}
                    >
                      Original
                    </TabBtn>
                    <TabBtn
                      active={viewMode === 'diff'}
                      onClick={() => setViewMode('diff')}
                      dot="amber"
                    >
                      Changes
                    </TabBtn>
                    <TabBtn
                      active={viewMode === 'tailored'}
                      onClick={() => setViewMode('tailored')}
                      dot="emerald"
                    >
                      Preview
                    </TabBtn>
                  </motion.div>
                ) : (
                  <motion.span
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-foreground/30 font-medium"
                  >
                    CV Preview
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Right: actions */}
              <div className="flex items-center gap-2">
                <ThemePicker
                  selectedThemeId={selectedThemeId}
                  onChange={handleThemeChange}
                />
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-full bg-white border border-dia-divider text-foreground text-xs font-medium px-3 py-1.5 shadow-sm hover:bg-foreground/5 transition-all"
                  title="Download as PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
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
                        className="flex items-center gap-1.5 rounded-full bg-white border border-dia-divider text-foreground text-xs font-medium px-3 py-1.5 shadow-sm hover:bg-foreground/5 transition-all"
                        title="Discard pending changes"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Discard
                      </button>
                      <button
                        onClick={handleApply}
                        disabled={applying || !applyReady}
                        className="flex items-center gap-1.5 rounded-full bg-foreground text-background text-xs font-medium px-3 py-1.5 shadow-sm hover:opacity-90 disabled:opacity-40 transition-all"
                      >
                        {applying ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Apply
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Content area ── */}
            <div className="flex-1 min-h-0 relative">
              {/* Shimmer skeleton overlay while generating */}
              <AnimatePresence>
                {generating && (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 z-20"
                  >
                    <GeneratingSkeleton
                      masterResume={masterResume}
                      progress={generateProgress}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Normal content beneath skeleton */}
              {viewMode === 'diff' && pendingChanges ? (
                <TailoredDiffView
                  masterResume={masterResume}
                  pendingChanges={pendingChanges}
                />
              ) : (
                <ScrollArea className="h-full bg-dia-canvas">
                  <ResumePreview
                    resume={viewMode === 'original' ? masterResume : tailoredResume}
                    containerWidth={width}
                    theme={selectedTheme}
                  />
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      />
    </main>
  );
}

/** Small pill tab button */
function TabBtn({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: 'amber' | 'emerald';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${
        active
          ? 'bg-white shadow-sm text-foreground font-medium border border-dia-divider/60'
          : 'text-foreground/50 hover:text-foreground'
      }`}
    >
      {children}
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
            dot === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />
      )}
    </button>
  );
}
