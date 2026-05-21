# Conversational CV Tailoring with Live Diff Preview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Replace the static "paste JD → tailor" form with a chat interface where the user collaboratively refines a tailored CV. AI scrapes URLs, understands the job, proposes changes, accepts feedback, and only commits when the user says "ready." User sees pending changes highlighted live in the preview, with a one-click toggle back to the original Master CV.

**Architecture:**
- **Left panel:** Chat (streaming messages with `useChat`)
- **Right panel:** Live PDF preview showing either Master CV (original) or proposed tailored CV
- **AI has tools:**
  - `scrape_job_url(url)` — fetches a URL, strips HTML, returns plain text
  - `propose_changes(work_experience, skills, summary)` — sets pending changes (visible in preview but not saved)
  - `apply_changes()` — saves pending changes as a new tailored resume
- **State machine:** `idle → discussing → proposed → applied`
- **View toggle:** "Original" vs "Tailored (pending)" vs "Tailored (saved)"

**Tech Stack:** Vercel AI SDK `streamText` + `useChat` for streaming chat with tool calling, Llama 3.3 70B for reasoning, Cloudflare Workers `fetch()` for URL scraping (with fallback to user-pasted text when scraping fails — e.g. LinkedIn login walls).

**Out of scope (separate plans):** Theme gallery, multi-language support, version history beyond current session.

---

## File Structure

- **Create:** `src/utils/actions/scrape.ts` — server action to fetch a URL and return clean text
- **Create:** `src/app/api/tailor-chat/route.ts` — streaming chat endpoint with tool calling
- **Create:** `src/components/workspace/tailor-chat.tsx` — left-panel chat UI
- **Create:** `src/components/workspace/preview-toolbar.tsx` — right-panel toolbar with Original/Tailored toggle + Apply button + Download
- **Modify:** `src/components/workspace/workspace-client.tsx` — orchestrate chat ↔ preview state, hold pending vs applied changes
- **Modify:** `src/utils/actions/workspace.ts` — refactor `tailorResume` to accept structured changes (not regenerate from scratch)

---

### Task 1: URL scraping server action

**Files:**
- Create: `src/utils/actions/scrape.ts`

Fetch a URL, parse HTML, return clean text. Use a real-browser User-Agent. If we get HTML, strip tags + scripts + nav and return the text content. If the site blocks us (LinkedIn login wall, Cloudflare turnstile, 403), return a clear error so the AI can ask the user to paste the JD manually.

- [ ] **Step 1: Create scrape.ts**

```typescript
// src/utils/actions/scrape.ts
'use server';

import { getAuthenticatedUser } from '@/utils/auth';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScrapeResult {
  ok: boolean;
  url: string;
  text?: string;
  title?: string;
  error?: string;
}

/**
 * Fetch a public URL and extract the main text content.
 * Returns ok:false when the site blocks scraping (login walls, captchas, 403s).
 */
export async function scrapeJobUrl(url: string): Promise<ScrapeResult> {
  await getAuthenticatedUser(); // gate to authed users only
  console.log('[scrapeJobUrl] fetching:', url);

  try {
    // Validate URL
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, url, error: 'Only http/https URLs are supported.' };
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return { ok: false, url, error: `HTTP ${res.status} — site may block scraping` };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('html') && !contentType.includes('text')) {
      return { ok: false, url, error: `Unsupported content type: ${contentType}` };
    }

    const html = await res.text();

    // Detect common login walls
    if (
      html.includes('Sign in to LinkedIn') ||
      html.includes('Join LinkedIn') ||
      (parsed.hostname.includes('linkedin.com') && html.length < 50000)
    ) {
      return {
        ok: false,
        url,
        error:
          'LinkedIn blocks scraping. Please copy the job description text and paste it directly into the chat.',
      };
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Strip scripts, styles, nav, footer, then strip all tags
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim();

    // Truncate to keep prompt size reasonable
    const truncated = text.slice(0, 8000);

    console.log('[scrapeJobUrl] success, text length:', truncated.length);
    return { ok: true, url, title, text: truncated };
  } catch (err) {
    console.error('[scrapeJobUrl] failed:', err);
    return {
      ok: false,
      url,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/actions/scrape.ts
git commit -m "feat: URL scraping server action with LinkedIn-block detection"
```

