import { maskNonProse } from "../text/prose-mask.js";
import { profileScripts, type ScriptProfile } from "../text/script-profile.js";
import { splitSentences, type Sentence } from "../text/sentences.js";
import type { Finding, Rule, RuleInput } from "../types.js";

export const MINIMUM_HAN_SHARE = 0.3;

const HAN_CHARACTERS_PER_WORD = 2;

const COMMON_COMMANDS = new Set([
  "npm", "npx", "pnpm", "yarn", "node", "git", "cd", "ls", "cat", "mkdir", "rm", "cp", "mv",
  "python", "python3", "pip", "cargo", "go", "make", "docker", "kubectl", "curl", "bash", "sh", "pwsh"
]);

const PROMPT_START = /^[$>%]\s/u;

const CODE_SYMBOLS = /[{}();=<>|&]|(?:^|\s)--?[A-Za-z]/u;

function looksLikeCommand(text: string): boolean {
  const firstToken = text.split(/\s+/u)[0] ?? "";
  return PROMPT_START.test(text) || COMMON_COMMANDS.has(firstToken) || CODE_SYMBOLS.test(text);
}

function isJudgeable(sentence: Sentence, profile: ScriptProfile): boolean {
  if (profile.hanCount + profile.kanaCount + profile.latinWordCount === 0) {
    return false;
  }
  return profile.hanCount > 0 || profile.kanaCount > 0 || !looksLikeCommand(sentence.text);
}

export function findFirstSentence(text: string): { sentence: Sentence; profile: ScriptProfile } | undefined {
  for (const sentence of splitSentences(maskNonProse(text))) {
    const profile = profileScripts(sentence.text);
    if (isJudgeable(sentence, profile)) {
      return { sentence, profile };
    }
  }
  return undefined;
}

export function describeLanguageProblem(profile: ScriptProfile): string | undefined {
  if (profile.kanaCount > 0) {
    return "Japanese";
  }
  const hanWords = profile.hanCount / HAN_CHARACTERS_PER_WORD;
  if (hanWords / (hanWords + profile.latinWordCount) < MINIMUM_HAN_SHARE) {
    return "English";
  }
  return profile.simplifiedCount > 0 ? "Simplified Chinese" : undefined;
}

function checkReplyLanguage({ text }: RuleInput): Finding[] {
  const first = findFirstSentence(text);
  const language = first === undefined ? undefined : describeLanguageProblem(first.profile);
  if (first === undefined || language === undefined) {
    return [];
  }
  return [
    {
      start: first.sentence.start,
      end: first.sentence.end,
      message: `Reply starts in ${language}, not Traditional Chinese`,
      suggestion: "start the reply in Traditional Chinese (Taiwan)"
    }
  ];
}

export const replyLanguageRule: Rule = {
  id: "reply-language",
  check: checkReplyLanguage
};
