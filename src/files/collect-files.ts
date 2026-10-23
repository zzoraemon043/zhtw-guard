import { readdir, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { createGlobMatcher } from "./glob.js";

export const ALWAYS_EXCLUDED = ["**/node_modules/**", "**/.git/**"];

export interface FileSelection {
  root: string;
  include: readonly string[];
  exclude: readonly string[];
}

export class MissingPathError extends Error {
  constructor(readonly path: string) {
    super(`Path not found: ${path}`);
  }
}

export function toRelativePosix(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

interface Matchers {
  root: string;
  isIncluded: (relativePath: string) => boolean;
  isExcluded: (relativePath: string) => boolean;
}

async function walkDirectory(directory: string, matchers: Matchers, found: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const relativePath = toRelativePosix(matchers.root, path);
    if (matchers.isExcluded(relativePath)) {
      continue;
    }
    if (entry.isDirectory()) {
      await walkDirectory(path, matchers, found);
    } else if (entry.isFile() && matchers.isIncluded(relativePath)) {
      found.push(path);
    }
  }
}

function isSelectedFile(matchers: Matchers, absolute: string): boolean {
  const relativePath = toRelativePosix(matchers.root, absolute);
  if (matchers.isExcluded(relativePath)) {
    return false;
  }
  const outsideRoot = relativePath === ".." || relativePath.startsWith("../") || isAbsolute(relativePath);
  return outsideRoot || matchers.isIncluded(relativePath);
}

async function statOrThrow(path: string): Promise<Awaited<ReturnType<typeof stat>>> {
  try {
    return await stat(path);
  } catch {
    throw new MissingPathError(path);
  }
}

export async function collectFiles(paths: readonly string[], cwd: string, selection: FileSelection): Promise<string[]> {
  const matchers: Matchers = {
    root: selection.root,
    isIncluded: createGlobMatcher(selection.include),
    isExcluded: createGlobMatcher([...ALWAYS_EXCLUDED, ...selection.exclude])
  };
  const found: string[] = [];
  for (const path of paths.length === 0 ? ["."] : paths) {
    const absolute = resolve(cwd, path);
    const info = await statOrThrow(absolute);
    if (info.isDirectory()) {
      await walkDirectory(absolute, matchers, found);
    } else if (isSelectedFile(matchers, absolute)) {
      found.push(absolute);
    }
  }
  return [...new Set(found)];
}
