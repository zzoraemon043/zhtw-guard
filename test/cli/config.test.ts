import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, runInProject } from "./cli-helpers.js";

function configFile(config: unknown): string {
  return JSON.stringify(config);
}

describe("zhtw-guard.config.json", () => {
  it("turns rules off", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({ rules: { "simplified-char": "off", "mainland-term": "off" } }),
      "a.md": "软件\n"
    });
    expect((await runInProject(root, ["check"])).exitCode).toBe(0);
  });

  it("downgrades rules to warnings, which do not fail the run", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({ rules: { "mainland-term": "warning" } }),
      "a.md": "軟件\n"
    });
    const result = await runInProject(root, ["check"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("mainland-term");
    expect(result.stdout).toContain("(warning)");
    expect(result.stderr).toContain("1 problem (0 errors, 1 warning)");
  });

  it("applies include and exclude relative to the config file", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({ include: ["**/*.md"], exclude: ["vendor/**"] }),
      "docs/a.md": "軟體\n",
      "docs/b.txt": "软件\n",
      "vendor/c.md": "软件\n"
    });
    expect((await runInProject(join(root, "docs"), ["check"])).exitCode).toBe(0);
    expect((await runInProject(root, ["check"])).exitCode).toBe(0);
  });

  it("finds the config file in a parent directory", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({ allow: ["软件"] }),
      "docs/a.md": "软件\n"
    });
    expect((await runInProject(join(root, "docs"), ["check"])).exitCode).toBe(0);
  });

  it("adds extra terms and fixes them", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({ extraTerms: { 質量: "品質" } }),
      "a.md": "質量\n"
    });
    expect((await runInProject(root, ["fix"])).exitCode).toBe(0);
    expect(await readFile(join(root, "a.md"), "utf8")).toBe("品質\n");
  });

  it("uses the config for the text command", async () => {
    const root = await createProject({ "zhtw-guard.config.json": configFile({ allow: ["视频号"] }) });
    expect((await runInProject(root, ["text"], "视频号")).exitCode).toBe(0);
  });

  it("uses --config instead of searching", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({}),
      "strict.json": configFile({ rules: { "line-ending": "off" } }),
      "a.md": "a\r\nb\n"
    });
    expect((await runInProject(root, ["check"])).exitCode).toBe(1);
    expect((await runInProject(root, ["check", "--config", "strict.json"])).exitCode).toBe(0);
  });

  it("exits with 2 for an invalid config", async () => {
    const root = await createProject({ "zhtw-guard.config.json": configFile({ rules: { mojibake: "warn" } }) });
    const result = await runInProject(root, ["check"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Rule "mojibake" must be "error", "warning" or "off".');
  });

  it("exits with 2 for invalid JSON", async () => {
    const root = await createProject({ "zhtw-guard.config.json": "{" });
    expect((await runInProject(root, ["check"])).exitCode).toBe(2);
  });

  it("exits with 2 for a missing --config file", async () => {
    const root = await createProject({});
    expect((await runInProject(root, ["check", "--config", "nope.json"])).exitCode).toBe(2);
  });
});
