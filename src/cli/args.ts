import { parseArgs } from "node:util";
import { UsageError } from "./io.js";

export const COMMANDS = ["check", "fix", "text"] as const;

export type Command = (typeof COMMANDS)[number];

export type OutputFormat = "human" | "json";

export interface ParsedArgs {
  command: Command | "help" | "version";
  paths: string[];
  format: OutputFormat;
  configPath?: string;
  filePath?: string;
  fix: boolean;
}

const OPTIONS = {
  format: { type: "string" },
  config: { type: "string" },
  path: { type: "string" },
  fix: { type: "boolean" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" }
} as const;

function parseFormat(value: string | undefined): OutputFormat {
  if (value === undefined || value === "human" || value === "json") {
    return value ?? "human";
  }
  throw new UsageError(`Unknown format "${value}". Use "human" or "json".`);
}

function parseCommand(name: string | undefined): Command {
  if (COMMANDS.includes(name as Command)) {
    return name as Command;
  }
  throw new UsageError(name === undefined ? "Missing command." : `Unknown command "${name}".`);
}

function readRawArgs(argv: readonly string[]): ReturnType<typeof parseArgs<{ options: typeof OPTIONS; allowPositionals: true }>> {
  try {
    return parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    throw new UsageError((error as Error).message);
  }
}

function validateCommandOptions(command: Command, values: { path?: string; fix?: boolean }, paths: string[]): void {
  if (command !== "text" && (values.path !== undefined || values.fix === true)) {
    throw new UsageError("--path and --fix are only valid with the text command.");
  }
  if (command === "text" && paths.length > 0) {
    throw new UsageError("The text command reads standard input and takes no paths.");
  }
}

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  const { values, positionals } = readRawArgs(argv);
  const format = parseFormat(values.format);
  const base = { paths: [], format, fix: false };
  if (values.version === true) {
    return { ...base, command: "version" };
  }
  if (values.help === true || positionals.length === 0) {
    return { ...base, command: "help" };
  }
  const [name, ...paths] = positionals;
  const command = parseCommand(name);
  validateCommandOptions(command, values, paths);
  return {
    command,
    paths,
    format,
    fix: values.fix === true,
    ...(values.config === undefined ? {} : { configPath: values.config }),
    ...(values.path === undefined ? {} : { filePath: values.path })
  };
}
