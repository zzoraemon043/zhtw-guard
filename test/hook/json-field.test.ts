import { describe, expect, it } from "vitest";
import { firstStringField, readField } from "../../src/hook/json-field.js";

describe("readField", () => {
  it("reads nested fields with dots", () => {
    expect(readField({ event: { input: { path: "a.md" } } }, "event.input.path")).toBe("a.md");
  });

  it("reads array items by index", () => {
    expect(readField({ files: ["a.md", "b.md"] }, "files.1")).toBe("b.md");
  });

  it("returns undefined for a missing field", () => {
    expect(readField({ event: null }, "event.input")).toBeUndefined();
    expect(readField("text", "length.x")).toBeUndefined();
  });
});

describe("firstStringField", () => {
  it("returns the first non-empty string", () => {
    expect(firstStringField({ text: "", reply: "好", message: "x" }, ["text", "reply", "message"])).toBe("好");
  });

  it("skips values that are not strings", () => {
    expect(firstStringField({ text: 1, reply: ["a"] }, ["text", "reply"])).toBeUndefined();
  });
});
