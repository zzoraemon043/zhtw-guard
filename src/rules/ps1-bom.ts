import { containsNonAscii } from "../text/ascii.js";
import type { Finding, Rule, RuleInput } from "../types.js";

export const UTF8_BOM = "\uFEFF";

function isPowerShellScript(path: string | undefined): boolean {
  return path?.toLowerCase().endsWith(".ps1") ?? false;
}

function checkPowerShellBom({ text, path }: RuleInput): Finding[] {
  if (!isPowerShellScript(path) || text.startsWith(UTF8_BOM) || !containsNonAscii(text)) {
    return [];
  }
  return [
    {
      start: 0,
      end: 0,
      message: "PowerShell script contains non-ASCII text but has no UTF-8 BOM",
      suggestion: "save as UTF-8 with BOM",
      edits: [{ start: 0, end: 0, text: UTF8_BOM }]
    }
  ];
}

export const ps1BomRule: Rule = {
  id: "ps1-bom",
  check: checkPowerShellBom
};
