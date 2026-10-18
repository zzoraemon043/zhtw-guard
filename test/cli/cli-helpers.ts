import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runCli } from "../../src/cli/run-cli.js";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function createProject(files: Record<string, string | Uint8Array>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "zhtw-guard-"));
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}

export async function runInProject(cwd: string, argv: string[], stdin = ""): Promise<CliResult> {
  let stdout = "";
  let stderr = "";
  const exitCode = await runCli(argv, {
    cwd,
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
    readStdin: () => Promise.resolve(new TextEncoder().encode(stdin))
  });
  return { exitCode, stdout, stderr };
}
