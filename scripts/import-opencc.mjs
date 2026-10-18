import { readFileSync, writeFileSync } from "node:fs";

const dataDirectory = new URL("../data/", import.meta.url);
const openccDirectory = new URL("opencc/", dataDirectory);

function readOpenccTable(fileName) {
  const content = readFileSync(new URL(fileName, openccDirectory), "utf8");
  const table = new Map();
  for (const line of content.split("\n")) {
    if (line.trim() === "" || line.startsWith("#")) {
      continue;
    }
    const [key, values] = line.split("\t");
    table.set(key, values.trim().split(" "));
  }
  return table;
}

function buildTaiwanVariantConverter() {
  const variants = readOpenccTable("TWVariants.txt");
  return (text) => [...text].map((character) => variants.get(character)?.[0] ?? character).join("");
}

function unique(values) {
  return [...new Set(values)];
}

function collectTraditionalCharacters(toTaiwan) {
  const traditional = new Set(readOpenccTable("TSCharacters.txt").keys());
  for (const [, values] of readOpenccTable("TWVariants.txt")) {
    values.forEach((value) => traditional.add(value));
  }
  return new Set([...traditional].map(toTaiwan));
}

function splitCharacterTables() {
  const toTaiwan = buildTaiwanVariantConverter();
  const traditional = collectTraditionalCharacters(toTaiwan);
  const oneToOne = {};
  const ambiguous = {};
  for (const [simplified, values] of readOpenccTable("STCharacters.txt")) {
    const candidates = unique(values.map(toTaiwan));
    if (candidates.includes(simplified) || traditional.has(simplified)) {
      continue;
    }
    if (candidates.length === 1) {
      oneToOne[simplified] = candidates[0];
    } else {
      ambiguous[simplified] = candidates;
    }
  }
  return { oneToOne, ambiguous };
}

function formatOneEntryPerLine(table) {
  const lines = Object.entries(table).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  return `{\n${lines.join(",\n")}\n}\n`;
}

const { oneToOne, ambiguous } = splitCharacterTables();
writeFileSync(new URL("simplified-chars.json", dataDirectory), formatOneEntryPerLine(oneToOne));
writeFileSync(new URL("ambiguous-chars.json", dataDirectory), formatOneEntryPerLine(ambiguous));
console.log(`simplified-chars.json: ${Object.keys(oneToOne).length} entries`);
console.log(`ambiguous-chars.json: ${Object.keys(ambiguous).length} entries`);
