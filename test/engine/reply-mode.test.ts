import { describe, expect, it } from "vitest";
import { checkText } from "../../src/engine/check-text.js";
import { defaultSettings } from "../../src/engine/settings.js";

describe("reply mode", () => {
  it("does not run reply-language by default", () => {
    expect(checkText({ text: "Sure, I will fix it." }, defaultSettings())).toEqual([]);
  });

  it("runs reply-language in reply mode", () => {
    const issues = checkText({ text: "Sure, I will fix it." }, { ...defaultSettings(), replyMode: true });
    expect(issues.map((issue) => issue.rule)).toEqual(["reply-language"]);
  });

  it("respects a rule turned off in reply mode", () => {
    const settings = defaultSettings();
    const rules = { ...settings.rules, "reply-language": "off" as const };
    expect(checkText({ text: "Sure." }, { ...settings, rules, replyMode: true })).toEqual([]);
  });
});
