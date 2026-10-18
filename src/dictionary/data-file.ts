import { readFileSync } from "node:fs";

export function readDataFile<T>(fileName: string): T {
  const fileUrl = new URL(`../../data/${fileName}`, import.meta.url);
  return JSON.parse(readFileSync(fileUrl, "utf8")) as T;
}
