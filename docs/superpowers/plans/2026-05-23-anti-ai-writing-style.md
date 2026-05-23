# Anti-AI Writing Style System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all AI-generated resume text pass mainstream AI detectors by injecting a comprehensive humanization prompt block into both generation routes — no extra API calls, no added latency.

**Architecture:** One new file `src/lib/ai/humanization.ts` exports `HUMANIZATION_INSTRUCTIONS` — a carefully engineered ~600-word prompt block. It is appended to the system prompt in `tailor-generate/route.ts` and to `ATS_WORK_PROMPT` in `onboarding-ats.ts`. The `ATS_WORK_PROMPT` also needs two contradictions fixed: banned verbs in its example list, and a "PARALLEL structure" rule that conflicts with our variation requirements.

**Tech Stack:** TypeScript, Node.js test runner (`node:test` + `node:assert/strict`), pnpm

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/ai/humanization.ts` | **CREATE** | Exports `HUMANIZATION_INSTRUCTIONS` constant — the full prompt block |
| `src/lib/ai/humanization.test.ts` | **CREATE** | Tests that the constant exists, is long enough, and contains key required content |
| `src/app/api/tailor-generate/route.ts` | **MODIFY** | Import + append `HUMANIZATION_INSTRUCTIONS` to `systemPrompt` |
| `src/utils/actions/onboarding-ats.ts` | **MODIFY** | Import + append to `ATS_WORK_PROMPT`; fix contradicting verbs and parallel-structure rule |

---

## Task 1: Create `humanization.ts` with full constant, tested

**Files:**
- Create: `src/lib/ai/humanization.ts`
- Create: `src/lib/ai/humanization.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/ai/humanization.test.ts`:

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HUMANIZATION_INSTRUCTIONS } from "./humanization";

describe("HUMANIZATION_INSTRUCTIONS", () => {
  it("is a non-empty string of substantial length", () => {
    assert.equal(typeof HUMANIZATION_INSTRUCTIONS, "string");
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.length > 500,
      `expected >500 chars, got ${HUMANIZATION_INSTRUCTIONS.length}`,
    );
  });

  it("contains the writing voice section header", () => {
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("WRITING STYLE — HUMAN, NOT AI"),
      "missing writing voice header",
    );
  });

  it("contains all critical banned verbs", () => {
    const required = [
      "leveraged",
      "spearheaded",
      "orchestrated",
      "utilized",
      "garnered",
      "fostered",
      "championed",
    ];
    for (const word of required) {
      assert.ok(
        HUMANIZATION_INSTRUCTIONS.includes(word),
        `missing banned verb: ${word}`,
      );
    }
  });

  it("contains key banned phrases", () => {
    const required = [
      "cross-functional teams",
      "results-driven",
      "proven track record",
      "synergy",
      "thought leader",
    ];
    for (const phrase of required) {
      assert.ok(
        HUMANIZATION_INSTRUCTIONS.includes(phrase),
        `missing banned phrase: ${phrase}`,
      );
    }
  });

  it("contains structural variation section", () => {
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("STRUCTURAL VARIATION"),
      "missing structural variation section",
    );
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("BULLET LENGTH"),
      "missing bullet length rule",
    );
  });

  it("contains professional summary rules", () => {
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("PROFESSIONAL SUMMARY"),
      "missing professional summary rules",
    );
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm test 2>&1 | grep -A3 "humanization"
```

Expected: `ReferenceError` or `Cannot find module './humanization'` — the file doesn't exist yet.

- [ ] **Step 3: Create `src/lib/ai/humanization.ts` with the full constant**

```typescript
/**
 * HUMANIZATION_INSTRUCTIONS
 *
 * Prompt block injected into all AI resume generation system prompts.
 * Prevents AI-signature vocabulary and structural patterns that trigger
 * detectors like GPTZero, Originality.ai, Copyleaks, and ZeroGPT.
 *
 * Covers two mechanisms:
 *   A) Forbidden vocabulary — words/phrases AI statistically overuses
 *   B) Structural variation — boosting perplexity and sentence-length burstiness
 */
export const HUMANIZATION_INSTRUCTIONS = `
WRITING STYLE — HUMAN, NOT AI:
Write the way a sharp professional actually writes — direct, specific, slightly varied in rhythm.
Do NOT write the way AI writes: perfectly parallel, uniformly long, corporate-jargon-heavy.
A recruiter reading this should feel they are reading something written by the candidate, not generated.

