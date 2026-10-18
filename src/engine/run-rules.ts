import { ALL_RULES } from "../rules/index.js";
import type { Finding, Rule, Severity } from "../types.js";
import type { CheckSettings } from "./settings.js";

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
    return setting === "off" ? [] : [{ rule, severity: setting }];
  });
}

export function runRule(rule: Rule, target: TextTarget, settings: CheckSettings): Finding[] {
  return rule.check({
    text: target.text,
    terms: settings.terms,
    ...(target.filePath === undefined ? {} : { path: target.filePath })
  });
}

export function runEnabledRules(target: TextTarget, settings: CheckSettings): RuleFinding[] {
  return enabledRules(settings).flatMap(({ rule, severity }) =>
    runRule(rule, target, settings).map((finding) => ({ rule, severity, finding }))
  );
}
