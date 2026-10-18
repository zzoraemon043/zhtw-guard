import { dirname, resolve } from "node:path";
import { findConfigFile, loadConfigFile } from "../config/load-config.js";
import type { ProjectConfig } from "../config/validate-config.js";
import { termTableFor, withExtraTerms } from "../dictionary/term-table.js";
import { defaultRuleSettings, defaultSettings, type CheckSettings } from "../engine/settings.js";
import type { FileSelection } from "../files/collect-files.js";

export interface ProjectContext {
  settings: CheckSettings;
  selection: FileSelection;
}

export const DEFAULT_INCLUDE = ["**"];

export function defaultProjectContext(root: string): ProjectContext {
  return { settings: defaultSettings(), selection: { root, include: DEFAULT_INCLUDE, exclude: [] } };
}

export function projectContextFromConfig(root: string, config: ProjectConfig): ProjectContext {
  const baseTerms = termTableFor(config.strictness ?? "default");
  return {
    settings: {
      rules: { ...defaultRuleSettings(), ...config.rules },
      allow: config.allow ?? [],
      terms: config.extraTerms === undefined ? baseTerms : withExtraTerms(baseTerms, config.extraTerms)
    },
    selection: { root, include: config.include ?? DEFAULT_INCLUDE, exclude: config.exclude ?? [] }
  };
}

export async function loadProjectContext(cwd: string, configPath?: string): Promise<ProjectContext> {
  const path = configPath === undefined ? await findConfigFile(cwd) : resolve(cwd, configPath);
  if (path === undefined) {
    return defaultProjectContext(cwd);
  }
  const { config } = await loadConfigFile(path);
  return projectContextFromConfig(dirname(path), config);
}
