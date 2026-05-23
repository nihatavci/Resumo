import { createWorkersAI } from 'workers-ai-provider';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { LanguageModelV1 } from 'ai';
import { type AIConfig } from '@/lib/ai-models';
import { resolveAIRequest, type ResolvedAIRequest } from '@/lib/ai/access-control';

// Re-export types for backward compatibility
export type { ApiKey, AIConfig } from '@/lib/ai-models';

function getAIBinding(): Ai {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    return getCloudflareContext().env.AI;
  } catch {
    throw new Error('Workers AI binding not available');
  }
}

export function createAIClientFromResolvedRequest(
  resolved: ResolvedAIRequest,
  useThinking?: boolean
) {
  void useThinking;

  if (resolved.providerId === 'deepseek') {
    const deepseek = createDeepSeek({ apiKey: resolved.apiKey });
    return deepseek(resolved.modelId) as LanguageModelV1;
  }

  const workersai = createWorkersAI({ binding: getAIBinding() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return workersai(resolved.modelId as any) as LanguageModelV1;
}

export function resolveAIClient(config?: AIConfig, isPro?: boolean, useThinking?: boolean) {
  if (!config) {
    throw new Error('AI model is required');
  }

  const resolved = resolveAIRequest({
    requestedModel: config.model,
    apiKeys: config.apiKeys ?? [],
    isPro: Boolean(isPro),
  });

  return {
    model: createAIClientFromResolvedRequest(resolved, useThinking),
    resolved,
  };
}

/**
 * Initializes an AI client based on the centralized access-control decision.
 */
export function initializeAIClient(config?: AIConfig, isPro?: boolean, useThinking?: boolean) {
  return resolveAIClient(config, isPro, useThinking).model;
}
