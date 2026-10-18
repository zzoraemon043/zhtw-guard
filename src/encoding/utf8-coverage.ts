export interface Utf8Coverage {
  coveredBytes: number;
  decoded: string;
}

function sequenceLength(lead: number): number {
  if (lead >= 0xc2 && lead <= 0xdf) {
    return 2;
  }
  if (lead >= 0xe0 && lead <= 0xef) {
    return 3;
  }
  if (lead >= 0xf0 && lead <= 0xf4) {
    return 4;
  }
  return 0;
}

const strictDecoder = new TextDecoder("utf-8", { fatal: true });

function decodeSequenceAt(bytes: readonly number[], start: number): string | undefined {
  const length = sequenceLength(bytes[start] ?? 0);
  if (length === 0 || start + length > bytes.length) {
    return undefined;
  }
  try {
    return strictDecoder.decode(new Uint8Array(bytes.slice(start, start + length)));
  } catch {
    return undefined;
  }
}

export function measureUtf8Coverage(bytes: readonly number[]): Utf8Coverage {
  let coveredBytes = 0;
  let decoded = "";
  let index = 0;
  while (index < bytes.length) {
    const character = decodeSequenceAt(bytes, index);
    if (character === undefined) {
      index += 1;
      continue;
    }
    const length = sequenceLength(bytes[index] ?? 0);
    decoded += character;
    coveredBytes += length;
    index += length;
  }
  return { coveredBytes, decoded };
}
