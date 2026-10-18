import { checkText } from "../../engine/check-text.js";
import type { CheckSettings } from "../../engine/settings.js";
import { fixText } from "../../engine/fix-text.js";
import { decodeUtf8 } from "../../files/read-text-file.js";
import type { ProjectContext } from "../../project/context.js";
import type { ParsedArgs } from "../args.js";
import type { CliIo } from "../io.js";
import { exitCodeFor, summarize, toJson } from "../report.js";
import { emitIssues, formatIssues } from "./emit.js";

export const STDIN_DISPLAY_PATH = "<stdin>";

function fixStdin(text: string, args: ParsedArgs, settings: CheckSettings, io: CliIo): number {
  const target = { text, ...(args.filePath === undefined ? {} : { filePath: args.filePath }) };
  const fixed = fixText(target, settings);
  const issues = checkText({ ...target, text: fixed.text, displayPath: args.filePath ?? STDIN_DISPLAY_PATH }, settings);
  const summary = summarize(issues);
  if (args.format === "json") {
    io.stdout(toJson({ output: fixed.text, fixedCount: fixed.fixedCount, issues, ...summary }));
  } else {
    io.stdout(fixed.text);
    io.stderr(formatIssues(issues, args.format));
  }
  return exitCodeFor(summary, args.failOn);
}

export async function checkStdin(args: ParsedArgs, project: ProjectContext, io: CliIo): Promise<number> {
  const { text } = decodeUtf8(await io.readStdin());
  const settings = { ...project.settings, replyMode: args.reply };
  if (args.fix) {
    return fixStdin(text, args, settings, io);
  }
  const target = { text, displayPath: args.filePath ?? STDIN_DISPLAY_PATH, ...(args.filePath === undefined ? {} : { filePath: args.filePath }) };
  return emitIssues(checkText(target, settings), io, args, {});
}
