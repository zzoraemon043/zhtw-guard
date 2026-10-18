# Agent hooks

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

`zhtw-guard hook` 是給 AI 寫程式工具使用的通用 hook 介面。大多數 AI 代理都能在特定事件發生時執行一個指令，並把事件內容以 JSON 從標準輸入傳給它。`zhtw-guard hook` 會從這份 JSON 找出回覆文字或剛寫入的檔案路徑，執行對應的檢查。

### 介面約定

| 情況 | 行為 |
| --- | --- |
| 輸入 | 標準輸入的一份 JSON |
| 沒有問題 | 結束代碼 `0`，沒有任何輸出 |
| 發現問題 | 結束代碼 `2`，問題寫到標準錯誤，讓 AI 代理看到並自行修正 |
| 輸入或設定有誤 | 結束代碼 `1`，錯誤訊息寫到標準錯誤，不會擋住 AI 代理 |

輸入是空的，或 JSON 裡找不到指定的欄位時，視為沒有問題，結束代碼為 `0`。

### 會做哪些檢查

- **回覆文字**：執行所有文字規則，再加上 `reply-language`，確認回覆的第一句是繁體中文。
- **寫入的檔案**：和 `zhtw-guard check` 相同的檔案規則，不檢查 `reply-language`。設定檔的 `exclude` 也會套用，被排除的檔案不會被檢查；檔案已不存在時直接略過。
- 兩種欄位同時存在時，兩者都檢查。

### 欄位設定

每個 AI 代理的 JSON 結構都不一樣，所以欄位名稱可以自行指定。欄位路徑用 `.` 分隔，陣列可以用數字索引，例如 `event.files.0`。

| 參數 | 用途 | 預設值 |
| --- | --- | --- |
| `--text-field <路徑>` | 回覆文字所在的欄位，可重複指定或用逗號分隔，取第一個有值的欄位 | `text`、`reply`、`message` |
| `--path-field <路徑>` | 剛寫入的檔案路徑所在的欄位，規則同上 | `path`、`file_path`、`filePath` |
| `--cwd-field <路徑>` | 工作目錄所在的欄位，相對路徑會以它為基準 | `cwd` |
| `--config <檔案>` | 指定設定檔 | 從工作目錄往上層尋找 |
| `--strictness <default\|strict>` | 覆寫設定檔的用語嚴格度 | 依設定檔 |
| `--fail-on <error\|warning>` | 設為 `warning` 時，警告也會讓結束代碼變成 `2` | `error` |

### 情境一：回覆完成後檢查

假設 AI 代理在回覆完成時送出這樣的事件：

```json
{
  "event": "reply_finished",
  "cwd": "/home/dev/project",
  "reply": "好的，我已經更新設定檔。"
}
```

在 AI 代理的 hook 設定裡，讓「回覆完成」事件執行：

```json
{
  "hooks": {
    "reply_finished": [
      { "command": "npx zhtw-guard hook --text-field reply" }
    ]
  }
}
```

回覆的第一句不是繁體中文，或混入簡體字與中國大陸用語時，指令會以結束代碼 `2` 結束，AI 代理會在標準錯誤看到類似下面的訊息，並改寫回覆：

```text
<reply>:1:1 reply-language Reply starts in English, not Traditional Chinese -> start the reply in Traditional Chinese (Taiwan)
zhtw-guard: 1 problem (1 error, 0 warnings). Fix them so the text follows Traditional Chinese (Taiwan) conventions.
```

### 情境二：寫入檔案後檢查

假設 AI 代理在寫入檔案後送出這樣的事件，檔案路徑放在巢狀欄位裡：

```json
{
  "event": "file_written",
  "workspace": "/home/dev/project",
  "input": {
    "target": "docs/guide.md"
  }
}
```

讓「寫入檔案」事件執行：

```json
{
  "hooks": {
    "file_written": [
      { "command": "npx zhtw-guard hook --path-field input.target --cwd-field workspace" }
    ]
  }
}
```

