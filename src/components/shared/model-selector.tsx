'use client'

import React from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  getModelById,
  getProviderById,
  isModelAvailable,
  groupModelsByProvider,
  type ApiKey
} from '@/lib/ai-models'

interface ModelSelectorProps {
  value: string
  onValueChange: (value: string) => void
  apiKeys: ApiKey[]
  className?: string
  placeholder?: string
  showToast?: boolean
}

export function ModelSelector({
  value,
  onValueChange,
  apiKeys,
  className,
  placeholder = "Select an AI model",
  showToast = true
}: ModelSelectorProps) {

  const handleModelChange = (modelId: string) => {
    const selectedModel = getModelById(modelId)
    if (!selectedModel) return

    if (!isModelAvailable(modelId, true, apiKeys)) {
      if (showToast) {
        const provider = getProviderById(selectedModel.provider)
        toast.error(`Model ${provider?.name || selectedModel.provider} is not available`)
      }
      return
    }

    onValueChange(modelId)
    if (showToast) {
      toast.success('Model updated successfully')
    }
  }

  const getModelsByProvider = () => groupModelsByProvider()

  return (
    <Select value={value} onValueChange={handleModelChange}>
      <SelectTrigger className={cn(
        "bg-white border-dia-divider hover:border-border focus:border-foreground/40 transition-colors",
        className
      )}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="min-w-[300px] max-w-[400px]">
        {getModelsByProvider().map((group, groupIndex) => (
          <div key={group.provider}>
            <SelectGroup>
              <SelectLabel className="text-xs font-normal text-muted-foreground px-2 py-1.5">
                <div className="flex items-center gap-2">
                  {group.name}
                </div>
              </SelectLabel>
              {group.models.map((model) => {
                return (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="truncate font-normal">{model.name}</span>
                        {model.features.isRecommended && (
                          <span className="text-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-normal flex-shrink-0">
                            Recommended
                          </span>
                        )}
                        {model.features.isFree && (
                          <span className="text-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-normal flex-shrink-0">
                            Free
                          </span>
                        )}
                        {model.features.supportsVision && (
                          <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-normal flex-shrink-0">
                            Vision
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectGroup>
            {groupIndex < getModelsByProvider().length - 1 && (
              <SelectSeparator />
            )}
          </div>
        ))}
      </SelectContent>
    </Select>
  )
}

// Re-export types from centralized location
export type { ApiKey } from '@/lib/ai-models'
