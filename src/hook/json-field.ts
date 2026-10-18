function isIndexable(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readField(source: unknown, fieldPath: string): unknown {
  let current: unknown = source;
  for (const key of fieldPath.split(".")) {
    if (!isIndexable(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

export function firstStringField(source: unknown, fieldPaths: readonly string[]): string | undefined {
  for (const fieldPath of fieldPaths) {
    const value = readField(source, fieldPath);
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}
