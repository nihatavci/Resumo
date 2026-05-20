# Clerk Multi-User Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-user CF-Access stub with real Clerk-backed multi-user authentication. Sign up, sign in, sign out work. Each user has isolated data.

**Architecture:** Install `@clerk/nextjs`. Wrap the app with `<ClerkProvider>` in the root layout. Use `clerkMiddleware()` to gate all app routes. Replace `getAuthenticatedUser()` to return the real Clerk userId — every existing DB query already filters by `user_id`, so isolation becomes automatic for all 23 callers. Use Clerk's `<UserButton>` in the header for built-in logout + profile UI. Use Clerk's `<SignIn>` / `<SignUp>` components on dedicated pages.

**Tech Stack:** `@clerk/nextjs` v6, Next.js 15 App Router, Cloudflare Workers via `@opennextjs/cloudflare`, D1 (user data keyed on Clerk userId string).

**Out of scope (deferred to later plan):** Fixing the PDF extraction / questionnaire / Master CV / tailoring flow. This plan only delivers auth + data isolation.

---

## File Structure

- **Create:** `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page
- **Create:** `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up page
- **Modify:** `src/middleware.ts` — replace pass-through with `clerkMiddleware()`
- **Modify:** `src/app/layout.tsx` — wrap with `<ClerkProvider>`
- **Modify:** `src/utils/auth.ts` — `getAuthenticatedUser()` returns Clerk userId
- **Modify:** `src/components/layout/app-header.tsx` — `<LogoutButton>` → `<UserButton>`
- **Modify:** `src/app/auth/login/actions.ts` — delete stub login/signup, keep logout that redirects to Clerk
- **Modify:** `src/app/page.tsx` — handle unauthenticated case (redirect to sign-in)
- **Create:** `.dev.vars.example` — document required env vars
- **Modify:** `wrangler.toml` — add public Clerk vars (not secrets)

The 23 callers of `getAuthenticatedUser` are untouched — they automatically work because the function signature stays the same.

---

### Task 1: Install Clerk and configure env vars

**Files:**
- Modify: `package.json`
- Create: `.dev.vars.example`

- [ ] **Step 1: Install package**

```bash
pnpm add @clerk/nextjs@^6
```

Expected: `@clerk/nextjs` appears in `package.json` dependencies.

- [ ] **Step 2: Create env var documentation**

Create `.dev.vars.example`:

```
# Clerk — get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

- [ ] **Step 3: Tell the user how to set production secrets**

Print these commands (do NOT run them — user must do this with their Clerk keys):

```bash
# After creating a Clerk app at dashboard.clerk.com:
npx wrangler secret put CLERK_SECRET_KEY
# Paste the sk_live_... value when prompted

# The NEXT_PUBLIC_* vars are added to wrangler.toml in Task 2
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .dev.vars.example
git commit -m "feat: install @clerk/nextjs for multi-user auth"
```

---

### Task 2: Add public Clerk env vars to wrangler.toml

**Files:**
- Modify: `wrangler.toml`

`NEXT_PUBLIC_*` vars must be available at build time. Add them to `wrangler.toml` `[vars]` section.

- [ ] **Step 1: Read current wrangler.toml structure**

Check the existing `[vars]` block (or note that there isn't one).

- [ ] **Step 2: Add Clerk public vars**

Append to `wrangler.toml`:

```toml
[vars]
NEXT_PUBLIC_CLERK_SIGN_IN_URL = "/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL = "/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL = "/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL = "/"
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be set via .env.local or build env
# CLERK_SECRET_KEY is set via `wrangler secret put`
```

(If a `[vars]` block already exists, merge — don't create a duplicate.)

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml
git commit -m "config: add Clerk public env vars to wrangler.toml"
```

---

### Task 3: Wrap root layout with `<ClerkProvider>`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace the file**

Current root layout has `PostHogProvider`, `MotionProvider`, `Suspense`, `Toaster`. Wrap the entire body content with `<ClerkProvider>` at the outermost level.

