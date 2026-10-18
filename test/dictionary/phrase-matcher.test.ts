import { describe, expect, it } from "vitest";
import { PhraseMatcher } from "../../src/dictionary/phrase-matcher.js";

describe("PhraseMatcher", () => {
  it("finds the longest phrase at each position", () => {
    const matcher = new PhraseMatcher(["數據", "數據庫"]);
    expect(matcher.findAll("數據庫與數據")).toEqual([
      { start: 0, end: 3, phrase: "數據庫" },
      { start: 4, end: 6, phrase: "數據" }
    ]);
  });

  it("matches a short phrase at the end of the text when a longer phrase shares its start", () => {
    const matcher = new PhraseMatcher(["軟件", "軟體動物"]);
    expect(matcher.findAll("安裝軟件")).toEqual([{ start: 2, end: 4, phrase: "軟件" }]);
  });

  it("finds nothing in unrelated text", () => {
    expect(new PhraseMatcher(["軟件"]).findAll("軟體")).toEqual([]);
  });
});
