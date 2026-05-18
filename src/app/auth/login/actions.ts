'use server'

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/utils/auth";
import { deleteProfileByUserId, deleteResumesByUserId } from "@/lib/db";
import type { AuthFormState } from "@/components/auth/auth-form-state";

interface AuthResult {
  success: boolean;
  error?: string;
}

// Login - CF Access handles authentication, just redirect home
export async function login(): Promise<AuthResult> {
  redirect('/')
  return { success: true }
}

// Signup - CF Access handles authentication, just redirect home
export async function signup(): Promise<AuthResult> {
  redirect('/')
  return { success: true }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loginWithState(_previousState: AuthFormState, _formData: FormData): Promise<AuthFormState> {
  redirect('/')
  return { status: "success" };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function signupWithState(_previousState: AuthFormState, _formData: FormData): Promise<AuthFormState> {
  redirect('/')
  return { status: "success" };
}

// Logout - just redirect to home (CF Access handles session)
export async function logout() {
  redirect('/');
}

// Check if user is authenticated
export async function checkAuth(): Promise<{
  authenticated: boolean;
  user?: { id: string; email?: string | null } | null
}> {
  try {
    const user = await getAuthenticatedUser();
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (error) {
    console.error('Unexpected error during auth check:', error);
    return { authenticated: false };
  }
}

// Get user ID if authenticated
export async function getUserId(): Promise<string | null> {
  try {
    const user = await getAuthenticatedUser();
    return user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

export async function deleteUserAccount(formData: FormData) {
  'use server'

  const confirmation = formData.get('confirm')
  if (confirmation !== 'DELETE') {
    throw new Error('Invalid confirmation text')
  }

  try {
    const user = await getAuthenticatedUser();

    // Delete user data from profiles table
    await deleteProfileByUserId(user.id);

    // Delete user's resumes
    await deleteResumesByUserId(user.id);
  } catch (error) {
    console.error('Account deletion failed:', error)
    throw error
  }

  redirect('/')
}
