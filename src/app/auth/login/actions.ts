'use server'

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { deleteProfileByUserId, deleteResumesByUserId } from "@/lib/db";
import type { AuthFormState } from "@/components/auth/auth-form-state";

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
  // a fallback that redirects to the sign-in page.
  redirect('/sign-in');
}

// Legacy stubs for old auth forms that haven't been removed yet.
// They redirect to Clerk's hosted UI rather than attempt login themselves.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loginWithState(_prev: AuthFormState, _data: FormData): Promise<AuthFormState> {
  redirect('/sign-in');
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function signupWithState(_prev: AuthFormState, _data: FormData): Promise<AuthFormState> {
  redirect('/sign-up');
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

  // Note: the Clerk user account itself isn't deleted — user must do that
  // separately from their account settings.
  redirect('/');
}
