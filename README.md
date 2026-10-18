# zhtw-guard

Keep Traditional Chinese (Taiwan) text consistent in code, docs and AI output.

[繁體中文](#繁體中文) | [English](#english)

> Status: early development. The design is in [docs/spec.md](docs/spec.md).

---

## 繁體中文

`zhtw-guard` 是給台灣與使用繁體中文的開發者用的檢查工具。它會在你的專案、文件、提交訊息與 AI 代理的回覆裡，找出混進來的簡體字、中國大陸用語與編碼問題，並給出修正建議。

### 它要解決的問題

- 文件與介面字串混入簡體字，例如「设定」「软件」
- 字是繁體，但用語是中國大陸慣用，例如「軟件」應為「軟體」、「默認」應為「預設」
- Windows 上常見的編碼問題：cp950 亂碼、PowerShell 腳本缺少 UTF-8 BOM、混用 CRLF 與 LF
- AI 代理在工作途中把回覆切換成英文或簡體中文

### 規劃中的功能

- 命令列工具：`npx zhtw-guard check` 掃描檔案，`--fix` 自動修正可確定的項目
- GitHub Action：在 Pull Request 上標出問題行
- AI 代理 hook：支援 Claude Code、Codex、Gemini CLI 等工具，檢查回覆與寫入的檔案
- 可自訂詞表與忽略規則

### 授權

[MIT](LICENSE)

---

## English

`zhtw-guard` is a checker for developers who write Traditional Chinese (Taiwan). It finds Simplified characters, Mainland China terms and encoding problems in your files, commit messages and AI agent output, and suggests fixes.

### Problems it targets

- Simplified characters mixed into docs and UI strings
- Traditional characters with Mainland vocabulary, for example 軟件 instead of 軟體
- Windows encoding issues: cp950 mojibake, PowerShell scripts without a UTF-8 BOM, mixed CRLF and LF
- AI agents that switch their replies to English or Simplified Chinese mid-task

### Planned features

- CLI: `npx zhtw-guard check` scans files, and `--fix` applies safe fixes
- GitHub Action that annotates problem lines on pull requests
- Hooks for AI coding agents such as Claude Code, Codex and Gemini CLI
- Custom word lists and ignore rules

### License

[MIT](LICENSE)
