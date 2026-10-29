const REGEX_SPECIAL = /[.+^$()|[\]\\}]/u;

function findClosingBrace(pattern: string, index: number): number {
  let depth = 0;
  for (let position = index; position < pattern.length; position += 1) {
    if (pattern[position] === "{") {
      depth += 1;
    } else if (pattern[position] === "}") {
      depth -= 1;
      if (depth === 0) {
        return position;
      }
    }
  }
  return -1;
}

function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of body) {
    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
    }
    current += character;
  }
  parts.push(current);
  return parts;
}

function translateBraces(pattern: string, index: number): { source: string; next: number } {
  const close = findClosingBrace(pattern, index);
  if (close === -1) {
    return { source: "\\{", next: index + 1 };
  }
  const alternatives = splitTopLevel(pattern.slice(index + 1, close)).map((part) => globBody(part));
  return { source: `(?:${alternatives.join("|")})`, next: close + 1 };
}

function translateStar(pattern: string, index: number): { source: string; next: number } {
  if (pattern[index + 1] !== "*") {
    return { source: "[^/]*", next: index + 1 };
  }
  if (pattern[index + 2] === "/") {
    return { source: "(?:.*/)?", next: index + 3 };
  }
  return { source: ".*", next: index + 2 };
}

function translateAt(pattern: string, index: number): { source: string; next: number } {
  const character = pattern[index] ?? "";
  if (character === "*") {
    return translateStar(pattern, index);
  }
  if (character === "?") {
    return { source: "[^/]", next: index + 1 };
  }
  if (character === "{") {
    return translateBraces(pattern, index);
  }
  if (pattern.startsWith("/**", index) && index + 3 === pattern.length) {
    return { source: "(?:/.*)?", next: index + 3 };
  }
  return { source: REGEX_SPECIAL.test(character) ? `\\${character}` : character, next: index + 1 };
}

function globBody(pattern: string): string {
  let source = "";
  let index = 0;
  while (index < pattern.length) {
    const translated = translateAt(pattern, index);
    source += translated.source;
    index = translated.next;
  }
  return source;
}

export function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/^\.\//u, "").replace(/\/$/u, "/**");
  return new RegExp(`^${globBody(normalized)}$`, "u");
}

export function createGlobMatcher(patterns: readonly string[]): (relativePath: string) => boolean {
  const expressions = patterns.map(globToRegExp);
  return (relativePath) => expressions.some((expression) => expression.test(relativePath));
}
