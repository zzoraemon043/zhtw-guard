# zhtw-guard

Keep Traditional Chinese (Taiwan) text consistent in code, docs and AI output.

[繁體中文](#繁體中文) | [English](#english)

> Status: early development. The design is in [docs/spec.md](docs/spec.md).

---

## 繁體中文

`zhtw-guard` 是給台灣與使用繁體中文的開發者用的檢查工具。它會在你的專案、文件、提交訊息與 AI 代理的回覆裡，找出混進來的簡體字、中國大陸用語與編碼問題，並給出修正建議。

### 它要解決的問題

- 文件與介面字串混入簡體字，例如「设定」「软件」 <!-- zhtw-guard-ignore -->
- 字是繁體，但用語是中國大陸慣用，例如「軟件」應為「軟體」、「默認」應為「預設」 <!-- zhtw-guard-ignore -->
- Windows 上常見的編碼問題：cp950 亂碼、PowerShell 腳本缺少 UTF-8 BOM、混用 CRLF 與 LF
- AI 代理在工作途中把回覆切換成英文或簡體中文

### 安裝

需要 Node.js 22 以上版本。

```sh
npm install --save-dev zhtw-guard
```

也可以不安裝，直接用 `npx zhtw-guard` 執行。

### 使用方式

```sh
npx zhtw-guard check                  # 檢查目前資料夾
npx zhtw-guard check README.md docs   # 只檢查指定的檔案或資料夾
npx zhtw-guard fix                    # 自動修正可確定的問題，再回報其餘問題
echo "请安装软件" | npx zhtw-guard text          # 檢查標準輸入 zhtw-guard-ignore
echo "请安装软件" | npx zhtw-guard text --fix    # 輸出修正後的文字 zhtw-guard-ignore
```

每個問題一行，格式為 `路徑:行:欄 規則 說明 -> 建議`。

| 選項 | 說明 |
| --- | --- |
| `--format json` | 改用 JSON 輸出，方便給其他工具或 CI 使用 |
| `--config <檔案>` | 指定設定檔，不自動尋找 `zhtw-guard.config.json` |
| `--path <檔名>` | 只用於 `text`：指定檔名，讓 `ps1-bom` 這類依副檔名判斷的規則生效 |
| `--fix` | 只用於 `text`：輸出修正後的文字，剩下的問題寫到標準錯誤 |

結束代碼：`0` 沒有錯誤，`1` 發現錯誤，`2` 指令用法或設定檔有誤。設為 `warning` 的規則只會回報，不會讓結束代碼變成 `1`。

### 規則

| 規則 | 檢查內容 | 自動修正 |
| --- | --- | --- |
| `simplified-char` | 繁體文字中的簡體字 | 只有一對一對應時修正 |
| `mainland-term` | 中國大陸用語 | 只有一個建議用語時修正 |
| `ambiguous-char` | 有多個繁體寫法的簡體字，例如「发」可能是「發」或「髮」 | 不修正，只回報 | <!-- zhtw-guard-ignore -->
| `mojibake` | 疑似 cp950 或 UTF-8 解碼錯誤造成的亂碼 | 不修正，只回報 |
| `ps1-bom` | 含有非 ASCII 文字、但沒有 UTF-8 BOM 的 `.ps1` 檔案 | 加上 BOM |
| `line-ending` | 同一個檔案混用 CRLF 與 LF | 統一成較多的那一種 |

`fix` 不會改寫不是有效 UTF-8 的檔案，以免損壞原本的內容。

### 設定檔

在專案根目錄放一個 `zhtw-guard.config.json`。工具會從目前資料夾往上層尋找，路徑規則都以設定檔所在的資料夾為準。

```json
{
  "include": ["**/*.md", "src/**"],
  "exclude": ["vendor/**"],
  "rules": {
    "mainland-term": "warning",
    "line-ending": "off"
  },
  "allow": ["某個產品名稱"],
  "extraTerms": {
    "質量": "品質",
    "渠道": ["通路", "管道"]
  }
}
```

- `include`、`exclude`：要檢查與略過的路徑規則，支援 `*`、`**`、`?` 與 `{a,b}`。`node_modules` 與 `.git` 一律略過。
- `rules`：把規則設為 `error`、`warning` 或 `off`。
- `allow`：不要回報的詞，例如引用的簡體原文或產品名稱。
- `extraTerms`：專案自己的用語對照。只有一個建議時，`fix` 會自動替換。

### 行內忽略

以 `zhtw-guard-ignore` 結尾的行不會被檢查。標記可以放在行尾註解裡：

```js
const sample = "简体示例"; // zhtw-guard-ignore
```

在 Markdown 裡可以寫成 `<!-- zhtw-guard-ignore -->`，畫面上不會顯示。

### 詞庫來源

字表與用語表以 [OpenCC](https://github.com/BYVoid/OpenCC)（Apache-2.0）的資料為基礎，授權檔與出處說明放在 [`data/`](data/README.md)。台灣用語表 `data/tw-terms.json` 由本專案維護，每一筆都有測試。

### 規劃中的功能

- GitHub Action：在 Pull Request 上標出問題行
- AI 代理 hook：支援 Claude Code、Codex、Gemini CLI 等工具，檢查回覆與寫入的檔案
- `reply-language` 規則：檢查 AI 代理的回覆是不是以繁體中文開頭

### 開發

```sh
npm ci
npm test
npm run lint
npm run build
node dist/cli/main.js check
```

貢獻規則請見 [AGENTS.md](AGENTS.md)。

### 授權

[MIT](LICENSE)。`data/opencc/` 內的 OpenCC 資料採用 Apache-2.0 授權。

---

## English

`zhtw-guard` is a checker for developers who write Traditional Chinese (Taiwan). It finds Simplified characters, Mainland China terms and encoding problems in your files, commit messages and AI agent output, and suggests fixes.

### Problems it targets

- Simplified characters mixed into docs and UI strings
- Traditional characters with Mainland vocabulary, for example 軟件 instead of 軟體 <!-- zhtw-guard-ignore -->
- Windows encoding issues: cp950 mojibake, PowerShell scripts without a UTF-8 BOM, mixed CRLF and LF
- AI agents that switch their replies to English or Simplified Chinese mid-task

### Install

Requires Node.js 22 or later.

```sh
npm install --save-dev zhtw-guard
```

You can also run it without installing through `npx zhtw-guard`.

### Usage

```sh
npx zhtw-guard check                  # check the current directory
npx zhtw-guard check README.md docs   # check only these files or directories
npx zhtw-guard fix                    # apply safe fixes, then report the rest
echo "请安装软件" | npx zhtw-guard text          # check standard input zhtw-guard-ignore
echo "请安装软件" | npx zhtw-guard text --fix    # print the fixed text zhtw-guard-ignore
```

Each problem is printed on one line as `path:line:column rule message -> suggestion`.

| Option | Description |
| --- | --- |
| `--format json` | Print JSON for other tools and CI |
| `--config <file>` | Use this config file instead of searching for `zhtw-guard.config.json` |
| `--path <name>` | `text` only: file name for rules that depend on it, such as `ps1-bom` |
| `--fix` | `text` only: print the fixed text and write remaining problems to standard error |

Exit codes: `0` no errors, `1` errors found, `2` usage or configuration error. Rules set to `warning` are reported but do not change the exit code to `1`.

### Rules

| Rule | What it finds | Auto fix |
| --- | --- | --- |
| `simplified-char` | Simplified characters in Traditional text | When the mapping is one to one |
| `mainland-term` | Mainland China vocabulary | When there is one suggested term |
| `ambiguous-char` | Simplified characters with several Traditional forms, for example 发 to 發 or 髮 | No, report only | <!-- zhtw-guard-ignore -->
| `mojibake` | Text that looks like cp950 or UTF-8 decoding damage | No, report only |
| `ps1-bom` | `.ps1` files with non-ASCII text and no UTF-8 BOM | Adds the BOM |
| `line-ending` | Mixed CRLF and LF in one file | Converts to the more common one |

`fix` never rewrites a file that is not valid UTF-8, so the original bytes are not damaged.

### Configuration

Put a `zhtw-guard.config.json` at the project root. The tool searches from the current directory upward, and all patterns are relative to the directory of the config file.

```json
{
  "include": ["**/*.md", "src/**"],
  "exclude": ["vendor/**"],
  "rules": {
    "mainland-term": "warning",
    "line-ending": "off"
  },
  "allow": ["SomeProductName"],
  "extraTerms": {
    "質量": "品質",
    "渠道": ["通路", "管道"]
  }
}
```

- `include` and `exclude`: path patterns with `*`, `**`, `?` and `{a,b}`. `node_modules` and `.git` are always skipped.
- `rules`: set a rule to `error`, `warning` or `off`.
- `allow`: words that must not be flagged, for example quoted Simplified text or product names.
- `extraTerms`: project-specific replacements. `fix` applies a term automatically when it has one replacement.

### Inline ignore

A line that ends with `zhtw-guard-ignore` is skipped. The marker can sit inside a trailing comment:

```js
const sample = "简体示例"; // zhtw-guard-ignore
```

In Markdown, write `<!-- zhtw-guard-ignore -->` so the marker stays hidden.

### Dictionary data

The character and term tables start from [OpenCC](https://github.com/BYVoid/OpenCC) (Apache-2.0). Its license file and attribution are in [`data/`](data/README.md). The Taiwan term table `data/tw-terms.json` is maintained in this repository, and every entry has a test.

### Planned features

- GitHub Action that annotates problem lines on pull requests
- Hooks for AI coding agents such as Claude Code, Codex and Gemini CLI
- `reply-language` rule that checks whether an agent reply starts in Traditional Chinese

### Development

```sh
npm ci
npm test
npm run lint
npm run build
node dist/cli/main.js check
```

See [AGENTS.md](AGENTS.md) for contributor rules.

### License

[MIT](LICENSE). The OpenCC data in `data/opencc/` is licensed under Apache-2.0.
