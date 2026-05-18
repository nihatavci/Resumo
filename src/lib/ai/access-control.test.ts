import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { resolveAIRequest } from "./access-control";

const originalEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
};

afterEach(() => {
  process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  process.env.ANTHROPIC_API_KEY = originalEnv.ANTHROPIC_API_KEY;
  process.env.OPENROUTER_API_KEY = originalEnv.OPENROUTER_API_KEY;
});

describe("resolveAIRequest", () => {
  it("allows all users to use server-key models", () => {
    process.env.OPENAI_API_KEY = "server-openai";

    const result = resolveAIRequest({
      requestedModel: "gpt-5.4-nano",
      apiKeys: [],
      isPro: false,
    });

    assert.equal(result.providerId, "openai");
    assert.equal(result.modelId, "gpt-5.4-nano");
    assert.equal(result.apiKey, "server-openai");
    assert.equal(result.usedServerKey, true);
    assert.equal(result.requiresRateLimit, true);
  });

  it("allows all users to use OpenRouter models via server key", () => {
    process.env.OPENROUTER_API_KEY = "server-openrouter";

    const result = resolveAIRequest({
      requestedModel: "z-ai/glm-4.6:exacto",
      apiKeys: [],
      isPro: false,
    });

    assert.equal(result.providerId, "openrouter");
    assert.equal(result.modelId, "z-ai/glm-4.6:exacto");
    assert.equal(result.apiKey, "server-openrouter");
    assert.equal(result.usedServerKey, true);
    assert.equal(result.requiresRateLimit, true);
  });

  it("allows all users to use server-key pro models", () => {
    process.env.OPENAI_API_KEY = "server-openai";

    const result = resolveAIRequest({
      requestedModel: "gpt-5.5",
      apiKeys: [],
      isPro: false,
    });

    assert.equal(result.providerId, "openai");
    assert.equal(result.modelId, "gpt-5.5");
    assert.equal(result.apiKey, "server-openai");
    assert.equal(result.usedServerKey, true);
    assert.equal(result.requiresRateLimit, true);
  });

  it("allows BYOK users only when their key matches the requested model provider", () => {
    const result = resolveAIRequest({
      requestedModel: "claude-sonnet-4-6",
      apiKeys: [
        { service: "anthropic", key: "user-anthropic", addedAt: "2026-05-03" },
      ],
      isPro: false,
    });

    assert.equal(result.providerId, "anthropic");
    assert.equal(result.apiKey, "user-anthropic");
    assert.equal(result.usedServerKey, false);
    assert.equal(result.requiresRateLimit, false);

    assert.throws(
      () =>
        resolveAIRequest({
          requestedModel: "claude-sonnet-4-6",
          apiKeys: [
            { service: "openai", key: "user-openai", addedAt: "2026-05-03" },
          ],
          isPro: false,
        }),
      /Anthropic API key not found in user configuration/
    );
  });

  it("rejects unknown models", () => {
    assert.throws(
      () =>
        resolveAIRequest({
          requestedModel: "unknown/model",
          apiKeys: [],
          isPro: true,
        }),
      /Unknown model: unknown\/model/
    );
  });

  it("reports server-key usage for every allowed server-key call", () => {
    process.env.OPENAI_API_KEY = "server-openai";

    const result = resolveAIRequest({
      requestedModel: "gpt-5.4-nano",
      apiKeys: [],
      isPro: false,
    });

    assert.equal(result.usedServerKey, true);
  });
});
