import { describe, expect, it } from "vitest";
import { replyLanguageRule } from "../../src/rules/reply-language.js";
import { runRule } from "../helpers.js";

const FLAGGED: ReadonlyArray<readonly [string, string, string]> = [
  ["an English reply", "Sure, I will update the config file.", "English"],
  ["an English first sentence before Chinese", "Done! 已經更新設定檔。", "English"],
  ["a Simplified Chinese reply", "好的，我来修改这个文件。", "Simplified Chinese"],
  ["Simplified Chinese with an ambiguous character", "已经发布新版本。", "Simplified Chinese"],
  ["a Japanese reply", "了解しました。設定を変更します。", "Japanese"],
  ["English after a code block", "```sh\nnpm test\n```\nAll tests passed.", "English"],
  ["English after a path", "src/index.ts: updated the exports.", "English"],
  ["English after a URL", "https://example.com/docs explains the setup.", "English"],
  ["an English heading", "## Summary\n\n這次修改了三個檔案。", "English"],
  ["an English top-level heading", "# Changes\n\n這次修改了三個檔案。", "English"],
  ["mostly English with one Chinese word", "I fixed the parser and updated all the tests 了", "English"],
  ["Simplified Chinese after a command", "npm run build\n构建完成。", "Simplified Chinese"],
  ["English after inline code", "`zhtw-guard check` reports nothing now.", "English"]
];

const CLEAN: ReadonlyArray<readonly [string, string]> = [
  ["a Traditional Chinese reply", "好的，我來修改這個檔案。"],
  ["Traditional Chinese with English terms", "我把 React Query 的 useQuery hook 換成新的寫法。"],
  ["a command line followed by Chinese", "npm run build\n建置完成，沒有錯誤。"],
  ["a shell prompt followed by Chinese", "$ git status\n工作區是乾淨的。"],
  ["a path followed by Chinese", "src/cli/main.ts：已加上新的參數。"],
  ["a Windows path followed by Chinese", "C:\\Users\\dev\\project\\README.md 已更新。"],
  ["inline code followed by Chinese", "`npm test` 全部通過。"],
  ["a code block followed by Chinese", "```ts\nconst value = 1;\n```\n上面的程式已經修正。"],
  ["a URL followed by Chinese", "https://github.com/zzoraemon043/zhtw-guard 這是專案網址。"],
  ["a file name followed by Chinese", "package.json 的版本已改為 0.2.0。"],
  ["punctuation before Chinese", "---\n\n> 已完成以下修改："],
  ["a command with flags followed by Chinese", "git push -u origin main\n推送完成。"],
  ["text with no words", "```\nonly code\n```"],
  ["an empty reply", ""]
];

describe("reply-language", () => {
  it.each(FLAGGED)("flags %s", (_name, text, language) => {
    const findings = runRule(replyLanguageRule, text);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toBe(`Reply starts in ${language}, not Traditional Chinese`);
    expect(findings[0]?.edits).toBeUndefined();
  });

  it.each(CLEAN)("does not flag %s", (_name, text) => {
    expect(runRule(replyLanguageRule, text)).toEqual([]);
  });

  it("points at the first sentence", () => {
    const text = "```\nx\n```\nOkay. 好的。";
    const [finding] = runRule(replyLanguageRule, text);
    expect(text.slice(finding?.start, finding?.end)).toBe("Okay");
  });

  it("has at least ten cases each way", () => {
    expect(FLAGGED.length).toBeGreaterThanOrEqual(10);
    expect(CLEAN.length).toBeGreaterThanOrEqual(10);
  });
});
