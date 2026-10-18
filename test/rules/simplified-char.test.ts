import { describe, expect, it } from "vitest";
import { simplifiedCharRule } from "../../src/rules/simplified-char.js";
import { fixWithRule, flaggedTexts, runRule } from "../helpers.js";

describe("simplified-char", () => {
  it("flags a Simplified character with one Traditional form", () => {
    const [finding] = runRule(simplifiedCharRule, "请设定");
    expect(finding).toMatchObject({ start: 0, end: 1, suggestion: "請" });
    expect(flaggedTexts(simplifiedCharRule, "请设定")).toEqual(["请", "设"]);
  });

  it("fixes Simplified characters", () => {
    expect(fixWithRule(simplifiedCharRule, "软件设定")).toBe("軟件設定");
  });

  it("uses Taiwan variant forms", () => {
    expect(fixWithRule(simplifiedCharRule, "因为")).toBe("因為");
  });

  it("does not flag Traditional text", () => {
    expect(runRule(simplifiedCharRule, "請到設定頁面調整")).toEqual([]);
  });

  it("does not flag characters that are also Traditional", () => {
    expect(runRule(simplifiedCharRule, "干擾、公里、皇后、台北")).toEqual([]);
  });

  it("does not flag characters with several Traditional forms", () => {
    expect(runRule(simplifiedCharRule, "头发")).toHaveLength(1);
    expect(flaggedTexts(simplifiedCharRule, "头发")).toEqual(["头"]);
  });

  it("does not flag ASCII text", () => {
    expect(runRule(simplifiedCharRule, "const value = 1;")).toEqual([]);
  });
});
