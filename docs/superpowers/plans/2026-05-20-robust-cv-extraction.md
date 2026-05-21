# Robust CV Extraction → ATS-Optimized Master CV

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Three-stage pipeline:
1. **Parse** — PDF → raw text (deterministic, layout-preserving)
2. **Understand** — AI extracts EVERY detail (contact, all jobs, all education, all skills, all projects) via section-by-section parallel calls
3. **Optimize** — AI rewrites the Master CV using ATS science: strong action verbs, quantified achievements, ATS-friendly structure, keyword density for target role

**ATS Science Applied:**
- Standard section headings (Work Experience, Education, Skills, Projects — reverse-chronological)
- Strong action verbs (Achieved, Led, Built, Reduced, Increased)
- Quantified impact (preserve original numbers; never invent)
- Keyword density matched to target role
- No tables/columns/icons (plain semantic structure)
- Clear date format
- Skills grouped by category with industry-standard naming

**Architecture file map:**
- `cv-upload.tsx` → better PDF parsing (font fix + layout)
- NEW `onboarding-extract.ts` → 5 parallel AI calls (contact / work / edu / skills / projects)
- NEW `onboarding-ats.ts` → ATS optimization pass on extracted data
- `onboarding.ts` → orchestrate: extract → optimize → save
- `cv-review-form.tsx` → expanded with editable work/edu cards
- `onboarding-flow.tsx` → diagnostic logging + forward edits
- `generating-screen.tsx` → progress states

---

### Task 1: PDF parser — font stability + column detection
**File:** `src/components/onboarding/cv-upload.tsx` — `extractTextFromPDF`
Fixes "AVCI → Avc1" via `disableFontFace + useSystemFonts`. Detects 2-column layouts.

### Task 2: Section-by-section AI extraction
**File:** NEW `src/utils/actions/onboarding-extract.ts`
5 parallel `generateObject` calls (contact / work / edu / skills / projects) via `Promise.allSettled`. One failure doesn't kill the rest.

### Task 3: ATS optimization pass
**File:** NEW `src/utils/actions/onboarding-ats.ts`
After extraction, AI rewrites each work_experience bullet to ATS standards while preserving facts. Optimizes skill categorization. Standardizes date formats.

### Task 4: Wire orchestration
**File:** `src/utils/actions/onboarding.ts`
`extractCVData()` → calls sectioned extractor.
`completeOnboarding()` → calls ATS optimizer before insertResume.

### Task 5: Expand review form
**File:** `src/components/onboarding/cv-review-form.tsx`
Add editable cards for work_experience and education (read from cvData, edit in place, pass edits back).

### Task 6: Wire edits back
**File:** `src/components/onboarding/onboarding-flow.tsx`
`handleReviewComplete` accepts edited sections, merges with cvData, sends to `completeOnboarding`.

### Task 7: Better generating screen
**File:** `src/components/onboarding/generating-screen.tsx`
Show progress: "Analyzing your experience…" → "Optimizing for ATS…" → "Building your Master CV…"

### Task 8: Diagnostic logging
Across all files — console.log at every boundary so failures are visible in devtools.

### Task 9: Deploy + verify with real Nihat CV
Upload Nihat-Avci-CV.pdf, verify all 4 jobs + education + real skills appear.
