import { simplifiedCharacters } from "../dictionary/character-tables.js";
import { PhraseMatcher } from "../dictionary/phrase-matcher.js";
import type { Finding, Rule, RuleInput, TermTable } from "../types.js";

const matcherCache = new WeakMap<TermTable, PhraseMatcher>();

function matcherFor(terms: TermTable): PhraseMatcher {
  let matcher = matcherCache.get(terms);
  if (matcher === undefined) {
    matcher = new PhraseMatcher([...terms.replacements.keys(), ...terms.protectedPhrases]);
    matcherCache.set(terms, matcher);
  }
  return matcher;
}

export function toTraditionalKeepingOffsets(text: string): string {
  const table = simplifiedCharacters();
  let converted = "";
  for (const character of text) {
    const traditional = table.get(character);
    converted += traditional !== undefined && traditional.length === character.length ? traditional : character;
  }
  return converted;
}

function checkMainlandTerms({ text, terms }: RuleInput): Finding[] {
  const findings: Finding[] = [];
  for (const { start, end, phrase } of matcherFor(terms).findAll(toTraditionalKeepingOffsets(text))) {
    const replacements = terms.replacements.get(phrase);
    if (replacements === undefined || terms.protectedPhrases.has(phrase)) {
      continue;
    }
    const [onlyReplacement] = replacements;
    findings.push({
      start,
      end,
      message: `Mainland China term "${text.slice(start, end)}"`,
      suggestion: replacements.join(" / "),
      ...(replacements.length === 1 && onlyReplacement !== undefined
        ? { edits: [{ start, end, text: onlyReplacement }] }
        : {})
    });
  }
  return findings;
}

export const mainlandTermRule: Rule = {
  id: "mainland-term",
  check: checkMainlandTerms
};
