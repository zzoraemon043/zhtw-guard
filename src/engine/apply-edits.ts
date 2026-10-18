import type { TextEdit } from "../types.js";

export function selectNonOverlapping(edits: readonly TextEdit[]): TextEdit[] {
  const sorted = [...edits].sort((left, right) => left.start - right.start || left.end - right.end);
  const selected: TextEdit[] = [];
  let lastEnd = 0;
  for (const edit of sorted) {
    if (edit.start < lastEnd) {
      continue;
    }
    selected.push(edit);
    lastEnd = edit.end;
  }
  return selected;
}

export function applyEdits(text: string, edits: readonly TextEdit[]): string {
  let result = "";
  let cursor = 0;
  for (const edit of selectNonOverlapping(edits)) {
    result += text.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }
  return result + text.slice(cursor);
}
