import type { ProjectContext } from "../../project/context.js";
import { MAX_FILE_BYTES } from "../../files/read-text-file.js";
import { checkPaths } from "../../project/check-paths.js";
import type { ParsedArgs } from "../args.js";
import type { CliIo } from "../io.js";
import { emitIssues } from "./emit.js";

export async function checkFiles(args: ParsedArgs, project: ProjectContext, io: CliIo): Promise<number> {
  const reportSkip = (path: string, reason: "binary" | "too-large") => {
    if (reason === "too-large") {
      io.stderr(`skipped ${path}: larger than ${MAX_FILE_BYTES / 1024 / 1024} MB\n`);
    }
  };
  return emitIssues(await checkPaths(args.paths, io.cwd, project, reportSkip), io, args, {});
}
