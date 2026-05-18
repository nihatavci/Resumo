import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getTaskModel, withTaskModel } from "./task-models";
import type { AIConfig } from "@/lib/ai-models";

describe("task model routing", () => {
  it("routes full resume tailoring to the 70B model regardless of plan", () => {
    assert.equal(getTaskModel("jobTailoring", false), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    assert.equal(getTaskModel("jobTailoring", true), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  });

  it("routes extraction and simple tasks to the 8B fast model", () => {
    assert.equal(getTaskModel("structuredExtraction", false), "@cf/meta/llama-3.1-8b-instruct-fast");
    assert.equal(getTaskModel("structuredExtraction", true), "@cf/meta/llama-3.1-8b-instruct-fast");
    assert.equal(getTaskModel("simpleRewrite", false), "@cf/meta/llama-3.1-8b-instruct-fast");
    assert.equal(getTaskModel("simpleRewrite", true), "@cf/meta/llama-3.1-8b-instruct-fast");
  });

  it("routes content generation and cover letters to the 70B model", () => {
    assert.equal(getTaskModel("contentGeneration", false), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    assert.equal(getTaskModel("contentGeneration", true), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    assert.equal(getTaskModel("coverLetter", false), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    assert.equal(getTaskModel("coverLetter", true), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  });

  it("routes chat assistant to the 70B model regardless of plan", () => {
    assert.equal(getTaskModel("chatAssistant", false), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    assert.equal(getTaskModel("chatAssistant", true), "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  });

  it("preserves API keys and custom prompts while replacing the model", () => {
    const config: AIConfig = {
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      apiKeys: [],
      customPrompts: {
        textAnalyzer: "Extract carefully.",
      },
    };

    const resolved = withTaskModel({
      task: "structuredExtraction",
      isPro: false,
      config,
    });

    assert.equal(resolved.model, "@cf/meta/llama-3.1-8b-instruct-fast");
    assert.deepEqual(resolved.apiKeys, config.apiKeys);
    assert.deepEqual(resolved.customPrompts, config.customPrompts);
  });

  it("can intentionally preserve a selected model for future override paths", () => {
    const resolved = withTaskModel({
      task: "chatAssistant",
      isPro: true,
      config: {
        model: "@cf/mistralai/mistral-small-3.1-24b-instruct",
        apiKeys: [],
      },
      respectSelectedModel: true,
    });

    assert.equal(resolved.model, "@cf/mistralai/mistral-small-3.1-24b-instruct");
  });
});
