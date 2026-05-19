# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the design system to the full Dia Browser spec (typography scale, button hover states, spacing, border radius), add Framer Motion page transitions, and restructure routing for the new linear app flow (onboarding → workspace → memory).

**Architecture:** Update Tailwind config and globals.css with the complete Dia token set. Fix button and card components to match spec (30px radius, hover inversion). Add a Framer Motion `<AnimatePresence>` wrapper at the layout level for page transitions. Restructure routes: `/` becomes the entry point (redirects to `/onboarding` or `/workspace`), `/memory` replaces `/profile`, dead routes get removed.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v3, Framer Motion (already installed), Shadcn UI, DM Sans via next/font

---

### Task 1: Update Tailwind config with full Dia token set

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add missing color tokens**

Add `fog`, `steel`, `ash` to the `dia` color object, and add the full spectrum gradient stops as individual tokens:

```ts
// In theme.extend.colors.dia:
dia: {
  canvas: '#F8F8F8',
  body: '#636363',
  tertiary: '#959595',
  button: '#D9D9D9',
  divider: '#E5E5E5',
  fog: '#EFEFEF',
  steel: '#AEAEAE',
  ash: '#7C7C7C',
},
```

- [ ] **Step 2: Update border radius tokens to match Dia spec**

Replace current radius values. Dia uses 30px for cards and buttons, 16px for nav items, 10px for images, 40px for containers:

```ts
// In theme.extend.borderRadius:
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
  dia: '30px',
  'dia-sm': '16px',
  'dia-btn': '30px',     // Changed from 12px to 30px per Dia spec
  'dia-img': '10px',
  'dia-container': '40px',
  'dia-pill': '9999px',
},
```

- [ ] **Step 3: Add typography scale tokens as fontSize entries**

Add the Dia type scale so we can use `text-dia-display`, `text-dia-heading`, etc.:

```ts
// In theme.extend.fontSize:
fontSize: {
  'dia-caption': ['10px', { lineHeight: '1.5' }],
  'dia-body-sm': ['14px', { lineHeight: '1.5' }],
  'dia-body': ['16px', { lineHeight: '1.5' }],
  'dia-subheading': ['18px', { lineHeight: '1.33' }],
  'dia-heading-sm': ['22px', { lineHeight: '1.25', letterSpacing: '-0.44px' }],
  'dia-heading': ['50px', { lineHeight: '1.18', letterSpacing: '-2px' }],
  'dia-heading-lg': ['54px', { lineHeight: '1.17', letterSpacing: '-2.16px' }],
  'dia-display': ['72px', { lineHeight: '1.11', letterSpacing: '-2.88px' }],
},
```

- [ ] **Step 4: Add spacing tokens on 8px grid**

```ts
// In theme.extend.spacing:
spacing: {
  'dia-5': '5px',
  'dia-6': '6px',
  'dia-10': '10px',
  'dia-14': '14px',
  'dia-15': '15px',
  'dia-20': '20px',
  'dia-24': '24px',
  'dia-32': '32px',
  'dia-34': '34px',
},
```

- [ ] **Step 5: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: align Tailwind tokens to full Dia Browser spec

Add missing colors (fog, steel, ash), fix button radius to 30px,
add complete typography scale, image/container/pill radii, and
8px-grid spacing tokens."
```

---

### Task 2: Update globals.css with Dia CSS custom properties

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add CSS custom properties for the full Dia token set**

Add these inside the existing `:root` block in the `@layer base` section, after the existing variables:

```css
/* Dia Typography */
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;

/* Dia Surfaces */
--surface-canvas: #f8f8f8;
--surface-header: #efefef;
--surface-card: #ffffff;
--surface-button-fill: #d9d9d9;
```

- [ ] **Step 2: Add the Dia frosted card utility with updated radius**

Update the existing `.glass-card` utility to use the correct 30px radius and add a `.glass-card-sm` variant:

```css
@layer utilities {
  .glass-card {
    @apply bg-white/90 backdrop-blur-[24px] shadow-dia;
    border-radius: 30px;
  }

  .glass-card-sm {
    @apply bg-white/90 backdrop-blur-[24px] shadow-dia;
    border-radius: 16px;
  }
}
```

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Dia surface variables and glass-card-sm utility"
```