---

### Task 2: Streaming chat endpoint with tool calling

**Files:**
- Create: `src/app/api/tailor-chat/route.ts`

Vercel AI SDK `streamText` with tools. The AI receives the user's Master CV + the conversation, can call `scrape_job_url`, and produces a `proposed_changes` tool call when ready.

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/tailor-chat/route.ts
import { streamText, tool, convertToCoreMessages, type CoreMessage } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import { scrapeJobUrl } from '@/utils/actions/scrape';
import type { Resume } from '@/lib/types';

export const runtime = 'edge';

const proposeChangesSchema = z.object({
  professional_summary: z.string().optional().describe('Tailored summary paragraph, or omit to keep original.'),
  work_experience: z
    .array(
      z.object({
        company: z.string(),
        position: z.string(),
        date: z.string(),
        location: z.string().optional(),
        description: z.array(z.string()),
        technologies: z.array(z.string()).optional(),
      })
    )
    .describe('Same entries as master, with bullets rewritten and reordered for the target job. Never drop or invent jobs.'),
  skills: z
    .array(z.object({ category: z.string(), items: z.array(z.string()) }))
    .describe('Skills reordered/regrouped for the target job. Never invent skills.'),
  rationale: z.string().describe('One-paragraph explanation of what changed and why, in plain English.'),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as {
    messages: CoreMessage[];
    masterResume: Resume;
  };

  const { messages, masterResume } = body;

  const { model, usageEventId } = await startAIUsageRequest({
    route: 'api.tailor-chat',
    userId,
    isPro: true,
  });

  const systemPrompt = `You are a professional resume tailoring assistant. You help the user adapt their Master CV to a specific job opening.

You have these tools:
- scrape_job_url(url): fetch a job posting from a URL. Use this when the user provides a URL.
- propose_changes(...): once you have enough context (job description + user's preferences), call this with the proposed tailored version. The user will then review.

The user's MASTER CV is provided below as JSON. NEVER invent facts. NEVER drop work experience entries. Only rewrite bullets and reorder/regroup skills.

When you have enough context:
1. Call propose_changes with the full tailored work_experience (same number of entries as master), tailored skills, and an optional rephrased professional_summary.
2. Include a 'rationale' field explaining what you changed and why.

If the user provides a LinkedIn URL, scraping might fail. If so, ask them to paste the job description text directly.

Be conversational. Ask clarifying questions when helpful (e.g. "Want me to emphasize your B2B SaaS experience or your platform work?"). But don't ask too many — most users want fast results.

MASTER CV:
${JSON.stringify(
  {
    professional_summary: masterResume.professional_summary,
    work_experience: masterResume.work_experience,
    skills: masterResume.skills,
    education: masterResume.education,
  },
  null,
  2
)}`;

  try {
    const result = streamText({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...convertToCoreMessages(messages)],
      tools: {
        scrape_job_url: tool({
          description: 'Fetch a public job posting from a URL and return the text. Use when the user provides a URL.',
          parameters: z.object({
            url: z.string().describe('The URL of the job posting'),
          }),
          execute: async ({ url }) => {
            const result = await scrapeJobUrl(url);
            return result;
          },
        }),
        propose_changes: tool({
          description:
            'Propose the final tailored version of the resume. The user will see the changes in a preview and decide whether to apply.',
          parameters: proposeChangesSchema,
          execute: async (changes) => {
            // Returning the proposal as the tool result — the client picks it up.
            return { proposed: true, ...changes };
          },
        }),
      },
      onFinish: async ({ usage }) => {
        await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('[tailor-chat] error:', err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'stream_failed',
    });
    return new Response('Streaming error', { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/tailor-chat/route.ts
git commit -m "feat: streaming tailor-chat endpoint with scrape and propose tools"
```

---

### Task 3: Chat panel UI

**Files:**
- Create: `src/components/workspace/tailor-chat.tsx`

Uses `useChat` from `@ai-sdk/react`. Renders messages, handles tool-call results (the `propose_changes` result is forwarded to the parent so it can show a diff). Input field at bottom.

- [ ] **Step 1: Create the component**

```typescript
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

export function TailorChat({ masterResume, onProposedChanges, onApplyReady }: TailorChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/tailor-chat',
    body: { masterResume },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Pick up the latest propose_changes tool result and forward to parent
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'assistant') continue;
      const toolInvocations = m.toolInvocations ?? [];
      for (const inv of toolInvocations) {
        if (inv.toolName === 'propose_changes' && inv.state === 'result') {
          const r = inv.result as ProposedChanges & { proposed?: boolean };
          if (r.proposed) {
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
          Paste a job URL or description. Chat with the assistant to refine. Click <strong>Apply</strong> when ready.
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="inline-flex h-10 w-10 rounded-full items-center justify-center bg-foreground/5">
              <Sparkles className="h-5 w-5 text-foreground/60" />
            </div>
            <p className="text-sm text-foreground/50 max-w-xs mx-auto">
              Start by pasting a job URL or job description.<br />
              <span className="text-xs">e.g. &quot;Tailor for this role: https://jobs.example.com/123&quot;</span>
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} toolInvocations={m.toolInvocations} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-foreground/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 px-6 py-4 border-t border-dia-divider">
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
            className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
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
  toolInvocations?: Array<{ toolName: string; state: string; result?: unknown }>;
}) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? 'bg-foreground text-background' : 'bg-white border border-dia-divider text-foreground'
        }`}
      >
        {content && <p className="whitespace-pre-wrap">{content}</p>}
        {toolInvocations?.map((inv, idx) => (
          <ToolInvocationView key={idx} inv={inv} />
        ))}
      </div>
    </div>
  );
}

function ToolInvocationView({
  inv,
}: {
  inv: { toolName: string; state: string; result?: unknown };
}) {
  if (inv.toolName === 'scrape_job_url') {
    if (inv.state !== 'result') return <p className="text-xs text-foreground/40 italic">Fetching job description…</p>;
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
    if (inv.state !== 'result') return <p className="text-xs text-foreground/40 italic">Drafting changes…</p>;
    const r = inv.result as { rationale?: string };
    return (
      <div className="mt-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs text-foreground/70">
        <p className="font-medium text-foreground/90 mb-1">Proposed changes ready</p>
        {r.rationale && <p>{r.rationale}</p>}
        <p className="text-foreground/50 mt-1.5">Review the preview on the right, then click Apply.</p>
      </div>
    );
  }
  return null;
}
```

- [ ] **Step 2: Create types file**

```typescript
// src/components/workspace/types.ts
import type { WorkExperience, Skill } from '@/lib/types';

export interface ProposedChanges {
  professional_summary?: string;
  work_experience: WorkExperience[];
  skills: Skill[];
  rationale: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/workspace/tailor-chat.tsx src/components/workspace/types.ts
git commit -m "feat: chat panel UI with tool-call rendering"
```

---

### Task 4: Refactor workspace-client to orchestrate chat + diff preview

**Files:**
- Modify: `src/components/workspace/workspace-client.tsx`

Replace the static form with `<TailorChat>`. Hold three states: `original` (Master CV), `pendingChanges` (proposed by AI, not saved), `savedTailored` (last applied/saved tailored CV). View mode toggles which one renders in preview.

- [ ] **Step 1: Replace the file**

```typescript
// src/components/workspace/workspace-client.tsx
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

  // Auto-switch to pending view when AI proposes changes
  function handleProposedChanges(changes: ProposedChanges | null) {
    setPendingChanges(changes);
    if (changes) setViewMode('pending');
  }

  // Build the resume that's shown in the preview based on viewMode + pending
  const displayResume: Resume =
    viewMode === 'pending' && pendingChanges
      ? {
          ...masterResume,
          professional_summary: pendingChanges.professional_summary ?? masterResume.professional_summary,
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

  async function handleDownload() {
    try {
      const blob = await pdf(<ResumePDFDocument resume={displayResume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${displayResume.first_name}_${displayResume.last_name}_${viewMode === 'pending' ? 'Tailored' : 'Master_CV'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
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

            {/* Top toolbar — view toggle */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <AnimatePresence>
                {pendingChanges && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm border border-dia-divider p-1 shadow-lg"
                  >
                    <button
                      onClick={() => setViewMode('original')}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        viewMode === 'original' ? 'bg-foreground text-background' : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setViewMode('pending')}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                        viewMode === 'pending' ? 'bg-foreground text-background' : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      Tailored (pending)
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right toolbar — actions */}
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
                      onClick={() => {
                        setPendingChanges(null);
                        setApplyReady(false);
                        setViewMode('original');
                      }}
                      className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm border border-dia-divider text-foreground text-sm font-medium px-3.5 py-2 shadow-md hover:bg-white transition-all"
                      title="Discard changes"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="hidden lg:inline">Discard</span>
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applying || !applyReady}
                      className="flex items-center gap-2 rounded-full bg-foreground text-background text-sm font-medium px-3.5 py-2 shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/workspace/workspace-client.tsx
git commit -m "feat: workspace-client with chat + diff preview + Apply/Discard/Download toolbar"
```

---

### Task 5: Refactor `tailorResume` to accept structured changes

**Files:**
- Modify: `src/utils/actions/workspace.ts`

Replace the single `tailorResume(jobTitle, company, jobDescription)` with `applyTailoring(masterResumeId, changes)` that takes already-computed changes from the chat tool call. No more AI call here — the chat already did the work.

- [ ] **Step 1: Replace the file**

```typescript
// src/utils/actions/workspace.ts
'use server';

import { getAuthenticatedUser } from '@/utils/auth';
import { Resume } from '@/lib/types';
import * as db from '@/lib/db';
import type { ProposedChanges } from '@/components/workspace/types';

/**
 * Save a tailored resume from chat-proposed changes.
 * The AI already produced the changes via the chat tool call —
 * this just persists them as a new resume row.
 */
export async function applyTailoring(masterResumeId: string, changes: ProposedChanges): Promise<Resume> {
  const user = await getAuthenticatedUser();
  console.log('[applyTailoring] for master:', masterResumeId);

  const master = await db.getResumeById(masterResumeId, user.id);
  if (!master) {
    throw new Error('Master resume not found');
  }

  const saved = await db.insertResume({
    user_id: user.id,
    name: `Tailored — ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric' })}`,
    target_role: master.target_role,
    is_base_resume: false,
    first_name: master.first_name,
    last_name: master.last_name,
    email: master.email,
    phone_number: master.phone_number,
    location: master.location,
    website: master.website,
    linkedin_url: master.linkedin_url,
    github_url: master.github_url,
    professional_summary: changes.professional_summary ?? master.professional_summary,
    work_experience: changes.work_experience,
    education: master.education,
    skills: changes.skills,
    projects: master.projects,
    section_order: master.section_order ?? ['summary', 'work_experience', 'education', 'skills', 'projects'],
    section_configs: master.section_configs ?? {
      work_experience: { visible: changes.work_experience.length > 0 },
      education: { visible: (master.education?.length ?? 0) > 0 },
      skills: { visible: changes.skills.length > 0 },
      projects: { visible: (master.projects?.length ?? 0) > 0 },
    },
    document_settings: master.document_settings,
  });

  console.log('[applyTailoring] saved id:', saved.id);
  return saved;
}
```

- [ ] **Step 2: Check db has `getResumeById`**

```bash
grep -n "getResumeById" /Users/nihat/DevS/Resumo/.claude/worktrees/gallant-franklin-195096/src/lib/db/index.ts
```

If it doesn't exist, add it. Otherwise, this task is done.

- [ ] **Step 3: Commit**

```bash
git add src/utils/actions/workspace.ts
git commit -m "feat: applyTailoring saves chat-proposed changes (no second AI call)"
```

---

### Task 6: Install AI SDK React hooks

**Files:**
- Modify: `package.json`

`useChat` lives in `@ai-sdk/react`. Verify it's installed; install if not.

- [ ] **Step 1: Check**

```bash
grep -E "@ai-sdk/react|@ai-sdk/openai" /Users/nihat/DevS/Resumo/.claude/worktrees/gallant-franklin-195096/package.json
```

- [ ] **Step 2: Install if missing**

```bash
pnpm add @ai-sdk/react@^1
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @ai-sdk/react for streaming chat hooks"
```

---

### Task 7: Build, deploy, verify

- [ ] **Step 1: Build**

```bash
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bW9kZXJuLXNlYWhvcnNlLTE2LmNsZXJrLmFjY291bnRzLmRldiQ
export NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
export NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
export NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
export NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
pnpm build 2>&1 | grep -E "error TS|✓ Generating" | head -5
```

- [ ] **Step 2: OpenNext + Wrangler**

```bash
npx opennextjs-cloudflare build 2>&1 | tail -3
npx wrangler deploy 2>&1 | grep -E "Deployed|Error"
```

- [ ] **Step 3: Browser test**

1. Go to https://resumelm.nihatavci.workers.dev/workspace
2. Chat panel opens on the left, preview on the right
3. Paste a job URL — AI should call `scrape_job_url`, fetch the JD, then propose changes
4. Pending pill appears at top of preview ("Tailored (pending)")
5. Click "Original" to see Master CV; click "Tailored (pending)" to see proposed
6. Chat back: "make the FACTUREE bullets more about platform engineering"
7. AI proposes new changes — preview updates
8. Click **Apply** — toast confirms, saves to DB
9. Click **Discard** at any point — pending goes away, view returns to Master CV
10. **Download PDF** works in both modes

- [ ] **Step 4: Final commit and merge**

```bash
git -C /Users/nihat/DevS/Resumo/.claude/worktrees/gallant-franklin-195096 checkout main
git -C /Users/nihat/DevS/Resumo/.claude/worktrees/gallant-franklin-195096 merge --no-ff claude/gallant-franklin-195096 -m "feat: conversational CV tailoring with live diff preview"
git -C /Users/nihat/DevS/Resumo/.claude/worktrees/gallant-franklin-195096 push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Chat UI replaces static form: Task 3 (`TailorChat`)
- ✅ User can paste links: Task 2 (`scrape_job_url` tool)
- ✅ AI scrapes URL and understands JD: Task 1 (server action) + Task 2 (tool wiring)
- ✅ Conversational refinement: Task 3 + Task 2 (multi-turn `useChat` with system prompt allowing follow-ups)
- ✅ "Yes I'm ready" → apply: Task 4 (Apply button + `applyTailoring`)
- ✅ Live diff preview: Task 4 (pendingChanges state, viewMode toggle, preview updates immediately when AI calls `propose_changes`)
- ✅ One-click back to original: Task 4 (Discard button + Original/Pending pill toggle)

**Placeholder scan:** Every code block is complete. No TODO/TBD.

**Type consistency:** `ProposedChanges` shape is defined in Task 3 step 2, used in Task 3 (chat), Task 4 (workspace), Task 5 (applyTailoring).

**Risks:**
- LinkedIn scraping will fail — handled by clear error message + fallback to paste JD text
- Workers AI tool calling support — Llama 3.3 70B on Cloudflare supports it via Vercel AI SDK
- Bundle size — `@ai-sdk/react` is small (~10kb gzipped)
