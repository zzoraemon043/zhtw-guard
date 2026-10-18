import { defaultSettings, type CheckSettings } from "../engine/settings.js";
import type { FileSelection } from "../files/collect-files.js";

export interface ProjectContext {
  settings: CheckSettings;
  selection: FileSelection;
}

export function defaultProjectContext(root: string): ProjectContext {
  return { settings: defaultSettings(), selection: { root, include: ["**"], exclude: [] } };
}
