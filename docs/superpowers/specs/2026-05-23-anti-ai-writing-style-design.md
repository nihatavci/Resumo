# Anti-AI Writing Style System — Design Spec

**Date:** 2026-05-23  
**Status:** Approved for implementation  
**Goal:** Make all AI-generated resume text pass mainstream AI detectors (GPTZero, Originality.ai, Copyleaks, ZeroGPT) at the prompt level — no extra API calls, no added latency.

---

## Problem

Resumo generates resume text using AI. AI detectors identify AI-written text through two mechanisms:
1. **Flagged vocabulary** — a well-known set of words and phrases that AI models statistically overuse ("leveraged", "spearheaded", "cross-functional teams", etc.)
2. **Low perplexity + low burstiness** — AI chooses predictable words and produces uniformly-structured sentences. Detectors measure both.

Currently, both `tailor-generate` and `onboarding-ats` produce text with high concentrations of flagged vocabulary and uniform sentence structure.

---

## Solution

A single new file: **`src/lib/ai/humanization.ts`**

Exports one constant: `HUMANIZATION_INSTRUCTIONS` — a carefully engineered prompt block (~600 words) that:
1. **Bans high-signal AI vocabulary** with direct replacement guidance (Part A)
2. **Mandates structural variation** to boost perplexity and burstiness (Part C)

This block is appended to the system prompt in two generation routes:
- `src/app/api/tailor-generate/route.ts`
- `src/utils/actions/onboarding-ats.ts` (the `ATS_WORK_PROMPT` constant)

No new API calls. No new UI. No new components.

---

## `HUMANIZATION_INSTRUCTIONS` — Full Content Specification

The constant must contain exactly the following sections in order:

### Section 1: Writing Voice

```
WRITING STYLE — HUMAN, NOT AI:
Write the way a sharp professional actually writes — direct, specific, slightly varied in rhythm.
Do NOT write the way AI writes: perfectly parallel, uniformly long, corporate-jargon-heavy.
A recruiter reading this should feel they are reading something written by the candidate, not generated.
```

### Section 2: Forbidden Vocabulary (Comprehensive)

The following categories must all be present and non-negotiable:

**Forbidden verbs and their required replacements:**

| Banned | Replace with |
|--------|-------------|
| leveraged / leverage | used, applied, relied on |
| spearheaded | launched, led, kicked off, drove |
| orchestrated | coordinated, organized, ran, managed |
| streamlined (as a vague verb) | cut, simplified, reduced, sped up |
| facilitated | ran, set up, organized, helped |
| championed | pushed for, led, advocated for |
| fostered | built, grew, developed |
| cultivated | built, developed, grew |
| harnessed | used, applied |
| garnered | got, earned, won, attracted |
| utilized | used |
| demonstrated | showed, proved |
| showcased | showed, highlighted |
| revolutionized | changed, rebuilt, transformed (only if true) |
| empowered | gave X the ability to, let X, enabled X to |
| envisioned | planned, designed, defined |
| ideated | designed, brainstormed |
| disruptive / disrupted | changed (and say how) |
| executed (generic) | ran, completed, delivered |
| ensured | made sure, verified, confirmed |

**Forbidden phrases:**

- results-driven / results-oriented → omit; let the bullets prove it
- proven track record → omit; the bullets are the track record
- dynamic environment / fast-paced environment → omit entirely
- cross-functional teams → name the functions: "design, engineering, and sales" or "product and finance"
- best practices → name the specific practices
- innovative solutions / innovative approach → describe the actual innovation
- cutting-edge / state-of-the-art → name the specific technology
- seamless (as a vague adjective) → omit or describe what makes it work well
- transformative → omit; describe what changed
- world-class → never use
- comprehensive (as padding) → omit; use a number or be specific
- robust (as padding) → omit; describe what makes it reliable
- end-to-end (as vague padding) → name the specific stages
- paradigm shift → never use
- synergy / synergistic → never use
- thought leader → never use
- value-add / value proposition → describe the specific value
- mission-critical → describe the actual stakes
- client-centric / customer-centric → "focused on users", "built around customer needs"
- detail-oriented → never (prove it through specific examples)
- self-starter → never
- team player → never
- proactive → describe the proactive action directly
- "not only X but also Y" → just say both: "X and Y"
- "in order to" → "to"
- "as well as" → "and"
- "in addition to" → just use "and" or restructure
- "throughout my career" → use a specific timeframe
- "I am passionate about" → never
- "I thrive in" → never
- "dedicated to" (as opener) → describe the dedication through a specific action
- "wear many hats" → never
- "move the needle" → never
- "deep dive" → "analyzed", "investigated", "examined in detail"
- "bandwidth" (as capacity metaphor) → "time", "capacity", "headcount"
- "scalable solution" → name the actual system or approach

