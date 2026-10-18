# Contributor rules

These rules apply to every contributor, human or automated.

## Code

- Do not write code comments. Name things so the code explains itself.
- Do not use emoji in code, docs, commit messages, issues or pull requests.
- Keep functions small and files focused on one job.
- Every rule and every dictionary entry needs tests.

## Commits and pull requests

- Use Conventional Commits, for example `feat(cli): add --fix`.
- Author commits as the repository owner: `zzoraemon043 <195147269+zzoraemon043@users.noreply.github.com>`.
- Do not add co-author trailers, tool attribution lines, session links or "generated with" footers.
- Do not mention the tools used to write the code.

## Docs

- Keep `README.md` bilingual: Traditional Chinese (Taiwan) and English.
- Use Taiwan vocabulary in Chinese text. The project must pass its own checks.

## Checks before pushing

- `npm test`
- `npm run lint`
- `npm run build`
