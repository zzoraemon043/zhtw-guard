export interface CodePoint {
  character: string;
  start: number;
  end: number;
}

export function* codePoints(text: string): Generator<CodePoint> {
  let start = 0;
  for (const character of text) {
    yield { character, start, end: start + character.length };
    start += character.length;
  }
}