---

FORBIDDEN VERBS — never use these; use the replacement instead:

- leveraged / leverage → used, applied, relied on
- spearheaded → launched, led, kicked off, drove
- orchestrated → coordinated, organized, ran, managed
- streamlined (vague) → cut, simplified, reduced, sped up
- facilitated → ran, set up, organized, helped
- championed → pushed for, led, advocated for
- fostered → built, grew, developed
- cultivated → built, developed, grew
- harnessed → used, applied
- garnered → got, earned, won, attracted
- utilized → used
- demonstrated → showed, proved
- showcased → showed, highlighted
- revolutionized → changed, rebuilt (only if literally true)
- empowered → gave X the ability to, let X, enabled X to
- envisioned → planned, designed, defined
- ideated → designed, brainstormed
- disruptive / disrupted → changed (and say specifically how)
- executed (generic) → ran, completed, delivered
- ensured → made sure, verified, confirmed

---

FORBIDDEN PHRASES — never use these; follow the guidance instead:

- results-driven / results-oriented → omit; the bullets themselves prove it
- proven track record → omit; that is what the bullets are
- dynamic environment / fast-paced environment → omit entirely
- cross-functional teams → name the actual functions: "design, engineering, and sales" or "product and finance"
- best practices → name the specific practices, not the phrase
- innovative solutions / innovative approach → describe the actual innovation
- cutting-edge / state-of-the-art → name the specific technology
- seamless (vague adjective) → omit or say what makes it reliable
- transformative → omit; describe what specifically changed
- world-class → never
- comprehensive (padding) → omit; use a number or specific detail
- robust (padding) → omit; describe what makes it reliable
- end-to-end (vague) → name the specific stages
- paradigm shift → never
- synergy / synergistic → never
- thought leader → never
- value-add / value proposition → describe the specific value in plain terms
- mission-critical → describe the actual stakes instead
- client-centric / customer-centric → "focused on users", "built around customer needs"
- detail-oriented → never; prove it through specific examples
- self-starter → never
- team player → never
- proactive → describe the proactive action directly
- "not only X but also Y" → just write "X and Y"
- "in order to" → "to"
- "as well as" → "and"
- "in addition to" → "and" or restructure the sentence
- "throughout my career" → use a specific timeframe instead
- "I am passionate about" → never
- "I thrive in" → never
- "dedicated to" (as opener) → show the dedication through a specific action
- "wear many hats" → never
- "move the needle" → never
- "deep dive" → "analyzed", "investigated", "examined in detail"
- "bandwidth" (capacity metaphor) → "time", "capacity", "headcount"
- "scalable solution" → name the actual system or approach

---

FORBIDDEN QUALIFIERS — padding words that AI overuses:

- various → use a specific number or name them
- numerous → use a specific number
- multiple (as filler) → use a specific number or name them
- key (standalone filler: "key metrics") → omit "key", just say "metrics"
- critical / crucial (overused) → omit, or describe why it actually matters
- highly / extremely (vague intensifiers) → omit; use a specific metric
- significantly (without a number following) → omit; add the number
- successfully → omit (implied by the result)
- effectively → omit (implied by the result)
- wide range of / vast array of / myriad of / plethora of → use a number
- unique → only if you can prove it; otherwise omit
- truly / really / absolutely → never in professional writing

---

STRUCTURAL VARIATION — required for natural-sounding text:

1. BULLET LENGTH: Include a mix of short bullets (8–12 words) and longer ones (16–22 words)
   in each work section. Never make every bullet the same length.

2. STRUCTURAL MIX: Not every bullet follows [Verb + Object + Metric + Context].
   Also use these patterns (aim for at least 1–2 per section):
   - Pure result first: "Cut deployment time from 3 days to 4 hours using X"
   - Context-then-result: "After migrating to microservices, reduced API latency by 40%"
   - Short punchy statement: "Shipped the MVP in 6 weeks."
   - Two-part joined: "Rebuilt the data pipeline and reduced monthly costs by €12K"

3. VERB VARIETY: Do not use the same verb more than twice in a single work section.
   Mix verb categories:
   - Creation: built, wrote, shipped, developed, designed, created
   - Movement: drove, grew, pushed, scaled, expanded
   - Reduction/fix: cut, reduced, eliminated, fixed, removed
   - Communication: convinced, negotiated, presented, aligned
   - Analysis: analyzed, identified, mapped, measured

