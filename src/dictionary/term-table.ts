import type { Strictness, TermTable } from "../types.js";
import { readDataFile } from "./data-file.js";

interface TermFile {
  replacements: Record<string, string[]>;
  reportOnly?: string[];
  protected: string[];
}

export type ExtraTerms = Record<string, string | string[]>;

const TERM_FILES: Record<Strictness, string> = {
  default: "tw-terms.json",
  strict: "tw-terms-strict.json"
};

const fileCache = new Map<string, TermTable>();
const tableCache = new Map<Strictness, TermTable>();

export function readTermFile(fileName: string): TermTable {
  let table = fileCache.get(fileName);
  if (table === undefined) {
    const file = readDataFile<TermFile>(fileName);
    table = {
      replacements: new Map(Object.entries(file.replacements)),
      reportOnly: new Set(file.reportOnly ?? []),
      protectedPhrases: new Set(file.protected)
    };
    fileCache.set(fileName, table);
  }
  return table;
}

export function mergeTermTables(base: TermTable, overlay: TermTable): TermTable {
  const replacements = new Map(base.replacements);
  const reportOnly = new Set(base.reportOnly);
  const protectedPhrases = new Set([...base.protectedPhrases, ...overlay.protectedPhrases]);
  for (const [term, values] of overlay.replacements) {
    replacements.set(term, values);
    protectedPhrases.delete(term);
    if (overlay.reportOnly.has(term)) {
      reportOnly.add(term);
    } else {
      reportOnly.delete(term);
    }
  }
  return { replacements, reportOnly, protectedPhrases };
}

export function defaultTermTable(): TermTable {
  return termTableFor("default");
}

export function termTableFor(strictness: Strictness): TermTable {
  let table = tableCache.get(strictness);
  if (table === undefined) {
    const base = readTermFile(TERM_FILES.default);
    table = strictness === "default" ? base : mergeTermTables(base, readTermFile(TERM_FILES[strictness]));
    tableCache.set(strictness, table);
  }
  return table;
}

export function withExtraTerms(base: TermTable, extraTerms: ExtraTerms): TermTable {
  const replacements = new Map(
    Object.entries(extraTerms).map(([term, value]) => [term, typeof value === "string" ? [value] : value] as const)
  );
  const merged = mergeTermTables(base, { replacements, reportOnly: new Set(), protectedPhrases: new Set() });
  const protectedPhrases = new Set(merged.protectedPhrases);
  for (const [term, values] of replacements) {
    for (const value of values) {
      if (value.includes(term)) {
        protectedPhrases.add(value);
      }
    }
  }
  return { ...merged, protectedPhrases };
}
