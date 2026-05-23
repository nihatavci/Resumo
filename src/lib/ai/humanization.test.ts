import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HUMANIZATION_INSTRUCTIONS } from "./humanization";

describe("HUMANIZATION_INSTRUCTIONS", () => {
  it("is a non-empty string of substantial length", () => {
    assert.equal(typeof HUMANIZATION_INSTRUCTIONS, "string");
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.length > 2500,
      `expected >2500 chars, got ${HUMANIZATION_INSTRUCTIONS.length}`,
    );
  });

  it("contains the writing voice section header", () => {
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("WRITING STYLE — HUMAN, NOT AI"),
      "missing writing voice header",
    );
  });

  it("contains all critical banned verbs", () => {
    const required = [
      "leveraged",
      "spearheaded",
      "orchestrated",
      "utilized",
      "garnered",
      "fostered",
      "championed",
    ];
    for (const word of required) {
      assert.ok(
        HUMANIZATION_INSTRUCTIONS.includes(word),
        `missing banned verb: ${word}`,
      );
    }
  });

  it("contains key banned phrases", () => {
    const required = [
      "cross-functional teams",
      "results-driven",
      "proven track record",
      "synergy",
      "thought leader",
    ];
    for (const phrase of required) {
      assert.ok(
        HUMANIZATION_INSTRUCTIONS.includes(phrase),
        `missing banned phrase: ${phrase}`,
      );
    }
  });

  it("contains structural variation section", () => {
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("STRUCTURAL VARIATION"),
      "missing structural variation section",
    );
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("BULLET LENGTH"),
      "missing bullet length rule",
    );
  });

  it("contains professional summary rules", () => {
    assert.ok(
      HUMANIZATION_INSTRUCTIONS.includes("PROFESSIONAL SUMMARY"),
      "missing professional summary rules",
    );
  });

  it("contains key forbidden qualifiers", () => {
    const required = [
      "significantly",
      "successfully",
      "effectively",
      "various",
      "numerous",
      "unique",
    ];
    for (const word of required) {
      assert.ok(
        HUMANIZATION_INSTRUCTIONS.includes(word),
        `missing forbidden qualifier: ${word}`,
      );
    }
  });
});
