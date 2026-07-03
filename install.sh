#!/bin/bash
# set -e dihapus — gunakan error handling eksplisit

REPO_URL="https://github.com/firdaus12p/MACCA-METHOD"
TMP_DIR=$(mktemp -d)
SELECTED=()
trap 'rm -rf "$TMP_DIR" 2>/dev/null' INT TERM EXIT

# ─── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo "  ╭─────────────────────────────────────────╮"
echo "  │      MACCA — AI Spec-Driven Dev          │"
echo "  ╰─────────────────────────────────────────╯"
echo ""

# ─── Clone & copy skills ────────────────────────────────────────────────────────
echo "  Mengunduh skills..."
if ! git clone --depth 1 "$REPO_URL" "$TMP_DIR/macca" --quiet 2>&1; then
  echo ""
  echo "  ✗ Gagal mengunduh. Periksa:"
  echo "    · Koneksi internet aktif"
  echo "    · Repo tersedia di: $REPO_URL"
  rm -rf "$TMP_DIR"
  exit 1
fi

cp -r "$TMP_DIR/macca/.agents/" .
cp "$TMP_DIR/macca/skills-lock.json" .

# ─── Copy skills to a tool's folder ─────────────────────────────────────────────
copy_skills() {
  local DEST="$1"
  mkdir -p "$DEST"
  cp -r .agents/skills/. "$DEST/"
}

# ─── Install per tool ────────────────────────────────────────────────────────────
install_tool() {
  local TOOL="$1"
  case "$TOOL" in
    1|copilot)
      copy_skills .github/skills
      SELECTED+=("copilot")
      echo "  ✓ GitHub Copilot    → .github/skills/"
      ;;
    2|cursor)
      copy_skills .cursor/skills
      SELECTED+=("cursor")
      echo "  ✓ Cursor            → .cursor/skills/"
      ;;
    3|claude)
      copy_skills .claude/skills
      SELECTED+=("claude")
      echo "  ✓ Claude Code       → .claude/skills/"
      ;;
    4|windsurf)
      copy_skills .windsurf/skills
      SELECTED+=("windsurf")
      echo "  ✓ Windsurf          → .windsurf/skills/"
      ;;
    5|gemini)
      copy_skills .gemini/skills
      SELECTED+=("gemini")
      echo "  ✓ Gemini CLI        → .gemini/skills/"
      ;;
    6|opencode)
      copy_skills .opencode/skill
      SELECTED+=("opencode")
      echo "  ✓ OpenCode          → .opencode/skill/"
      ;;
    7|kilo)
      copy_skills .kilo/skills
      SELECTED+=("kilo")
      echo "  ✓ Kilo Code         → .kilo/skills/"
      ;;
    8|codex)
      SELECTED+=("codex")
      echo "  ✓ Codex (OpenAI)    → .agents/skills/ (format native Codex, tidak ada file tambahan)"
      ;;
    9|kimi)
      copy_skills "$HOME/.config/agents/skills"
      SELECTED+=("kimi")
      echo "  ✓ Kimi CLI          → ~/.config/agents/skills/"
      ;;
  esac
}

