import type { TermTable } from "../types.js";
import { readDataFile } from "./data-file.js";

interface TermFile {
  replacements: Record<string, string[]>;
  protected: string[];
}

export type ExtraTerms = Record<string, string | string[]>;

let defaultTableCache: TermTable | undefined;

export function defaultTermTable(): TermTable {
  if (defaultTableCache === undefined) {
    const file = readDataFile<TermFile>("tw-terms.json");
    defaultTableCache = {
      replacements: new Map(Object.entries(file.replacements)),
      protectedPhrases: new Set(file.protected)
    };
  }
  return defaultTableCache;
}

export function withExtraTerms(base: TermTable, extraTerms: ExtraTerms): TermTable {
  const replacements = new Map(base.replacements);
  const protectedPhrases = new Set(base.protectedPhrases);
  for (const [term, value] of Object.entries(extraTerms)) {
    replacements.set(term, typeof value === "string" ? [value] : value);
    protectedPhrases.delete(term);
  }
  return { replacements, protectedPhrases };
}
