$REPO_URL     = "https://github.com/firdaus12p/MACCA-METHOD"
$TMP_DIR      = Join-Path $env:TEMP "macca-install"
$Selected     = @()

# ─── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╭─────────────────────────────────────────╮"
Write-Host "  │      MACCA — AI Spec-Driven Dev          │"
Write-Host "  ╰─────────────────────────────────────────╯"
Write-Host ""

# ─── Clone & copy skills ───────────────────────────────────────────────────────
Write-Host "  Mengunduh skills..."
if (Test-Path $TMP_DIR) { Remove-Item -Recurse -Force $TMP_DIR }
git clone --depth 1 $REPO_URL $TMP_DIR --quiet 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "  x Gagal mengunduh. Periksa:"
  Write-Host "    - Koneksi internet aktif"
  Write-Host "    - Repo tersedia di: $REPO_URL"
  if (Test-Path $TMP_DIR) { Remove-Item -Recurse -Force $TMP_DIR -ErrorAction SilentlyContinue }
  exit 1
}

Copy-Item -Recurse "$TMP_DIR\.agents" . -Force
if (Test-Path "$TMP_DIR\skills-lock.json") {
  Copy-Item "$TMP_DIR\skills-lock.json" . -Force
}

# ─── Helper: copy all skill folders to destination ────────────────────────────
function Copy-Skills($Dest) {
  New-Item -ItemType Directory -Force -Path $Dest | Out-Null
  foreach ($Dir in (Get-ChildItem ".agents\skills" -Directory)) {
    $Target = Join-Path $Dest $Dir.Name
    if (Test-Path $Target) { Remove-Item -Recurse -Force $Target }
    Copy-Item -Recurse $Dir.FullName $Target
  }
}

function Normalize-Language($Value) {
  $trimmed = $Value.Trim()
  switch ($trimmed.ToLowerInvariant()) {
    "" { return "indonesian" }
    "id" { return "indonesian" }
    "indo" { return "indonesian" }
    "indonesia" { return "indonesian" }
    "indonesian" { return "indonesian" }
    "bahasa indonesia" { return "indonesian" }
    "en" { return "english" }
    "eng" { return "english" }
    "english" { return "english" }
    "inggris" { return "english" }
    "bahasa inggris" { return "english" }
    default { return $trimmed.ToLowerInvariant() }
  }
}

# ─── Checkbox selector (↑/↓ Spasi Enter) ────────────────────────────────────
$AllToolDisplay = @(
  "GitHub Copilot    -> .github\skills\"
  "Cursor            -> .cursor\skills\"
  "Claude Code       -> .claude\skills\"
  "Windsurf          -> .windsurf\skills\"
  "Gemini CLI        -> .gemini\skills\"
  "OpenCode          -> .opencode\skill\"
  "Kilo Code         -> .kilo\skills\"
  "Codex / OpenAI    -> .agents\skills\ (native)"
  "Kimi CLI          -> AppData\Roaming\agents\skills\"
)
$AllToolKeys = @("copilot","cursor","claude","windsurf","gemini","opencode","kilo","codex","kimi")
$checked     = @($false) * $AllToolDisplay.Count
$cursor      = 0
$n           = $AllToolDisplay.Count

