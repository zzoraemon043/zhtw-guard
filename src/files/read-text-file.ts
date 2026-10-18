import { readFile } from "node:fs/promises";

export const MAX_FILE_BYTES = 2 * 1024 * 1024;

const BINARY_SNIFF_BYTES = 8000;

export type ReadResult =
  | { kind: "text"; text: string; lossless: boolean }
  | { kind: "skipped"; reason: "binary" | "too-large" };

export function decodeUtf8(bytes: Uint8Array): { text: string; lossless: boolean } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes), lossless: true };
  } catch {
    return { text: new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes), lossless: false };
  }
}

export async function readTextFile(path: string): Promise<ReadResult> {
  const bytes = await readFile(path);
  if (bytes.length > MAX_FILE_BYTES) {
    return { kind: "skipped", reason: "too-large" };
  }
  if (bytes.subarray(0, BINARY_SNIFF_BYTES).includes(0)) {
    return { kind: "skipped", reason: "binary" };
  }
  return { kind: "text", ...decodeUtf8(bytes) };
}