Replace `src/app/layout.tsx` (preserve all existing logic, only add the provider):

```typescript
import "./globals.css";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { Suspense } from "react";
import { MotionProvider } from "@/components/motion/motion-config";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const isVercel = process.env.VERCEL === '1';

export const metadata: Metadata = {
  metadataBase: new URL("https://resumelm.com"),
  title: {
    default: "Resumo — AI Resume Builder",
    template: "%s | Resumo"
  },
  description: "Create tailored, ATS-optimized resumes powered by AI.",
  applicationName: "Resumo",
  keywords: ["resume builder", "AI resume", "ATS optimization", "career tools"],
  authors: [{ name: "Resumo" }],
  creator: "Resumo",
  publisher: "Resumo",
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Resumo",
    title: "Resumo — AI Resume Builder",
    description: "Create tailored, ATS-optimized resumes powered by AI.",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: "Resumo — AI Resume Builder" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resumo — AI Resume Builder",
    description: "Create tailored, ATS-optimized resumes powered by AI.",
    images: ["/og.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={dmSans.variable}>
        <body className="font-sans bg-dia-canvas">
          <PostHogProvider user={null}>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <div className="relative min-h-screen h-screen flex flex-col">
              <MotionProvider>
                <main className="h-full">
                  {children}
                  {isVercel && <Analytics />}
                </main>
              </MotionProvider>
            </div>
            <Toaster
              position="top-right"
              closeButton
              toastOptions={{
                style: {
                  fontSize: '0.875rem',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.08)',
                }
              }}
            />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

Note: PostHogProvider's user is set to `null` here — server-side user identification will be done per-page if needed (Clerk's `useAuth()` is client-side).

- [ ] **Step 2: Build to verify**

```bash
pnpm build 2>&1 | grep -E "error|Error|✓"
```

Expected: clean build (Clerk validates at runtime if keys missing, build still succeeds).

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap root layout with ClerkProvider"
```

---

### Task 4: Replace middleware with `clerkMiddleware()`

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Replace file**

Replace `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes — anything else requires sign-in
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/blog(.*)',
  '/api/webhook(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: enforce auth on all routes via clerkMiddleware"
```

---

### Task 5: Create sign-in and sign-up pages

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`

These are catch-all routes Clerk uses for its multi-step flows.

- [ ] **Step 1: Create sign-in page**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dia-canvas px-4">
      <SignIn appearance={{ elements: { rootBox: 'mx-auto' } }} />
    </div>
  );
}
```

- [ ] **Step 2: Create sign-up page**

Create `src/app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dia-canvas px-4">
      <SignUp appearance={{ elements: { rootBox: 'mx-auto' } }} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/sign-in src/app/sign-up
git commit -m "feat: add sign-in and sign-up pages"
```

---

### Task 6: Rewrite `getAuthenticatedUser` to use Clerk

**Files:**
- Modify: `src/utils/auth.ts`

This is the critical change. The function signature and return type stay the same — all 23 callers continue working unchanged.

- [ ] **Step 1: Replace file**

Replace `src/utils/auth.ts`:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { getProfileByUserId, createProfile } from '@/lib/db';

/**
 * Returns the authenticated user's Clerk ID and primary email.
 * Throws (via Clerk's auth().protect()) if the request is unauthenticated.
 *
 * Middleware already enforces auth on protected routes, so reaching this
 * function with no user means we're in an unauthenticated public context
 * (which shouldn't happen for the 23 callers).
 */
export async function getAuthenticatedUser(): Promise<{ id: string; email: string | null }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('UNAUTHENTICATED');
  }

  // Email isn't strictly needed for DB ops, but several callers use it.
  // `currentUser()` is a separate Clerk call — only invoke if email might be used.
  // For now: return userId immediately, fetch email lazily via a separate helper.
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  return { id: userId, email };
}

export async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('UNAUTHENTICATED');
  return userId;
}

