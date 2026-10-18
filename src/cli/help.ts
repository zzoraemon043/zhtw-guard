export const HELP_TEXT = `Usage: zhtw-guard <command> [options]

Commands:
  check [paths...]   Report problems in files and directories (default: .)
  fix [paths...]     Fix what can be fixed safely, then report the rest
  text               Check text from standard input

Options:
  --format <human|json|github>   Output format (default: human); github prints workflow annotations
  --config <file>                Use this config file instead of searching for zhtw-guard.config.json
  --strictness <default|strict>  Override the term strictness from the config file
  --fail-on <error|warning>      Exit with 1 on errors only, or on warnings too (default: error)
  --path <file>                  text only: file name used for file-specific rules such as ps1-bom
  --fix                          text only: print the fixed text instead of a report
  --reply                        text only: also check that the text starts in Traditional Chinese
  -h, --help                     Show this help
  -v, --version                  Show the version

Exit codes:
  0  no failing problems
  1  problems found at or above the --fail-on level
  2  usage or configuration error
`;
