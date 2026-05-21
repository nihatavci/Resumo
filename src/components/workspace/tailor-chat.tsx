// src/components/workspace/tailor-chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import type { Resume } from '@/lib/types';
import type { ProposedChanges } from './types';

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
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/tailor-chat',
    body: { masterResume },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Forward the latest propose_changes tool result to the parent
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'assistant') continue;
      const invocations = (m as unknown as { toolInvocations?: ToolInvocation[] }).toolInvocations ?? [];
      for (const inv of invocations) {
        if (inv.toolName === 'propose_changes' && inv.state === 'result') {
          const r = inv.result as ProposedChanges & { proposed?: boolean };
          if (r && r.proposed) {
            onProposedChanges(r);
            onApplyReady(true);
            return;
          }
        }
      }
    }
  }, [messages, onProposedChanges, onApplyReady]);

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
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 px-6 py-4 border-t border-dia-divider bg-dia-canvas"
      >
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
            placeholder="Paste a job URL, or chat with the assistant…"
            rows={2}
            className="flex-1 resize-none rounded-2xl border border-dia-divider bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors placeholder:text-foreground/30"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-foreground text-background'
            : 'bg-white border border-dia-divider text-foreground'
        }`}
      >
        {content && <p className="whitespace-pre-wrap">{content}</p>}
        {toolInvocations.map((inv, idx) => (
          <ToolInvocationView key={inv.toolCallId ?? idx} inv={inv} />
        ))}
      </div>
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
    return <p className="text-xs text-amber-600 italic mt-1">⚠ {r.error}</p>;
  }

  if (inv.toolName === 'propose_changes') {
    if (inv.state !== 'result') {
      return <p className="text-xs text-foreground/40 italic mt-1">Drafting changes…</p>;
    }
    const r = inv.result as { rationale?: string };
    return (
      <div className="mt-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs text-foreground/70">
        <p className="font-medium text-foreground/90 mb-1">Proposed changes ready</p>
        {r.rationale && <p className="leading-snug">{r.rationale}</p>}
        <p className="text-foreground/50 mt-1.5">
          Review the preview on the right, then click <strong>Apply</strong>.
        </p>
      </div>
    );
  }

  return null;
}