檔案有問題時，AI 代理會收到檔案路徑、行號、欄位與建議，可以直接修正。

### 建議

- 先在專案裡安裝 `zhtw-guard`（`npm install --save-dev zhtw-guard`），讓 `npx` 不必每次下載。
- 寫入檔案的 hook 只會回報問題，不會自動修改檔案。需要自動修正時，可以另外執行 `npx zhtw-guard fix <路徑>`。
- 可以先用 `--fail-on error` 只擋錯誤，等詞表符合團隊習慣後再考慮 `--fail-on warning`。

---

## English

`zhtw-guard hook` is a generic hook interface for AI coding agents. Most agents can run a command when an event happens and pass the event to it as JSON on standard input. `zhtw-guard hook` finds the reply text or the path of a file that was just written in that JSON and runs the matching checks.

### Contract

| Situation | Behavior |
| --- | --- |
| Input | One JSON document on standard input |
| No problems | Exit code `0` and no output |
| Problems found | Exit code `2`, problems written to standard error so the agent can see them and fix its work |
| Invalid input or config | Exit code `1` and an error on standard error, so the agent is not blocked |

Empty input, or JSON without any of the configured fields, counts as clean and exits with `0`.

### What it checks

- **Reply text**: every text rule plus `reply-language`, which checks that the first sentence is Traditional Chinese.
- **Written file**: the same file rules as `zhtw-guard check`, without `reply-language`. The `exclude` setting of the config file applies, so excluded files are skipped. A file that no longer exists is skipped.
- When both fields are present, both are checked.

### Fields

Every agent sends a different JSON shape, so the field names are configurable. Field paths use `.` between keys, and array items use numeric indexes such as `event.files.0`.

| Option | Purpose | Default |
| --- | --- | --- |
| `--text-field <path>` | Field with the reply text. Repeat it or separate fields with commas; the first field with a value wins | `text`, `reply`, `message` |
| `--path-field <path>` | Field with the path of the written file, with the same rules | `path`, `file_path`, `filePath` |
| `--cwd-field <path>` | Field with the working directory; relative paths resolve against it | `cwd` |
| `--config <file>` | Config file to use | Searched upward from the working directory |
| `--strictness <default\|strict>` | Override the term strictness from the config file | From the config file |
| `--fail-on <error\|warning>` | With `warning`, warnings also exit with `2` | `error` |

### Scenario 1: check a reply when it is finished

Suppose the agent sends this event when a reply is finished:

```json
{
  "event": "reply_finished",
  "cwd": "/home/dev/project",
  "reply": "Sure, I updated the config file."
}
```

In the hook settings of the agent, run this command for the reply finished event:

```json
{
  "hooks": {
    "reply_finished": [
      { "command": "npx zhtw-guard hook --text-field reply" }
    ]
  }
}
```

The command exits with `2` and writes this to standard error, so the agent rewrites the reply:

```text
<reply>:1:1 reply-language Reply starts in English, not Traditional Chinese -> start the reply in Traditional Chinese (Taiwan)
zhtw-guard: 1 problem (1 error, 0 warnings). Fix them so the text follows Traditional Chinese (Taiwan) conventions.
```

### Scenario 2: check a file after it is written

Suppose the agent sends this event after writing a file, with the path in a nested field:

```json
{
  "event": "file_written",
  "workspace": "/home/dev/project",
  "input": {
    "target": "docs/guide.md"
  }
}
```

Run this command for the file written event:

```json
{
  "hooks": {
    "file_written": [
      { "command": "npx zhtw-guard hook --path-field input.target --cwd-field workspace" }
    ]
  }
}
```

When the file has problems, the agent gets the path, line, column and suggestion for each one and can fix the file.

### Tips

- Install `zhtw-guard` in the project (`npm install --save-dev zhtw-guard`) so `npx` does not download it on every run.
- The file hook only reports problems and never edits the file. Run `npx zhtw-guard fix <path>` separately if you want automatic fixes.
- Start with `--fail-on error` and move to `--fail-on warning` once the term tables match your team's style.
