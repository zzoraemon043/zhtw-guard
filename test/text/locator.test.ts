import { describe, expect, it } from "vitest";
import { createLocator } from "../../src/text/locator.js";

describe("createLocator", () => {
  it("returns 1-based lines and columns", () => {
    const locate = createLocator("ab\ncd\n");
    expect(locate(0)).toEqual({ line: 1, column: 1 });
    expect(locate(4)).toEqual({ line: 2, column: 2 });
  });

  it("counts columns in code points", () => {
    const text = "\u{20000}x";
    expect(createLocator(text)(text.indexOf("x"))).toEqual({ line: 1, column: 2 });
  });

  it("does not count a leading BOM as a column", () => {
    const text = "﻿# 标题\n标";
    const locate = createLocator(text);
    expect(locate(0)).toEqual({ line: 1, column: 1 });
    expect(locate(text.indexOf("标"))).toEqual({ line: 1, column: 3 });
    expect(locate(text.lastIndexOf("标"))).toEqual({ line: 2, column: 1 });
  });

  it("places the end of the text on the last line", () => {
    expect(createLocator("a\nb")(3)).toEqual({ line: 2, column: 2 });
  });
});
