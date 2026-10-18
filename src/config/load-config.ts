import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { ConfigError } from "./config-error.js";
import { validateConfig, type ProjectConfig } from "./validate-config.js";

export const CONFIG_FILE_NAME = "zhtw-guard.config.json";

export interface LoadedConfig {
  path: string;
  config: ProjectConfig;
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export async function findConfigFile(startDirectory: string): Promise<string | undefined> {
  let directory = resolve(startDirectory);
  for (;;) {
    const candidate = join(directory, CONFIG_FILE_NAME);
    if (await isFile(candidate)) {
      return candidate;
    }
    const parent = dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
}

async function readJson(path: string): Promise<unknown> {
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch {
    throw new ConfigError(`Cannot read config file ${path}`);
  }
  try {
    return JSON.parse(content.replace(/^\uFEFF/u, "")) as unknown;
  } catch (error) {
    throw new ConfigError(`Invalid JSON in ${path}: ${(error as Error).message}`);
  }
}

export async function loadConfigFile(path: string): Promise<LoadedConfig> {
  try {
    return { path, config: validateConfig(await readJson(path)) };
  } catch (error) {
    if (error instanceof ConfigError && !error.message.includes(path)) {
      throw new ConfigError(`${path}: ${error.message}`);
    }
    throw error;
  }
}
