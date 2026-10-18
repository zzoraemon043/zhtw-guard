import { describe, expect, it } from "vitest";
import { ALL_RULES } from "../../src/rules/index.js";
import { RULE_IDS, type RuleId } from "../../src/types.js";
import { runRule } from "../helpers.js";

interface RuleCase {
  text: string;
  path?: string;
}

interface RuleCases {
  flagged: RuleCase[];
  clean: RuleCase[];
}

const CASES: Record<RuleId, RuleCases> = {
  "simplified-char": {
    flagged: [{ text: "设定" }, { text: "这个问题" }, { text: "说明文档" }],
    clean: [{ text: "設定" }, { text: "這個問題" }, { text: "干擾與公里" }]
  },
  "mainland-term": {
    flagged: [{ text: "軟件" }, { text: "默認值" }, { text: "打开软件" }],
    clean: [{ text: "軟體" }, { text: "預設值" }, { text: "打開軟體" }]
  },
  "ambiguous-char": {
    flagged: [{ text: "头发" }, { text: "复制" }, { text: "一个" }],
    clean: [{ text: "頭髮" }, { text: "複製" }, { text: "一個" }]
  },
  mojibake: {
    flagged: [{ text: "銝剜" }, { text: "Ã¤Â¸Â­" }, { text: "abc\uFFFD" }],
    clean: [{ text: "中文" }, { text: "Größe" }, { text: "建構函式與解構函式" }]
  },
  "ps1-bom": {
    flagged: [{ text: 'Write-Host "中文"', path: "a.ps1" }],
    clean: [
      { text: '\uFEFFWrite-Host "中文"', path: "a.ps1" },
      { text: 'Write-Host "ok"', path: "a.ps1" },
      { text: "中文", path: "a.md" }
    ]
  },
  "line-ending": {
    flagged: [{ text: "a\r\nb\n" }, { text: "a\nb\nc\r\n" }],
    clean: [{ text: "a\nb\n" }, { text: "a\r\nb\r\n" }, { text: "a" }]
  }
};

function optionsFor(ruleCase: RuleCase): { path?: string } {
  return ruleCase.path === undefined ? {} : { path: ruleCase.path };
}

describe("rule cases", () => {
  it("covers every rule", () => {
    expect(ALL_RULES.map((rule) => rule.id)).toEqual([...RULE_IDS]);
    for (const id of RULE_IDS) {
      expect(CASES[id].flagged.length).toBeGreaterThan(0);
      expect(CASES[id].clean.length).toBeGreaterThan(0);
    }
  });

  describe.each(ALL_RULES.map((rule) => [rule.id, rule] as const))("%s", (id, rule) => {
    it.each(CASES[id].flagged.map((ruleCase) => [JSON.stringify(ruleCase.text), ruleCase] as const))(
      "flags %s",
      (_label, ruleCase) => {
        expect(runRule(rule, ruleCase.text, optionsFor(ruleCase)).length).toBeGreaterThan(0);
      }
    );

    it.each(CASES[id].clean.map((ruleCase) => [JSON.stringify(ruleCase.text), ruleCase] as const))(
      "does not flag %s",
      (_label, ruleCase) => {
        expect(runRule(rule, ruleCase.text, optionsFor(ruleCase))).toEqual([]);
      }
    );
  });
});
