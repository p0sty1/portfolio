# Copy environment variables from .env to the portfolio Worker (wrangler secrets).
# Run after: npx wrangler login
# Pages secrets to mirror: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY,
#   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (add the latter two to .env if missing).

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Import-DotEnv {
  param([string]$Path = ".env")
  if (-not (Test-Path $Path)) {
    Write-Error "Missing $Path. Copy .env.example and fill in values."
  }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $name, $value = $_ -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    if ($name) { Set-Item -Path "env:$name" -Value $value }
  }
}

Import-DotEnv

$keys = @(
  "REACT_APP_SUPABASE_URL",
  "REACT_APP_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
)

$lines = @()
foreach ($key in $keys) {
  $val = [Environment]::GetEnvironmentVariable($key)
  if ($val) { $lines += "$key=$val" }
}

if ($lines.Count -eq 0) {
  Write-Error "No secrets found in .env for: $($keys -join ', ')"
}

$bulkFile = ".wrangler-secrets-bulk.env"
$lines | Set-Content -Path $bulkFile -Encoding utf8
Write-Host "Uploading $($lines.Count) secret(s) to Worker portfolio..."
npx wrangler secret bulk $bulkFile
Remove-Item $bulkFile -Force
Write-Host "Done. List with: npx wrangler secret list"
