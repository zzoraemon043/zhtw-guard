export const HELP_TEXT = `Usage: zhtw-guard <command> [options]

Commands:
  check [paths...]   Report problems in files and directories (default: .)
  fix [paths...]     Fix what can be fixed safely, then report the rest
  text               Check text from standard input

Options:
  --format <human|json>  Output format (default: human)
  --config <file>        Use this config file instead of searching for zhtw-guard.config.json
  --path <file>          text only: file name used for file-specific rules such as ps1-bom
  --fix                  text only: print the fixed text instead of a report
  -h, --help             Show this help
  -v, --version          Show the version

Exit codes:
  0  no errors
  1  errors found
  2  usage or configuration error
`;
