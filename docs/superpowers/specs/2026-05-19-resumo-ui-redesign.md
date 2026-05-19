# Resumo UI Redesign — "Reshape" Approach

## Overview

Transform Resumo from a multi-user SaaS dashboard into an opinionated, linear resume-tailoring tool. Keep the working engine (PDF renderer, AI integration, editor forms), replace the shell (routing, layout, flows, animations).

## Product Model

### Three Concepts

1. **Memory** — Structured career data (experience, education, skills, projects, free-form notes). Single source of truth. Created through guided onboarding. Editable anytime.

2. **Master CV** — One canonical resume, the best possible version of the user's career. Always visible in the workspace. Generated from Memory during onboarding, manually editable after.

3. **Tailored CV** — Generated from Memory + Master CV + Job Description. User pastes a LinkedIn job URL, AI analyzes the role and tweaks the Master CV. Never fabricates — only reframes real experience. Saved with auto-cleanup (last N or time-based).

### Core Flow

```
Upload CV → Guided Questions (50-60, Typeform-style, coaching tone)
  → Memory Created → Master CV Generated
  → Workspace: Split View (Master CV | Job Tailoring)
  → Paste LinkedIn URL → AI Tailors → Download/Export
```

## Onboarding Flow

### Step 1: CV Upload
- Full-screen, centered. Single drop zone or file picker.
- AI parses the uploaded CV and pre-fills Memory fields.
- Framer Motion: fade-in, the document "dissolves" into structured data.

### Step 2: Guided Questionnaire (Typeform-style)
- 50-60 questions, one at a time, full-screen focus.
- Progress bar at top (thin spectrum gradient line).
- Questions flow: personal info → experience → education → skills → projects → goals → free-form.
- Coaching tone throughout: educates about ATS while extracting info.
  - Example: "Nice! Now let's make sure recruiters actually find you. Did you know 75% of CVs get filtered by ATS before a human sees them?"
- Input types: text, textarea, multiple choice, date pickers, tag inputs.
- AI pre-fills answers from the uploaded CV where possible — user confirms or edits.
- Framer Motion: slide transitions between questions, spring physics on inputs.
- Final question: "Anything else you want us to know?" (free-form textarea).

### Step 3: Memory + Master CV Generation
- "Building your profile..." animation.
- AI processes all answers into structured Memory.
- AI generates Master CV from Memory.
- Reveal: Master CV slides into view in the workspace.

## Workspace (Day-to-Day Screen)

### Layout: Split View
- **Left panel:** Master CV (always visible, editable)
- **Right panel:** Job tailoring zone
  - LinkedIn URL input at top
  - After URL paste: AI analyzes the job, shows key requirements
  - "Tailor" button generates the customized CV
  - Tailored CV appears, showing the transformation
- Resizable panels (reuse existing ResizablePanels component)
- Framer Motion: smooth panel transitions, CV content morphing

### Header
- Minimal: "Resumo" logo left, Memory access + settings right
- No model selector in header (move to settings, it's infrastructure not UX)
- No profile stats, no greeting, no banners

### Generated CVs
- Accessible via a subtle drawer/panel — "Recent" or "History"
- Auto-cleanup: keep last 20, or last 30 days
- Each entry: job title + company + date generated
- Click to re-open in split view

## Memory View

- Accessible from workspace header (icon or "Memory" link)
- Structured sections: Experience, Education, Skills, Projects, Notes
- Each section is a clean card with inline editing
- Can re-run the questionnaire to add more data
- Framer Motion: accordion expand/collapse, smooth inline edits

## Design System (Dia Browser Reference)

### Already Implemented
- Color tokens (canvas, fog, pebble, graphite, slate, etc.)
- DM Sans font at weights 300/400/500
- Frosted glass cards (white/90 + backdrop-blur)
- Shadow system (single 8px blur)
- Border radius tokens (30px cards, 16px nav, 12px buttons)

### Gaps to Close
- **Typography scale:** Not using the full Dia type scale. Need display (72px/300wt/-0.04em tracking) for onboarding headlines, heading-sm (22px) for section headers.
- **Letter spacing:** Missing negative tracking on large text.
- **Button radius:** DESIGN.md says 30px for filled buttons, we're using 12px. Need to match.
- **Animations:** Zero Framer Motion currently. Need spring transitions, page transitions, micro-interactions.
- **Spacing:** Not following 8px grid consistently. Need spacious density per Dia spec.
- **Hover states:** Buttons should go #D9D9D9 → #000000 bg + white text on hover (per Dia spec).

### New Components Needed
- Typeform-style question card (full-screen, centered, animated)
- Progress bar (thin spectrum gradient)
- CV upload drop zone
- LinkedIn URL input with job analysis preview
- Split-view workspace layout
- History drawer for generated CVs
- Memory section cards with inline editing

## Tech Stack Additions
- **framer-motion** — page transitions, layout animations, spring physics, gesture support
- Keep: Next.js 15, Tailwind CSS, Shadcn UI, React PDF, Cloudflare Workers AI

## Routing (Simplified)

```
/                → Onboarding (if no Memory) or Workspace (if Memory exists)
/onboarding      → CV upload → Questions → Memory/Master CV generation
/memory          → View/edit Memory sections
/history         → Browse generated CVs (could also be a drawer in workspace)
/settings        → App settings, model config
```

Current routes to remove/redirect:
- `/home` → redirect to `/`
- `/profile` → becomes `/memory`
- `/resumes` → removed (workspace replaces it)
- `/resumes/[id]` → kept for viewing specific generated CVs

## What We Keep (Engine)
- Resume PDF renderer (`react-pdf`)
- Resume editor forms (work experience, education, skills, projects, basic info)
- AI integration (Cloudflare Workers AI, chat API)
- Document settings form (font, margins, etc.)
- Shadcn UI component library
- Tailwind config with Dia tokens
- Authentication (Cloudflare Access)

## What We Remove
- Dashboard page (greeting, profile row, resume sections)
- API key alert banner
- Multiple base resume concept
- Profile page (replaced by Memory)
- Landing page components (already dead code)
- Complex resume management (create dialogs for base/tailored)
- Model selector in header

## Honesty Constraint
The AI tailoring must never:
- Invent experience, skills, or achievements
- Exaggerate metrics or responsibilities
- Add technologies the user hasn't used
- Fabricate education or certifications

It may:
- Reorder sections to match job priorities
- Rephrase descriptions using industry keywords from the JD
- Emphasize relevant experience, de-emphasize less relevant
- Adjust summary/objective to align with the role
- Use ATS-friendly formatting and keyword placement

## Phases (Suggested)

1. **Foundation** — Add framer-motion, update design tokens to full Dia spec, fix button/typography gaps
2. **Onboarding** — CV upload + Typeform questionnaire + Memory creation + Master CV generation
3. **Workspace** — Split-view with Master CV + LinkedIn URL tailoring
4. **Polish** — History drawer, Memory editing, animations, edge cases, cleanup dead code
