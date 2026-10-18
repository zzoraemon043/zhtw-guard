import { describe, expect, it } from "vitest";
import { VERSION } from "../src/index.js";

describe("VERSION", () => {
  it("matches a semantic version", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("is not empty", () => {
    expect(VERSION.length).toBeGreaterThan(0);
  });
});