export async function ensureProfile(): Promise<void> {
  const user = await getAuthenticatedUser();
  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    await createProfile(user.id, {
      email: user.email,
    });
  }
}
```

- [ ] **Step 2: Build to verify**

```bash
pnpm build 2>&1 | grep -E "error TS|Error:" | head -10
```

Expected: no type errors. All 23 callers see the same `{ id, email }` shape.

- [ ] **Step 3: Commit**

```bash
git add src/utils/auth.ts
git commit -m "feat: getAuthenticatedUser uses Clerk auth() instead of single-user stub"
```

---

### Task 7: Replace `<LogoutButton>` with Clerk's `<UserButton>` in app header

**Files:**
- Modify: `src/components/layout/app-header.tsx`

- [ ] **Step 1: Read current header**

```bash
cat src/components/layout/app-header.tsx
```

Identify the line(s) using `<LogoutButton />`.

- [ ] **Step 2: Replace LogoutButton with UserButton**

In `src/components/layout/app-header.tsx`:

1. Remove the import: `import { LogoutButton } from "@/components/auth/logout-button";`
2. Add the import: `import { UserButton } from "@clerk/nextjs";`
3. Replace `<LogoutButton />` (and any nearby logout-related JSX like "Logout" text + icon) with:

```tsx
<UserButton
  afterSignOutUrl="/sign-in"
  appearance={{
    elements: {
      avatarBox: 'h-8 w-8',
    }
  }}
/>
```

If the header has a mobile menu (Sheet) with a separate logout link, replace that too with `<UserButton />`.

- [ ] **Step 3: Build**

```bash
pnpm build 2>&1 | grep -E "error TS" | head -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-header.tsx
git commit -m "feat: use Clerk UserButton for profile + logout in header"
```

---

### Task 8: Clean up stub auth actions

**Files:**
- Modify: `src/app/auth/login/actions.ts`

The login/signup actions were stubs. Now real auth goes through Clerk's components. Delete the stubs and update logout to point at Clerk's sign-out URL.

- [ ] **Step 1: Replace file**

Replace `src/app/auth/login/actions.ts`:

```typescript
'use server'

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { deleteProfileByUserId, deleteResumesByUserId } from "@/lib/db";

// Auth is now handled by Clerk. These exports are kept for any callers
// that still import them — they redirect to Clerk's flows.

export async function login() {
  redirect('/sign-in');
}

export async function signup() {
  redirect('/sign-up');
}

export async function logout() {
  // Clerk's UserButton handles client-side sign-out. This server action is
  // a fallback that redirects to the sign-out URL.
  redirect('/sign-in');
}

export async function checkAuth(): Promise<{
  authenticated: boolean;
  user?: { id: string; email?: string | null } | null;
}> {
  const { userId } = await auth();
  return { authenticated: !!userId, user: userId ? { id: userId } : null };
}

export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

export async function deleteUserAccount(formData: FormData) {
  const confirmation = formData.get('confirm');
  if (confirmation !== 'DELETE') {
    throw new Error('Invalid confirmation text');
  }

  const { userId } = await auth();
  if (!userId) throw new Error('UNAUTHENTICATED');

  await deleteProfileByUserId(userId);
  await deleteResumesByUserId(userId);

  // User still exists in Clerk — they must delete their Clerk account separately.
  redirect('/');
}
```

- [ ] **Step 2: Build**

```bash
pnpm build 2>&1 | grep -E "error TS" | head -5
```

Expected: no errors. The exported names (`login`, `signup`, `logout`, `checkAuth`, `getUserId`, `deleteUserAccount`) are preserved.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/login/actions.ts
git commit -m "feat: route stub auth actions to Clerk; real logic in Clerk components"
```

---

### Task 9: Update root page redirect

**Files:**
- Modify: `src/app/page.tsx`

If middleware redirects unauthenticated users to `/sign-in`, the root page only runs when authenticated. Simplify it.

- [ ] **Step 1: Replace file**