4. NO SERIAL-COMMA VERB PADDING: Avoid "Built, tested, and deployed X" as a way
   to fill a bullet. Say what matters most, not everything that happened.

5. PROFESSIONAL SUMMARY:
   - First sentence must NOT begin with "Experienced [title] with X years of..."
   - Must include at least one sentence under 12 words.
   - Must reference at least one specific number or named technology.
   - Final sentence must NOT be a generic aspiration such as "looking forward to contributing to..."
   - Vary sentence length throughout — do not write uniform medium-length sentences.
`.trim();
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
pnpm test 2>&1 | grep -A10 "humanization"
```

Expected output (all passing):
```
▶ HUMANIZATION_INSTRUCTIONS
  ✓ is a non-empty string of substantial length
  ✓ contains the writing voice section header
  ✓ contains all critical banned verbs
  ✓ contains key banned phrases
  ✓ contains structural variation section
  ✓ contains professional summary rules
▶ HUMANIZATION_INSTRUCTIONS (Xms)
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/humanization.ts src/lib/ai/humanization.test.ts
git commit -m "feat: add HUMANIZATION_INSTRUCTIONS prompt block for AI detection evasion"
```

---

## Task 2: Inject into `tailor-generate/route.ts`

**Files:**
- Modify: `src/app/api/tailor-generate/route.ts`

