#!/bin/bash
set -e

REPO_URL="https://github.com/firdaus12p/macca-workflow"
TMP_DIR=$(mktemp -d)

echo "Installing MACCA..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR/macca" --quiet

cp -r "$TMP_DIR/macca/.agents/" .
cp "$TMP_DIR/macca/skills-lock.json" .

rm -rf "$TMP_DIR"

read -r -p "Kamu mau di panggil apa? (kosongkan untuk skip): " DEV_NAME </dev/tty
if [ -n "$DEV_NAME" ]; then
  mkdir -p .agents
  printf '{\n  "name": "%s"\n}\n' "$DEV_NAME" > .agents/developer-config.json
  echo "Nama developer disimpan."
fi

echo "Done! MACCA installed. Gunakan skill help untuk mulai."
