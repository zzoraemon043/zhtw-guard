import { execFileSync, spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject } from "../cli/cli-helpers.js";

const SCRIPT = resolve("scripts/action-check.sh");
const ARGUMENT_PRINTER = "console.log(JSON.stringify(process.argv.slice(2)));\n";

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

async function createRepository(files: Record<string, string>): Promise<{ root: string; baseSha: string }> {
  const root = await createProject({ "base.md": "base\n", "docs/old.md": "old\n" });
  git(root, "init", "--quiet", "--initial-branch=main");
  git(root, "-c", "user.name=test", "-c", "user.email=test@example.com", "add", ".");
  git(root, "-c", "user.name=test", "-c", "user.email=test@example.com", "commit", "--quiet", "-m", "base");
  const baseSha = git(root, "rev-parse", "HEAD");
  for (const [path, content] of Object.entries(files)) {
    await writeFile(join(root, path), content);
  }
  git(root, "-c", "user.name=test", "-c", "user.email=test@example.com", "add", ".");
  git(root, "-c", "user.name=test", "-c", "user.email=test@example.com", "commit", "--quiet", "-m", "change");
  git(root, "remote", "add", "origin", root);
  await writeFile(join(root, "print-args.mjs"), ARGUMENT_PRINTER);
  return { root, baseSha };
}

function runAction(root: string, env: Record<string, string>): { status: number | null; stdout: string } {
  const result = spawnSync("bash", [SCRIPT], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ZHTW_GUARD_BIN: join(root, "print-args.mjs"), ...env }
  });
  return { status: result.status, stdout: result.stdout };
}

function passedArguments(stdout: string): string[] {
  return JSON.parse(stdout.trim().split("\n").at(-1) ?? "[]") as string[];
}

describe.skipIf(process.platform === "win32")("scripts/action-check.sh", () => {
  it("checks only files changed since the base commit", async () => {
    const { root, baseSha } = await createRepository({ "docs/new.md": "new\n", "src.md": "src\n" });
    const result = runAction(root, { ZHTW_GUARD_BASE_SHA: baseSha });
    expect(result.status).toBe(0);
    expect(passedArguments(result.stdout)).toEqual(["check", "--format", "github", "--fail-on", "error", "docs/new.md", "src.md"]);
  });

  it("limits changed files to the given paths", async () => {
    const { root, baseSha } = await createRepository({ "docs/new.md": "new\n", "src.md": "src\n" });
    const result = runAction(root, { ZHTW_GUARD_BASE_SHA: baseSha, ZHTW_GUARD_PATHS: "./docs/\nREADME.md" });
    expect(passedArguments(result.stdout).slice(5)).toEqual(["docs/new.md"]);
  });

  it("passes strictness and fail-on", async () => {
    const { root, baseSha } = await createRepository({ "a.md": "a\n" });
    const result = runAction(root, { ZHTW_GUARD_BASE_SHA: baseSha, ZHTW_GUARD_STRICTNESS: "strict", ZHTW_GUARD_FAIL_ON: "warning" });
    expect(passedArguments(result.stdout)).toEqual(["check", "--format", "github", "--fail-on", "warning", "--strictness", "strict", "a.md"]);
  });

  it("skips the check when no changed file is in scope", async () => {
    const { root, baseSha } = await createRepository({ "src.md": "src\n" });
    const result = runAction(root, { ZHTW_GUARD_BASE_SHA: baseSha, ZHTW_GUARD_PATHS: "docs" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("no changed files to check");
  });

  it("checks the given paths outside pull requests", async () => {
    const { root } = await createRepository({ "a.md": "a\n" });
    const result = runAction(root, { ZHTW_GUARD_PATHS: "docs README.md" });
    expect(passedArguments(result.stdout).slice(5)).toEqual(["docs", "README.md"]);
  });

  it("fails when the check fails", async () => {
    const { root, baseSha } = await createRepository({ "a.md": "a\n" });
    await writeFile(join(root, "fail.mjs"), "process.exit(1);\n");
    const result = runAction(root, { ZHTW_GUARD_BASE_SHA: baseSha, ZHTW_GUARD_BIN: join(root, "fail.mjs") });
    expect(result.status).toBe(1);
  });

  it("falls back to the given paths when the base commit is missing", async () => {
    const { root } = await createRepository({ "a.md": "a\n" });
    const result = runAction(root, { ZHTW_GUARD_BASE_SHA: "0".repeat(40) });
    expect(result.stdout).toContain("::warning title=zhtw-guard::Base commit");
    expect(passedArguments(result.stdout).slice(5)).toEqual(["."]);
  });
});
