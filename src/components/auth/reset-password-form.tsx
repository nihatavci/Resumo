"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function ResetPasswordForm() {
  return (
    <div className="grid gap-6">
      <Alert className="bg-emerald-50/50 text-emerald-900 border-emerald-200/50">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <AlertDescription>
          Authentication is managed by Cloudflare Access. Password reset is not needed.
        </AlertDescription>
      </Alert>
      <div className="text-center text-sm">
        <Link
          href="/"
          className="text-muted-foreground hover:text-violet-600 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
