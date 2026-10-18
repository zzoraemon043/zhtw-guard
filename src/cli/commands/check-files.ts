import type { ProjectContext } from "../../project/context.js";
import { checkPaths } from "../../project/check-paths.js";
import type { ParsedArgs } from "../args.js";
import type { CliIo } from "../io.js";
import { emitIssues } from "./emit.js";

export async function checkFiles(args: ParsedArgs, project: ProjectContext, io: CliIo): Promise<number> {
  return emitIssues(await checkPaths(args.paths, io.cwd, project), io, args, {});
}
