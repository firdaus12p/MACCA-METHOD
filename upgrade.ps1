$REPO_URL = "https://github.com/firdaus12p/macca-workflow"
$TMP_DIR = Join-Path $env:TEMP "macca-upgrade"

# Backup developer-config.json jika ada
$CONFIG_BACKUP = $null
if (Test-Path ".agents\developer-config.json") {
  $Config_BACKUP = Get-Content ".agents\developer-config.json" -Raw
}

if (Test-Path $TMP_DIR) { Remove-Item -Recurse -Force $TMP_DIR }

Write-Host "Updating MACCA..."
git clone --depth 1 $REPO_URL $TMP_DIR --quiet

if (Test-Path ".agents") { Remove-Item -Recurse -Force ".agents" }
Copy-Item -Recurse "$TMP_DIR\.agents" . -Force
Copy-Item "$TMP_DIR\skills-lock.json" . -Force

# Restore developer-config.json
if ($null -ne $Config_BACKUP) {
  Set-Content -Path ".agents\developer-config.json" -Value $Config_BACKUP
}

Remove-Item -Recurse -Force $TMP_DIR
Write-Host "Done! MACCA updated to latest version."
