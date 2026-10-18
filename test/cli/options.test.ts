import { describe, expect, it } from "vitest";
import { formatGithubAnnotation } from "../../src/cli/github-annotations.js";
import type { Issue } from "../../src/types.js";
import { createProject, runInProject } from "./cli-helpers.js";

function configFile(config: unknown): string {
  return JSON.stringify(config);
}

describe("text --reply", () => {
  it("flags a reply that starts in English", async () => {
    const result = await runInProject(process.cwd(), ["text", "--reply"], "Sure, I will fix it.\n");
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("<stdin>:1:1 reply-language Reply starts in English");
  });

  it("accepts a reply that starts in Traditional Chinese", async () => {
    expect((await runInProject(process.cwd(), ["text", "--reply"], "`npm test`\n全部通過。\n")).exitCode).toBe(0);
  });

  it("does not check the reply language without --reply", async () => {
    expect((await runInProject(process.cwd(), ["text"], "Sure, I will fix it.\n")).exitCode).toBe(0);
  });

  it("never checks the reply language of files", async () => {
    const root = await createProject({ "notes.md": "Sure, I will fix it.\n" });
    expect((await runInProject(root, ["check"])).exitCode).toBe(0);
  });

  it("is rejected outside the text command", async () => {
    expect((await runInProject(process.cwd(), ["check", "--reply"])).exitCode).toBe(2);
  });
});

describe("--strictness", () => {
  it("overrides the config file", async () => {
    const root = await createProject({ "a.md": "這個版本不支持舊格式\n" });
    expect((await runInProject(root, ["check"])).exitCode).toBe(0);
    expect((await runInProject(root, ["check", "--strictness", "strict"])).exitCode).toBe(1);
  });

  it("can relax a strict config", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({ strictness: "strict" }),
      "a.md": "這個版本不支持舊格式\n"
    });
    expect((await runInProject(root, ["check", "--strictness", "default"])).exitCode).toBe(0);
  });

  it("rejects unknown values", async () => {
    expect((await runInProject(process.cwd(), ["check", "--strictness", "loose"])).exitCode).toBe(2);
  });
});

describe("--fail-on", () => {
  const warningConfig = configFile({ rules: { "mainland-term": "warning" } });

  it("ignores warnings by default", async () => {
    const root = await createProject({ "zhtw-guard.config.json": warningConfig, "a.md": "軟件\n" });
    expect((await runInProject(root, ["check"])).exitCode).toBe(0);
  });

  it("fails on warnings with --fail-on warning", async () => {
    const root = await createProject({ "zhtw-guard.config.json": warningConfig, "a.md": "軟件\n" });
    expect((await runInProject(root, ["check", "--fail-on", "warning"])).exitCode).toBe(1);
  });

  it("rejects unknown values", async () => {
    expect((await runInProject(process.cwd(), ["check", "--fail-on", "info"])).exitCode).toBe(2);
  });
});

describe("--format github", () => {
  it("prints workflow annotations", async () => {
    const root = await createProject({ "docs/a.md": "請安裝軟件\n" });
    const result = await runInProject(root, ["check", "--format", "github"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe(
      "::error file=docs/a.md,line=1,col=4,endLine=1,endColumn=6,title=zhtw-guard mainland-term::Mainland China term \"軟件\" -> 軟體\n"
    );
  });

  it("prints warnings as warning annotations", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": configFile({ rules: { "mainland-term": "warning" } }),
      "a.md": "軟件\n"
    });
    expect((await runInProject(root, ["check", "--format", "github"])).stdout).toMatch(/^::warning file=a\.md,/u);
  });

  it("escapes special characters", () => {
    const issue: Issue = {
      path: "a,b:c.md",
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 2,
      rule: "mojibake",
      severity: "error",
      message: "100% broken\nline",
      fixable: false
    };
    expect(formatGithubAnnotation(issue)).toBe(
      "::error file=a%2Cb%3Ac.md,line=1,col=1,endLine=1,endColumn=2,title=zhtw-guard mojibake::100%25 broken%0Aline"
    );
  });

  it("works with the text command", async () => {
    const result = await runInProject(process.cwd(), ["text", "--format", "github"], "设定");
    expect(result.stdout).toMatch(/^::error file=<stdin>,line=1,col=1,/u);
  });
});
