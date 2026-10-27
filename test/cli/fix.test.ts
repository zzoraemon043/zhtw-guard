import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, runInProject } from "./cli-helpers.js";

describe("zhtw-guard fix", () => {
  it("fixes files in place and exits with 0 when nothing is left", async () => {
    const root = await createProject({ "a.md": "请设置默认软件\n" });
    const result = await runInProject(root, ["fix"]);
    expect(result.exitCode).toBe(0);
    expect(await readFile(join(root, "a.md"), "utf8")).toBe("請設定預設軟體\n");
    expect(result.stderr).toContain("in 1 file");
  });

  it("reports what it cannot fix and exits with 1", async () => {
    const root = await createProject({ "a.md": "长发与视频\n" });
    const result = await runInProject(root, ["fix"]);
    expect(result.exitCode).toBe(1);
    expect(await readFile(join(root, "a.md"), "utf8")).toBe("長发與視頻\n");
    expect(result.stdout).toContain("ambiguous-char");
    expect(result.stdout).toContain("mainland-term");
  });

  it("adds the BOM and normalizes line endings", async () => {
    const root = await createProject({ "run.ps1": 'Write-Host "完成"\nexit 0\r\n\n' });
    expect((await runInProject(root, ["fix"])).exitCode).toBe(0);
    expect(await readFile(join(root, "run.ps1"), "utf8")).toBe('\uFEFFWrite-Host "完成"\nexit 0\n\n');
  });

  it("does not rewrite files that are not valid UTF-8", async () => {
    const bytes = new Uint8Array([0xa4, 0xa4, 0x0d, 0x0a, 0x0a]);
    const root = await createProject({ "big5.txt": bytes });
    expect((await runInProject(root, ["fix"])).exitCode).toBe(1);
    expect(new Uint8Array(await readFile(join(root, "big5.txt")))).toEqual(bytes);
  });

  it("reports fixed counts in JSON", async () => {
    const root = await createProject({ "a.md": "设定\n" });
    const result = await runInProject(root, ["fix", "--format", "json"]);
    expect(JSON.parse(result.stdout)).toEqual({ issues: [], errorCount: 0, warningCount: 0, fixedCount: 1, changedFiles: ["a.md"] });
  });

  it("leaves clean files untouched", async () => {
    const root = await createProject({ "a.md": "設定\n" });
    const result = await runInProject(root, ["fix"]);
    expect(result).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });
});
