import type { Rule } from "../types.js";
import { ambiguousCharRule } from "./ambiguous-char.js";
import { lineEndingRule } from "./line-ending.js";
import { mainlandTermRule } from "./mainland-term.js";
import { mojibakeRule } from "./mojibake.js";
import { ps1BomRule } from "./ps1-bom.js";
import { simplifiedCharRule } from "./simplified-char.js";

export const ALL_RULES: readonly Rule[] = [
  simplifiedCharRule,
  mainlandTermRule,
  ambiguousCharRule,
  mojibakeRule,
  ps1BomRule,
  lineEndingRule
];