function Render-Tools {
  for ($i = 0; $i -lt $n; $i++) {
    $m = if ($checked[$i]) { "[x]" } else { "[ ]" }
    if ($i -eq $cursor) {
      Write-Host ("  `e[7m {0}  {1} `e[0m" -f $m, $AllToolDisplay[$i])
    } else {
      Write-Host ("    {0}  {1}" -f $m, $AllToolDisplay[$i])
    }
  }
  Write-Host ""
  Write-Host "  " -NoNewline
  Write-Host "↑/↓ navigasi  ·  Spasi pilih  ·  Enter konfirmasi" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  Pilih AI provider yang kamu gunakan:"
[System.Console]::CursorVisible = $false
Write-Host ""
Render-Tools

while ($true) {
  $key = [System.Console]::ReadKey($true)
  if ($key.Key -eq 'Enter') { break }
  switch ($key.Key) {
    'UpArrow'   { if ($cursor -gt 0)    { $cursor-- } }
    'DownArrow' { if ($cursor -lt $n-1) { $cursor++ } }
    'Spacebar'  { $checked[$cursor] = -not $checked[$cursor] }
  }
  [System.Console]::SetCursorPosition(0, [System.Console]::CursorTop - ($n + 2))
  Render-Tools
}
[System.Console]::CursorVisible = $true
Write-Host ""

$ToolSelected = @()
for ($i = 0; $i -lt $n; $i++) {
  if ($checked[$i]) { $ToolSelected += $AllToolKeys[$i] }
}

if ($ToolSelected.Count -eq 0) {
  Write-Host "  Tidak ada provider dipilih — default ke .agents\skills\"
  $Selected += 'codex'
} else {
  Write-Host "  Menyalin skills:"
  foreach ($Key in $ToolSelected) {
    switch ($Key) {
      'copilot'  { Copy-Skills ".github\skills";   $Selected += 'copilot';  Write-Host "  v GitHub Copilot  -> .github\skills\" }
      'cursor'   { Copy-Skills ".cursor\skills"; $Selected += 'cursor';  Write-Host "  v Cursor          -> .cursor\skills\" }
      'claude'   { Copy-Skills ".claude\skills"; $Selected += 'claude';  Write-Host "  v Claude Code     -> .claude\skills\" }
      'windsurf' { Copy-Skills ".windsurf\skills";  $Selected += 'windsurf'; Write-Host "  v Windsurf        -> .windsurf\skills\" }
      'gemini'   { Copy-Skills ".gemini\skills";    $Selected += 'gemini';   Write-Host "  v Gemini CLI      -> .gemini\skills\" }
      'opencode' { Copy-Skills ".opencode\skill";   $Selected += 'opencode'; Write-Host "  v OpenCode        -> .opencode\skill\" }
      'kilo'     { Copy-Skills ".kilo\skills";      $Selected += 'kilo';     Write-Host "  v Kilo Code       -> .kilo\skills\" }
      'codex'    { $Selected += 'codex'; Write-Host "  v Codex/OpenAI    -> .agents\skills\ (native)" }
      'kimi'     { $KimiDir = Join-Path $env:APPDATA "agents\skills"; Copy-Skills $KimiDir; $Selected += 'kimi'; Write-Host "  v Kimi CLI        -> $KimiDir" }
    }
  }
}

# Hapus .agents\skills\ kecuali jika codex dipilih
if ($ToolSelected.Count -gt 0 -and $ToolSelected -notcontains 'codex') {
  Remove-Item -Recurse -Force ".agents\skills" -ErrorAction SilentlyContinue
}

# ─── Save selected tools ───────────────────────────────────────────────────────
Set-Content ".agents\macca-tools.txt" ($Selected -join "`n")

# ─── Nama developer, project, & language preferences ──────────────────────────
Write-Host ""
$DEV_NAME     = Read-Host "  Kamu mau di panggil apa? (Kosong = Skip)"
$PROJECT_NAME = Read-Host "  Nama project ini apa? (Kosong = Skip)"
$COMMUNICATION_LANGUAGE = Read-Host "  Bahasa komunikasi yang anda inginkan? (Kosong = Bahasa Indonesia)"
$DOCUMENT_LANGUAGE      = Read-Host "  Bahasa dokumen yang dihasilkan? (Kosong = Bahasa Indonesia)"

if ($COMMUNICATION_LANGUAGE -eq "") { $COMMUNICATION_LANGUAGE = "Bahasa Indonesia" }
if ($DOCUMENT_LANGUAGE -eq "")      { $DOCUMENT_LANGUAGE = "Bahasa Indonesia" }

if ($DEV_NAME -ne "" -or $PROJECT_NAME -ne "" -or $COMMUNICATION_LANGUAGE -ne "" -or $DOCUMENT_LANGUAGE -ne "") {
  $DeveloperConfig = [ordered]@{
    name = $DEV_NAME
    project = $PROJECT_NAME
    languagePreferences = [ordered]@{
      communication = [ordered]@{
        raw = $COMMUNICATION_LANGUAGE
        normalized = Normalize-Language $COMMUNICATION_LANGUAGE
      }
      documents = [ordered]@{
        raw = $DOCUMENT_LANGUAGE
        normalized = Normalize-Language $DOCUMENT_LANGUAGE
      }
    }
  }

  $DeveloperConfig | ConvertTo-Json -Depth 5 | Set-Content -Path ".agents\developer-config.json"
  if ($DEV_NAME -ne "")     { Write-Host "  Nama developer disimpan: $DEV_NAME" }
  if ($PROJECT_NAME -ne "") { Write-Host "  Nama project disimpan:   $PROJECT_NAME" }
  Write-Host "  Bahasa komunikasi disimpan: $COMMUNICATION_LANGUAGE"
  Write-Host "  Bahasa dokumen disimpan:    $DOCUMENT_LANGUAGE"
}

# ─── Cleanup & done ────────────────────────────────────────────────────────────
Remove-Item -Recurse -Force $TMP_DIR
Write-Host ""
Write-Host "  v MACCA installed!"
Write-Host ""