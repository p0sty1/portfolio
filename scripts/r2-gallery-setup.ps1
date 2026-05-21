# Creates R2 bucket + uploads gallery/manifest.json
# Auth (pick one):
#   A) npx wrangler login
#   B) CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in .env (see .env.example)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Import-DotEnv {
  param([string]$Path = ".env")
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $name, $value = $_ -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    if ($name) { Set-Item -Path "env:$name" -Value $value }
  }
}

Import-DotEnv

if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
  $env:CLOUDFLARE_ACCOUNT_ID = "cd77340c35e904beb65ed7a2dea6d21c"
}

if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "提示: 未设置 CLOUDFLARE_API_TOKEN。可先执行 npx wrangler login，或在 .env 填入 API Token。"
  $whoami = npx wrangler whoami 2>&1 | Out-String
  if ($whoami -match "not authenticated") {
    Write-Error @"
未登录 Cloudflare。请任选其一：
  1) npx wrangler login
  2) 在 .env 设置 CLOUDFLARE_API_TOKEN（见 .env.example），然后重新运行本脚本
  3) Cursor 里授权 Cloudflare Bindings MCP（弹出窗口点 Allow，需在 2 分钟内完成）
"@
  }
}

Write-Host "Account: $($env:CLOUDFLARE_ACCOUNT_ID)"
Write-Host "Listing R2 buckets..."
npx wrangler r2 bucket list

Write-Host "Creating R2 bucket portfolio-gallery (skip if exists)..."
npx wrangler r2 bucket create portfolio-gallery 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "(bucket may already exist — continuing)"
}

Write-Host "Uploading gallery/manifest.json..."
npx wrangler r2 object put portfolio-gallery/gallery/manifest.json `
  --file=r2/gallery/manifest.json `
  --content-type=application/json

Write-Host "Verifying manifest in bucket..."
npx wrangler r2 object get portfolio-gallery/gallery/manifest.json --file=.wrangler-manifest-check.json 2>$null
if (Test-Path ".wrangler-manifest-check.json") {
  Remove-Item ".wrangler-manifest-check.json" -Force
  Write-Host "OK: manifest.json is in R2."
} else {
  Write-Host "Upload finished. Confirm in Dashboard → R2 → portfolio-gallery."
}

Write-Host ""
Write-Host "Upload images:"
Write-Host "  npx wrangler r2 object put portfolio-gallery/gallery/g1.jpg --file=path/to/image.jpg --content-type=image/jpeg"
Write-Host "Deploy: npm run build && npx wrangler deploy"
