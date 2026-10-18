import { resolve } from "node:path";
import { checkText } from "../../engine/check-text.js";
import { MissingPathError } from "../../files/collect-files.js";
import { decodeUtf8 } from "../../files/read-text-file.js";
import { firstStringField, readField } from "../../hook/json-field.js";
import { checkPaths } from "../../project/check-paths.js";
import { loadProjectContext, type ProjectContext } from "../../project/context.js";
import type { Issue } from "../../types.js";
import type { ParsedArgs } from "../args.js";
import { EXIT_CLEAN, EXIT_HOOK_BLOCK, UsageError, type CliIo } from "../io.js";
import { exitCodeFor, formatHumanReport, formatSummary, summarize } from "../report.js";

export const REPLY_DISPLAY_PATH = "<reply>";

function parseHookInput(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new UsageError("The hook command expects a JSON object on standard input.");
  }
}

async function checkWrittenPath(path: string, cwd: string, project: ProjectContext): Promise<Issue[]> {
  try {
    return await checkPaths([path], cwd, project);
  } catch (error) {
    if (error instanceof MissingPathError) {
      return [];
    }
    throw error;
  }
}

async function collectHookIssues(input: unknown, args: ParsedArgs, io: CliIo): Promise<Issue[]> {
  const cwdValue = readField(input, args.cwdField);
  const cwd = typeof cwdValue === "string" ? resolve(io.cwd, cwdValue) : io.cwd;
  const project = await loadProjectContext(cwd, args.configPath, args.strictness);
  const reply = firstStringField(input, args.textFields);
  const path = firstStringField(input, args.pathFields);
  const replyIssues =
    reply === undefined
      ? []
      : checkText({ text: reply, displayPath: REPLY_DISPLAY_PATH }, { ...project.settings, replyMode: true });
  const pathIssues = path === undefined ? [] : await checkWrittenPath(path, cwd, project);
  return [...replyIssues, ...pathIssues];
}

function reportBlockingIssues(issues: readonly Issue[], io: CliIo): void {
  io.stderr(formatHumanReport(issues));
  io.stderr(`zhtw-guard: ${formatSummary(summarize(issues))}. Fix them so the text follows Traditional Chinese (Taiwan) conventions.\n`);
}

export async function runHook(args: ParsedArgs, io: CliIo): Promise<number> {
  const raw = decodeUtf8(await io.readStdin()).text;
  if (raw.trim().length === 0) {
    return EXIT_CLEAN;
  }
  const issues = await collectHookIssues(parseHookInput(raw), args, io);
  if (exitCodeFor(summarize(issues), args.failOn) === EXIT_CLEAN) {
    return EXIT_CLEAN;
  }
  reportBlockingIssues(issues, io);
  return EXIT_HOOK_BLOCK;
}
