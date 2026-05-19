'use client'

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useApiKeys } from "@/hooks/use-api-keys"

export function ApiKeyAlert() {
  const { apiKeys } = useApiKeys()
  const hasApiKeys = apiKeys.length > 0

  if (hasApiKeys) return null

  return (
    <Alert className="border-0 p-0 bg-transparent">
      <AlertDescription className="p-0">
        <div className="relative overflow-hidden rounded-dia-sm bg-white/90 backdrop-blur-[24px] border border-dia-divider shadow-dia">
          <div className="relative p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-dia-btn bg-dia-button flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-dia-body" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-foreground">
                  Configure Your AI Models
                </h3>
                <p className="text-xs text-dia-tertiary mt-0.5">
                  Models are pre-configured via Cloudflare Workers AI.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/settings">
                  <Button>
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
