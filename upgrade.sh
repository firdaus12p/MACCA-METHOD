#!/bin/bash
# set -e dihapus — gunakan error handling eksplisit

REPO_URL="https://github.com/firdaus12p/MACCA-METHOD"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR" 2>/dev/null' INT TERM EXIT

echo ""
echo "  Updating MACCA skills..."

# ─── Backup user configs ──────────────────────────────────────────────────────
CONFIG_BACKUP=""
TOOLS_BACKUP=""
MANAGED_SKILLS_BACKUP=""
[ -f ".agents/developer-config.json" ] && CONFIG_BACKUP=$(cat ".agents/developer-config.json")
[ -f ".agents/macca-tools.txt" ]        && TOOLS_BACKUP=$(cat ".agents/macca-tools.txt")
[ -f ".agents/macca-managed-skills.txt" ] && MANAGED_SKILLS_BACKUP=$(cat ".agents/macca-managed-skills.txt")

# ─── Clone repo ───────────────────────────────────────────────────────────────
if ! git clone --depth 1 "$REPO_URL" "$TMP_DIR/macca" --quiet 2>&1; then
  echo ""
  echo "  ✗ Gagal mengunduh. Periksa:"
  echo "    · Koneksi internet aktif"
  echo "    · Repo tersedia di: $REPO_URL"
  exit 1
fi

# ─── Helper: copy langsung dari temp ke folder tool ──────────────────────────
list_new_managed_skills() {
  if [ -f "$TMP_DIR/macca/.agents/macca-managed-skills.txt" ]; then
    cat "$TMP_DIR/macca/.agents/macca-managed-skills.txt"
    return
  fi

  for path in "$TMP_DIR/macca/.agents/skills"/*; do
    [ -d "$path" ] || continue
    basename "$path"
  done
}

list_managed_skills_to_clean() {
  {
    printf '%s\n' "$MANAGED_SKILLS_BACKUP"
    list_new_managed_skills
  } | sed '/^$/d' | sort -u
}

copy_skills() {
  local DEST="$1"
  mkdir -p "$DEST"

  while IFS= read -r SKILL_DIR; do
    [ -z "$SKILL_DIR" ] && continue
    rm -rf "$DEST/$SKILL_DIR"
  done < <(list_managed_skills_to_clean)

  while IFS= read -r SKILL_DIR; do
    [ -z "$SKILL_DIR" ] && continue
    cp -r "$TMP_DIR/macca/.agents/skills/$SKILL_DIR" "$DEST/$SKILL_DIR"
  done < <(list_new_managed_skills)
}

# ─── Update skills langsung ke folder masing-masing tool ─────────────────────
HAS_CODEX=false
if [ -f ".agents/macca-tools.txt" ]; then
  echo "  Memperbarui skills untuk:"
  while IFS= read -r TOOL; do
    case "$TOOL" in
      copilot)  copy_skills .github/skills                 && echo "  ✓ GitHub Copilot  → .github/skills/" ;;
      cursor)   copy_skills .cursor/skills                 && echo "  ✓ Cursor          → .cursor/skills/" ;;
      claude)   copy_skills .claude/skills                 && echo "  ✓ Claude Code     → .claude/skills/" ;;
      windsurf) copy_skills .windsurf/skills               && echo "  ✓ Windsurf        → .windsurf/skills/" ;;
      gemini)   copy_skills .gemini/skills                 && echo "  ✓ Gemini CLI      → .gemini/skills/" ;;
      opencode) copy_skills .opencode/skill                && echo "  ✓ OpenCode        → .opencode/skill/" ;;
      kilo)     copy_skills .kilo/skills                   && echo "  ✓ Kilo Code       → .kilo/skills/" ;;
      codex)    HAS_CODEX=true
                copy_skills .agents/skills                 && echo "  ✓ Codex (OpenAI)  → .agents/skills/" ;;
      kimi)     copy_skills "$HOME/.config/agents/skills"  && echo "  ✓ Kimi CLI        → ~/.config/agents/skills/" ;;
    esac
  done < .agents/macca-tools.txt
else
  echo "  (macca-tools.txt tidak ditemukan — jalankan install ulang untuk memilih tools)"
fi

# ─── Bersihkan .agents/skills/ jika bukan codex ──────────────────────────────
if [ "$HAS_CODEX" = false ]; then
  rm -rf .agents/skills
fi

# ─── Update skills-lock.json ──────────────────────────────────────────────────
if [ -f "$TMP_DIR/macca/skills-lock.json" ]; then
  cp "$TMP_DIR/macca/skills-lock.json" .
fi

# ─── Restore user configs ─────────────────────────────────────────────────────
mkdir -p .agents
[ -f "$TMP_DIR/macca/.agents/macca-managed-skills.txt" ] && cp "$TMP_DIR/macca/.agents/macca-managed-skills.txt" .agents/macca-managed-skills.txt
[ -n "$CONFIG_BACKUP" ] && echo "$CONFIG_BACKUP" > .agents/developer-config.json
[ -n "$TOOLS_BACKUP" ]  && echo "$TOOLS_BACKUP"  > .agents/macca-tools.txt

# ─── Cleanup & done ───────────────────────────────────────────────────────────
rm -rf "$TMP_DIR"
trap - INT TERM EXIT
echo ""
echo "  ✓ MACCA updated!"
echo ""
