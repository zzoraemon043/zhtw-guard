import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, runInProject } from "./cli-helpers.js";

function hookInput(value: unknown): string {
  return JSON.stringify(value);
}

describe("zhtw-guard hook: replies", () => {
  it("exits with 0 and prints nothing for a clean reply", async () => {
    const result = await runInProject(process.cwd(), ["hook"], hookInput({ text: "好的，我來修改設定。" }));
    expect(result).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("exits with 2 and writes problems to standard error", async () => {
    const result = await runInProject(process.cwd(), ["hook"], hookInput({ text: "好的，我来修改设置。" }));
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("<reply>:1:1 reply-language Reply starts in Simplified Chinese");
    expect(result.stderr).toContain('<reply>:1:8 mainland-term Mainland China term "设置" -> 設定');
    expect(result.stderr).toContain("Fix them so the text follows Traditional Chinese (Taiwan) conventions.");
  });

  it("flags a reply that starts in English", async () => {
    const result = await runInProject(process.cwd(), ["hook"], hookInput({ reply: "Done. 已完成。" }));
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Reply starts in English");
  });

  it("reads custom nested text fields", async () => {
    const input = hookInput({ event: { output: { content: "Sure, done." } } });
    const result = await runInProject(process.cwd(), ["hook", "--text-field", "event.output.content"], input);
    expect(result.exitCode).toBe(2);
  });

  it("accepts several fields separated by commas", async () => {
    const input = hookInput({ answer: "Sure, done." });
    expect((await runInProject(process.cwd(), ["hook", "--text-field", "body,answer"], input)).exitCode).toBe(2);
  });

  it("ignores events without a known field", async () => {
    const result = await runInProject(process.cwd(), ["hook"], hookInput({ event: "start", content: "Sure" }));
    expect(result).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });

  it("ignores empty input", async () => {
    expect(await runInProject(process.cwd(), ["hook"], "  \n")).toEqual({ exitCode: 0, stdout: "", stderr: "" });
  });
});

describe("zhtw-guard hook: written files", () => {
  it("checks the written file relative to the cwd field", async () => {
    const root = await createProject({ "docs/a.md": "請安裝軟件\n" });
    const result = await runInProject(process.cwd(), ["hook"], hookInput({ cwd: root, path: "docs/a.md" }));
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('docs/a.md:1:4 mainland-term Mainland China term "軟件" -> 軟體');
  });

  it("does not check the reply language of files", async () => {
    const root = await createProject({ "notes.md": "Sure, I will fix it.\n" });
    expect((await runInProject(root, ["hook"], hookInput({ file_path: join(root, "notes.md") }))).exitCode).toBe(0);
  });

  it("reads custom path fields", async () => {
    const root = await createProject({ "a.md": "设定\n" });
    const input = hookInput({ tool: { args: { target: "a.md" } }, workdir: root });
    const result = await runInProject(process.cwd(), ["hook", "--path-field", "tool.args.target", "--cwd-field", "workdir"], input);
    expect(result.exitCode).toBe(2);
  });

  it("uses the project config, including exclude", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": JSON.stringify({ exclude: ["vendor/**"] }),
      "vendor/a.md": "设定\n"
    });
    expect((await runInProject(root, ["hook"], hookInput({ path: "vendor/a.md" }))).exitCode).toBe(0);
  });

  it("ignores a path that no longer exists", async () => {
    const root = await createProject({});
    expect((await runInProject(root, ["hook"], hookInput({ path: "deleted.md" }))).exitCode).toBe(0);
  });

  it("does not block on warnings unless --fail-on warning is set", async () => {
    const root = await createProject({
      "zhtw-guard.config.json": JSON.stringify({ rules: { "mainland-term": "warning" } }),
      "a.md": "軟件\n"
    });
    expect((await runInProject(root, ["hook"], hookInput({ path: "a.md" }))).exitCode).toBe(0);
    expect((await runInProject(root, ["hook", "--fail-on", "warning"], hookInput({ path: "a.md" }))).exitCode).toBe(2);
  });

  it("checks both the reply and the file when both are present", async () => {
    const root = await createProject({ "a.md": "设定\n" });
    const result = await runInProject(root, ["hook"], hookInput({ text: "Done.", path: "a.md" }));
    expect(result.stderr).toContain("<reply>:1:1 reply-language");
    expect(result.stderr).toContain("a.md:1:1 simplified-char");
  });
});

describe("zhtw-guard hook: errors", () => {
  it("exits with 1 for invalid JSON so the agent is not blocked", async () => {
    const result = await runInProject(process.cwd(), ["hook"], "{not json");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("expects a JSON object");
  });

  it("exits with 1 for an invalid config", async () => {
    const root = await createProject({ "zhtw-guard.config.json": "{" });
    expect((await runInProject(root, ["hook"], hookInput({ text: "好" }))).exitCode).toBe(1);
  });

  it("exits with 1 for unsupported options", async () => {
    expect((await runInProject(process.cwd(), ["hook", "--format", "json"], "{}")).exitCode).toBe(1);
    expect((await runInProject(process.cwd(), ["hook", "a.md"], "{}")).exitCode).toBe(1);
  });

  it("rejects hook options on other commands", async () => {
    expect((await runInProject(process.cwd(), ["text", "--text-field", "x"], "")).exitCode).toBe(2);
  });
});
