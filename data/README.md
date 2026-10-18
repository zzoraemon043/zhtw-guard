# Dictionary data

## Files

| File | Purpose | Source |
| --- | --- | --- |
| `simplified-chars.json` | Simplified characters with exactly one Traditional (Taiwan) form | Generated from OpenCC |
| `ambiguous-chars.json` | Simplified characters with several Traditional (Taiwan) forms | Generated from OpenCC |
| `tw-terms.json` | Mainland China terms and their Taiwan replacements, plus protected phrases that must not be flagged | Seeded from OpenCC, maintained by hand |
| `tw-terms-strict.json` | Terms that Taiwan software teams prefer, checked only with `"strictness": "strict"` | Maintained by hand |
| `opencc/` | Unmodified OpenCC dictionary files and the OpenCC license | OpenCC |

## Attribution

The files in `opencc/` are copied without changes from
[OpenCC](https://github.com/BYVoid/OpenCC), tag `ver.1.3.0`, directory `data/dictionary`.
OpenCC is Copyright (c) Carbo Kuo and contributors and is licensed under the
Apache License, Version 2.0. The full license text is in [`opencc/LICENSE`](opencc/LICENSE).

`simplified-chars.json` and `ambiguous-chars.json` are derived from
`STCharacters.txt`, `TSCharacters.txt` and `TWVariants.txt`. Characters that are
also valid Traditional characters, such as 干 or 里, are left out so that they are
never flagged. Regenerate them with:

```sh
node scripts/import-opencc.mjs
```

`tw-terms.json` was seeded from `TWPhrases.txt` with Taiwan variant characters
applied (`TWVariants.txt`). Entries whose source phrase is also correct Taiwan
usage were removed or moved to `protected`. It is now maintained by hand in this
repository so that every change can be reviewed line by line.

## Format of `tw-terms.json` and `tw-terms-strict.json`

- `replacements`: each key is a term to flag and each value lists the Taiwan
  replacements. A term with one replacement is fixed automatically. A term with
  several replacements is reported only.
- `reportOnly` (optional): terms that are reported but never fixed automatically,
  because the right word depends on context.
- `protected`: phrases that are correct in Taiwan and must not be flagged, even
  when they contain a flagged term. Matching always prefers the longest phrase.

In strict mode the strict table is merged over the default table. A strict
entry replaces a default protected phrase with the same text.

Every entry is covered by the tests in `test/dictionary`. Strict entries also
need a hand-written flagged and clean example in
`test/dictionary/strict-entries.test.ts`.
