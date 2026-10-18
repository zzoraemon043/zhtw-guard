import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "max-lines-per-function": ["error", { max: 40, skipBlankLines: true }]
    }
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      "max-lines-per-function": "off"
    }
  },
  {
    files: ["scripts/**/*.mjs", "*.js"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly", URL: "readonly" }
    }
  }
);
