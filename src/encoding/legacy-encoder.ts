export type LegacyEncoding = "big5" | "windows-1252";

const encoderCache = new Map<LegacyEncoding, ReadonlyMap<string, readonly number[]>>();

function* candidateByteSequences(encoding: LegacyEncoding): Generator<number[]> {
  if (encoding === "windows-1252") {
    for (let byte = 0x80; byte <= 0xff; byte += 1) {
      yield [byte];
    }
    return;
  }
  for (let lead = 0x81; lead <= 0xfe; lead += 1) {
    for (let trail = 0xa1; trail <= 0xfe; trail += 1) {
      yield [lead, trail];
    }
  }
}

function buildEncoder(encoding: LegacyEncoding): Map<string, readonly number[]> {
  const decoder = new TextDecoder(encoding);
  const encoder = new Map<string, readonly number[]>();
  for (const bytes of candidateByteSequences(encoding)) {
    const decoded = decoder.decode(new Uint8Array(bytes));
    if ([...decoded].length === 1 && decoded !== "\uFFFD" && !encoder.has(decoded)) {
      encoder.set(decoded, bytes);
    }
  }
  return encoder;
}

export function legacyEncoder(encoding: LegacyEncoding): ReadonlyMap<string, readonly number[]> {
  let encoder = encoderCache.get(encoding);
  if (encoder === undefined) {
    encoder = buildEncoder(encoding);
    encoderCache.set(encoding, encoder);
  }
  return encoder;
}