---

### Task 3: Fix Button component to match Dia spec

**Files:**
- Modify: `src/components/ui/button.tsx`

The Dia spec says: filled buttons use 30px radius, hover transitions from `#D9D9D9` bg to `#000000` bg with white text. Current button uses `rounded-dia-btn` (was 12px, now 30px from Task 1) and a simple opacity hover.

- [ ] **Step 1: Update default variant hover to Dia inversion**

Replace the default variant hover with the Dia spec hover (black bg + white text):

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-dia-btn text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-dia-button text-foreground shadow-dia hover:bg-foreground hover:text-white",
        destructive:
          "bg-destructive text-destructive-foreground shadow-dia hover:bg-destructive/90",
        outline:
          "border border-dia-divider bg-white shadow-dia hover:bg-foreground hover:text-white hover:border-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-dia hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

Key changes:
- Base: `transition-colors` → `transition-all duration-200`
- Default hover: `hover:bg-dia-button/80` → `hover:bg-foreground hover:text-white`
- Outline hover: same inversion pattern
- Size variants: removed redundant `rounded-dia-btn` (already in base)

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: button hover inverts to black bg per Dia spec"
```

---

### Task 4: Fix Card component to match Dia spec

**Files:**
- Modify: `src/components/ui/card.tsx`

Dia cards use 30px radius, no visible border, frosted glass background. Currently using `rounded-dia-sm` (16px) with a border.

- [ ] **Step 1: Update Card base classes**

Change the `Card` component's default classes:

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-dia bg-white/90 backdrop-blur-[24px] text-card-foreground shadow-dia",
      className
    )}
    {...props}
  />
))
```

Key changes:
- `rounded-dia-sm` → `rounded-dia` (16px → 30px)
- Added `bg-white/90 backdrop-blur-[24px]` for frosted glass
- Removed `border` (Dia uses shadow, not borders for cards)

- [ ] **Step 2: Update CardTitle to use proper Dia weight**

```tsx
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
```

Change: `font-semibold` → `font-medium` (Dia max weight is 500).

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: card uses 30px radius, frosted glass, no border per Dia"
```

---

### Task 5: Add Framer Motion page transition wrapper

**Files:**
- Create: `src/components/motion/page-transition.tsx`
- Create: `src/components/motion/motion-config.tsx`

- [ ] **Step 1: Create the motion config provider**

This wraps the app with Framer Motion's `LazyMotion` for smaller bundle size and a shared `MotionConfig` for consistent spring physics:

```tsx
// src/components/motion/motion-config.tsx
'use client';

import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { ReactNode } from 'react';

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 30,
        }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
```

- [ ] **Step 2: Create the page transition component**

```tsx
// src/components/motion/page-transition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds (components are created but not wired in yet — that's Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/
git commit -m "feat: add Framer Motion page transition and config provider"
```

---

### Task 6: Wire Framer Motion into the root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add MotionProvider and PageTransition to the root layout**

Import and wrap children in the motion components. The `MotionProvider` goes around the entire app (inside `PostHogProvider`), and `PageTransition` wraps the `<main>` children:

In the imports section, add:

```tsx
import { MotionProvider } from "@/components/motion/motion-config";
import { PageTransition } from "@/components/motion/page-transition";
```

Then update the JSX. Replace the current `<main>` block:

```tsx
<main className="py-14 h-full">
  {children}
  {isVercel && <Analytics />}
</main>
```

With:

```tsx
<MotionProvider>
  <main className="py-14 h-full">
    <PageTransition>
      {children}
    </PageTransition>
    {isVercel && <Analytics />}
  </main>
</MotionProvider>
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Verify page transitions work in dev**

Run: `pnpm dev` and navigate between `/home` and `/profile` in the browser. Pages should fade in/out with a subtle 8px vertical slide.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wire Framer Motion transitions into root layout"
```

---

### Task 7: Restructure routing for new app flow

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/workspace/page.tsx`
- Create: `src/app/(app)/memory/page.tsx`
- Create: `src/app/(app)/onboarding/page.tsx`
- Modify: `src/components/ui/logo.tsx`
- Modify: `src/components/layout/footer.tsx`

