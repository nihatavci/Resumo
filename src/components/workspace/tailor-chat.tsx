// src/components/workspace/tailor-chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2, Wand2, Copy, Check } from 'lucide-react';
import type { Resume } from '@/lib/types';
import type { ProposedChanges } from './types';
import { parseMessageSegments, parseAnalysisLines, parseMatchLines, extractMemoryPoints } from './chat-message-parser';

interface TailorChatProps {
  masterResume: Resume;
  onProposedChanges: (changes: ProposedChanges | null) => void;
  onApplyReady: (ready: boolean) => void;
  onMemoryPoints?: (points: string[]) => void;
  onGenerating?: (generating: boolean, progress: number) => void;
}

interface ToolInvocation {
  toolCallId?: string;
  toolName: string;
  state: string;
  args?: unknown;
  result?: unknown;
}

export function TailorChat({ masterResume, onProposedChanges, onApplyReady, onMemoryPoints, onGenerating }: TailorChatProps) {
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [memoryPoints, setMemoryPoints] = useState<string[]>([]);
  const [researching, setResearching] = useState(false);
  const [companyIntel, setCompanyIntel] = useState<{
    culture: string;
    employerRep: string;
    hiringSignals: string;
  } | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dismissedPointsRef = useRef<Set<string>>(new Set());

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/tailor-chat',
    body: {
      masterResume,
      companyIntel: companyIntel
        ? `Culture: ${companyIntel.culture} | Employer rep: ${companyIntel.employerRep} | Hiring signals: ${companyIntel.hiringSignals}`
        : undefined,
    },
    onError: (err) => {
      console.error('[tailor-chat client] error:', err);
    },
    onFinish: (msg) => {
      console.log('[tailor-chat client] finished:', msg);
    },
  });

  // The "Generate tailored CV" button is enabled once there's at least one
  // assistant reply (meaning the AI has acknowledged a JD)
  const hasContext = messages.some((m) => m.role === 'assistant' && m.content.length > 50);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/tailor-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, masterResume, memoryPoints }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ProposedChanges & { proposed?: boolean };
      if (!data.proposed) throw new Error('Invalid response');
      setGenerateProgress(100);
      onProposedChanges(data);
      onApplyReady(true);
    } catch (err) {
      console.error('[tailor-generate] error:', err);
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
      // Reset progress after the fill-to-100 transition plays out
      setTimeout(() => setGenerateProgress(0), 600);
    }
  }

  function extractCompanyFromMessages(): string | null {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'assistant') continue;
      const match = m.content.match(/📋\s*Role\s*:\s*([^\n]+)/);
      if (match) {
        const roleText = match[1].trim();
        const companyMatch = roleText.match(/^([A-Za-zÀ-ÿ0-9\s&.'-]+?)(?:\s+(?:Digital|Marketing|Software|Lead|Manager|Engineer|Head|Senior|Junior|–|-|at|\|))/i);
        return companyMatch?.[1]?.trim() ?? roleText.split(' ').slice(0, 2).join(' ');
      }
    }
    return null;
  }

  async function handleResearch() {
    const companyName = extractCompanyFromMessages();
    if (!companyName) return;

    setResearching(true);
    setResearchError(null);
    try {
      const res = await fetch('/api/tailor-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      });
      const data = (await res.json()) as
        | { ok: true; culture: string; employerRep: string; hiringSignals: string }
        | { ok: false; error: string };

      if (!data.ok) throw new Error(data.error);
      setCompanyIntel({ culture: data.culture, employerRep: data.employerRep, hiringSignals: data.hiringSignals });
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : 'Research failed');
    } finally {
      setResearching(false);
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Propagate generating state + progress to parent (for skeleton overlay)
  useEffect(() => {
    onGenerating?.(generating, generateProgress);
  }, [generating, generateProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fake progress animation while generating
  useEffect(() => {
    if (!generating) return;
    setGenerateProgress(0);
    const interval = setInterval(() => {
      setGenerateProgress((prev) => {
        // Easing: rushes to ~60%, then crawls toward 90%, never reaches it
        const remaining = 90 - prev;
        const increment = Math.max(0.2, remaining * 0.06);
        return Math.min(90, prev + increment);
      });
    }, 120);
    return () => clearInterval(interval);
  }, [generating]);

  useEffect(() => {
    let accumulated: string[] = [];
    for (const m of messages) {
      if (m.role !== 'assistant') continue;
      const segs = parseMessageSegments(m.content);
      for (const seg of segs) {
        if (seg.type === 'memory') {
          accumulated = extractMemoryPoints(accumulated, seg.points);
        }
      }
    }
    // Filter out user-dismissed chips
    accumulated = accumulated.filter(
      (p) => !dismissedPointsRef.current.has(p.toLowerCase().trim())
    );
    setMemoryPoints(accumulated);
    onMemoryPoints?.(accumulated);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex flex-col bg-dia-canvas">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex-shrink-0 border-b border-dia-divider">
        <h2 className="text-dia-heading-sm font-light text-foreground mb-1">Tailor with AI</h2>
        <p className="text-sm text-dia-muted">
          Paste a job URL or description. Chat to refine. Click <strong>Apply</strong> when ready.
        </p>
      </div>

      {/* no chip rail here — plan card lives above the input */}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="inline-flex h-10 w-10 rounded-full items-center justify-center bg-foreground/5">
              <Sparkles className="h-5 w-5 text-foreground/60" />
            </div>
            <p className="text-sm text-foreground/50 max-w-xs mx-auto leading-relaxed">
              Start by pasting a job URL or job description.
              <br />
              <span className="text-xs text-foreground/30">
                {"e.g. “Tailor for: https://jobs.example.com/123”"}
              </span>
            </p>
          </div>
        )}

        {messages.map((m) => {
          const invocations = (m as unknown as { toolInvocations?: ToolInvocation[] }).toolInvocations ?? [];
          return (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              toolInvocations={invocations}
            />
          );
        })}

        {isLoading && (() => {
          // If the last user message has a URL, we're pre-scraping server-side
          const lastMsg = messages[messages.length - 1];
          const hasUrl = lastMsg?.role === 'user' &&
            typeof lastMsg.content === 'string' &&
            /https?:\/\//.test(lastMsg.content);
          return (
            <div className="flex items-center gap-2 text-sm text-foreground/40">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {hasUrl ? 'Fetching job posting…' : 'Thinking…'}
            </div>
          );
        })()}

        {/* Research button — shown after first JD analysis, before company intel loads */}
        {!companyIntel && messages.some((m) => m.role === 'assistant' && m.content.includes('📋')) && !isLoading && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResearch}
              disabled={researching}
              className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1.5 hover:bg-sky-100 transition-colors disabled:opacity-50"
            >
              {researching ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Researching…
                </>
              ) : (
                <>🔍 Research company</>
              )}
            </button>
            {researchError && (
              <p className="text-xs text-red-500">{researchError}</p>
            )}
          </div>
        )}

        {/* Company intel card */}
        {companyIntel && (
          <div className="flex justify-start">
            <div className="max-w-[92%]">
              <CompanyIntelCard {...companyIntel} />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
            <p className="font-medium mb-1">The assistant ran into an error</p>
            <p className="text-red-600 leading-relaxed">{error.message}</p>
            <p className="text-red-500/70 mt-2">Check browser DevTools console for details.</p>
          </div>
        )}
      </div>

      {/* Change plan card — live summary of agreed changes, pinned above input */}
      <ChangePlanCard points={memoryPoints} />

      {/* Input + Generate button */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-dia-divider bg-dia-canvas space-y-2">
        {generateError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {generateError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Paste a job URL or description, or chat with the assistant…"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-dia-divider bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors placeholder:text-foreground/30"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity flex-shrink-0"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>

        <button
          onClick={handleGenerate}
          disabled={!hasContext || generating || isLoading}
          className="relative w-full overflow-hidden rounded-2xl text-sm font-medium py-2.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{
            background: generating ? 'hsl(var(--foreground) / 0.12)' : 'hsl(var(--foreground))',
            color: 'hsl(var(--background))',
          }}
          title={!hasContext ? 'Discuss the job with the assistant first' : 'Generate the tailored CV'}
        >
          {/* Fill bar — grows from left as progress increases */}
          {generating && (
            <span
              className="absolute inset-y-0 left-0 bg-foreground"
              style={{
                width: `${generateProgress}%`,
                transition: 'width 0.15s ease-out',
              }}
            />
          )}

          {/* Button label — always above the fill */}
          <span className="relative z-10 flex items-center justify-center gap-2" style={{ color: 'hsl(var(--background))' }}>
            {generating ? (
              <>
                <span className="tabular-nums font-semibold">{Math.round(generateProgress)}%</span>
                <span className="font-normal opacity-80">— Generating tailored CV…</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate tailored CV
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Floating "Change plan" summary card — pinned between messages and input.
 * Replaces itself smoothly as memory points update throughout the conversation.
 * Shows nothing when there are no agreed changes yet.
 */
function ChangePlanCard({ points }: { points: string[] }) {
  const [open, setOpen] = useState(true);

  if (points.length === 0) return null;

  const actions = points.filter((p) => !/^(flag|gap|⚠)/i.test(p));
  const gaps = points.filter((p) => /^(flag|gap|⚠)/i.test(p));

  return (
    <div className="flex-shrink-0 mx-4 mb-2 rounded-2xl border border-foreground/8 bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35">
            Change plan
          </span>
          {/* live badge */}
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-600 text-[10px] font-semibold px-1.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            {points.length}
          </span>
        </div>
        <span className="text-foreground/25 text-xs">{open ? '▾' : '▸'}</span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-3 space-y-1">
          {actions.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-foreground/70 leading-snug">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" />
              <span>{p}</span>
            </div>
          ))}
          {gaps.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-amber-700 leading-snug">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-foreground/10 text-foreground/40 hover:text-foreground/70"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function MessageBubble({
  role,
  content,
  toolInvocations,
}: {
  role: string;
  content: string;
  toolInvocations: ToolInvocation[];
}) {
  const isUser = role === 'user';
  if (role === 'system') return null;

  const segments = isUser ? null : parseMessageSegments(content);

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? (
        <div className="relative max-w-[85%]">
          <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-foreground text-background">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
          <div className="absolute -bottom-5 right-1 flex items-center">
            <CopyButton text={content} />
          </div>
        </div>
      ) : (
        <div className="relative max-w-[92%] space-y-2">
          {segments?.map((seg, i) =>
            seg.type === 'ats' ? (
              <AtsTipBadges key={i} content={seg.content} />
            ) : seg.type === 'match' ? (
              <MatchMapCard key={i} content={seg.content} />
            ) : seg.type === 'memory' ? null : (
              <AnalysisBubble key={i} content={seg.content} />
            )
          )}
          {toolInvocations.map((inv, idx) => (
            <ToolInvocationView key={inv.toolCallId ?? idx} inv={inv} />
          ))}
          {content && (
            <div className="flex items-center">
              <CopyButton text={content} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Renders the structured 📋/🎯/✅/🔧/⚠️ analysis block with visual row treatment */
function AnalysisBubble({ content }: { content: string }) {
  const lines = parseAnalysisLines(content);
  const hasStructured = lines.some((l) => !('raw' in l));

  if (!hasStructured) {
    // Plain conversational message
    return (
      <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-white border border-dia-divider text-foreground">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dia-divider bg-white overflow-hidden text-sm">
      {lines.map((line, i) => {
        if ('raw' in line) {
          if (!line.raw || line.raw.length === 0) return null;
          return (
            <p key={i} className="px-4 py-2.5 text-foreground/80 leading-relaxed border-t border-dia-divider/50 first:border-t-0">
              {line.raw}
            </p>
          );
        }
        const rowStyle = getRowStyle(line.emoji);
        return (
          <div key={i} className={`flex items-start gap-3 px-4 py-2.5 border-t border-dia-divider/40 first:border-t-0 ${rowStyle.bg}`}>
            <span className="text-base leading-tight mt-0.5 flex-shrink-0">{line.emoji}</span>
            <div className="min-w-0">
              <span className={`text-[10px] font-semibold tracking-wider uppercase ${rowStyle.label} block mb-0.5`}>
                {line.label}
              </span>
              <span className="text-foreground leading-snug">{line.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getRowStyle(emoji: string): { bg: string; label: string } {
  switch (emoji) {
    case '📋': return { bg: 'bg-foreground/[0.02]', label: 'text-foreground/50' };
    case '🎯': return { bg: 'bg-blue-50/60',        label: 'text-blue-500' };
    case '✅': return { bg: 'bg-emerald-50/60',      label: 'text-emerald-600' };
    case '🔧': return { bg: 'bg-violet-50/60',       label: 'text-violet-500' };
    case '⚠️':
    case '⚠':  return { bg: 'bg-amber-50/60',        label: 'text-amber-600' };
    case '💼': return { bg: 'bg-sky-50/60',          label: 'text-sky-500' };
    case '🌍': return { bg: 'bg-teal-50/60',         label: 'text-teal-600' };
    default:   return { bg: '',                       label: 'text-foreground/50' };
  }
}

/** ATS tips rendered as pill badges */
function AtsTipBadges({ content }: { content: string }) {
  const tips = content.split('\n').filter((line) => line.trim().length > 0);
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 space-y-2.5">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-600">
        ATS Tips
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tips.map((tip, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs text-amber-800 leading-none"
          >
            {tip}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompanyIntelCard({
  culture,
  employerRep,
  hiringSignals,
}: {
  culture: string;
  employerRep: string;
  hiringSignals: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 overflow-hidden text-sm">
      <div className="px-4 py-2.5 border-b border-sky-200/60">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-sky-600">
          🏢 Company Intel
        </p>
      </div>
      {[
        { icon: '🌍', label: 'Culture', value: culture },
        { icon: '⭐', label: 'Employer rep', value: employerRep },
        { icon: '💡', label: 'What they value', value: hiringSignals },
      ].map(({ icon, label, value }) => (
        <div key={label} className="flex items-start gap-3 px-4 py-2.5 border-t border-sky-200/40 first:border-t-0">
          <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-500 mb-0.5">{label}</p>
            <p className="text-xs text-foreground/80 leading-snug">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Renders :::match fence content as a two-column table card */
function MatchMapCard({ content }: { content: string }) {
  const lines = parseMatchLines(content);
  if (lines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dia-divider bg-white overflow-hidden text-sm">
      <div className="px-4 py-2.5 border-b border-dia-divider/50 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
          Match map
        </span>
      </div>
      {lines.map((line, i) => {
        const bg =
          line.marker === '✅' ? 'bg-emerald-50/60' :
          line.marker === '⚡' ? 'bg-amber-50/60' :
          'bg-red-50/40';
        const markerColor =
          line.marker === '✅' ? 'text-emerald-600' :
          line.marker === '⚡' ? 'text-amber-500' :
          'text-red-500';

        return (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 py-2 border-t border-dia-divider/30 first:border-t-0 ${bg}`}
          >
            <span className={`text-base flex-shrink-0 mt-0.5 ${markerColor}`}>{line.marker}</span>
            <div className="min-w-0 flex-1 grid grid-cols-[1fr_1.5fr] gap-2">
              <span className="text-xs font-medium text-foreground truncate">{line.requirement}</span>
              <span className="text-xs text-foreground/60 leading-snug">{line.explanation}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolInvocationView({ inv }: { inv: ToolInvocation }) {
  if (inv.toolName === 'scrape_job_url') {
    if (inv.state !== 'result') {
      return <p className="text-xs text-foreground/40 italic mt-1">Fetching job description…</p>;
    }
    const r = inv.result as { ok: boolean; title?: string; error?: string };
    if (r.ok) {
      return (
        <p className="text-xs text-foreground/60 italic mt-1">
          ✓ Fetched{r.title ? `: ${r.title.slice(0, 80)}` : ' job description'}
        </p>
      );
    }
    // Don't show a scary error — the AI will ask for pasted text instead
    return null;
  }

  return null;
}
