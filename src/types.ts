export const RULE_IDS = [
  "simplified-char",
  "mainland-term",
  "ambiguous-char",
  "mojibake",
  "ps1-bom",
  "line-ending",
  "reply-language"
] as const;

export type RuleId = (typeof RULE_IDS)[number];

export type Severity = "error" | "warning";

export type RuleSetting = Severity | "off";

export interface TextEdit {
  start: number;
  end: number;
  text: string;
}

export interface Finding {
  start: number;
  end: number;
  message: string;
  suggestion?: string;
  edits?: TextEdit[];
}

export type Strictness = "default" | "strict";

export const STRICTNESS_LEVELS: readonly Strictness[] = ["default", "strict"];

export interface TermTable {
  replacements: ReadonlyMap<string, readonly string[]>;
  reportOnly: ReadonlySet<string>;
  protectedPhrases: ReadonlySet<string>;
}

export interface RuleInput {
  text: string;
  path?: string;
  terms: TermTable;
}

export interface Rule {
  id: RuleId;
  check(input: RuleInput): Finding[];
}

export interface Issue {
  path: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  rule: RuleId;
  severity: Severity;
  message: string;
  suggestion?: string;
  fixable: boolean;
}