The new route group `(app)` replaces `(dashboard)`. It will contain the three primary routes: workspace, memory, onboarding.

- [ ] **Step 1: Create the (app) route group layout**

This is a minimal layout for the new app — header + content, no footer (workspace is full-height):

```tsx
// src/app/(app)/layout.tsx
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <div className="pt-14 h-full">
        {children}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create workspace placeholder page**

```tsx
// src/app/(app)/workspace/page.tsx
export default function WorkspacePage() {
  return (
    <main className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-dia-heading-sm font-light text-foreground">
          Workspace
        </h1>
        <p className="text-dia-body text-dia-body">
          Split-view resume tailoring — coming in Phase 3.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create memory placeholder page**

```tsx
// src/app/(app)/memory/page.tsx
export default function MemoryPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] max-w-[1200px] mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-dia-heading-sm font-light text-foreground">
          Memory
        </h1>
        <p className="text-dia-body text-dia-body">
          Your career data — coming in Phase 2.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Create onboarding placeholder page**

```tsx
// src/app/(app)/onboarding/page.tsx
export default function OnboardingPage() {
  return (
    <main className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-dia-heading font-light text-foreground">
          Welcome to Resumo
        </h1>
        <p className="text-dia-subheading text-dia-body">
          Upload your CV and we'll build your career profile together.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Update root page.tsx to route to the new flow**

Replace the current redirect-to-`/home` with logic that routes to `/onboarding` or `/workspace`:

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";
import { getDashboardData } from "@/utils/actions";

export default async function RootPage() {
  let hasProfile = false;
  try {
    const data = await getDashboardData();
    hasProfile = !!data.profile;
  } catch {
    // No profile yet
  }

  if (hasProfile) {
    redirect("/workspace");
  } else {
    redirect("/onboarding");
  }
}
```

- [ ] **Step 6: Update Logo link to point to `/` instead of `/home`**

In `src/components/ui/logo.tsx`, change the Link href:

```tsx
if (asLink) {
  return <Link href="/">{logoContent}</Link>;
}
```

- [ ] **Step 7: Remove footer from root layout**

In `src/app/layout.tsx`, remove the footer import and the `{user && <Footer />}` line. The new app is full-height workspace — no persistent footer. Also remove the unused import:

Remove this import:
```tsx
import { Footer } from "@/components/layout/footer";
```

Remove this line from JSX:
```tsx
{user && <Footer />}
```

Also move the `{user && <AppHeader />}` out of root layout since the `(app)` layout now handles the header. Remove:
```tsx
{user && <AppHeader />}
```

And the import:
```tsx
import { AppHeader } from "@/components/layout/app-header";
```

- [ ] **Step 8: Verify build compiles**

Run: `pnpm build 2>&1 | tail -10`
Expected: Build succeeds. New routes `/workspace`, `/memory`, `/onboarding` appear in the output.

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx src/app/\(app\)/ src/components/ui/logo.tsx src/app/layout.tsx
git commit -m "feat: restructure routing for linear app flow

Add (app) route group with workspace, memory, onboarding placeholders.
Root page routes to /onboarding or /workspace based on profile state.
Remove footer from root layout, move header to (app) layout."
```

---

### Task 8: Remove API key alert banner

**Files:**
- Modify: `src/app/(dashboard)/home/page.tsx`
- Modify: `src/components/dashboard/api-key-alert.tsx`

The user explicitly requested removing this. It shows "Configure Your AI Models" which is irrelevant since models are pre-configured via Cloudflare Workers AI.

- [ ] **Step 1: Remove ApiKeyAlert from dashboard home page**

In `src/app/(dashboard)/home/page.tsx`, remove the import:

```tsx
import { ApiKeyAlert } from "@/components/dashboard/api-key-alert";
```

And remove the usage from JSX:

```tsx
<ApiKeyAlert />
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/home/page.tsx
git commit -m "fix: remove API key configuration banner from dashboard"
```

---

### Task 9: Remove model selector from header

**Files:**
- Modify: `src/components/layout/app-header.tsx`

Per the spec: "No model selector in header (move to settings, it's infrastructure not UX)." The model selector takes up significant header real estate and is configuration, not workflow.

- [ ] **Step 1: Remove ModelSelector from desktop and mobile nav**

In `src/components/layout/app-header.tsx`:

Remove these imports:
```tsx
import { ModelSelector } from "@/components/shared/model-selector";
import { getDefaultModel } from "@/lib/ai-models";
import { useApiKeys, useDefaultModel } from "@/hooks/use-api-keys";
```

Remove the state/effect/handler code (lines 25-41 approximately):
```tsx
const { apiKeys } = useApiKeys();
const { defaultModel, setDefaultModel } = useDefaultModel();

const hasInitialized = useRef(false);

useEffect(() => {
  if (hasInitialized.current) return;
  hasInitialized.current = true;

  if (!defaultModel) {
    const defaultModelId = getDefaultModel(true);
    setDefaultModel(defaultModelId);
  }
}, [defaultModel, setDefaultModel]);

const handleModelChange = (modelId: string) => {
  setDefaultModel(modelId);
};
```

Also remove `useRef` from the React import since it's no longer used (keep `useState` and `useEffect` only if still needed — check if `isOpen` still uses `useState`). Keep `useState` for `isOpen`.

Remove the `useEffect` import if nothing else uses it. Keep `useState` for the Sheet.

Remove the desktop ModelSelector block:
```tsx
<div className="mr-3">
  <ModelSelector
    value={defaultModel}
    onValueChange={handleModelChange}
    apiKeys={apiKeys}
    className="w-[220px] lg:w-[260px] h-8 text-xs"
    placeholder="Select AI model"
    showToast={false}
  />
</div>
```

Remove the mobile ModelSelector block:
```tsx
<div className="px-1">
  <ModelSelector
    value={defaultModel}
    onValueChange={handleModelChange}
    apiKeys={apiKeys}
    className="w-full h-10 text-sm"
    placeholder="Select AI model"
    showToast={false}
  />
</div>
```

Update the header nav links to use the new routes. Change the Profile link href from `/profile` to `/memory`:

```tsx
<Link
  href="/memory"
  ...
>
```

Do this for both the desktop and mobile Profile links.

- [ ] **Step 2: Clean up unused imports**

After removing ModelSelector references, ensure only used imports remain. The header should import: `LogoutButton`, `SettingsButton`, `Logo`, `cn`, `Link`, `Menu`, `User`, `PageTitle`, `Button`, `Sheet` components, and `useState`.

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-header.tsx
git commit -m "feat: remove model selector from header, link to /memory

Model selection moves to settings. Header is now minimal:
logo, page title, profile/settings/logout."
```

---

### Task 10: Create shared Framer Motion animation variants

**Files:**
- Create: `src/components/motion/variants.ts`

Reusable animation variants that will be used across the onboarding flow, workspace, and memory pages in later phases.

- [ ] **Step 1: Create the variants file**

```ts
// src/components/motion/variants.ts

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/motion/variants.ts
git commit -m "feat: add shared Framer Motion animation variants"
```

---

### Task 11: Verify foundation end-to-end

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds. New routes `/workspace`, `/memory`, `/onboarding` appear.

- [ ] **Step 2: Run lint**

Run: `pnpm lint 2>&1 | tail -10`
Expected: No errors.

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck 2>&1 | tail -10`
Expected: No errors (or only pre-existing ones unrelated to our changes).

- [ ] **Step 4: Manual browser check**

Start dev server (`pnpm dev`), navigate to `http://localhost:3000`:
- Should redirect to `/onboarding` (if no profile) or `/workspace` (if profile exists)
- Page transitions should animate (fade + slide)
- Buttons should have 30px radius and invert to black on hover
- No model selector in header
- No API key banner on `/home` (old route still works via `(dashboard)` group)
- Header Profile link goes to `/memory`

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: foundation phase verification fixes"
```