# ─── Checkbox selector (↑/↓ Spasi Enter) ─────────────────────────────────────
_cb_indices=()
checkbox_select() {
  local items=("$@") n=${#items[@]} cursor=0 i
  local checked=()
  for ((i=0;i<n;i++)); do checked[$i]=0; done

  _render() {
    for ((i=0;i<n;i++)); do
      local m; [[ ${checked[$i]} -eq 1 ]] && m="[x]" || m="[ ]"
      if [[ $i -eq $cursor ]]; then
        printf "  \033[7m %s  %s \033[0m\n" "$m" "${items[$i]}"
      else
        printf "    %s  %s\n" "$m" "${items[$i]}"
      fi
    done
    printf "\n  \033[2m↑/↓ navigasi  ·  Spasi pilih  ·  Enter konfirmasi\033[0m\n"
  }

  printf "\n"; _render
  while true; do
    local k k2 k3
    IFS= read -r -s -n1 k </dev/tty
    if [[ "$k" == $'\x1b' ]]; then
      IFS= read -r -s -n1 -t 0.1 k2 </dev/tty
      IFS= read -r -s -n1 -t 0.1 k3 </dev/tty
      if [[ "$k2$k3" == '[A' && $cursor -gt 0 ]];        then cursor=$((cursor - 1)); fi
      if [[ "$k2$k3" == '[B' && $cursor -lt $((n-1)) ]]; then cursor=$((cursor + 1)); fi
    elif [[ "$k" == ' ' ]];  then checked[$cursor]=$((1-checked[$cursor]))
    elif [[ "$k" == '' ]]; then break
    fi
    printf "\033[%dA" $((n+2)); _render
  done
  printf "\n"
  _cb_indices=()
  for ((i=0;i<n;i++)); do
    if [[ ${checked[$i]} -eq 1 ]]; then _cb_indices+=("$i"); fi
  done
}

# ─── Pilih AI provider ────────────────────────────────────────────────────────
DISPLAY=(
  "GitHub Copilot    → .github/skills/"
  "Cursor            → .cursor/skills/"
  "Claude Code       → .claude/skills/"
  "Windsurf          → .windsurf/skills/"
  "Gemini CLI        → .gemini/skills/"
  "OpenCode          → .opencode/skill/"
  "Kilo Code         → .kilo/skills/"
  "Codex / OpenAI    → .agents/skills/  (native)"
  "Kimi CLI          → ~/.config/agents/skills/"
)
KEYS=("copilot" "cursor" "claude" "windsurf" "gemini" "opencode" "kilo" "codex" "kimi")

echo "  Pilih AI provider yang kamu gunakan:"
checkbox_select "${DISPLAY[@]}"

TOOL_SELECTED=()
for idx in "${_cb_indices[@]}"; do TOOL_SELECTED+=("${KEYS[$idx]}"); done

if [ ${#TOOL_SELECTED[@]} -eq 0 ]; then
  echo "  Tidak ada provider dipilih — default ke .agents/skills/"
  SELECTED+=("codex")
else
  echo "  Menyalin skills:"
  for KEY in "${TOOL_SELECTED[@]}"; do install_tool "$KEY"; done
fi

# Hapus .agents/skills/ kecuali jika codex dipilih
KEEP=false
for KEY in "${TOOL_SELECTED[@]}"; do
  if [[ "$KEY" == "codex" ]]; then KEEP=true; fi
done
if [ "$KEEP" = false ] && [ ${#TOOL_SELECTED[@]} -gt 0 ]; then
  rm -rf .agents/skills
fi

# ─── Save selected tools ───────────────────────────────────────────────────────────
printf '%s\n' "${SELECTED[@]}" > .agents/macca-tools.txt

# ─── Nama developer & project ───────────────────────────────────────────────────────────────────────────────────
echo ""
read -r -p "  Kamu mau di panggil apa? (Kosong = Skip): " DEV_NAME </dev/tty
read -r -p "  Nama project ini apa? (Kosong = Skip): " PROJECT_NAME </dev/tty
if [ -n "$DEV_NAME" ] || [ -n "$PROJECT_NAME" ]; then
  printf '{\n  "name": "%s",\n  "project": "%s"\n}\n' "$DEV_NAME" "$PROJECT_NAME" > .agents/developer-config.json
  if [ -n "$DEV_NAME" ];     then echo "  Nama developer disimpan: $DEV_NAME"; fi
  if [ -n "$PROJECT_NAME" ]; then echo "  Nama project disimpan:   $PROJECT_NAME"; fi
fi

# ─── Cleanup & done ────────────────────────────────────────────────────────────────
rm -rf "$TMP_DIR"
trap - INT TERM EXIT
echo ""
echo "  ✓ MACCA installed!"
echo ""
