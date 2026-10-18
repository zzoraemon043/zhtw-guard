import type { Issue } from "../../types.js";
import { EXIT_CLEAN, EXIT_PROBLEMS, type CliIo } from "../io.js";
import { formatHumanReport, formatSummary, summarize, toJson } from "../report.js";

export function emitIssues(
  issues: readonly Issue[],
  io: CliIo,
  format: "human" | "json",
  extra: Record<string, unknown>
): number {
  const summary = summarize(issues);
  if (format === "json") {
    io.stdout(toJson({ issues, ...summary, ...extra }));
  } else {
    io.stdout(formatHumanReport(issues));
    if (issues.length > 0) {
      io.stderr(`${formatSummary(summary)}\n`);
    }
  }
  return summary.errorCount > 0 ? EXIT_PROBLEMS : EXIT_CLEAN;
}
