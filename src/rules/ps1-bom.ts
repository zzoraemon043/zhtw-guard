import { containsNonAscii } from "../text/ascii.js";
import type { Finding, Rule, RuleInput } from "../types.js";

export const UTF8_BOM = "\uFEFF";

const powerShellExtensions = [".ps1", ".psm1", ".psd1"];

function isPowerShellScript(path: string | undefined): boolean {
  const lowerPath = path?.toLowerCase();
  return lowerPath !== undefined && powerShellExtensions.some((extension) => lowerPath.endsWith(extension));
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
      wholeFile: true,
      suggestion: "save as UTF-8 with BOM",
      edits: [{ start: 0, end: 0, text: UTF8_BOM }]
    }
  ];
}

export const ps1BomRule: Rule = {
  id: "ps1-bom",
  check: checkPowerShellBom
};
