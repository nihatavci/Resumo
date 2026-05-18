'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Everything is now free and unlimited - this button just links to settings
export function ProUpgradeButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push('/settings')}
    >
      Go to Settings
    </Button>
  );
}
