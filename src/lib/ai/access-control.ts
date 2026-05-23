import {
  getModelById,
  getProviderById,
  type AIModel,
} from "@/lib/ai-models";
import type { ServiceName } from "@/lib/types";

interface APIKeyInput {
  service: string;
  key: string;
  addedAt?: string;
}

export interface ResolveAIRequestInput {
  requestedModel: string;
  apiKeys: APIKeyInput[];
  isPro?: boolean;
}

export interface ResolvedAIRequest {
  providerId: ServiceName;
  modelId: string;
  apiKey: string;
  usedServerKey: boolean;
  requiresRateLimit: boolean;
}

type HiddenModel = Pick<AIModel, "id" | "name" | "provider" | "features" | "availability">;

const HIDDEN_MODELS: Record<string, HiddenModel> = {};

function getKnownModel(modelId: string): HiddenModel | undefined {
  return getModelById(modelId) ?? HIDDEN_MODELS[modelId];
}

/**
 * Read an env var from the Cloudflare Workers env binding first,
 * then fall back to process.env (local dev / Node runtimes).
 * CF secrets are on `env.*`, NOT on process.env in Workers runtime.
 */
function getCFEnvOrProcessEnv(key: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const cfEnv = getCloudflareContext().env as Record<string, string | undefined>;
    const cfVal = cfEnv[key];
    if (cfVal) return cfVal;
  } catch {
    // not running in CF Workers context — fall through to process.env
  }
  return process.env[key];
}

export function resolveAIRequest(input: ResolveAIRequestInput): ResolvedAIRequest {
  const model = getKnownModel(input.requestedModel);

  if (!model) {
    throw new Error(`Unknown model: ${input.requestedModel}`);
  }

  const provider = getProviderById(model.provider);
  if (!provider) {
    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  // Workers AI uses the Cloudflare binding — no API key required.
  if (model.provider === 'workersai') {
    return {
      providerId: model.provider,
      modelId: model.id,
      apiKey: '',
      usedServerKey: true,
      requiresRateLimit: true,
    };
  }

  // DeepSeek and other external providers — prefer server-side key, then user key.
  // In Cloudflare Workers, secrets live on the `env` binding object, not process.env.
  // Try the CF context first, then fall back to process.env (for local dev / other runtimes).
  const envKey = provider.envKey ? getCFEnvOrProcessEnv(provider.envKey) : undefined;
  if (envKey) {
    return {
      providerId: model.provider,
      modelId: model.id,
      apiKey: envKey,
      usedServerKey: true,
      requiresRateLimit: true,
    };
  }

  const userApiKey = input.apiKeys.find((k) => k.service === model.provider)?.key;
  if (userApiKey) {
    return {
      providerId: model.provider,
      modelId: model.id,
      apiKey: userApiKey,
      usedServerKey: false,
      requiresRateLimit: false,
    };
  }

  // If no API key is available for an external provider, fall back to Workers AI Llama
  // so the app keeps working while the key is being configured.
  console.warn(`[access-control] No API key for provider "${model.provider}" — falling back to Workers AI`);
  return {
    providerId: 'workersai' as import('@/lib/types').ServiceName,
    modelId: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    apiKey: '',
    usedServerKey: true,
    requiresRateLimit: true,
  };
}
