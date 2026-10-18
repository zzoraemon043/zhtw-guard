import { describe, expect, it } from "vitest";
import { ConfigError } from "../../src/config/config-error.js";
import { validateConfig } from "../../src/config/validate-config.js";

describe("validateConfig", () => {
  it("accepts a complete config", () => {
    const config = {
      $schema: "./schema.json",
      include: ["**/*.md"],
      exclude: ["data/**"],
      rules: { "mainland-term": "warning", mojibake: "off", "simplified-char": "error" },
      allow: ["视频号"],
      extraTerms: { 質量: "品質", 渠道: ["通路", "管道"] }
    };
    expect(validateConfig(config)).toEqual(config);
  });

  it("accepts an empty config", () => {
    expect(validateConfig({})).toEqual({});
  });

  it.each([
    ["a non-object config", []],
    ["an unknown key", { ignore: [] }],
    ["a non-array include", { include: "**/*.md" }],
    ["a non-string exclude entry", { exclude: [1] }],
    ["a non-array allow", { allow: "x" }],
    ["a non-object rules", { rules: ["mojibake"] }],
    ["an unknown rule", { rules: { "no-such-rule": "off" } }],
    ["an unknown severity", { rules: { mojibake: "warn" } }],
    ["a bad extra term", { extraTerms: { 質量: 1 } }],
    ["an empty extra term list", { extraTerms: { 質量: [] } }]
  ])("rejects %s", (_name, config) => {
    expect(() => validateConfig(config)).toThrow(ConfigError);
  });
});
