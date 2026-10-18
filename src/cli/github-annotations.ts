import type { Issue } from "../types.js";

function escapeData(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}

function escapeProperty(value: string): string {
  return escapeData(value).replaceAll(":", "%3A").replaceAll(",", "%2C");
}

export function formatGithubAnnotation(issue: Issue): string {
  const properties = [
    `file=${escapeProperty(issue.path)}`,
    `line=${issue.line}`,
    `col=${issue.column}`,
    `endLine=${issue.endLine}`,
    `endColumn=${issue.endColumn}`,
    `title=${escapeProperty(`zhtw-guard ${issue.rule}`)}`
  ].join(",");
  const suggestion = issue.suggestion === undefined ? "" : ` -> ${issue.suggestion}`;
  return `::${issue.severity} ${properties}::${escapeData(`${issue.message}${suggestion}`)}`;
}

export function formatGithubReport(issues: readonly Issue[]): string {
  return issues.map((issue) => `${formatGithubAnnotation(issue)}\n`).join("");
}
