# Job Intelligence Design

**Goal:** Upgrade Resumo's tailor-chat from single-pass JD analysis to a three-layer intelligence system: persistent memory points, on-demand company research, and deep JD analysis with proactive suggestions.

**Architecture:** Three independent subsystems layered onto the existing tailor-chat flow. Memory points use the established `:::fence` pattern. Company research is a new server endpoint. Deep JD analysis is a system prompt upgrade with a new `:::match` fence type. No new database tables required.

**Tech Stack:** Next.js 15 App Router, Cloudflare Workers, Workers AI (Llama 3.3 70B), Jina.ai reader for scraping, existing `chat-message-parser.ts` fence pattern.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/workspace/chat-message-parser.ts` | Add `:::memory` and `:::match` fence parsing |
| `src/components/workspace/types.ts` | Add `MemoryPoint` type, extend `MessageSegment` |
| `src/components/workspace/tailor-chat.tsx` | Memory rail UI, research button, match card, company intel card |
| `src/app/api/tailor-chat/route.ts` | Enhanced system prompt: deep JD analysis + memory emission |
| `src/app/api/tailor-generate/route.ts` | Accept `memoryPoints[]` in request body, pass to prompt |
| `src/app/api/tailor-research/route.ts` | **NEW** — parallel scrape Kununu + website + LinkedIn |

---

## Subsystem 1: Memory Points

### AI Output Format

Whenever the AI decides or agrees on something, it emits a `:::memory` fence block at the end of its reply. One short decision label per line (max 6 words):

```
:::memory
Emphasise HubSpot CRM automation
Move KPI bullet first at Quandoo
Flag German language gap
:::
```

### Parsing (`chat-message-parser.ts`)

New segment type `'memory'` added alongside `'text'` and `'ats'`. Regex `/:::memory\n([\s\S]*?)\n:::/g` — same pattern as `:::ats`.

Each `:::memory` block's content is split by newline into individual `MemoryPoint` strings. The client **accumulates** points across all messages and deduplicates by normalised label text (lowercased, trimmed).

```typescript
export type MemoryPoint = string; // short decision label
export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'ats'; content: string }
  | { type: 'memory'; points: MemoryPoint[] }
  | { type: 'match'; content: string };
```

### UI — Memory Rail

Position: pinned between the "Tailor with AI" header and the message scroll area.

- Hidden when `memoryPoints.length === 0`
- Horizontal scrollable flex row of pill chips
- Each chip: small coloured dot + label text + `×` dismiss button
  - Violet dot = plan/action point
  - Amber dot = gap/warning point (label starts with "Flag" or "Gap" or "⚠")
- Dismissing a chip removes it from local state
- `memoryPoints[]` serialised and sent as part of the `/api/tailor-generate` POST body

### Generate Integration (`tailor-generate/route.ts`)

Request body gains optional `memoryPoints: string[]`. System prompt appended:

```
AGREED DECISIONS FROM CHAT (apply these specifically):
- Emphasise HubSpot CRM automation
- Move KPI bullet first at Quandoo
- Flag German language gap
```

---

## Subsystem 2: On-Demand Company Research

### Trigger

After any assistant message that contains a `📋 Role:` line (first JD analysis), the chat UI renders a `"🔍 Research company"` button below that bubble. Clicking it:
1. Sets a `researching` boolean state → button shows spinner + "Researching…"
2. POSTs to `/api/tailor-research` with `{ companyName, jobTitle, messages }`
3. On success, appends a special `'company-intel'` message to the local message list
4. On failure, shows a small inline error toast — non-blocking

### Endpoint (`tailor-research/route.ts`)

Extracts company name from the latest assistant message (regex on `📋 Role:` line). Scrapes three sources **in parallel** via `Promise.allSettled`:

| Source | URL pattern | Via |
|--------|-------------|-----|
| Kununu | `https://r.jina.ai/https://www.kununu.com/de/{slug}` | Jina reader |
| Company website | `https://r.jina.ai/{homepage}/about` | Jina reader |
| LinkedIn company | `https://r.jina.ai/https://www.linkedin.com/company/{slug}` | Jina reader |

Slugs are derived from company name: lowercase, spaces → hyphens, strip GmbH/AG/Ltd/Inc.

A second AI call (`generateText`, max 300 tokens) synthesises the raw scraped text into three structured fields:
- `culture` — 1–2 sentences on values/tone
- `employerRep` — Kununu score (if found) + 1–2 key review quotes
- `hiringSignals` — what they seem to prioritise in new hires

