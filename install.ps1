$REPO_URL = "https://github.com/firdaus12p/macca-workflow"
$TMP_DIR = Join-Path $env:TEMP "macca-install"

if (Test-Path $TMP_DIR) { Remove-Item -Recurse -Force $TMP_DIR }

Write-Host "Installing MACCA..."
git clone --depth 1 $REPO_URL $TMP_DIR --quiet

Copy-Item -Recurse "$TMP_DIR\.agents" . -Force
Copy-Item "$TMP_DIR\skills-lock.json" . -Force

Remove-Item -Recurse -Force $TMP_DIR

$DEV_NAME = Read-Host "Kamu mau di panggil apa? (kosongkan untuk skip)"
if ($DEV_NAME -ne "") {
  New-Item -ItemType Directory -Force -Path ".agents" | Out-Null
  Set-Content -Path ".agents\developer-config.json" -Value "{`n  `"name`": `"$DEV_NAME`"`n}"
  Write-Host "Nama developer disimpan."
}

Write-Host "Done! MACCA installed. Gunakan skill help untuk mulai."
