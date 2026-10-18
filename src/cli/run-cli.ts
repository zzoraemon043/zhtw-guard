import { MissingPathError } from "../files/collect-files.js";
import { defaultProjectContext } from "../project/context.js";
import { VERSION } from "../version.js";
import { parseCliArgs, type ParsedArgs } from "./args.js";
import { checkFiles } from "./commands/check-files.js";
import { checkStdin } from "./commands/check-stdin.js";
import { fixFiles } from "./commands/fix-files.js";
import { HELP_TEXT } from "./help.js";
import { EXIT_CLEAN, EXIT_USAGE, UsageError, type CliIo } from "./io.js";

async function dispatch(args: ParsedArgs, io: CliIo): Promise<number> {
  if (args.command === "help" || args.command === "version") {
    io.stdout(args.command === "help" ? HELP_TEXT : `${VERSION}\n`);
    return EXIT_CLEAN;
  }
  const project = defaultProjectContext(io.cwd);
  if (args.command === "text") {
    return checkStdin(args, project, io);
  }
  const run = args.command === "fix" ? fixFiles : checkFiles;
  return run(args.paths, project, io, args.format);
}

export async function runCli(argv: readonly string[], io: CliIo): Promise<number> {
  try {
    return await dispatch(parseCliArgs(argv), io);
  } catch (error) {
    if (error instanceof UsageError || error instanceof MissingPathError) {
      io.stderr(`zhtw-guard: ${error.message}\n`);
      if (error instanceof UsageError) {
        io.stderr("Run zhtw-guard --help for usage.\n");
      }
      return EXIT_USAGE;
    }
    throw error;
  }
}
