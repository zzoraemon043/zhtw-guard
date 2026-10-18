import { createLocator } from "../text/locator.js";
import type { Issue } from "../types.js";
import { runEnabledRules, type TextTarget } from "./run-rules.js";
import type { CheckSettings } from "./settings.js";

export interface CheckTextOptions extends TextTarget {
  displayPath?: string;
}

export function checkText(options: CheckTextOptions, settings: CheckSettings): Issue[] {
  const locate = createLocator(options.text);
  const displayPath = options.displayPath ?? options.filePath ?? "<text>";
  return runEnabledRules(options, settings)
    .map(({ rule, severity, finding }) => {
      const start = locate(finding.start);
      const end = locate(finding.end);
      return {
        path: displayPath,
        line: start.line,
        column: start.column,
        endLine: end.line,
        endColumn: end.column,
        rule: rule.id,
        severity,
        message: finding.message,
        ...(finding.suggestion === undefined ? {} : { suggestion: finding.suggestion }),
        fixable: (finding.edits?.length ?? 0) > 0
      };
    })
    .sort((left, right) => left.line - right.line || left.column - right.column);
}
