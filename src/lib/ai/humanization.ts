/**
 * HUMANIZATION_INSTRUCTIONS
 *
 * A prompt block injected into AI resume-writing calls to suppress AI-typical
 * writing patterns and produce output that reads as written by the candidate.
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

FORBIDDEN PHRASES — never use any of the following:

Corporate buzzwords:
- results-driven / results-oriented
- proven track record
- dynamic environment / fast-paced environment
- cross-functional teams → name the actual functions (e.g. "engineering and marketing")
- best practices → name the specific ones
- innovative solutions / innovative approach
- cutting-edge / state-of-the-art
- seamless (as vague adjective)
- transformative
- world-class
- comprehensive (as padding)
- robust (as padding)
- end-to-end (vague)
- paradigm shift
- synergy / synergistic
- thought leader
- value-add / value proposition
- mission-critical
- client-centric / customer-centric

Generic filler traits:
- detail-oriented
- self-starter
- team player
- proactive (as vague word — only use if showing specific example)

Sentence-padding constructions:
- "not only X but also Y"
- "in order to"
- "as well as"
- "in addition to"
- "throughout my career"
- "I am passionate about"
- "I thrive in"
- "dedicated to" (as opener)

Overused metaphors and jargon:
- "wear many hats"
- "move the needle"
- "deep dive"
- "bandwidth" (used as capacity metaphor)
- "scalable solution"

---

FORBIDDEN QUALIFIERS — cut or replace:

- various, numerous, multiple (as filler — use specific counts instead)
- key (standalone filler), critical/crucial (overused)
- highly/extremely (vague), significantly (without an attached number)
- successfully, effectively (add no meaning)
- wide range of / vast array of / myriad of / plethora of
- unique (unless provable), truly/really/absolutely

---

STRUCTURAL VARIATION:

BULLET LENGTH:
Mix short bullets (8–12 words) with longer ones (16–22 words). Never make all bullets the same length.
Uniform bullet length is the single strongest AI signal. Break it intentionally.

Pattern mixing — rotate among:
1. Pure result first: "Cut deploy time 40% by switching to containerized builds."
2. Context-then-result: "After scaling to 500k users, rebuilt the queue layer to handle 3× peak load."
3. Short punchy: "Shipped the redesigned onboarding flow in two sprints."
4. Two-part joined: "Designed the API schema; the mobile team adopted it without changes."

VERB VARIETY:
No single verb used more than twice per section.
Rotate across categories: creation (built, wrote, designed), movement (shipped, launched, rolled out),
reduction (cut, removed, eliminated), communication (presented, wrote, explained), analysis (measured, identified, mapped).

Serial-comma verb padding rule:
Do NOT write "Built, tested, and deployed X." Pick one primary action.

---

PROFESSIONAL SUMMARY rules:

- Do NOT open with "Experienced [title] with [N] years of experience."
- First sentence: under 12 words, punchy, role-specific.
- Include at least one specific number or technology in the body.
- Final sentence: not a generic aspiration ("seeking a role where..."). Make it a concrete differentiator.
- Vary sentence length — short sentence, medium sentence, short sentence is a good pattern.
- Write in first person implied (no "I"), not third person ("John is a...").
`.trim();
