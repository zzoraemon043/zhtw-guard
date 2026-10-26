import { simplifiedCharacters } from "../dictionary/character-tables.js";

export interface LegacyDecoding {
  label: string;
  text: string;
}

interface Candidate {
  label: string;
  encoding: string;
  score(text: string): number;
}

let traditionalCache: ReadonlySet<string> | undefined;

function traditionalCharacters(): ReadonlySet<string> {
  traditionalCache ??= new Set(simplifiedCharacters().values());
  return traditionalCache;
}

function countMatching(text: string, characters: { has(character: string): boolean }): number {
  return [...text].filter((character) => characters.has(character)).length;
}

const CANDIDATES: readonly Candidate[] = [
  { label: "Big5", encoding: "big5", score: (text) => countMatching(text, traditionalCharacters()) },
  { label: "GBK", encoding: "gbk", score: (text) => countMatching(text, simplifiedCharacters()) }
];

function decodeStrict(bytes: Uint8Array, encoding: string): string | undefined {
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
}

export function detectLegacyEncoding(bytes: Uint8Array): LegacyDecoding | undefined {
  const decoded = CANDIDATES.flatMap((candidate) => {
    const text = decodeStrict(bytes, candidate.encoding);
    return text === undefined ? [] : [{ label: candidate.label, text, score: candidate.score(text) }];
  }).sort((left, right) => right.score - left.score);
  const [best, runnerUp] = decoded;
  if (best === undefined) {
    return undefined;
  }
  const label = runnerUp !== undefined && runnerUp.score === best.score ? "Big5 or GBK" : best.label;
  return { label, text: best.text };
}
