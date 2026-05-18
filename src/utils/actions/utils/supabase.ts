import { getAuthenticatedUser } from "@/utils/auth";

// Shared client initialization — adapted for D1/CF Access mode
export async function getAuthenticatedClient() {
  const user = await getAuthenticatedUser();
  return { user };
}

// Service client is no longer needed in D1 mode.
// Kept as a no-op for backward compatibility with callers.
export async function getServiceClient() {
  return {};
}
