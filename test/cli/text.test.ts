import { describe, expect, it } from "vitest";
import { runInProject } from "./cli-helpers.js";

describe("zhtw-guard text", () => {
  it("checks standard input", async () => {
    const result = await runInProject(process.cwd(), ["text"], "好的，我来设置。\n");
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("<stdin>:1:5 simplified-char");
  });

  it("exits with 0 for clean input", async () => {
    expect(await runInProject(process.cwd(), ["text"], "好的，我來設定。\n")).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("prints fixed text with --fix", async () => {
    const result = await runInProject(process.cwd(), ["text", "--fix"], "默认设置\n");
    expect(result).toEqual({ exitCode: 0, stdout: "預設設定\n", stderr: "" });
  });

  it("prints fixed text and remaining issues as JSON", async () => {
    const result = await runInProject(process.cwd(), ["text", "--fix", "--format", "json"], "长发");
    const report = JSON.parse(result.stdout) as { output: string; fixedCount: number; errorCount: number };
    expect(result.exitCode).toBe(1);
    expect(report).toMatchObject({ output: "長发", fixedCount: 1, errorCount: 1 });
  });

  it("uses --path for file-specific rules and output", async () => {
    const result = await runInProject(process.cwd(), ["text", "--path", "setup.ps1"], 'Write-Host "完成"');
    expect(result.stdout).toContain("setup.ps1:1:1 ps1-bom");
  });

  it("rejects paths", async () => {
    expect((await runInProject(process.cwd(), ["text", "a.md"])).exitCode).toBe(2);
  });
});
