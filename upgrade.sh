#!/bin/bash
set -e

REPO_URL="https://github.com/firdaus12p/macca-workflow"
TMP_DIR=$(mktemp -d)

# Backup developer-config.json jika ada
CONFIG_BACKUP=""
if [ -f ".agents/developer-config.json" ]; then
  CONFIG_BACKUP=$(cat ".agents/developer-config.json")
fi

echo "Updating MACCA..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR/macca" --quiet

rm -rf .agents
cp -r "$TMP_DIR/macca/.agents/" .
cp "$TMP_DIR/macca/skills-lock.json" .

# Restore developer-config.json
if [ -n "$CONFIG_BACKUP" ]; then
  echo "$CONFIG_BACKUP" > .agents/developer-config.json
fi

rm -rf "$TMP_DIR"
echo "Done! MACCA updated to latest version."
