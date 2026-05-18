import type { LanguageModelUsage, LanguageModelV1, TelemetrySettings } from "ai";

import { checkRateLimit } from "@/lib/rateLimiter";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerAnalyticsEvent } from "@/lib/analytics/server";
import { getDefaultModel } from "@/lib/ai-models";
import { buildPostHogAITelemetry } from "@/lib/ai/posthog-telemetry";
import {
  resolveAIRequest,
  type ResolvedAIRequest,
} from "@/lib/ai/access-control";
import { createAIClientFromResolvedRequest, type AIConfig } from "@/utils/ai-tools";
import { insertAIUsageEvent, updateAIUsageEvent } from "@/lib/db";

type AIUsageStatus = "succeeded" | "failed" | "rate_limited" | "blocked";

export class AIUsageError extends Error {
  constructor(
    message: string,
    public readonly code: "blocked" | "rate_limited" | "failed",
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "AIUsageError";
  }
}

export async function recordAIUsageStarted(input: {
  userId: string;
  route: string;
  provider: string;
  model: string;
  isPro?: boolean;
  usedServerKey: boolean;
}): Promise<string> {
  const id = await insertAIUsageEvent({
    userId: input.userId,
    route: input.route,
    provider: input.provider,
    model: input.model,
    isPro: true,
    usedServerKey: input.usedServerKey,
    status: "started",
  });

  await captureServerAnalyticsEvent({
    distinctId: input.userId,
    event: AnalyticsEvents.AIRequestStarted,
    properties: {
      route: input.route,
      provider: input.provider,
      model: input.model,
      is_pro: true,
      used_server_key: input.usedServerKey,
    },
  });

  return id;
}

export async function recordAIUsageFinished(input: {
  id: string;
  status: AIUsageStatus;
  errorCode?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}): Promise<void> {
  await updateAIUsageEvent(input.id, {
    status: input.status,
    errorCode: input.errorCode,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    totalTokens: input.totalTokens,
  });

  // Note: Analytics event is best-effort. We no longer re-read the row since
  // D1 UPDATE doesn't return the updated row.  The usage event id is sufficient
  // for reconciliation and the detailed analytics are captured at start time.
}

export function usageFromLanguageModelUsage(usage?: LanguageModelUsage) {
  if (!usage) {
    return {};
  }

  return {
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  };
}

export async function finishAIUsageRequest(input: {
  usageEventId: string;
  status: AIUsageStatus;
  usage?: LanguageModelUsage;
  errorCode?: string;
}) {
  await recordAIUsageFinished({
    id: input.usageEventId,
    status: input.status,
    errorCode: input.errorCode,
    ...usageFromLanguageModelUsage(input.usage),
  });
}

export async function startAIUsageRequest(input: {
  userId: string;
  route: string;
  config?: AIConfig;
  isPro?: boolean;
  useThinking?: boolean;
}): Promise<{
  model: LanguageModelV1;
  usageEventId: string;
  resolved: ResolvedAIRequest;
  telemetry: TelemetrySettings;
}> {
  const requestedModel = input.config?.model ?? getDefaultModel(true);

  let resolved: ResolvedAIRequest;
  try {
    resolved = resolveAIRequest({
      requestedModel,
      apiKeys: input.config?.apiKeys ?? [],
      isPro: true,
    });
  } catch (error) {
    const usageEventId = await recordAIUsageStarted({
      userId: input.userId,
      route: input.route,
      provider: "unknown",
      model: requestedModel,
      isPro: true,
      usedServerKey: false,
    });

    await recordAIUsageFinished({
      id: usageEventId,
      status: "blocked",
      errorCode: error instanceof Error ? error.message : "access_denied",
    });

    throw new AIUsageError(
      error instanceof Error ? error.message : "AI request blocked",
      "blocked",
      403
    );
  }

  const usageEventId = await recordAIUsageStarted({
    userId: input.userId,
    route: input.route,
    provider: resolved.providerId,
    model: resolved.modelId,
    isPro: true,
    usedServerKey: resolved.usedServerKey,
  });

  if (resolved.requiresRateLimit) {
    try {
      await checkRateLimit(input.userId);
    } catch (error) {
      await recordAIUsageFinished({
        id: usageEventId,
        status: "rate_limited",
        errorCode: error instanceof Error ? error.message : "rate_limit_exceeded",
      });

      throw new AIUsageError(
        error instanceof Error ? error.message : "Rate limit exceeded",
        "rate_limited",
        429
      );
    }
  }

  return {
    model: createAIClientFromResolvedRequest(resolved, input.useThinking),
    usageEventId,
    resolved,
    telemetry: buildPostHogAITelemetry({
      route: input.route,
      userId: input.userId,
      usageEventId,
      isPro: true,
      resolved,
    }),
  };
}
