import { dirname, resolve } from "node:path";
import { findConfigFile, loadConfigFile } from "../config/load-config.js";
import type { ProjectConfig } from "../config/validate-config.js";
import { termTableFor, withExtraTerms } from "../dictionary/term-table.js";
import { defaultRuleSettings, type CheckSettings } from "../engine/settings.js";
import type { FileSelection } from "../files/collect-files.js";
import type { Strictness } from "../types.js";

export interface ProjectContext {
  settings: CheckSettings;
  selection: FileSelection;
}

export const DEFAULT_INCLUDE = ["**"];

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

export async function loadProjectContext(cwd: string, configPath?: string, strictness?: Strictness): Promise<ProjectContext> {
  const path = configPath === undefined ? await findConfigFile(cwd) : resolve(cwd, configPath);
  const override = strictness === undefined ? {} : { strictness };
  if (path === undefined) {
    return projectContextFromConfig(cwd, override);
  }
  const { config } = await loadConfigFile(path);
  return projectContextFromConfig(dirname(path), { ...config, ...override });
}
