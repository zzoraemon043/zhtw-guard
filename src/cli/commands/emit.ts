import type { Issue } from "../../types.js";
import type { FailOn, OutputFormat } from "../args.js";
import { formatGithubReport } from "../github-annotations.js";
import type { CliIo } from "../io.js";
import { exitCodeFor, formatHumanReport, formatSummary, summarize, toJson } from "../report.js";

export interface EmitOptions {
  format: OutputFormat;
  failOn: FailOn;
}

export function formatIssues(issues: readonly Issue[], format: Exclude<OutputFormat, "json">): string {
  return format === "github" ? formatGithubReport(issues) : formatHumanReport(issues);
}

export function emitIssues(issues: readonly Issue[], io: CliIo, options: EmitOptions, extra: Record<string, unknown>): number {
  const summary = summarize(issues);
  if (options.format === "json") {
    io.stdout(toJson({ issues, ...summary, ...extra }));
  } else {
    io.stdout(formatIssues(issues, options.format));
    if (issues.length > 0) {
      io.stderr(`${formatSummary(summary)}\n`);
    }
  }
  return exitCodeFor(summary, options.failOn);
}