Returns `{ ok: true, culture, employerRep, hiringSignals }` or `{ ok: false, error }`.

Partial results are fine — if Kununu fails, still return website + LinkedIn.

### UI — Company Intel Card

Rendered as a distinct assistant-side bubble (not a normal `MessageBubble`) with a `🏢` header. Three rows:
- 🏢 **Culture** — culture text
- ⭐ **Employer rep** — employerRep text
- 💡 **What they value** — hiringSignals text

The company intel text is injected into the *next* user message sent to `/api/tailor-chat` as a hidden prefix (same server-side injection pattern as URL scraping): `[Company intel: ...]`. This way the AI can factor it into follow-up suggestions without the user re-pasting it.

---

## Subsystem 3: Deep JD Analysis + Proactive Suggestions

### Enhanced System Prompt

The first-analysis structure becomes:

**Part 1 — Structured extraction** (existing emoji row format, two new rows):
```
📋 Role: [company + title in ≤10 words]
🎯 Required: [comma-separated required skills from JD]
💼 Nice-to-have: [comma-separated preferred skills]
🌍 Culture signals: [3–4 keywords extracted from JD tone/values]
⚠️ Red flags: [hard requirements the candidate may not meet — omit if none]
```

New emojis `💼` and `🌍` added to `ANALYSIS_PREFIXES` in `chat-message-parser.ts` and `getRowStyle()` in `tailor-chat.tsx`.

**Part 2 — Match map** (`:::match` fence, emitted immediately after the emoji rows):
```
:::match
✅ Data-driven marketing | 11 yrs experience, PMAX campaigns at Quandoo
✅ Google Analytics | Listed in skills and referenced in FACTUREE bullet
⚡ Full-funnel strategy | Partially — have top/bottom, no explicit mid-funnel work
❌ German fluency | Not in CV — genuine gap, worth addressing in cover letter
:::
```

Markers: `✅` = strong match, `⚡` = partial match, `❌` = gap. Only requirements from Part 1 appear here.

**Part 3 — Proactive suggestions** (normal prose after the fences, ≤4 lines):
- **Bullet rewrites**: 1–2 specific rephrasing examples. Format: *"At [Company], instead of '[original]' → '[rewrite]'"*. Rewrites only rephrase existing content — no new facts.
- **Gap alerts**: one sentence per ❌ item with actionable advice (cover letter, address in interview, etc.)

### Match Map UI (`:::match` fence rendering)

Parsed as `{ type: 'match'; content: string }` segment. Rendered as a clean two-column card:
- Left column: requirement label (stripped of ✅/⚡/❌ prefix)
- Right column: explanation text
- Row background: green-tint for ✅, amber-tint for ⚡, red-tint for ❌

### `:::match` Parsing

Same regex pattern as `:::ats` and `:::memory`. Content split by `\n`, each line parsed:
```typescript
function parseMatchLine(line: string): { marker: '✅'|'⚡'|'❌'; requirement: string; explanation: string } | null
```
Lines not matching the pattern are skipped.

---

## Data Flow Summary

```
1. User shares JD
   → server pre-scrapes URL (existing)
   → AI gets CV + JD text
   → AI returns: Part1 emoji rows + :::match + proactive suggestions + :::ats + :::memory
   → client: analysis card + match table + ats pills + memory rail updated

2. User clicks "Research company" (optional)
   → POST /api/tailor-research
   → parallel scrape Kununu + website + LinkedIn via Jina
   → AI synthesises → company intel card in chat
   → next user message gets company intel injected as hidden prefix

3. Conversation continues
   → each AI reply may emit new :::memory points
   → memory rail accumulates, user can dismiss chips

4. User clicks "Generate tailored CV"
   → POST /api/tailor-generate with { messages, masterResume, memoryPoints }
   → memory points injected as explicit instructions in generate prompt
   → structured tailored CV produced
```

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Company research all scrapers fail | Toast "Couldn't research this company — try pasting their About page" |
| Kununu not found (non-DACH company) | Skip gracefully, return website + LinkedIn only |
| `:::memory` fence malformed | Skip — accumulate nothing, do not crash parser |
| `:::match` fence malformed | Skip line — render valid lines only |
| `memoryPoints` empty at generate time | Generate proceeds without memory context |

---

## Out of Scope

- Persisting memory points to the database (this session stays in-memory)
- LinkedIn scraping requiring login (Jina returns what it can publicly)
- Cover letter generation (separate feature)
- Editing bullet rewrites inline in the chat
