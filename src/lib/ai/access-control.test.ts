import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveAIRequest } from "./access-control";

describe("resolveAIRequest", () => {
  it("allows all users to use Workers AI models without API keys", () => {
    const result = resolveAIRequest({
      requestedModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      apiKeys: [],
      isPro: false,
    });

    assert.equal(result.providerId, "workersai");
    assert.equal(result.modelId, "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    assert.equal(result.apiKey, "");
    assert.equal(result.usedServerKey, true);
    assert.equal(result.requiresRateLimit, true);
  });

  it("resolves the 8B fast model", () => {
    const result = resolveAIRequest({
      requestedModel: "@cf/meta/llama-3.1-8b-instruct-fast",
      apiKeys: [],
      isPro: false,
    });

    assert.equal(result.providerId, "workersai");
    assert.equal(result.modelId, "@cf/meta/llama-3.1-8b-instruct-fast");
    assert.equal(result.usedServerKey, true);
  });

  it("resolves the Mistral model", () => {
    const result = resolveAIRequest({
      requestedModel: "@cf/mistralai/mistral-small-3.1-24b-instruct",
      apiKeys: [],
      isPro: true,
    });

    assert.equal(result.providerId, "workersai");
    assert.equal(result.modelId, "@cf/mistralai/mistral-small-3.1-24b-instruct");
    assert.equal(result.usedServerKey, true);
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

  it("reports server-key usage for Workers AI calls", () => {
    const result = resolveAIRequest({
      requestedModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      apiKeys: [],
      isPro: false,
    });

    assert.equal(result.usedServerKey, true);
  });
});
