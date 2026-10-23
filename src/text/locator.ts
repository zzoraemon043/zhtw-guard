export interface Location {
  line: number;
  column: number;
}

export type Locator = (offset: number) => Location;

function findLineStarts(text: string): number[] {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      starts.push(index + 1);
    }
  }
  return starts;
}

function lineIndexAt(lineStarts: readonly number[], offset: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((lineStarts[middle] ?? 0) <= offset) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return low;
}

export function createLocator(text: string): Locator {
  const lineStarts = findLineStarts(text);
  const firstColumnStart = text.startsWith("\uFEFF") ? 1 : 0;
  return (offset) => {
    const lineIndex = lineIndexAt(lineStarts, offset);
    const lineStart = lineIndex === 0 ? Math.min(firstColumnStart, offset) : (lineStarts[lineIndex] ?? 0);
    return { line: lineIndex + 1, column: [...text.slice(lineStart, offset)].length + 1 };
  };
}
