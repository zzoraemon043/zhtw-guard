import { describe, expect, it } from "vitest";
import { readTermFile, termTableFor } from "../../src/dictionary/term-table.js";
import { checkText } from "../../src/engine/check-text.js";
import { fixText } from "../../src/engine/fix-text.js";
import { defaultSettings } from "../../src/engine/settings.js";
import { ambiguousCharRule } from "../../src/rules/ambiguous-char.js";
import { mainlandTermRule } from "../../src/rules/mainland-term.js";
import { simplifiedCharRule } from "../../src/rules/simplified-char.js";
import { fixWithRule, runRule } from "../helpers.js";

interface StrictCase {
  flagged: string;
  clean: string;
}

const STRICT_CASES: Record<string, StrictCase> = {
  支持: { flagged: "這個版本不支持舊格式", clean: "這個版本不支援舊格式" },
  對象: { flagged: "建立一個新的對象", clean: "建立一個新的物件" },
  數據: { flagged: "把數據寫回磁碟", clean: "把資料寫回磁碟" },
  消息: { flagged: "顯示錯誤消息", clean: "顯示錯誤訊息" },
  程序: { flagged: "這段程序會讀取設定", clean: "這段程式會讀取設定" },
  文件: { flagged: "請開啟設定文件", clean: "請開啟設定檔案" },
  函數: { flagged: "呼叫這個函數", clean: "呼叫這個函式" },
  項目: { flagged: "建立新的項目", clean: "建立新的專案" },
  類型: { flagged: "參數的類型不對", clean: "參數的型別不對" },
  設備: { flagged: "連上行動設備", clean: "連上行動裝置" },
  查看: { flagged: "查看執行紀錄", clean: "檢視執行紀錄" },
  連接: { flagged: "資料庫連接失敗", clean: "資料庫連線失敗" },
  登錄: { flagged: "請先登錄帳號", clean: "請先登入帳號" },
  窗口: { flagged: "關閉這個窗口", clean: "關閉這個視窗" },
  保存: { flagged: "保存目前的變更", clean: "儲存目前的變更" },
  刷新: { flagged: "按下按鈕刷新頁面", clean: "按下按鈕重新整理頁面" },
  字體: { flagged: "更換等寬字體", clean: "更換等寬字型" },
  地址: { flagged: "伺服器的 IP 地址", clean: "伺服器的 IP 位址" },
  訪問: { flagged: "沒有權限訪問這個資源", clean: "沒有權限存取這個資源" },
  通過: { flagged: "通過環境變數設定", clean: "透過環境變數設定" },
  菜單: { flagged: "從右鍵菜單選擇", clean: "從右鍵選單選擇" },
  循環: { flagged: "在循環裡累加", clean: "在迴圈裡累加" },
  打開: { flagged: "打開終端機", clean: "開啟終端機" },
  鏡像: { flagged: "下載容器鏡像", clean: "下載容器映像檔" },
  圖像: { flagged: "壓縮圖像大小", clean: "壓縮影像大小" },
  交互: { flagged: "使用者交互流程", clean: "使用者互動流程" },
  發佈: { flagged: "發佈新版本", clean: "發布新版本" }
};

const strictFile = readTermFile("tw-terms-strict.json");
const strict = termTableFor("strict");
const defaults = termTableFor("default");
const strictSettings = { ...defaultSettings(), terms: strict };

function expectUntouchedInStrictMode(text: string): void {
  expect(strictTermFindings(text)).toEqual([]);
  expect(fixWithRule(mainlandTermRule, text, { terms: strict })).toBe(text);
  expect(checkText({ text }, strictSettings)).toEqual([]);
  expect(fixText({ text }, strictSettings).text).toBe(text);
}

function strictTermFindings(text: string): string[] {
  return runRule(mainlandTermRule, text, { terms: strict }).map((finding) => text.slice(finding.start, finding.end));
}

describe("tw-terms-strict.json", () => {
  it("has hand-written cases for exactly its entries", () => {
    expect(Object.keys(STRICT_CASES).sort()).toEqual([...strictFile.replacements.keys()].sort());
  });

  describe.each(Object.entries(STRICT_CASES))("%s", (term, { flagged, clean }) => {
    it("is flagged in strict mode", () => {
      expect(strictTermFindings(flagged)).toContain(term);
    });

    it("is not flagged in default mode", () => {
      const findings = runRule(mainlandTermRule, flagged, { terms: defaults });
      expect(findings.map((finding) => flagged.slice(finding.start, finding.end))).not.toContain(term);
    });

    it("leaves the Taiwan wording alone in strict mode", () => {
      expect(strictTermFindings(clean)).toEqual([]);
    });

    it("fixes only entries that are not report-only", () => {
      const fixed = fixWithRule(mainlandTermRule, flagged, { terms: strict });
      expect(fixed).toBe(strictFile.reportOnly.has(term) ? flagged : clean);
    });
  });

  it("lists only known terms as report-only", () => {
    expect([...strictFile.reportOnly].filter((term) => !strictFile.replacements.has(term))).toEqual([]);
  });

  it("does not repeat terms from the default table", () => {
    expect([...strictFile.replacements.keys()].filter((term) => defaults.replacements.has(term))).toEqual([]);
  });

  it("uses replacements that pass every vocabulary rule in strict mode", () => {
    const failures = [...strictFile.replacements.values()].flat().filter((replacement) =>
      [simplifiedCharRule, ambiguousCharRule, mainlandTermRule].some(
        (rule) => runRule(rule, replacement, { terms: strict }).length > 0
      )
    );
    expect(failures).toEqual([]);
  });

  it("never flags a strict protected phrase", () => {
    expect([...strictFile.protectedPhrases].filter((phrase) => strictTermFindings(phrase).length > 0)).toEqual([]);
  });

  it("never flags a default protected phrase that strict mode does not override", () => {
    const kept = [...defaults.protectedPhrases].filter((phrase) => !strictFile.replacements.has(phrase));
    expect(kept.filter((phrase) => strictTermFindings(phrase).length > 0)).toEqual([]);
  });

  it.each(["大數據", "數據機"])("does not report or fix %s", (phrase) => {
    expectUntouchedInStrictMode(`使用${phrase}處理`);
  });

  it("does not fix 交互作用 into 互動作用", () => {
    expectUntouchedInStrictMode("藥物的交互作用");
  });

  it("keeps every default entry", () => {
    expect([...defaults.replacements.keys()].filter((term) => !strict.replacements.has(term))).toEqual([]);
  });
});
