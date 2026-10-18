import { parseArgs } from "node:util";
import { STRICTNESS_LEVELS, type Strictness } from "../types.js";
import { UsageError } from "./io.js";

export const COMMANDS = ["check", "fix", "text", "hook"] as const;

export type Command = (typeof COMMANDS)[number];

export const OUTPUT_FORMATS = ["human", "json", "github"] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export const FAIL_ON_LEVELS = ["error", "warning"] as const;

export type FailOn = (typeof FAIL_ON_LEVELS)[number];

export interface ParsedArgs {
  command: Command | "help" | "version";
  paths: string[];
  format: OutputFormat;
  failOn: FailOn;
  fix: boolean;
  reply: boolean;
  textFields: string[];
  pathFields: string[];
  cwdField: string;
  configPath?: string;
  filePath?: string;
  strictness?: Strictness;
}

const OPTIONS = {
  format: { type: "string" },
  config: { type: "string" },
  strictness: { type: "string" },
  "fail-on": { type: "string" },
  path: { type: "string" },
  fix: { type: "boolean" },
  reply: { type: "boolean" },
  "text-field": { type: "string", multiple: true },
  "path-field": { type: "string", multiple: true },
  "cwd-field": { type: "string" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" }
} as const;

type RawValues = ReturnType<typeof parseArgs<{ options: typeof OPTIONS; allowPositionals: true }>>["values"];

const TEXT_ONLY_OPTIONS = ["path", "fix", "reply"] as const;

const HOOK_ONLY_OPTIONS = ["text-field", "path-field", "cwd-field"] as const;

export const DEFAULT_TEXT_FIELDS = ["text", "reply", "message"];

export const DEFAULT_PATH_FIELDS = ["path", "file_path", "filePath"];

export const DEFAULT_CWD_FIELD = "cwd";

function parseChoice<T extends string>(name: string, value: string | undefined, choices: readonly T[], fallback: T): T {
  if (value === undefined) {
    return fallback;
  }
  if (choices.includes(value as T)) {
    return value as T;
  }
  throw new UsageError(`Unknown ${name} "${value}". Use ${choices.map((choice) => `"${choice}"`).join(", ")}.`);
}

function parseCommand(name: string | undefined): Command {
  if (COMMANDS.includes(name as Command)) {
    return name as Command;
  }
  throw new UsageError(name === undefined ? "Missing command." : `Unknown command "${name}".`);
}

function readRawArgs(argv: readonly string[]): { values: RawValues; positionals: string[] } {
  try {
    return parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    throw new UsageError((error as Error).message);
  }
}

function validateCommandOptions(command: Command, values: RawValues, paths: string[]): void {
  if (command !== "text" && TEXT_ONLY_OPTIONS.some((option) => values[option] !== undefined)) {
    throw new UsageError("--path, --fix and --reply are only valid with the text command.");
  }
  if (command !== "hook" && HOOK_ONLY_OPTIONS.some((option) => values[option] !== undefined)) {
    throw new UsageError("--text-field, --path-field and --cwd-field are only valid with the hook command.");
  }
  if (command === "hook" && values.format !== undefined) {
    throw new UsageError("The hook command always writes problems to standard error and takes no --format.");
  }
  if ((command === "text" || command === "hook") && paths.length > 0) {
    throw new UsageError(`The ${command} command reads standard input and takes no paths.`);
  }
}

function fieldList(values: string[] | undefined, fallback: readonly string[]): string[] {
  const fields = (values ?? []).flatMap((value) => value.split(",")).map((field) => field.trim()).filter((field) => field.length > 0);
  return fields.length === 0 ? [...fallback] : fields;
}

function optionalValues(values: RawValues): Pick<ParsedArgs, "configPath" | "filePath" | "strictness"> {
  const strictness = values.strictness;
  return {
    ...(values.config === undefined ? {} : { configPath: values.config }),
    ...(values.path === undefined ? {} : { filePath: values.path }),
    ...(strictness === undefined ? {} : { strictness: parseChoice("strictness", strictness, STRICTNESS_LEVELS, "default") })
  };
}

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  const { values, positionals } = readRawArgs(argv);
  const base = {
    paths: [],
    format: parseChoice("format", values.format, OUTPUT_FORMATS, "human"),
    failOn: parseChoice("fail-on level", values["fail-on"], FAIL_ON_LEVELS, "error"),
    fix: values.fix === true,
    reply: values.reply === true,
    textFields: fieldList(values["text-field"], DEFAULT_TEXT_FIELDS),
    pathFields: fieldList(values["path-field"], DEFAULT_PATH_FIELDS),
    cwdField: values["cwd-field"] ?? DEFAULT_CWD_FIELD
  };
  if (values.version === true || values.help === true || positionals.length === 0) {
    return { ...base, command: values.version === true ? "version" : "help" };
  }
  const [name, ...paths] = positionals;
  const command = parseCommand(name);
  validateCommandOptions(command, values, paths);
  return { ...base, command, paths, ...optionalValues(values) };
}
