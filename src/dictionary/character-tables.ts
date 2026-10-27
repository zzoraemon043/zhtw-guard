import { readDataFile } from "./data-file.js";

let simplifiedCache: ReadonlyMap<string, string> | undefined;
let ambiguousCache: ReadonlyMap<string, readonly string[]> | undefined;

export function simplifiedCharacters(): ReadonlyMap<string, string> {
  simplifiedCache ??= new Map(Object.entries(readDataFile<Record<string, string>>("simplified-chars.json")));
  return simplifiedCache;
}

export function ambiguousCharacters(): ReadonlyMap<string, readonly string[]> {
  ambiguousCache ??= new Map(Object.entries(readDataFile<Record<string, string[]>>("ambiguous-chars.json")));
  return ambiguousCache;
}

interface SimplifiedPhraseFile {
  phrases: Record<string, string>;
  protected: string[];
}

export interface SimplifiedPhrases {
  phrases: ReadonlyMap<string, string>;
  protectedPhrases: ReadonlySet<string>;
}

let phraseCache: SimplifiedPhrases | undefined;

export function simplifiedPhrases(): SimplifiedPhrases {
  if (phraseCache === undefined) {
    const file = readDataFile<SimplifiedPhraseFile>("simplified-phrases.json");
    phraseCache = { phrases: new Map(Object.entries(file.phrases)), protectedPhrases: new Set(file.protected) };
  }
  return phraseCache;
}
