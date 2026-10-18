import { describe, expect, it } from "vitest";
import { ps1BomRule } from "../../src/rules/ps1-bom.js";
import { fixWithRule, runRule } from "../helpers.js";

const script = 'Write-Host "設定完成"\n';

describe("ps1-bom", () => {
  it("flags a PowerShell script with non-ASCII text and no BOM", () => {
    expect(runRule(ps1BomRule, script, { path: "setup.ps1" })).toEqual([
      expect.objectContaining({ start: 0, end: 0 })
    ]);
  });

  it("matches the extension without regard to case", () => {
    expect(runRule(ps1BomRule, script, { path: "Setup.PS1" })).toHaveLength(1);
  });

  it("adds the BOM", () => {
    expect(fixWithRule(ps1BomRule, script, { path: "setup.ps1" })).toBe(`\uFEFF${script}`);
  });

  it("does not flag a script that already has a BOM", () => {
    expect(runRule(ps1BomRule, `\uFEFF${script}`, { path: "setup.ps1" })).toEqual([]);
  });

  it("does not flag an ASCII-only script", () => {
    expect(runRule(ps1BomRule, 'Write-Host "done"\n', { path: "setup.ps1" })).toEqual([]);
  });

  it("does not flag other file types", () => {
    expect(runRule(ps1BomRule, script, { path: "setup.sh" })).toEqual([]);
    expect(runRule(ps1BomRule, script)).toEqual([]);
  });
});
