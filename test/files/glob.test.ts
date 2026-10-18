import { describe, expect, it } from "vitest";
import { createGlobMatcher, globToRegExp } from "../../src/files/glob.js";

describe("globToRegExp", () => {
  it("matches a single path segment with *", () => {
    expect(globToRegExp("*.md").test("README.md")).toBe(true);
    expect(globToRegExp("*.md").test("docs/spec.md")).toBe(false);
  });

  it("matches any depth with **/", () => {
    expect(globToRegExp("**/*.md").test("README.md")).toBe(true);
    expect(globToRegExp("**/*.md").test("docs/a/spec.md")).toBe(true);
  });

  it("matches a directory and its content with a trailing /**", () => {
    const pattern = globToRegExp("data/**");
    expect(pattern.test("data")).toBe(true);
    expect(pattern.test("data/opencc/LICENSE")).toBe(true);
    expect(pattern.test("database.md")).toBe(false);
  });

  it("treats a trailing slash as the whole directory", () => {
    expect(globToRegExp("dist/").test("dist/index.js")).toBe(true);
  });

  it("supports ? and brace alternatives", () => {
    expect(globToRegExp("file?.{ts,js}").test("file1.ts")).toBe(true);
    expect(globToRegExp("file?.{ts,js}").test("file1.md")).toBe(false);
  });

  it("escapes regular expression characters", () => {
    expect(globToRegExp("a+b.md").test("a+b.md")).toBe(true);
    expect(globToRegExp("a+b.md").test("aab.md")).toBe(false);
  });

  it("ignores a leading ./", () => {
    expect(globToRegExp("./src/**").test("src/index.ts")).toBe(true);
  });
});

describe("createGlobMatcher", () => {
  it("matches when any pattern matches", () => {
    const matches = createGlobMatcher(["*.md", "src/**"]);
    expect(matches("README.md")).toBe(true);
    expect(matches("src/cli/main.ts")).toBe(true);
    expect(matches("test/a.ts")).toBe(false);
  });

  it("matches nothing without patterns", () => {
    expect(createGlobMatcher([])("README.md")).toBe(false);
  });
});