Replace `src/app/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/utils/auth';
import { getProfileByUserId } from '@/lib/db';

export default async function RootPage() {
  // Middleware ensures user is authenticated by the time we get here
  const user = await getAuthenticatedUser();

  try {
    const profile = await getProfileByUserId(user.id);
    if (profile) {
      redirect('/workspace');
    } else {
      redirect('/onboarding');
    }
  } catch (err) {
    // redirect() throws internally — re-throw it
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
    // Real DB error — go to workspace which handles empty state
    redirect('/workspace');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: root page assumes authenticated user (middleware-enforced)"
```

---

### Task 10: Local verification

- [ ] **Step 1: Create local `.dev.vars` file**

Tell the user to:
1. Sign up at https://dashboard.clerk.com (free)
2. Create an application
3. Copy `Publishable key` and `Secret key`
4. Create `.dev.vars` (gitignored) in the worktree root:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Also create `.env.local` with the same content (Next.js reads this in dev).

- [ ] **Step 2: Run local dev**

```bash
pnpm dev
```

Expected: app starts on localhost:3000.

- [ ] **Step 3: Manual test in browser**

1. Visit http://localhost:3000 — should redirect to /sign-in
2. Click "Sign up" — create a new account with email A
3. Should redirect to / → /onboarding (no profile yet)
4. Complete onboarding, generate Master CV
5. Click avatar → "Sign out" — should land on /sign-in
6. Sign up again with a different email B
7. Verify the new user lands on /onboarding (does NOT see user A's resume)

- [ ] **Step 4: Commit any tweaks**

If tweaks were needed:

```bash
git add -A
git commit -m "fix: clerk auth manual test tweaks"
```

---

### Task 11: Deploy to Cloudflare

- [ ] **Step 1: Set production Clerk secret**

```bash
npx wrangler secret put CLERK_SECRET_KEY
# Paste sk_live_... (production) or sk_test_... (testing)
```

- [ ] **Step 2: Set production publishable key**

For `NEXT_PUBLIC_*` vars, OpenNext bakes them in at build time. Add the publishable key to the build environment:

```bash
# In wrangler.toml [vars] block, add:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_..."
```

Or, if you prefer build-time only without exposing it in wrangler.toml:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... npx opennextjs-cloudflare build
```

- [ ] **Step 3: Build + deploy**

```bash
npx opennextjs-cloudflare build 2>&1 | tail -3
npx wrangler deploy 2>&1 | grep -E "Deployed|Error"
```

Expected: `Deployed resumelm triggers`

- [ ] **Step 4: Production test**

Visit https://resumelm.nihatavci.workers.dev:
1. Should redirect to /sign-in
2. Sign up with a fresh email
3. Land on /onboarding (your old `default-user` data is NOT visible)
4. Complete onboarding
5. Sign out via avatar menu
6. Verify sign-in works on return

- [ ] **Step 5: Merge to main**

```bash
git checkout main
git merge --no-ff claude/gallant-franklin-195096 -m "feat: Clerk multi-user authentication"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Multi-user signup → Task 5 (Clerk SignUp component)
- ✅ Multi-user signin → Task 5 (Clerk SignIn component)
- ✅ Working sign out → Task 7 (UserButton with afterSignOutUrl)
- ✅ Per-user data isolation → Task 6 (getAuthenticatedUser returns Clerk userId; all 23 DB callers already filter by user_id)
- ✅ Middleware protection → Task 4 (clerkMiddleware enforces auth on all non-public routes)

**Placeholder scan:** Every step has exact paths, complete code, runnable commands. No TBDs.

**Type consistency:** `getAuthenticatedUser` keeps signature `Promise<{ id: string; email: string | null }>` — all 23 callers unchanged. `getUserId` keeps signature `Promise<string>`.

**Out of scope (intentional):**
- PDF extraction quality
- Master CV generation quality
- Job tailoring with diff visualization
- These get their own plan after auth lands.
