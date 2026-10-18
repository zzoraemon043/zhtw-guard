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
