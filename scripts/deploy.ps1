# Build with REACT_APP_* from .env.local / .env, then deploy Worker + static assets.
# Requires: npx wrangler login OR CLOUDFLARE_API_TOKEN in env / .env
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $name, $value = $_ -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    if ($name) { Set-Item -Path "env:$name" -Value $value }
  }
}

foreach ($file in @('.env.local', '.env')) {
  Import-DotEnv $file
}

if (-not $env:REACT_APP_SUPABASE_URL -or -not $env:REACT_APP_SUPABASE_ANON_KEY) {
  Write-Error @"
Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY.
Copy .env.example to .env.local and fill Supabase Project URL + anon key, then re-run.
"@
}

Write-Host "Building with Supabase env (URL set: yes)..."
npm run build

Write-Host "Deploying to Cloudflare Worker portfolio..."
npx wrangler deploy

Write-Host "Done. Open https://jyangb1y.site and hard-refresh (Ctrl+F5)."
