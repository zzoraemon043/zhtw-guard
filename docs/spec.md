# zhtw-guard design

## Goal

Detect and fix text that breaks Traditional Chinese (Taiwan) conventions, for humans and for AI coding agents.

## Rule groups

| ID | Group | Example | Auto fix |
| --- | --- | --- | --- |
| `simplified-char` | Simplified character in Traditional text | 设定 to 設定 | Yes, when the mapping is one to one |
| `mainland-term` | Mainland China vocabulary | 軟件 to 軟體, 默認 to 預設 | Yes, from the phrase table |
| `ambiguous-char` | Character with several Traditional forms | 发 to 發 or 髮 | No, report only |
| `mojibake` | Text that looks like cp950 or UTF-8 decoding damage | 銝剜 | No, report only |
| `ps1-bom` | `.ps1` file without a UTF-8 BOM that contains non-ASCII text | | Yes |
| `line-ending` | Mixed CRLF and LF in one file | | Yes |
| `reply-language` | Agent reply whose first sentence is not Traditional Chinese | | No, block or warn |

## Surfaces

1. CLI: `zhtw-guard check [paths]`, `zhtw-guard fix [paths]`, `zhtw-guard text` that reads stdin.
2. Library API for the same checks.
3. GitHub Action that runs `check` on changed files and writes annotations.
4. Agent hooks: a small adapter per agent that passes the reply or the written file to `zhtw-guard text`. Keep the adapters thin and agent-neutral in naming.

## Output

- Human format: `path:line:column rule message suggestion`.
- `--format json` for tools and the GitHub Action.
- Exit code 0 when clean, 1 when problems are found, 2 on usage errors.

## Configuration

`zhtw-guard.config.json` at the project root:

- `include` and `exclude` globs
- `rules` to turn rules off or change them from error to warning
- `allow` for words that must not be flagged, for example quoted Simplified text or product names
- `extraTerms` for project-specific replacements

Inline ignore: a line that ends with `zhtw-guard-ignore` is skipped.

## Dictionaries

- Character and phrase data can start from OpenCC (Apache-2.0). Keep its license file and attribution in `data/`.
- The Taiwan term table is maintained in this repository as plain JSON so contributors can review changes line by line.
- Every table entry needs a test case.

## Technical choices

- TypeScript, Node.js 22 or later, ESM.
- No runtime dependencies other than the dictionary data where possible.
- Tests with Vitest. Every rule has positive and negative cases.
- Published to npm as `zhtw-guard`.

## Out of scope for the first release

- Full Simplified to Traditional document conversion. OpenCC already does that.
- Grammar or style checking beyond vocabulary.
