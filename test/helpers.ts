import { applyEdits } from "../src/engine/apply-edits.js";
import { defaultTermTable } from "../src/dictionary/term-table.js";
import type { Finding, Rule, TermTable } from "../src/types.js";

export interface RunOptions {
  path?: string;
  terms?: TermTable;
}

export function runRule(rule: Rule, text: string, options: RunOptions = {}): Finding[] {
  return rule.check({
    text,
    terms: options.terms ?? defaultTermTable(),
    ...(options.path === undefined ? {} : { path: options.path })
  });
}

export function fixWithRule(rule: Rule, text: string, options: RunOptions = {}): string {
  return applyEdits(text, runRule(rule, text, options).flatMap((finding) => finding.edits ?? []));
}

export function flaggedTexts(rule: Rule, text: string, options: RunOptions = {}): string[] {
  return runRule(rule, text, options).map((finding) => text.slice(finding.start, finding.end));
}
