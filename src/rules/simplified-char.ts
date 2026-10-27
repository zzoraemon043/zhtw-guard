import { simplifiedCharacters, simplifiedPhrases } from "../dictionary/character-tables.js";
import { PhraseMatcher, type PhraseMatch } from "../dictionary/phrase-matcher.js";
import { codePoints } from "../text/code-points.js";
import type { Finding, Rule, RuleInput } from "../types.js";
import { toTraditionalKeepingOffsets } from "./mainland-term.js";

let phraseMatcherCache: PhraseMatcher | undefined;

function phraseMatcher(): PhraseMatcher {
  const { phrases, protectedPhrases } = simplifiedPhrases();
  phraseMatcherCache ??= new PhraseMatcher([...phrases.keys(), ...protectedPhrases]);
  return phraseMatcherCache;
}

function findPhrases(text: string): Finding[] {
  const { phrases } = simplifiedPhrases();
  return phraseMatcher()
    .findAll(toTraditionalKeepingOffsets(text))
    .flatMap(({ start, end, phrase }: PhraseMatch) => {
      const traditional = phrases.get(phrase);
      if (traditional === undefined) {
        return [];
      }
      return [
        {
          start,
          end,
          message: `Simplified phrase "${text.slice(start, end)}"`,
          suggestion: traditional,
          edits: [{ start, end, text: traditional }]
        }
      ];
    });
}

function findCharacters(text: string, covered: readonly Finding[]): Finding[] {
  const table = simplifiedCharacters();
  const findings: Finding[] = [];
  for (const { character, start, end } of codePoints(text)) {
    const traditional = table.get(character);
    if (traditional === undefined || covered.some((phrase) => start >= phrase.start && end <= phrase.end)) {
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

function checkSimplifiedCharacters({ text }: RuleInput): Finding[] {
  const phrases = findPhrases(text);
  return [...phrases, ...findCharacters(text, phrases)].sort((left, right) => left.start - right.start);
}

export const simplifiedCharRule: Rule = {
  id: "simplified-char",
  check: checkSimplifiedCharacters
};
