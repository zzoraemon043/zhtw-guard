import { describe, expect, it } from "vitest";
import { ambiguousCharRule } from "../../src/rules/ambiguous-char.js";
import { fixWithRule, runRule } from "../helpers.js";

describe("ambiguous-char", () => {
  it("reports every Traditional form of an ambiguous character", () => {
    expect(runRule(ambiguousCharRule, "头发")).toEqual([
      expect.objectContaining({ start: 1, end: 2, suggestion: "發 / 髮" })
    ]);
  });

  it("never fixes automatically", () => {
    expect(fixWithRule(ambiguousCharRule, "出发")).toBe("出发");
    expect(runRule(ambiguousCharRule, "出发")[0]?.edits).toBeUndefined();
  });

  it("does not flag the Traditional forms", () => {
    expect(runRule(ambiguousCharRule, "出發前去理髮")).toEqual([]);
  });

  it("does not flag Simplified characters with one Traditional form", () => {
    expect(runRule(ambiguousCharRule, "设定")).toEqual([]);
  });
});
