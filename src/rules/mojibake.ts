import { ambiguousCharacters, simplifiedCharacters } from "../dictionary/character-tables.js";
import { legacyEncoder, type LegacyEncoding } from "../encoding/legacy-encoder.js";
import { measureUtf8Coverage } from "../encoding/utf8-coverage.js";
import { containsNonAscii } from "../text/ascii.js";
import { codePoints } from "../text/code-points.js";
import type { Finding, Rule, RuleInput } from "../types.js";

interface Run {
  start: number;
  end: number;
  characters: string[];
  segments: number[][];
}

interface Profile {
  encoding: LegacyEncoding;
  label: string;
  accepts(decoded: string, run: Run): boolean;
}

const MINIMUM_RUN_CHARACTERS = 2;

const LOST_BYTE_MARKERS = new Set(["?", "\uFFFD"]);

const MINIMUM_COVERAGE = 0.75;

const CJK_PUNCTUATION = /^[\u3000-\u303F\uFF00-\uFFEF]$/u;

const BIG5_FREQUENT_FIRST = 0xa440;

const BIG5_FREQUENT_LAST = 0xc67e;

function isFrequentBig5Character(character: string): boolean {
  const [lead, trail] = legacyEncoder("big5").get(character) ?? [];
  if (lead === undefined || trail === undefined) {
    return false;
  }
  const code = lead * 0x100 + trail;
  return code >= BIG5_FREQUENT_FIRST && code <= BIG5_FREQUENT_LAST;
}

let traditionalCounterpartCache: ReadonlySet<string> | undefined;

function traditionalCounterparts(): ReadonlySet<string> {
  traditionalCounterpartCache ??= new Set(simplifiedCharacters().values());
  return traditionalCounterpartCache;
}

function isLikelyOriginalCharacter(character: string): boolean {
  return (
    CJK_PUNCTUATION.test(character) ||
    isFrequentBig5Character(character) ||
    traditionalCounterparts().has(character) ||
    simplifiedCharacters().has(character) ||
    ambiguousCharacters().has(character)
  );
}

const MINIMUM_RARE_SHARE = 0.5;

function hasManyRareCharacters(run: Run): boolean {
  const rareCount = run.characters.filter((character) => !isFrequentBig5Character(character)).length;
  return rareCount / run.characters.length >= MINIMUM_RARE_SHARE;
}

function isLikelyChineseMojibake(decoded: string, run: Run): boolean {
  return decoded.length > 0 && [...decoded].every(isLikelyOriginalCharacter) && hasManyRareCharacters(run);
}

function isNonAsciiText(decoded: string): boolean {
  return containsNonAscii(decoded);
}

const PROFILES: readonly Profile[] = [
  { encoding: "big5", label: "cp950 (Big5)", accepts: isLikelyChineseMojibake },
  { encoding: "windows-1252", label: "Windows-1252", accepts: isNonAsciiText }
];

function isRunCharacter(bytes: readonly number[] | undefined): bytes is readonly number[] {
  return bytes !== undefined && bytes.every((byte) => byte >= 0x80);
}

function startRun(runs: Run[], start: number): Run {
  const run: Run = { start, end: start, characters: [], segments: [[]] };
  runs.push(run);
  return run;
}

function collectRuns(text: string, encoding: LegacyEncoding): Run[] {
  const encoder = legacyEncoder(encoding);
  const runs: Run[] = [];
  let current: Run | undefined;
  for (const { character, start, end } of codePoints(text)) {
    const bytes = encoder.get(character);
    if (current !== undefined && LOST_BYTE_MARKERS.has(character)) {
      current.segments.push([]);
      continue;
    }
    if (!isRunCharacter(bytes)) {
      current = undefined;
      continue;
    }
    current ??= startRun(runs, start);
    current.end = end;
    current.characters.push(character);
    current.segments.at(-1)?.push(...bytes);
  }
  return runs;
}

function measureRun(run: Run): { coverage: number; decoded: string } {
  const measured = run.segments.map(measureUtf8Coverage);
  const totalBytes = run.segments.reduce((sum, segment) => sum + segment.length, 0);
  const coveredBytes = measured.reduce((sum, segment) => sum + segment.coveredBytes, 0);
  return { coverage: coveredBytes / totalBytes, decoded: measured.map((segment) => segment.decoded).join("") };
}

function findingForRun(run: Run, profile: Profile): Finding | undefined {
  if (run.characters.length < MINIMUM_RUN_CHARACTERS) {
    return undefined;
  }
  const { coverage, decoded } = measureRun(run);
  if (coverage < MINIMUM_COVERAGE || !profile.accepts(decoded, run)) {
    return undefined;
  }
  return {
    start: run.start,
    end: run.end,
    message: `Text looks like UTF-8 decoded as ${profile.label}`,
    suggestion: decoded
  };
}

function findReplacementCharacters(text: string): Finding[] {
  return [...text.matchAll(/\uFFFD+/gu)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    message: "Replacement character found; the text was decoded with the wrong encoding"
  }));
}

function findDecodingDamage(text: string, profile: Profile): Finding[] {
  return collectRuns(text, profile.encoding)
    .map((run) => findingForRun(run, profile))
    .filter((finding): finding is Finding => finding !== undefined);
}

function checkMojibake({ text, legacyEncoding }: RuleInput): Finding[] {
  if (legacyEncoding !== undefined) {
    return [{ start: 0, end: 0, message: `File is not UTF-8; it looks like ${legacyEncoding}`, wholeFile: true, suggestion: "save as UTF-8" }];
  }
  return [...findReplacementCharacters(text), ...PROFILES.flatMap((profile) => findDecodingDamage(text, profile))].sort(
    (left, right) => left.start - right.start
  );
}

export const mojibakeRule: Rule = {
  id: "mojibake",
  check: checkMojibake
};
