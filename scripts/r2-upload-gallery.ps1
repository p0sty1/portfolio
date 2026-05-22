# Upload E:\gallery (or -SourceDir) images to R2 as gallery/g1.jpg … and refresh manifest.
# Requires: npx wrangler login

param(
  [string]$SourceDir = "E:\gallery",
  [string]$Bucket = "portfolio-gallery",
  [switch]$Remote = $true
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path $SourceDir)) {
  Write-Error "Source directory not found: $SourceDir"
}

$files = Get-ChildItem -Path $SourceDir -File |
  Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' } |
  Sort-Object Name

if ($files.Count -eq 0) {
  Write-Error "No images in $SourceDir"
}

$remoteFlag = if ($Remote) { "--remote" } else { "" }
Write-Host "Uploading $($files.Count) image(s) to R2 bucket $Bucket ..."

$i = 1
foreach ($file in $files) {
  $key = "gallery/g$i.jpg"
  $contentType = switch ($file.Extension.ToLower()) {
    ".png" { "image/png" }
    ".webp" { "image/webp" }
    default { "image/jpeg" }
  }
  Write-Host "  $key <= $($file.Name)"
  if ($remoteFlag) {
    npx wrangler r2 object put "${Bucket}/${key}" --file=$file.FullName --content-type=$contentType --remote
  } else {
    npx wrangler r2 object put "${Bucket}/${key}" --file=$file.FullName --content-type=$contentType
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $i++
}

Write-Host "Uploading gallery/manifest.json ..."
if ($remoteFlag) {
  npx wrangler r2 object put "${Bucket}/gallery/manifest.json" `
    --file=r2/gallery/manifest.json `
    --content-type=application/json `
    --remote
} else {
  npx wrangler r2 object put "${Bucket}/gallery/manifest.json" `
    --file=r2/gallery/manifest.json `
    --content-type=application/json
}

Write-Host "Done. $($files.Count) images + manifest uploaded."
