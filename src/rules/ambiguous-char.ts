import { ambiguousCharacters } from "../dictionary/character-tables.js";
import { codePoints } from "../text/code-points.js";
import type { Finding, Rule, RuleInput } from "../types.js";

function checkAmbiguousCharacters({ text }: RuleInput): Finding[] {
  const table = ambiguousCharacters();
  const findings: Finding[] = [];
  for (const { character, start, end } of codePoints(text)) {
    const candidates = table.get(character);
    if (candidates === undefined) {
      continue;
    }
    findings.push({
      start,
      end,
      message: `Simplified character "${character}" has several Traditional forms`,
      suggestion: candidates.join(" / ")
    });
  }
  return findings;
}

export const ambiguousCharRule: Rule = {
  id: "ambiguous-char",
  check: checkAmbiguousCharacters
};
