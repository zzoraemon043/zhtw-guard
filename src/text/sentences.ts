export interface Sentence {
  start: number;
  end: number;
  text: string;
}

const SENTENCE_END = /[。！？；!?;\n]|\.(?=[*_)\]"'”’]*(?:\s|$))/gu;

function trimmed(text: string, start: number, end: number): Sentence | undefined {
  const raw = text.slice(start, end);
  const leading = raw.length - raw.trimStart().length;
  const content = raw.trim();
  return content.length === 0 ? undefined : { start: start + leading, end: start + leading + content.length, text: content };
}

export function splitSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  let start = 0;
  for (const match of text.matchAll(SENTENCE_END)) {
    const sentence = trimmed(text, start, match.index);
    if (sentence !== undefined) {
      sentences.push(sentence);
    }
    start = match.index + match[0].length;
  }
  const last = trimmed(text, start, text.length);
  return last === undefined ? sentences : [...sentences, last];
}
