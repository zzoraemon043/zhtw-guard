import { describe, expect, it } from "vitest";
import { defaultTermTable } from "../../src/dictionary/term-table.js";
import { mojibakeRule } from "../../src/rules/mojibake.js";
import { runRule } from "../helpers.js";

function decodeUtf8BytesAs(encoding: string, text: string): string {
  return new TextDecoder(encoding).decode(new TextEncoder().encode(text));
}

describe("mojibake", () => {
  it("flags UTF-8 text decoded as cp950", () => {
    expect(runRule(mojibakeRule, "銝剜")).toEqual([
      expect.objectContaining({ start: 0, end: 2, suggestion: "中" })
    ]);
  });

  it("flags longer text with lost bytes as one finding", () => {
    const damaged = decodeUtf8BytesAs("big5", "設定檔案");
    const big5Findings = runRule(mojibakeRule, damaged).filter((finding) => finding.message.includes("Big5"));
    expect(big5Findings).toEqual([expect.objectContaining({ start: 0, end: damaged.length - 1, suggestion: "設檔" })]);
  });

  it("flags damaged text that was saved with question marks", () => {
    expect(runRule(mojibakeRule, "銝剜?")).toEqual([expect.objectContaining({ start: 0, end: 2, suggestion: "中" })]);
  });

  it("does not flag Chinese text that ends with a question mark", () => {
    expect(runRule(mojibakeRule, "這是什麼?請說明")).toEqual([]);
  });

  it("flags UTF-8 text decoded as Windows-1252", () => {
    const damaged = decodeUtf8BytesAs("windows-1252", "中文");
    expect(runRule(mojibakeRule, damaged)).toEqual([
      expect.objectContaining({ start: 0, end: damaged.length, suggestion: "中文" })
    ]);
  });

  it("flags replacement characters", () => {
    expect(runRule(mojibakeRule, "abc\uFFFD\uFFFDdef")).toEqual([
      expect.objectContaining({ start: 3, end: 5 })
    ]);
  });

  it("never fixes automatically", () => {
    expect(runRule(mojibakeRule, "銝剜").every((finding) => finding.edits === undefined)).toBe(true);
  });

  it("does not flag Traditional Chinese text", () => {
    expect(runRule(mojibakeRule, "請在設定頁面選擇預設的字型，然後重新開啟應用程式。")).toEqual([]);
  });

  it("does not flag Latin text with accents", () => {
    expect(runRule(mojibakeRule, "café, naïve, Zürich, São Paulo")).toEqual([]);
  });

  it("does not flag any Taiwan phrase in the term table", () => {
    const terms = defaultTermTable();
    const phrases = [...terms.replacements.values()].flat().concat([...terms.protectedPhrases]);
    expect(phrases.filter((phrase) => runRule(mojibakeRule, phrase).length > 0)).toEqual([]);
  });
});
