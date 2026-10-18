import type { Issue } from "../types.js";
import type { FailOn } from "./args.js";
import { EXIT_CLEAN, EXIT_PROBLEMS } from "./io.js";

export interface Summary {
  errorCount: number;
  warningCount: number;
}

export function summarize(issues: readonly Issue[]): Summary {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  return { errorCount, warningCount: issues.length - errorCount };
}

export function exitCodeFor(summary: Summary, failOn: FailOn): number {
  const failing = summary.errorCount + (failOn === "warning" ? summary.warningCount : 0);
  return failing > 0 ? EXIT_PROBLEMS : EXIT_CLEAN;
}

export function formatIssue(issue: Issue): string {
  const location = `${issue.path}:${issue.line}:${issue.column}`;
  const suggestion = issue.suggestion === undefined ? "" : ` -> ${issue.suggestion}`;
  const severity = issue.severity === "warning" ? " (warning)" : "";
  return `${location} ${issue.rule} ${issue.message}${suggestion}${severity}`;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function formatSummary({ errorCount, warningCount }: Summary): string {
  const total = errorCount + warningCount;
  return `${plural(total, "problem")} (${plural(errorCount, "error")}, ${plural(warningCount, "warning")})`;
}

export function formatHumanReport(issues: readonly Issue[]): string {
  return issues.map((issue) => `${formatIssue(issue)}\n`).join("");
}

export function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
