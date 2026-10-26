import { checkText } from "../engine/check-text.js";
import { collectFiles, toRelativePosix } from "../files/collect-files.js";
import { readTextFile } from "../files/read-text-file.js";
import type { Issue } from "../types.js";
import type { ProjectContext } from "./context.js";

export async function checkPaths(paths: readonly string[], cwd: string, project: ProjectContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  for (const filePath of await collectFiles(paths, cwd, project.selection)) {
    const result = await readTextFile(filePath);
    if (result.kind === "text") {
      const legacy = result.legacyEncoding === undefined ? {} : { legacyEncoding: result.legacyEncoding };
      issues.push(...checkText({ text: result.text, filePath, displayPath: toRelativePosix(cwd, filePath), ...legacy }, project.settings));
    }
  }
  return issues;
}
