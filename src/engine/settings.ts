import { defaultTermTable } from "../dictionary/term-table.js";
import { RULE_IDS, type RuleId, type RuleSetting, type TermTable } from "../types.js";

export interface CheckSettings {
  rules: Readonly<Record<RuleId, RuleSetting>>;
  allow: readonly string[];
  terms: TermTable;
}

export function defaultRuleSettings(): Record<RuleId, RuleSetting> {
  return Object.fromEntries(RULE_IDS.map((id) => [id, "error"])) as Record<RuleId, RuleSetting>;
}

export function defaultSettings(): CheckSettings {
  return { rules: defaultRuleSettings(), allow: [], terms: defaultTermTable() };
}
