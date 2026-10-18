import { describe, expect, it } from "vitest";
import { lineEndingRule } from "../../src/rules/line-ending.js";
import { fixWithRule, runRule } from "../helpers.js";

describe("line-ending", () => {
  it("flags mixed line endings at the first line that differs from the majority", () => {
    expect(runRule(lineEndingRule, "a\nb\nc\r\nd\n")).toEqual([
      expect.objectContaining({ start: 5, end: 7, message: "Mixed line endings: 1 CRLF and 3 LF" })
    ]);
  });

  it("converts to LF when LF is the majority", () => {
    expect(fixWithRule(lineEndingRule, "a\nb\r\nc\n")).toBe("a\nb\nc\n");
  });

  it("converts to CRLF when CRLF is the majority", () => {
    expect(fixWithRule(lineEndingRule, "a\r\nb\nc\r\n")).toBe("a\r\nb\r\nc\r\n");
  });

  it("converts to LF on a tie", () => {
    expect(fixWithRule(lineEndingRule, "a\r\nb\n")).toBe("a\nb\n");
  });

  it("does not flag consistent LF", () => {
    expect(runRule(lineEndingRule, "a\nb\nc\n")).toEqual([]);
  });

  it("does not flag consistent CRLF", () => {
    expect(runRule(lineEndingRule, "a\r\nb\r\n")).toEqual([]);
  });

  it("does not flag text without line breaks", () => {
    expect(runRule(lineEndingRule, "a")).toEqual([]);
  });
});