**Forbidden qualifiers (padding words):**

- various → use a number or name them
- numerous → use a number
- multiple (as filler) → use a number or name them
- key (standalone filler before a noun: "key metrics") → omit "key", just say "metrics"
- critical / crucial (overused) → omit or describe why it matters
- highly / extremely (as vague intensifiers) → omit; use a specific metric
- significantly (without a number) → omit; add the number
- successfully → omit (implied by the result)
- effectively → omit (implied by the result)
- wide range of / vast array of / myriad of / plethora of → use a number
- unique → only use if you can prove it; otherwise omit
- truly / really / absolutely → never in professional writing

### Section 3: Structural Variation Rules

```
STRUCTURAL VARIATION — required for natural-sounding text:

1. BULLET LENGTH: Include a mix of short bullets (8–12 words) and longer ones (16–22 words) 
   in each work section. Never make every bullet the same length.

2. STRUCTURAL MIX: Not every bullet follows [Verb + Object + Metric + Context].
   Also use these patterns (at least 1–2 per section):
   - Pure result first: "Cut deployment time from 3 days to 4 hours using X"
   - Context-then-result: "After migrating to microservices, reduced API latency by 40%"
   - Short punchy statement: "Shipped the MVP in 6 weeks."
   - Two-part: "Rebuilt the data pipeline and reduced monthly costs by €12K"

3. VERB VARIETY: Do not use the same verb more than twice in a single work section.
   Mix categories:
   - Creation: built, wrote, shipped, developed, designed, created
   - Movement: drove, grew, pushed, scaled, expanded
   - Reduction/fix: cut, reduced, eliminated, fixed, removed
   - Communication: convinced, negotiated, presented, aligned
   - Analysis: analyzed, identified, mapped, measured

4. NO SERIAL-COMMA VERB PADDING: Avoid "Built, tested, and deployed X" as a way 
   to pad a bullet. Say what matters most.

5. PROFESSIONAL SUMMARY:
   - First sentence must NOT begin with "Experienced [title] with X years of..."
   - Must include at least one sentence under 12 words.
   - Must reference at least one specific number or named technology.
   - Final sentence must NOT be a generic aspiration ("looking forward to contributing to...").
   - Vary sentence length — short, longer, short or longer, short, longer. Not uniform.
```

---

## Injection Points

### `tailor-generate/route.ts`

Append `HUMANIZATION_INSTRUCTIONS` at the end of `systemPrompt`, before the closing backtick:

```typescript
import { HUMANIZATION_INSTRUCTIONS } from '@/lib/ai/humanization';

// In systemPrompt construction:
const systemPrompt = `...existing content...

${HUMANIZATION_INSTRUCTIONS}`;
```

### `onboarding-ats.ts`

Append `HUMANIZATION_INSTRUCTIONS` at the end of the `ATS_WORK_PROMPT` string constant:

```typescript
import { HUMANIZATION_INSTRUCTIONS } from '@/lib/ai/humanization';

const ATS_WORK_PROMPT = `...existing content...

${HUMANIZATION_INSTRUCTIONS}`;
```

The `ATS_SKILLS_PROMPT` does not need humanization — skill category names are not prose and not what detectors flag.

---

## File Structure

```
src/lib/ai/
├── humanization.ts        ← NEW: exports HUMANIZATION_INSTRUCTIONS
├── task-models.test.ts    ← existing, unchanged
└── usage-ledger.ts        ← existing, unchanged
```

---

## What This Covers / What It Doesn't

**Covered:**
- Tailored professional summaries (via `tailor-generate`)
- Tailored work experience bullets (via `tailor-generate`)
- Onboarding-generated bullet rewrites (via `onboarding-ats`)
- All vocabulary patterns that GPTZero, Originality.ai, Copyleaks, and ZeroGPT flag

**Not covered:**
- User-typed content (not needed — it's already human)
- Skill lists (not prose, not flagged)
- Chat responses in `tailor-chat` (not end up in the PDF)
- B-layer style mimicry from the user's own CV (deliberately excluded for simplicity; can be added later)

---

## Success Criteria

After implementation:
1. The `HUMANIZATION_INSTRUCTIONS` constant contains all banned words/phrases and all structural variation rules listed above.
2. Both `tailor-generate` and `onboarding-ats` import and inject the constant.
3. Build passes cleanly (`pnpm build`).
4. Generated resumes no longer contain vocabulary from the banned list.
