import { describe, expect, it } from "vitest";
import { ambiguousCharacters, simplifiedCharacters } from "../../src/dictionary/character-tables.js";
import { defaultTermTable } from "../../src/dictionary/term-table.js";
import { ambiguousCharRule } from "../../src/rules/ambiguous-char.js";
import { mainlandTermRule } from "../../src/rules/mainland-term.js";
import { simplifiedCharRule } from "../../src/rules/simplified-char.js";
import { fixWithRule, runRule } from "../helpers.js";

function failingEntries<T>(entries: Iterable<T>, passes: (entry: T) => boolean): T[] {
  return [...entries].filter((entry) => !passes(entry));
}

describe("simplified-chars.json", () => {
  it("has entries", () => {
    expect(simplifiedCharacters().size).toBeGreaterThan(3000);
  });

  it("flags and fixes every entry", () => {
    const failures = failingEntries(simplifiedCharacters(), ([simplified, traditional]) =>
      fixWithRule(simplifiedCharRule, simplified) === traditional
    );
    expect(failures).toEqual([]);
  });

  it("maps every entry to text that passes the character rules", () => {
    const failures = failingEntries(simplifiedCharacters().values(), (traditional) =>
      runRule(simplifiedCharRule, traditional).length === 0 && runRule(ambiguousCharRule, traditional).length === 0
    );
    expect(failures).toEqual([]);
  });
});

describe("ambiguous-chars.json", () => {
  it("reports every entry with all candidates", () => {
    const failures = failingEntries(ambiguousCharacters(), ([simplified, candidates]) =>
      runRule(ambiguousCharRule, simplified)[0]?.suggestion === candidates.join(" / ")
    );
    expect(failures).toEqual([]);
  });

  it("lists only candidates that pass the character rules", () => {
    const failures = failingEntries([...ambiguousCharacters().values()].flat(), (candidate) =>
      runRule(simplifiedCharRule, candidate).length === 0 && runRule(ambiguousCharRule, candidate).length === 0
    );
    expect(failures).toEqual([]);
  });

  it("does not overlap with simplified-chars.json", () => {
    const failures = failingEntries(ambiguousCharacters().keys(), (key) => !simplifiedCharacters().has(key));
    expect(failures).toEqual([]);
  });
});

describe("tw-terms.json", () => {
  const terms = defaultTermTable();

  it("flags every replacement entry with its suggestion", () => {
    const failures = failingEntries(terms.replacements, ([term, replacements]) => {
      const findings = runRule(mainlandTermRule, term);
      return findings.length === 1 && findings[0]?.suggestion === replacements.join(" / ");
    });
    expect(failures).toEqual([]);
  });

  it("fixes every entry with one replacement", () => {
    const single = [...terms.replacements].filter(([, replacements]) => replacements.length === 1);
    const failures = failingEntries(single, ([term, [replacement]]) => fixWithRule(mainlandTermRule, term) === replacement);
    expect(failures).toEqual([]);
  });

  it("uses replacements that pass every vocabulary rule", () => {
    const failures = failingEntries([...terms.replacements.values()].flat(), (replacement) =>
      [simplifiedCharRule, ambiguousCharRule, mainlandTermRule].every((rule) => runRule(rule, replacement).length === 0)
    );
    expect(failures).toEqual([]);
  });

  it("uses Traditional characters in every term", () => {
    const failures = failingEntries(terms.replacements.keys(), (term) =>
      runRule(simplifiedCharRule, term).length === 0 && runRule(ambiguousCharRule, term).length === 0
    );
    expect(failures).toEqual([]);
  });

  it("never flags a protected phrase", () => {
    const failures = failingEntries(terms.protectedPhrases, (phrase) => runRule(mainlandTermRule, phrase).length === 0);
    expect(failures).toEqual([]);
  });

  it("keeps protected phrases out of the replacements", () => {
    const failures = failingEntries(terms.protectedPhrases, (phrase) => !terms.replacements.has(phrase));
    expect(failures).toEqual([]);
  });
});
