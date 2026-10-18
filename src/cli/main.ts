#!/usr/bin/env node
import { buffer } from "node:stream/consumers";
import { runCli } from "./run-cli.js";

process.exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (output) => process.stdout.write(output),
  stderr: (output) => process.stderr.write(output),
  readStdin: () => buffer(process.stdin)
});
