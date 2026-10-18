import { checkText } from "../../engine/check-text.js";
import { collectFiles, toRelativePosix } from "../../files/collect-files.js";
import { readTextFile } from "../../files/read-text-file.js";
import type { ProjectContext } from "../../project/context.js";
import type { Issue } from "../../types.js";
import type { CliIo } from "../io.js";
import { emitIssues } from "./emit.js";

export async function checkFiles(paths: readonly string[], project: ProjectContext, io: CliIo, format: "human" | "json"): Promise<number> {
  const issues: Issue[] = [];
  for (const filePath of await collectFiles(paths, io.cwd, project.selection)) {
    const result = await readTextFile(filePath);
    if (result.kind === "text") {
      issues.push(...checkText({ text: result.text, filePath, displayPath: toRelativePosix(io.cwd, filePath) }, project.settings));
    }
  }
  return emitIssues(issues, io, format, {});
}
