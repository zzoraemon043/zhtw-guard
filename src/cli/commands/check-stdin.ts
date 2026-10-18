import { checkText } from "../../engine/check-text.js";
import { fixText } from "../../engine/fix-text.js";
import { decodeUtf8 } from "../../files/read-text-file.js";
import type { ProjectContext } from "../../project/context.js";
import type { ParsedArgs } from "../args.js";
import { EXIT_CLEAN, EXIT_PROBLEMS, type CliIo } from "../io.js";
import { formatHumanReport, summarize, toJson } from "../report.js";
import { emitIssues } from "./emit.js";

export const STDIN_DISPLAY_PATH = "<stdin>";

function fixStdin(text: string, args: ParsedArgs, project: ProjectContext, io: CliIo): number {
  const target = { text, ...(args.filePath === undefined ? {} : { filePath: args.filePath }) };
  const fixed = fixText(target, project.settings);
  const issues = checkText({ ...target, text: fixed.text, displayPath: args.filePath ?? STDIN_DISPLAY_PATH }, project.settings);
  const summary = summarize(issues);
  if (args.format === "json") {
    io.stdout(toJson({ output: fixed.text, fixedCount: fixed.fixedCount, issues, ...summary }));
  } else {
    io.stdout(fixed.text);
    io.stderr(formatHumanReport(issues));
  }
  return summary.errorCount > 0 ? EXIT_PROBLEMS : EXIT_CLEAN;
}

export async function checkStdin(args: ParsedArgs, project: ProjectContext, io: CliIo): Promise<number> {
  const { text } = decodeUtf8(await io.readStdin());
  if (args.fix) {
    return fixStdin(text, args, project, io);
  }
  const target = { text, displayPath: args.filePath ?? STDIN_DISPLAY_PATH, ...(args.filePath === undefined ? {} : { filePath: args.filePath }) };
  return emitIssues(checkText(target, project.settings), io, args.format, {});
}
