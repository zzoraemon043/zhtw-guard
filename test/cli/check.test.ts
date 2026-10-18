import { describe, expect, it } from "vitest";
import { createProject, runInProject } from "./cli-helpers.js";

describe("zhtw-guard check", () => {
  it("reports problems in the human format and exits with 1", async () => {
    const root = await createProject({ "docs/guide.md": "# 說明\n\n請安裝軟件。\n" });
    const result = await runInProject(root, ["check"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('docs/guide.md:3:4 mainland-term Mainland China term "軟件" -> 軟體\n');
    expect(result.stderr).toContain("1 problem (1 error, 0 warnings)");
  });

  it("exits with 0 and prints nothing when clean", async () => {
    const root = await createProject({ "README.md": "請安裝軟體。\n" });
    expect(await runInProject(root, ["check"])).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("checks only the given paths", async () => {
    const root = await createProject({ "a.md": "软件\n", "b.md": "軟體\n" });
    expect((await runInProject(root, ["check", "b.md"])).exitCode).toBe(0);
    expect((await runInProject(root, ["check", "a.md"])).exitCode).toBe(1);
  });

  it("prints JSON with --format json", async () => {
    const root = await createProject({ "a.md": "设定\n" });
    const result = await runInProject(root, ["check", "--format", "json"]);
    const report = JSON.parse(result.stdout) as { issues: unknown[]; errorCount: number; warningCount: number };
    expect(result.exitCode).toBe(1);
    expect(report.errorCount).toBe(1);
    expect(report.warningCount).toBe(0);
    expect(report.issues).toEqual([
      {
        path: "a.md",
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 2,
        rule: "simplified-char",
        severity: "error",
        message: 'Simplified character "设"',
        suggestion: "設",
        fixable: true
      }
    ]);
  });

  it("prints an empty JSON report when clean", async () => {
    const root = await createProject({ "a.md": "設定\n" });
    const result = await runInProject(root, ["check", "--format", "json"]);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ issues: [], errorCount: 0, warningCount: 0 });
  });

  it("skips binary files and node_modules", async () => {
    const root = await createProject({
      "image.bin": new Uint8Array([0, 0xe8, 0xae, 0xbe]),
      "node_modules/pkg/index.md": "软件\n"
    });
    expect((await runInProject(root, ["check"])).exitCode).toBe(0);
  });

  it("reports file-level rules", async () => {
    const root = await createProject({ "run.ps1": 'Write-Host "完成"\nexit 0\r\nexit 1\n' });
    const result = await runInProject(root, ["check"]);
    expect(result.stdout).toContain("run.ps1:1:1 ps1-bom");
    expect(result.stdout).toContain("run.ps1:2:7 line-ending");
  });

  it("reports text that is not valid UTF-8", async () => {
    const root = await createProject({ "big5.txt": new Uint8Array([0xa4, 0xa4, 0xa4, 0xe5, 0x0a]) });
    const result = await runInProject(root, ["check"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("big5.txt:1:1 mojibake");
  });
});

describe("usage errors", () => {
  it("exits with 2 for an unknown command", async () => {
    const result = await runInProject(process.cwd(), ["scan"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Unknown command "scan"');
  });

  it("exits with 2 for an unknown option", async () => {
    expect((await runInProject(process.cwd(), ["check", "--fast"])).exitCode).toBe(2);
  });

  it("exits with 2 for an unknown format", async () => {
    expect((await runInProject(process.cwd(), ["check", "--format", "xml"])).exitCode).toBe(2);
  });

  it("exits with 2 for a missing path", async () => {
    const root = await createProject({});
    const result = await runInProject(root, ["check", "missing.md"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Path not found");
  });

  it("exits with 2 when text-only options are used with check", async () => {
    expect((await runInProject(process.cwd(), ["check", "--fix"])).exitCode).toBe(2);
  });

  it("prints help and exits with 0", async () => {
    const result = await runInProject(process.cwd(), ["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: zhtw-guard");
  });

  it("prints the version", async () => {
    expect((await runInProject(process.cwd(), ["--version"])).stdout).toMatch(/^\d+\.\d+\.\d+\n$/);
  });
});
