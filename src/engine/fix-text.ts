import { applyEdits, selectNonOverlapping } from "./apply-edits.js";
import { enabledRules, runRule, type TextTarget } from "./run-rules.js";
import type { CheckSettings } from "./settings.js";

export interface FixResult {
  text: string;
  fixedCount: number;
}

export function fixText(target: TextTarget, settings: CheckSettings): FixResult {
  let text = target.text;
  let fixedCount = 0;
  for (const { rule } of enabledRules(settings)) {
    const findings = runRule(rule, { ...target, text }, settings).filter((finding) => (finding.edits?.length ?? 0) > 0);
    const edits = selectNonOverlapping(findings.flatMap((finding) => finding.edits ?? []));
    if (edits.length === 0) {
      continue;
    }
    text = applyEdits(text, edits);
    fixedCount += findings.length;
  }
  return { text, fixedCount };
}