Context: The `systemPrompt` template literal is built inside the `POST` handler (around line 67). It ends with a conditional block for memory points followed by the closing backtick `` ` ``. We append `HUMANIZATION_INSTRUCTIONS` just before that closing backtick.

- [ ] **Step 1: Add the import at the top of the file**

In `src/app/api/tailor-generate/route.ts`, after the existing imports (currently line 6: `import type { Resume } from '@/lib/types';`), add:

```typescript
import { HUMANIZATION_INSTRUCTIONS } from '@/lib/ai/humanization';
```

So the import block becomes:

```typescript
import { generateObject, type Message, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import type { Resume } from '@/lib/types';
import { HUMANIZATION_INSTRUCTIONS } from '@/lib/ai/humanization';
```

- [ ] **Step 2: Append `HUMANIZATION_INSTRUCTIONS` to `systemPrompt`**

Find the end of the `systemPrompt` template literal. It currently ends with:

```typescript
${memoryPoints && memoryPoints.length > 0 ? `

AGREED DECISIONS FROM CHAT (apply these specifically when tailoring):
${memoryPoints.map((p) => `- ${p}`).join('\n')}` : ''}`;
```

Replace that closing section with:

```typescript
${memoryPoints && memoryPoints.length > 0 ? `

AGREED DECISIONS FROM CHAT (apply these specifically when tailoring):
${memoryPoints.map((p) => `- ${p}`).join('\n')}` : ''}

${HUMANIZATION_INSTRUCTIONS}`;
```

(Only the last two lines change: add a blank line and the `${HUMANIZATION_INSTRUCTIONS}` interpolation before the closing backtick.)

- [ ] **Step 3: Verify the build passes**

```bash
pnpm build 2>&1 | grep -E "error|Error|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/tailor-generate/route.ts
git commit -m "feat: inject HUMANIZATION_INSTRUCTIONS into tailor-generate system prompt"
```

---

## Task 3: Inject into `onboarding-ats.ts` and fix contradictions

**Files:**
- Modify: `src/utils/actions/onboarding-ats.ts`

Context: `ATS_WORK_PROMPT` (lines 33–52) has two contradictions with the humanization rules that must be fixed at the same time as injection:
1. **Line 37** lists "Spearheaded, Orchestrated" as example strong verbs — both are on the banned list.
2. **Line 41** says "PARALLEL structure — every bullet starts with an action verb" — this directly contradicts the structural variation rule requiring mixed sentence patterns.

- [ ] **Step 1: Add the import at the top of the file**

In `src/utils/actions/onboarding-ats.ts`, after the existing imports, add:

```typescript
import { HUMANIZATION_INSTRUCTIONS } from '@/lib/ai/humanization';
```

The import block should become:

```typescript
// src/utils/actions/onboarding-ats.ts
'use server';

import { z } from 'zod';
import { generateObject, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import { getAuthenticatedUser } from '@/utils/auth';
import type { WorkExperience, Skill } from '@/lib/types';
import { HUMANIZATION_INSTRUCTIONS } from '@/lib/ai/humanization';
```

- [ ] **Step 2: Fix the contradiction in ATS_WORK_PROMPT — banned verbs in example list**

Find this line in `ATS_WORK_PROMPT`:

```
2. LEAD with strong action verbs (Achieved, Led, Built, Designed, Reduced, Increased, Launched, Developed, Optimized, Managed, Spearheaded, Orchestrated).
```

Replace it with (removes "Spearheaded, Orchestrated", adds "Drove, Shipped"):

```
2. LEAD with strong action verbs (Achieved, Led, Built, Designed, Reduced, Increased, Launched, Developed, Drove, Managed, Shipped, Grew).
```

- [ ] **Step 3: Fix the contradiction — rigid parallel structure rule**

Find this line in `ATS_WORK_PROMPT`:

```
6. PARALLEL structure — every bullet starts with an action verb in past tense (or present tense for current role).
```

Replace it with:

```
6. VARIED structure — most bullets start with an action verb, but vary the pattern: some lead with the result, some use a two-part structure. See writing style rules below.
```

- [ ] **Step 4: Append `HUMANIZATION_INSTRUCTIONS` to `ATS_WORK_PROMPT`**

The constant currently ends with:

```typescript
Keep company/position/date/location identical. Only the description bullets get rewritten.`;
```

Replace the closing of the template literal with:

```typescript
Keep company/position/date/location identical. Only the description bullets get rewritten.

${HUMANIZATION_INSTRUCTIONS}`;
```

After all three edits, the full `ATS_WORK_PROMPT` constant should look like:

```typescript
const ATS_WORK_PROMPT = `You are an ATS resume specialist. Rewrite the candidate's work experience bullets to be ATS-optimized for the given target role.

CRITICAL ATS RULES:
1. PRESERVE ALL FACTS — numbers, percentages, dollar amounts, dates, company names, achievements. NEVER invent or inflate.
2. LEAD with strong action verbs (Achieved, Led, Built, Designed, Reduced, Increased, Launched, Developed, Drove, Managed, Shipped, Grew).
3. QUANTIFY where possible (use the candidate's original numbers — do NOT make up new ones).
4. KEYWORD MATCH the target role — naturally incorporate relevant industry terms IF they correspond to what the candidate actually did.
5. CONCISE — one strong line per bullet (max ~25 words). Cut filler words.
6. VARIED structure — most bullets start with an action verb, but vary the pattern: some lead with the result, some use a two-part structure. See writing style rules below.
7. RESULT-ORIENTED — what was achieved, not just what was done.

DO NOT:
- Invent achievements or skills the candidate doesn't have
- Add metrics that weren't in the original
- Change job titles, companies, or dates
- Reword something that's already strong

INPUT: candidate's existing work experience.
OUTPUT: the same work experience entries with description bullets rewritten to ATS standards.
Keep company/position/date/location identical. Only the description bullets get rewritten.

${HUMANIZATION_INSTRUCTIONS}`;
```

- [ ] **Step 5: Verify the build passes**

```bash
pnpm build 2>&1 | grep -E "error|Error|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 6: Run all tests to confirm nothing regressed**

```bash
pnpm test 2>&1 | grep -E "✓|✗|pass|fail" | head -20
```

Expected: all tests passing, including the 6 new humanization tests.

- [ ] **Step 7: Commit**

```bash
git add src/utils/actions/onboarding-ats.ts
git commit -m "feat: inject HUMANIZATION_INSTRUCTIONS into onboarding ATS rewrite prompt"
```

---

## Task 4: Deploy and verify

**Files:** none (deploy only)

- [ ] **Step 1: Deploy to Cloudflare Workers**

```bash
npx wrangler deploy 2>&1 | grep -E "Deployed|Error"
```

Expected: `Deployed resumelm triggers`

- [ ] **Step 2: Manual smoke test — tailor-generate**

In the running app:
1. Open the workspace for any resume.
2. Paste a job description in the chat and send it.
3. Click **Generate tailored CV**.
4. Open the generated diff view.
5. Check the `professional_summary` and at least 3 bullets: none should contain "leveraged", "spearheaded", "orchestrated", "utilized", "cross-functional teams", "results-driven", or "proven track record".
6. Check bullet length variety: not all bullets should be the same length.

- [ ] **Step 3: Commit final state if any last-minute fixes were needed**

```bash
git status
# Only commit if there are actual changes
```
