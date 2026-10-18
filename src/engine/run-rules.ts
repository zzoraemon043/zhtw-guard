import { ALL_RULES } from "../rules/index.js";
import type { Finding, Rule, RuleId, Severity } from "../types.js";
import type { CheckSettings } from "./settings.js";
import { createSuppressionFilter } from "./suppressions.js";

const REPLY_RULE_ID: RuleId = "reply-language";

export interface TextTarget {
  text: string;
  filePath?: string;
}

export interface RuleFinding {
  rule: Rule;
  severity: Severity;
  finding: Finding;
}

export function enabledRules(settings: CheckSettings): Array<{ rule: Rule; severity: Severity }> {
  return ALL_RULES.flatMap((rule) => {
    const setting = settings.rules[rule.id];
    const skipped = setting === "off" || (rule.id === REPLY_RULE_ID && settings.replyMode !== true);
    return skipped ? [] : [{ rule, severity: setting }];
  });
}

export function runRule(rule: Rule, target: TextTarget, settings: CheckSettings): Finding[] {
  const findings = rule.check({
    text: target.text,
    terms: settings.terms,
    ...(target.filePath === undefined ? {} : { path: target.filePath })
  });
  return findings.length === 0 ? findings : findings.filter(createSuppressionFilter(target.text, settings.allow));
}

export function runEnabledRules(target: TextTarget, settings: CheckSettings): RuleFinding[] {
  return enabledRules(settings).flatMap(({ rule, severity }) =>
    runRule(rule, target, settings).map((finding) => ({ rule, severity, finding }))
  );
}
