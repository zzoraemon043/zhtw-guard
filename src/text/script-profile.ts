import { ambiguousCharacters, simplifiedCharacters } from "../dictionary/character-tables.js";

export interface ScriptProfile {
  hanCount: number;
  kanaCount: number;
  latinWordCount: number;
  simplifiedCount: number;
}

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

function countSimplified(text: string): number {
  return [...text].filter((character) => simplifiedCharacters().has(character) || ambiguousCharacters().has(character)).length;
}

export function profileScripts(text: string): ScriptProfile {
  return {
    hanCount: countMatches(text, /\p{Script=Han}/gu),
    kanaCount: countMatches(text, /[\p{Script=Hiragana}\p{Script=Katakana}]/gu),
    latinWordCount: countMatches(text, /[A-Za-z][A-Za-z'-]*/gu),
    simplifiedCount: countSimplified(text)
  };
}
