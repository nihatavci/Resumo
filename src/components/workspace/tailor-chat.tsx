// src/components/workspace/tailor-chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2, Wand2, Copy, Check } from 'lucide-react';
import type { Resume } from '@/lib/types';
import type { ProposedChanges } from './types';
import { parseMessageSegments } from './chat-message-parser';

interface TailorChatProps {
  masterResume: Resume;
  onProposedChanges: (changes: ProposedChanges | null) => void;
  onApplyReady: (ready: boolean) => void;
}

interface ToolInvocation {
  toolCallId?: string;
  toolName: string;
  state: string;
  args?: unknown;
  result?: unknown;
}

export function TailorChat({ masterResume, onProposedChanges, onApplyReady }: TailorChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/tailor-chat',
    body: { masterResume },
    onError: (err) => {
      console.error('[tailor-chat client] error:', err);
    },
    onFinish: (msg) => {
      console.log('[tailor-chat client] finished:', msg);
    },
  });

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ messages, masterResume }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ProposedChanges & { proposed?: boolean };
      if (!data.proposed) throw new Error('Invalid response');
      onProposedChanges(data);
      onApplyReady(true);
    } catch (err) {
      console.error('[tailor-generate] error:', err);
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-dia-canvas">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex-shrink-0 border-b border-dia-divider">
        <h2 className="text-dia-heading-sm font-light text-foreground mb-1">Tailor with AI</h2>
        <p className="text-sm text-dia-muted">
          Paste a job URL or description. Chat to refine. Click <strong>Apply</strong> when ready.
        </p>
      </div>

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

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-foreground/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking…
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
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background text-sm font-medium py-2.5 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          title={!hasContext ? 'Discuss the job with the assistant first' : 'Generate the tailored CV'}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating tailored CV…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate tailored CV
            </>
          )}
        </button>
      </div>
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
        <div className="relative max-w-[88%] space-y-2">
          {segments?.map((seg, i) =>
            seg.type === 'ats' ? (
              <AtsTipCard key={i} content={seg.content} />
            ) : (
              <div
                key={i}
                className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-white border border-dia-divider text-foreground"
              >
                <p className="whitespace-pre-wrap">{seg.content}</p>
              </div>
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

function AtsTipCard({ content }: { content: string }) {
  const tips = content.split('\n').filter((line) => line.trim().length > 0);
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-600">
        ATS Tips
      </p>
      {tips.map((tip, i) => (
        <p key={i} className="text-xs font-mono text-amber-800 leading-snug">
          · {tip}
        </p>
      ))}
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
