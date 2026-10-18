import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectFiles, MissingPathError } from "../../src/files/collect-files.js";
import { createProject } from "../cli/cli-helpers.js";

describe("collectFiles", () => {
  it("walks directories in a stable order and honors include and exclude", async () => {
    const root = await createProject({ "b.md": "", "a.md": "", "src/x.ts": "", "data/y.json": "", "z.txt": "" });
    const files = await collectFiles([], root, { root, include: ["**/*.md", "src/**"], exclude: ["data/**"] });
    expect(files).toEqual([join(root, "a.md"), join(root, "b.md"), join(root, "src/x.ts")]);
  });

  it("applies exclude but not include to explicit files", async () => {
    const root = await createProject({ "z.txt": "", "data/y.json": "" });
    const selection = { root, include: ["**/*.md"], exclude: ["data/**"] };
    expect(await collectFiles(["z.txt", "data/y.json"], root, selection)).toEqual([join(root, "z.txt")]);
  });

  it("throws for a missing path", async () => {
    const root = await createProject({});
    await expect(collectFiles(["nope"], root, { root, include: ["**"], exclude: [] })).rejects.toBeInstanceOf(MissingPathError);
  });
});
