#!/bin/bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
MODE="local"

if [ "${1:-}" = "--published" ]; then
  MODE="published"
fi

TMP_DIR=$(mktemp -d)
PROJECT_DIR="$TMP_DIR/project"
PACKAGE_SPEC="macca-method"
PACK_OUTPUT=""

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT INT TERM

resolve_tarball_filename() {
  node -e 'const fs = require("node:fs"); const data = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(data[0].filename);'
}

run_cli() {
  if [ "$MODE" = "published" ]; then
    npx --yes macca-method "$@"
    return
  fi

  npx --yes --package "$PACKAGE_SPEC" macca-method "$@"
}

assert_path_exists() {
  local target_path="$1"
  if [ ! -e "$target_path" ]; then
    echo "Missing expected path: $target_path" >&2
    exit 1
  fi
}

echo ""
echo "  MACCA test-install"
echo "  Mode: $MODE"

cd "$ROOT_DIR"

if [ "$MODE" = "local" ]; then
  PACK_OUTPUT=$(npm pack --json --pack-destination "$TMP_DIR")
  TARBALL_NAME=$(printf '%s' "$PACK_OUTPUT" | resolve_tarball_filename)
  PACKAGE_SPEC="$TMP_DIR/$TARBALL_NAME"
fi

mkdir -p "$PROJECT_DIR"

echo ""
echo "  Installing into: $PROJECT_DIR"

run_cli install \
  --yes \
  --tool codex \
  --tool github-copilot \
  --directory "$PROJECT_DIR"

run_cli upgrade \
  --directory "$PROJECT_DIR"

assert_path_exists "$PROJECT_DIR/.agents/developer-config.json"
assert_path_exists "$PROJECT_DIR/.agents/macca-managed-skills.txt"
assert_path_exists "$PROJECT_DIR/.agents/macca-tools.txt"
assert_path_exists "$PROJECT_DIR/.agents/skills/brainstorm-prd/SKILL.md"
assert_path_exists "$PROJECT_DIR/.github/skills/brainstorm-prd/SKILL.md"
assert_path_exists "$PROJECT_DIR/skills-lock.json"

if ! grep -qx 'codex' "$PROJECT_DIR/.agents/macca-tools.txt"; then
  echo "Expected codex in .agents/macca-tools.txt" >&2
  exit 1
fi

if ! grep -qx 'copilot' "$PROJECT_DIR/.agents/macca-tools.txt"; then
  echo "Expected copilot in .agents/macca-tools.txt" >&2
  exit 1
fi

echo ""
echo "  Verified files:"
find "$PROJECT_DIR" -maxdepth 4 -type f | sort

echo ""
echo "  ✓ test-install passed"
