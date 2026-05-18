import { redirect } from "next/navigation";


/**
 * Update Password Page
 *
 * In single-user mode with Cloudflare Access, password management is not needed.
 * Redirects to settings.
 */
export default function UpdatePasswordPage() {
  redirect("/settings");
}
