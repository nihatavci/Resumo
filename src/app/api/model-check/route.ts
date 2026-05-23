// src/app/api/model-check/route.ts
// Temporary debug endpoint — confirms which model/provider is active.
import { auth } from '@clerk/nextjs/server';
import { getDefaultModel, getModelById, getProviderById } from '@/lib/ai-models';
import { generateText } from 'ai';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import type { LanguageModelV1 } from 'ai';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const defaultModelId = getDefaultModel(true);
  const model = getModelById(defaultModelId);
  const provider = model ? getProviderById(model.provider) : undefined;

  // Check if the env key is present (without exposing the value)
  const envKeyName = provider?.envKey ?? '';
  const envKeyPresent = envKeyName ? Boolean(process.env[envKeyName]) : false;

  // Do a live 1-token call to confirm the model actually responds
  let liveTest: { ok: boolean; text?: string; error?: string; resolvedProvider?: string; resolvedModel?: string } = { ok: false };

  try {
    const { model: aiModel, usageEventId, resolved } = await startAIUsageRequest({
      route: 'api.model-check',
      userId,
      isPro: true,
    });

    const result = await generateText({
      model: aiModel as LanguageModelV1,
      prompt: 'Reply with exactly the text: "DeepSeek online"',
      maxTokens: 10,
    });

    await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage: result.usage });

    liveTest = {
      ok: true,
      text: result.text.trim(),
      resolvedProvider: resolved.providerId,
      resolvedModel: resolved.modelId,
    };
  } catch (err) {
    liveTest = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  return Response.json({
    configuredDefault: defaultModelId,
    providerName: provider?.name ?? 'unknown',
    envKeyName,
    envKeyPresent,
    liveTest,
  });
}
