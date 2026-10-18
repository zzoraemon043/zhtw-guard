#!/usr/bin/env bash
set -euo pipefail

read -r -a scopes <<< "$(printf '%s' "${ZHTW_GUARD_PATHS:-.}" | tr '\n\t' '  ')"
if (( ${#scopes[@]} == 0 )); then
  scopes=(.)
fi

check_args=(check --format github --fail-on "${ZHTW_GUARD_FAIL_ON:-error}")
if [[ -n "${ZHTW_GUARD_STRICTNESS:-}" ]]; then
  check_args+=(--strictness "$ZHTW_GUARD_STRICTNESS")
fi

run_check() {
  node "$ZHTW_GUARD_BIN" "${check_args[@]}" "$@"
}

base_sha="${ZHTW_GUARD_BASE_SHA:-}"
if [[ -z "$base_sha" ]]; then
  run_check "${scopes[@]}"
  exit $?
fi

git fetch --no-tags --quiet --depth=1 origin "$base_sha" 2>/dev/null || true
if ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
  echo "::warning title=zhtw-guard::Base commit $base_sha is not available; checking all paths instead."
  run_check "${scopes[@]}"
  exit $?
fi

is_in_scope() {
  local file="$1" scope
  for scope in "${scopes[@]}"; do
    scope="${scope#./}"
    scope="${scope%/}"
    if [[ "$scope" == "." || "$scope" == "" || "$file" == "$scope" || "$file" == "$scope/"* ]]; then
      return 0
    fi
  done
  return 1
}

files=()
while IFS= read -r -d '' file; do
  if is_in_scope "$file"; then
    files+=("$file")
  fi
done < <(git -c core.quotepath=off diff --name-only --diff-filter=ACMR -z "$base_sha" HEAD)

if (( ${#files[@]} == 0 )); then
  echo "zhtw-guard: no changed files to check"
  exit 0
fi

run_check "${files[@]}"
