import { describe, expect, it } from "vitest";
import { defaultTermTable, withExtraTerms } from "../../src/dictionary/term-table.js";
import { mainlandTermRule } from "../../src/rules/mainland-term.js";
import { fixWithRule, flaggedTexts, runRule } from "../helpers.js";

describe("mainland-term", () => {
  it("flags a Mainland China term", () => {
    expect(runRule(mainlandTermRule, "安裝軟件")).toEqual([
      expect.objectContaining({ start: 2, end: 4, suggestion: "軟體" })
    ]);
  });

  it("fixes a term with one replacement", () => {
    expect(fixWithRule(mainlandTermRule, "默認設置")).toBe("預設設定");
  });

  it("flags terms written in Simplified characters", () => {
    expect(flaggedTexts(mainlandTermRule, "安装软件")).toEqual(["软件"]);
    expect(fixWithRule(mainlandTermRule, "软件")).toBe("軟體");
  });

  it("prefers the longest term", () => {
    expect(runRule(mainlandTermRule, "數據庫")).toEqual([
      expect.objectContaining({ start: 0, end: 3, suggestion: "資料庫" })
    ]);
  });

  it("reports but does not fix a term with several replacements", () => {
    const [finding] = runRule(mainlandTermRule, "視頻");
    expect(finding?.suggestion).toBe("影片 / 視訊");
    expect(finding?.edits).toBeUndefined();
  });

  it("does not flag Taiwan terms", () => {
    expect(runRule(mainlandTermRule, "安裝軟體後到設定頁面調整預設值")).toEqual([]);
  });

  it("does not flag protected phrases", () => {
    expect(runRule(mainlandTermRule, "軟體動物與支持者")).toEqual([]);
  });

  it("does not flag terms that are also common in Taiwan", () => {
    expect(runRule(mainlandTermRule, "請參考這份文件的程序")).toEqual([]);
  });

  it("accepts extra project terms", () => {
    const terms = withExtraTerms(defaultTermTable(), { 質量: "品質", 渠道: ["通路", "管道"] });
    expect(fixWithRule(mainlandTermRule, "質量", { terms })).toBe("品質");
    expect(runRule(mainlandTermRule, "渠道", { terms })[0]?.suggestion).toBe("通路 / 管道");
    expect(runRule(mainlandTermRule, "質量")).toEqual([]);
  });

  it("keeps a replacement that contains its own term from being flagged again", () => {
    const terms = withExtraTerms(defaultTermTable(), { 簡訊: "簡訊驗證", 驗證碼: "驗證碼" });
    expect(fixWithRule(mainlandTermRule, "收簡訊啦", { terms })).toBe("收簡訊驗證啦");
    expect(runRule(mainlandTermRule, "收簡訊驗證啦", { terms })).toEqual([]);
    expect(runRule(mainlandTermRule, "驗證碼", { terms })).toEqual([]);
  });

  it("lets extra terms override protected phrases", () => {
    const terms = withExtraTerms(defaultTermTable(), { 通過: "透過" });
    expect(fixWithRule(mainlandTermRule, "通過", { terms })).toBe("透過");
  });
});
