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

  // Fallback for any non-workersai provider (should not happen with current config)
  const envKey = provider.envKey ? process.env[provider.envKey] : undefined;
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
  if (!userApiKey) {
    throw new Error(`${provider.name} API key not found in user configuration`);
  }

  return {
    providerId: model.provider,
    modelId: model.id,
    apiKey: userApiKey,
    usedServerKey: false,
    requiresRateLimit: false,
  };
}
