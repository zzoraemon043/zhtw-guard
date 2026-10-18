import { describe, expect, it } from "vitest";
import { checkText, defaultSettings, fixText, RULE_IDS } from "../src/index.js";

describe("library API", () => {
  it("checks text", () => {
    expect(checkText({ text: "设定" }, defaultSettings())).toEqual([
      expect.objectContaining({ path: "<text>", rule: "simplified-char", line: 1, column: 1 })
    ]);
  });

  it("fixes text", () => {
    expect(fixText({ text: "默认设置" }, defaultSettings())).toEqual({ text: "預設設定", fixedCount: 4 });
  });

  it("returns nothing for clean text", () => {
    expect(checkText({ text: "預設設定" }, defaultSettings())).toEqual([]);
  });

  it("lists every rule", () => {
    expect(RULE_IDS).toHaveLength(6);
  });
});
