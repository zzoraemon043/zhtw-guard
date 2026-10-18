import { simplifiedCharacters } from "../dictionary/character-tables.js";
import { codePoints } from "../text/code-points.js";
import type { Finding, Rule, RuleInput } from "../types.js";

function checkSimplifiedCharacters({ text }: RuleInput): Finding[] {
  const table = simplifiedCharacters();
  const findings: Finding[] = [];
  for (const { character, start, end } of codePoints(text)) {
    const traditional = table.get(character);
    if (traditional === undefined) {
      continue;
    }
    findings.push({
      start,
      end,
      message: `Simplified character "${character}"`,
      suggestion: traditional,
      edits: [{ start, end, text: traditional }]
    });
  }
  return findings;
}

export const simplifiedCharRule: Rule = {
  id: "simplified-char",
  check: checkSimplifiedCharacters
};
