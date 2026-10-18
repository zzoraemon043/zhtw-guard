import type { Finding, Rule, RuleInput, TextEdit } from "../types.js";

type LineEnding = "\r\n" | "\n";

interface LineBreak {
  start: number;
  ending: LineEnding;
}

function collectLineBreaks(text: string): LineBreak[] {
  return [...text.matchAll(/\r?\n/gu)].map((match) => ({ start: match.index, ending: match[0] as LineEnding }));
}

function describe(ending: LineEnding): string {
  return ending === "\n" ? "LF" : "CRLF";
}

function checkLineEndings({ text }: RuleInput): Finding[] {
  const breaks = collectLineBreaks(text);
  const crlfCount = breaks.filter((lineBreak) => lineBreak.ending === "\r\n").length;
  const lfCount = breaks.length - crlfCount;
  if (crlfCount === 0 || lfCount === 0) {
    return [];
  }
  const target: LineEnding = crlfCount > lfCount ? "\r\n" : "\n";
  const minority = breaks.filter((lineBreak) => lineBreak.ending !== target);
  const edits: TextEdit[] = minority.map(({ start, ending }) => ({ start, end: start + ending.length, text: target }));
  const [first] = minority;
  return [
    {
      start: first?.start ?? 0,
      end: (first?.start ?? 0) + (first?.ending.length ?? 0),
      message: `Mixed line endings: ${crlfCount} CRLF and ${lfCount} LF`,
      suggestion: `convert all to ${describe(target)}`,
      edits
    }
  ];
}

export const lineEndingRule: Rule = {
  id: "line-ending",
  check: checkLineEndings
};
