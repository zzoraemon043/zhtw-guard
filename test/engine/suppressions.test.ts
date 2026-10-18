import { describe, expect, it } from "vitest";
import { checkText } from "../../src/engine/check-text.js";
import { fixText } from "../../src/engine/fix-text.js";
import { defaultSettings } from "../../src/engine/settings.js";

function rulesFound(text: string, allow: string[] = []): string[] {
  return checkText({ text }, { ...defaultSettings(), allow }).map((issue) => `${issue.line}:${issue.rule}`);
}

describe("inline ignore", () => {
  it("skips a line that ends with the marker", () => {
    expect(rulesFound("设定 zhtw-guard-ignore\n设定\n")).toEqual(["2:simplified-char"]);
  });

  it("accepts the marker inside a trailing comment", () => {
    expect(rulesFound("const label = \"设定\"; // zhtw-guard-ignore\n")).toEqual([]);
    expect(rulesFound("设定 <!-- zhtw-guard-ignore -->\n")).toEqual([]);
    expect(rulesFound("/* 设定 zhtw-guard-ignore */\n")).toEqual([]);
  });

  it("works with CRLF line endings", () => {
    expect(rulesFound("设定 zhtw-guard-ignore\r\n設定\r\n")).toEqual([]);
  });

  it("does not skip a line where the marker is not at the end", () => {
    expect(rulesFound("zhtw-guard-ignore 设定\n")).toEqual(["1:simplified-char"]);
  });

  it("keeps ignored lines unchanged when fixing", () => {
    const settings = defaultSettings();
    expect(fixText({ text: "设定 zhtw-guard-ignore\n设定\n" }, settings).text).toBe("设定 zhtw-guard-ignore\n設定\n");
  });
});

describe("allow", () => {
  it("does not flag allowed words", () => {
    expect(rulesFound("视频与视频号", ["视频号"])).toEqual([
      "1:simplified-char",
      "1:mainland-term",
      "1:simplified-char",
      "1:simplified-char"
    ]);
  });

  it("flags the same text when it is not allowed", () => {
    expect(rulesFound("视频号")).toHaveLength(4);
  });

  it("keeps allowed words unchanged when fixing", () => {
    const settings = { ...defaultSettings(), allow: ["软件"] };
    expect(fixText({ text: "软件与软体" }, settings).text).toBe("软件與軟體");
  });
});
