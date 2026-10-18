import type { Finding } from "../types.js";

export const IGNORE_MARKER = "zhtw-guard-ignore";

interface Range {
  start: number;
  end: number;
}

const IGNORED_LINE = new RegExp(`${IGNORE_MARKER}(?:\\s*(?:-->|\\*/))?[ \\t]*\\r?$`, "u");

export function findIgnoredLines(text: string): Range[] {
  const ranges: Range[] = [];
  let start = 0;
  for (const line of text.split("\n")) {
    if (IGNORED_LINE.test(line)) {
      ranges.push({ start, end: start + line.length });
    }
    start += line.length + 1;
  }
  return ranges;
}

export function findAllowedRanges(text: string, allow: readonly string[]): Range[] {
  const ranges: Range[] = [];
  for (const word of allow.filter((entry) => entry.length > 0)) {
    let index = text.indexOf(word);
    while (index !== -1) {
      ranges.push({ start: index, end: index + word.length });
      index = text.indexOf(word, index + 1);
    }
  }
  return ranges;
}

function isOnIgnoredLine(finding: Finding, ignoredLines: readonly Range[]): boolean {
  return ignoredLines.some((range) => finding.start >= range.start && finding.start <= range.end);
}

function isInsideAllowedWord(finding: Finding, allowed: readonly Range[]): boolean {
  return allowed.some((range) => finding.start >= range.start && finding.end <= range.end && finding.end > finding.start);
}

export function createSuppressionFilter(text: string, allow: readonly string[]): (finding: Finding) => boolean {
  const ignoredLines = findIgnoredLines(text);
  const allowed = findAllowedRanges(text, allow);
  return (finding) => !isOnIgnoredLine(finding, ignoredLines) && !isInsideAllowedWord(finding, allowed);
}
