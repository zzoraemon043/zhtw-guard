export interface PhraseMatch {
  start: number;
  end: number;
  phrase: string;
}

export class PhraseMatcher {
  private readonly lengthsByFirstUnit = new Map<string, number[]>();
  private readonly phrases: ReadonlySet<string>;

  constructor(phrases: Iterable<string>) {
    this.phrases = new Set([...phrases].filter((phrase) => phrase.length > 0));
    for (const phrase of this.phrases) {
      const firstUnit = phrase[0] ?? "";
      const lengths = this.lengthsByFirstUnit.get(firstUnit) ?? [];
      if (!lengths.includes(phrase.length)) {
        lengths.push(phrase.length);
      }
      this.lengthsByFirstUnit.set(firstUnit, lengths);
    }
    for (const lengths of this.lengthsByFirstUnit.values()) {
      lengths.sort((left, right) => right - left);
    }
  }

  findAll(text: string): PhraseMatch[] {
    const matches: PhraseMatch[] = [];
    let index = 0;
    while (index < text.length) {
      const match = this.longestMatchAt(text, index);
      if (match === undefined) {
        index += 1;
        continue;
      }
      matches.push(match);
      index = match.end;
    }
    return matches;
  }

  private longestMatchAt(text: string, start: number): PhraseMatch | undefined {
    const lengths = this.lengthsByFirstUnit.get(text[start] ?? "") ?? [];
    for (const length of lengths) {
      const candidate = text.slice(start, start + length);
      if (candidate.length === length && this.phrases.has(candidate)) {
        return { start, end: start + length, phrase: candidate };
      }
    }
    return undefined;
  }
}
