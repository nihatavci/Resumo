'use client'

import { Label } from "@/components/ui/label"
import { ModelSelector } from "@/components/shared/model-selector"
import { MODEL_DESIGNATIONS } from "@/lib/ai-models"
import { useApiKeys, useDefaultModel } from "@/hooks/use-api-keys"
import { useEffect, useRef } from "react"

export function ApiKeysForm() {
  const { apiKeys } = useApiKeys()
  const { defaultModel, setDefaultModel } = useDefaultModel()

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    if (!defaultModel) {
      setDefaultModel(MODEL_DESIGNATIONS.DEFAULT_PRO)
    }
  }, [defaultModel, setDefaultModel])

  const handleModelChange = (modelId: string) => {
    setDefaultModel(modelId)
  }

  return (
    <div className="space-y-6">
      {/* Model Selection Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-white/50 to-white/30 border border-white/40 shadow-xl backdrop-blur-sm">
        <Label className="text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Default AI Model
        </Label>
        <p className="text-sm text-muted-foreground mt-2 mb-3">
          Choose which model to use for AI operations. All models are free and run on Cloudflare Workers AI.
        </p>
        <ModelSelector
          value={defaultModel}
          onValueChange={handleModelChange}
          apiKeys={apiKeys}
          className="w-full mt-1"
          placeholder="Select an AI model"
        />
      </div>

      {/* Workers AI Info Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-white/50 to-white/30 border border-white/40 shadow-xl backdrop-blur-sm">
        <Label className="text-base font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          Powered by Cloudflare Workers AI
        </Label>
        <div className="mt-2 space-y-2">
          <p className="text-sm text-muted-foreground">
            All AI models run directly on Cloudflare Workers AI through a secure binding. No API keys are needed.
          </p>
          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/50 text-emerald-900 text-sm">
            <p><strong>Free for all users:</strong> Every model is available at no cost. Simply select your preferred model above and start using AI features.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
