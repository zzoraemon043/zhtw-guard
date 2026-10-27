import { describe, expect, it } from "vitest";
import { simplifiedCharacters, simplifiedPhrases } from "../../src/dictionary/character-tables.js";
import { simplifiedCharRule } from "../../src/rules/simplified-char.js";
import { fixWithRule, runRule } from "../helpers.js";

const { phrases, protectedPhrases } = simplifiedPhrases();

describe("simplified phrase entries", () => {
  it.each([...phrases])("fixes %s to %s", (phrase, traditional) => {
    expect(fixWithRule(simplifiedCharRule, phrase)).toBe(traditional);
  });

  it.each([...phrases.keys()])("keys %s by characters the character table leaves alone", (phrase) => {
    expect([...phrase].every((character) => !simplifiedCharacters().has(character))).toBe(true);
  });

  it.each([...protectedPhrases])("leaves the Traditional word %s alone", (phrase) => {
    expect(runRule(simplifiedCharRule, phrase)).toEqual([]);
  });
});

describe("simplified phrases in sentences", () => {
  it("converts the characters that are also Traditional when the phrase shows their meaning", () => {
    expect(fixWithRule(simplifiedCharRule, "后来我们在里面吃面，干完活后把范围内的云计算资源都准备好了。我们发现")).toBe(
      "後來我們在裡面吃麵，幹完活后把範圍內的雲端運算資源都準備好了。我們發現"
    );
  });

  it("keeps words such as 皇后 and 公里 when a phrase would overlap them", () => {
    expect(fixWithRule(simplifiedCharRule, "皇后来了，全程三公里面向海边")).toBe("皇后來了，全程三公里面向海邊");
  });

  it("reports one finding for a phrase instead of one per character", () => {
    expect(runRule(simplifiedCharRule, "范围")).toEqual([expect.objectContaining({ start: 0, end: 2, suggestion: "範圍" })]);
  });
});
