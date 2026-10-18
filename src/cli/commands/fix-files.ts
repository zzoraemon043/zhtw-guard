import { writeFile } from "node:fs/promises";
import { checkText } from "../../engine/check-text.js";
import { fixText } from "../../engine/fix-text.js";
import { collectFiles, toRelativePosix } from "../../files/collect-files.js";
import { readTextFile } from "../../files/read-text-file.js";
import type { ProjectContext } from "../../project/context.js";
import type { Issue } from "../../types.js";
import type { ParsedArgs } from "../args.js";
import type { CliIo } from "../io.js";
import { emitIssues } from "./emit.js";

interface FileOutcome {
  issues: Issue[];
  fixedCount: number;
  changed: boolean;
}

async function fixFile(filePath: string, displayPath: string, project: ProjectContext): Promise<FileOutcome> {
  const result = await readTextFile(filePath);
  if (result.kind !== "text") {
    return { issues: [], fixedCount: 0, changed: false };
  }
  const fixed = result.lossless ? fixText({ text: result.text, filePath }, project.settings) : { text: result.text, fixedCount: 0 };
  const changed = fixed.text !== result.text;
  if (changed) {
    await writeFile(filePath, fixed.text, "utf8");
  }
  const issues = checkText({ text: fixed.text, filePath, displayPath }, project.settings);
  return { issues, fixedCount: fixed.fixedCount, changed };
}

export async function fixFiles(args: ParsedArgs, project: ProjectContext, io: CliIo): Promise<number> {
  const issues: Issue[] = [];
  const changedFiles: string[] = [];
  let fixedCount = 0;
  for (const filePath of await collectFiles(args.paths, io.cwd, project.selection)) {
    const displayPath = toRelativePosix(io.cwd, filePath);
    const outcome = await fixFile(filePath, displayPath, project);
    issues.push(...outcome.issues);
    fixedCount += outcome.fixedCount;
    if (outcome.changed) {
      changedFiles.push(displayPath);
    }
  }
  if (args.format !== "json" && fixedCount > 0) {
    io.stderr(`Fixed ${fixedCount} problem${fixedCount === 1 ? "" : "s"} in ${changedFiles.length} file${changedFiles.length === 1 ? "" : "s"}\n`);
  }
  return emitIssues(issues, io, args, { fixedCount, changedFiles });
}
