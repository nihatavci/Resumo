/**
 * Centralized AI Model Management
 * This file contains all AI model and provider configurations used throughout the application.
 * All models run on Cloudflare Workers AI via the binding — no API keys required.
 */

import { ServiceName } from './types'

// ========================
// Type Definitions
// ========================

export interface AIProvider {
  id: ServiceName
  name: string
  apiLink: string
  logo?: string
  envKey: string
  sdkInitializer: string
  unstable?: boolean
}

export interface AIModel {
  id: string
  name: string
  provider: ServiceName
  features: {
    isFree?: boolean
    isRecommended?: boolean
    isUnstable?: boolean
    maxTokens?: number
    supportsVision?: boolean
    supportsTools?: boolean
    isPro?: boolean
  }
  availability: {
    requiresApiKey: boolean
    requiresPro: boolean
  }
}

export interface ApiKey {
  service: ServiceName
  key: string
  addedAt: string
}

export interface AIConfig {
  model: string
  apiKeys: ApiKey[]
  customPrompts?: import('./types').CustomPrompts
}

export interface GroupedModels {
  provider: ServiceName
  name: string
  models: AIModel[]
}

// ========================
// Provider Configurations
// ========================

export const PROVIDERS: Partial<Record<ServiceName, AIProvider>> = {
  workersai: {
    id: 'workersai' as ServiceName,
    name: 'Workers AI',
    apiLink: 'https://developers.cloudflare.com/workers-ai/',
    envKey: '',
    sdkInitializer: 'workersai',
  },
}

// ========================
// Model Definitions
// ========================

export const AI_MODELS: AIModel[] = [
  {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    name: 'Llama 3.3 70B',
    provider: 'workersai' as ServiceName,
    features: {
      isFree: true,
      isRecommended: true,
      maxTokens: 131072,
      supportsTools: true,
    },
    availability: { requiresApiKey: false, requiresPro: false },
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct-fast',
    name: 'Llama 3.1 8B Fast',
    provider: 'workersai' as ServiceName,
    features: {
      isFree: true,
      isRecommended: false,
      maxTokens: 131072,
      supportsTools: true,
    },
    availability: { requiresApiKey: false, requiresPro: false },
  },
  {
    id: '@cf/meta/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    provider: 'workersai' as ServiceName,
    features: {
      isFree: true,
      isRecommended: false,
      maxTokens: 131072,
      supportsVision: true,
      supportsTools: true,
    },
    availability: { requiresApiKey: false, requiresPro: false },
  },
  {
    id: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1',
    provider: 'workersai' as ServiceName,
    features: {
      isFree: true,
      isRecommended: false,
      maxTokens: 131072,
      supportsVision: true,
      supportsTools: true,
    },
    availability: { requiresApiKey: false, requiresPro: false },
  },
  {
    id: '@cf/google/gemma-3-12b-it',
    name: 'Gemma 3 12B',
    provider: 'workersai' as ServiceName,
    features: {
      isFree: true,
      isRecommended: false,
      maxTokens: 131072,
      supportsTools: true,
    },
    availability: { requiresApiKey: false, requiresPro: false },
  },
]

// ========================
// Legacy ID Aliases
// ========================

// No legacy aliases needed — fresh model set
const MODEL_ALIASES: Record<string, string> = {}

// ========================
// Default Model Configuration
// ========================

export const DEFAULT_MODELS = {
  PRO_USER: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  FREE_USER: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
} as const

// ========================
// Model Designations for Different Use Cases
// ========================

/**
 * Designated models for specific use cases throughout the application.
 * 70B for quality tasks, 8B for fast tasks.
 */
