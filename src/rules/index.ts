import type { Rule } from "../types.js";
import { ambiguousCharRule } from "./ambiguous-char.js";
import { mainlandTermRule } from "./mainland-term.js";
import { simplifiedCharRule } from "./simplified-char.js";

export const ALL_RULES: readonly Rule[] = [simplifiedCharRule, mainlandTermRule, ambiguousCharRule];
