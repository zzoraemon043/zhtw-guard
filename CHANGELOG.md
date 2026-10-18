# Changelog

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

### 0.2.0

新增

- `reply-language` 規則：檢查 AI 代理回覆的第一句是不是繁體中文。會先略過程式碼區塊、行內程式碼、網址、路徑與開頭的指令，中文字比例過低視為英文，含簡體字視為簡體中文，含假名視為日文。只在 `text --reply` 與 `hook` 檢查回覆時啟用，檢查一般檔案時不啟用。
- `zhtw-guard hook` 指令：從標準輸入讀取 AI 代理的 hook 事件 JSON，檢查回覆文字或剛寫入的檔案。沒有問題時結束代碼為 `0` 且沒有輸出，有問題時結束代碼為 `2` 並把問題寫到標準錯誤，輸入或設定有誤時結束代碼為 `1`。欄位名稱可以用 `--text-field`、`--path-field`、`--cwd-field` 設定。說明見 [docs/hooks.md](docs/hooks.md)。
- GitHub Action（`action.yml`）：在 Pull Request 上只檢查有變更的檔案，並用 workflow commands 在問題行加上標註。輸入參數為 `paths`、`strictness`、`fail-on`。
- 命令列參數 `--format github`、`--strictness`、`--fail-on`，以及只用於 `text` 的 `--reply`。

### 0.1.0

第一個版本。

- 規則：`simplified-char`、`mainland-term`、`ambiguous-char`、`mojibake`、`ps1-bom`、`line-ending`。
- 命令列：`check`、`fix`、`text`，支援 `--format json`。結束代碼 `0` 表示沒有錯誤，`1` 表示發現錯誤，`2` 表示用法或設定檔有誤。
- 設定檔 `zhtw-guard.config.json`：`include`、`exclude`、`rules`、`allow`、`extraTerms`、`strictness`。
- 用語嚴格度：`default` 使用保守詞表，`strict` 另外檢查台灣軟體圈慣用的術語。
- 行內忽略：以 `zhtw-guard-ignore` 結尾的行不檢查。
- 字表與用語表以 OpenCC（Apache-2.0）資料為基礎，每一筆都有測試。

---

## English

### 0.2.0

Added

- `reply-language` rule: checks that the first sentence of an AI agent reply is Traditional Chinese. It skips code blocks, inline code, URLs, paths and leading commands first. A low share of Chinese characters counts as English, Simplified characters count as Simplified Chinese, and kana counts as Japanese. It only runs for `text --reply` and for replies in `hook`, never for regular files.
- `zhtw-guard hook` command: reads an AI agent hook event as JSON on standard input and checks the reply text or the file that was just written. It exits with `0` and no output when clean, with `2` and the problems on standard error when something is wrong, and with `1` on invalid input or configuration. Field names are set with `--text-field`, `--path-field` and `--cwd-field`. See [docs/hooks.md](docs/hooks.md).
- GitHub Action (`action.yml`): checks only the files changed in a pull request and annotates problem lines with workflow commands. Inputs are `paths`, `strictness` and `fail-on`.
- CLI options `--format github`, `--strictness`, `--fail-on`, and `--reply` for `text`.

### 0.1.0

First release.

- Rules: `simplified-char`, `mainland-term`, `ambiguous-char`, `mojibake`, `ps1-bom`, `line-ending`.
- CLI: `check`, `fix` and `text`, with `--format json`. Exit code `0` means no errors, `1` means errors were found, and `2` means a usage or configuration error.
- Config file `zhtw-guard.config.json`: `include`, `exclude`, `rules`, `allow`, `extraTerms` and `strictness`.
- Term strictness: `default` uses the conservative table, and `strict` also checks the terms Taiwan software teams prefer.
- Inline ignore: lines that end with `zhtw-guard-ignore` are skipped.
- Character and term tables start from OpenCC (Apache-2.0) data, and every entry has a test.