export const MODEL_DESIGNATIONS = {
  // Fast & cheap model for parsing, simple tasks, quick analysis
  FAST_CHEAP: '@cf/meta/llama-3.1-8b-instruct-fast',
  // Alternative fast & cheap option (free for all users)
  FAST_CHEAP_FREE: '@cf/meta/llama-3.1-8b-instruct-fast',
  // Structured extraction, parsing, and data normalization
  STRUCTURED_EXTRACTION: '@cf/meta/llama-3.1-8b-instruct-fast',
  // Resume scoring and analysis
  RESUME_SCORING: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  // Single-item rewrites and lightweight editing
  SIMPLE_REWRITE: '@cf/meta/llama-3.1-8b-instruct-fast',
  // Multi-bullet and polished content generation
  CONTENT_GENERATION: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  // Cover letter generation
  COVER_LETTER: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  // Full resume tailoring by plan
  JOB_TAILORING_FREE: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  JOB_TAILORING_PRO: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  // Interactive assistant by plan
  CHAT_ASSISTANT_FREE: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  CHAT_ASSISTANT_PRO: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  // Frontier model for complex tasks, deep analysis, best quality
  FRONTIER: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  // Alternative frontier model
  FRONTIER_ALT: '@cf/mistralai/mistral-small-3.1-24b-instruct',
  // Balanced model - good quality but faster/cheaper than frontier
  BALANCED: '@cf/meta/llama-3.1-8b-instruct-fast',
  // Vision-capable model for image analysis
  VISION: '@cf/meta/llama-4-scout-17b-16e-instruct',
  // Default models by user type
  DEFAULT_PRO: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  DEFAULT_FREE: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
} as const

// Type for model designations
export type ModelDesignation = keyof typeof MODEL_DESIGNATIONS

// ========================
// Utility Functions
// ========================

/**
 * Get all providers as an array
 */
export function getProvidersArray(): AIProvider[] {
  return Object.values(PROVIDERS)
}

/**
 * Get a model by its ID
 */
export function getModelById(id: string): AIModel | undefined {
  const resolvedId = MODEL_ALIASES[id] || id
  return AI_MODELS.find(model => model.id === resolvedId)
}

/**
 * Get a provider by its ID
 */
export function getProviderById(id: ServiceName): AIProvider | undefined {
  return PROVIDERS[id]
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: ServiceName): AIModel[] {
  return AI_MODELS.filter(model => model.provider === provider)
}

/**
 * Check if a model is available for a user.
 * All Workers AI models are free via the binding, so always return true.
 */
export function isModelAvailable(
  modelId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _isPro: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _apiKeys: ApiKey[]
): boolean {
  modelId = MODEL_ALIASES[modelId] || modelId
  const model = getModelById(modelId)
  return model !== undefined
}

/**
 * Get the default model for a user type
 */
export function getDefaultModel(isPro: boolean): string {
  return isPro ? DEFAULT_MODELS.PRO_USER : DEFAULT_MODELS.FREE_USER
}

/**
 * Get the provider for a model
 */
export function getModelProvider(modelId: string): AIProvider | undefined {
  const model = getModelById(modelId)
  if (!model) return undefined
  return getProviderById(model.provider)
}

/**
 * Group models by provider for display
 */
export function groupModelsByProvider(): GroupedModels[] {
  const providerOrder: ServiceName[] = ['workersai' as ServiceName]
  const grouped = new Map<ServiceName, AIModel[]>()

  // Group models by provider
  AI_MODELS.forEach(model => {
    if (!grouped.has(model.provider)) {
      grouped.set(model.provider, [])
    }
    grouped.get(model.provider)!.push(model)
  })

  // Return in ordered format
  return providerOrder
    .map(providerId => {
      const provider = getProviderById(providerId)
      if (!provider) return null

      return {
        provider: providerId,
        name: provider.name,
        models: grouped.get(providerId) || []
      }
    })
    .filter((group): group is GroupedModels => group !== null && group.models.length > 0)
}

/**
 * Get selectable models for a user
 */
export function getSelectableModels(isPro: boolean, apiKeys: ApiKey[]): AIModel[] {
  return AI_MODELS.filter(model => isModelAvailable(model.id, isPro, apiKeys))
}

/**
 * Determine which SDK to use for a model
 */
export function getModelSDKConfig(modelId: string): { provider: AIProvider; modelId: string } | undefined {
  const model = getModelById(modelId)
  if (!model) return undefined

  const provider = getProviderById(model.provider)
  if (!provider) return undefined

  return { provider, modelId }
}
