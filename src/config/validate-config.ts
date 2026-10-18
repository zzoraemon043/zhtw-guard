import { RULE_IDS, STRICTNESS_LEVELS, type RuleId, type RuleSetting, type Strictness } from "../types.js";
import type { ExtraTerms } from "../dictionary/term-table.js";
import { ConfigError } from "./config-error.js";

export interface ProjectConfig {
  include?: string[];
  exclude?: string[];
  rules?: Partial<Record<RuleId, RuleSetting>>;
  allow?: string[];
  extraTerms?: ExtraTerms;
  strictness?: Strictness;
}

const KNOWN_KEYS = new Set(["$schema", "include", "exclude", "rules", "allow", "extraTerms", "strictness"]);

const RULE_SETTINGS: readonly string[] = ["error", "warning", "off"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function expectStringArray(config: Record<string, unknown>, key: string): void {
  if (config[key] !== undefined && !isStringArray(config[key])) {
    throw new ConfigError(`"${key}" must be an array of strings.`);
  }
}

function validateRules(rules: unknown): void {
  if (rules === undefined) {
    return;
  }
  if (!isRecord(rules)) {
    throw new ConfigError('"rules" must be an object.');
  }
  for (const [id, setting] of Object.entries(rules)) {
    if (!RULE_IDS.includes(id as RuleId)) {
      throw new ConfigError(`Unknown rule "${id}" in "rules".`);
    }
    if (typeof setting !== "string" || !RULE_SETTINGS.includes(setting)) {
      throw new ConfigError(`Rule "${id}" must be "error", "warning" or "off".`);
    }
  }
}

function validateExtraTerms(extraTerms: unknown): void {
  if (extraTerms === undefined) {
    return;
  }
  const valid =
    isRecord(extraTerms) &&
    Object.entries(extraTerms).every(
      ([term, value]) => term.length > 0 && (typeof value === "string" || (isStringArray(value) && value.length > 0))
    );
  if (!valid) {
    throw new ConfigError('"extraTerms" must map each term to a replacement string or a non-empty array of strings.');
  }
}

function validateStrictness(strictness: unknown): void {
  if (strictness !== undefined && !STRICTNESS_LEVELS.includes(strictness as Strictness)) {
    throw new ConfigError('"strictness" must be "default" or "strict".');
  }
}

export function validateConfig(value: unknown): ProjectConfig {
  if (!isRecord(value)) {
    throw new ConfigError("The config must be a JSON object.");
  }
  const unknownKey = Object.keys(value).find((key) => !KNOWN_KEYS.has(key));
  if (unknownKey !== undefined) {
    throw new ConfigError(`Unknown config key "${unknownKey}".`);
  }
  ["include", "exclude", "allow"].forEach((key) => expectStringArray(value, key));
  validateRules(value.rules);
  validateExtraTerms(value.extraTerms);
  validateStrictness(value.strictness);
  return value as ProjectConfig;
}
