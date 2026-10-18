const NON_PROSE_PATTERNS: readonly RegExp[] = [
  /```[\s\S]*?(?:```|$(?![\s\S]))/gu,
  /~~~[\s\S]*?(?:~~~|$(?![\s\S]))/gu,
  /`[^`\n]+`/gu,
  /\b(?:https?|ftp|file):\/\/[^\s<>()"'\u3000-\u303F（），]+/gu,
  /\bwww\.[^\s<>()"'\u3000-\u303F（），]+/gu,
  /(?:[A-Za-z]:)?(?:\.{0,2}[\\/])?(?:[\w.@~-]+[\\/])+[\w.@~-]*/gu,
  /\b[\w-]+(?:\.[\w-]+)*\.[A-Za-z][A-Za-z0-9]{0,5}\b/gu
];

function blankOut(segment: string): string {
  return segment.replace(/[^\n]/gu, " ");
}

export function maskNonProse(text: string): string {
  return NON_PROSE_PATTERNS.reduce((masked, pattern) => masked.replace(pattern, blankOut), text);
}
