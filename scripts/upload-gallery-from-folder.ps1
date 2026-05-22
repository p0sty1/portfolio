# Upload local gallery folder to R2, generate manifest.json + sync src/data/galleryItems.ts
# Usage: .\scripts\upload-gallery-from-folder.ps1 -SourceDir "E:\gallery"

param(
  [string]$SourceDir = "E:\gallery",
  [string]$Bucket = "portfolio-gallery"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path $SourceDir)) {
  Write-Error "Source directory not found: $SourceDir"
}

function Get-ContentType([string]$ext) {
  switch ($ext.ToLower()) {
    ".png" { "image/png" }
    ".webp" { "image/webp" }
    default { "image/jpeg" }
  }
}

Add-Type -AssemblyName System.Drawing

function Get-AspectRatio {
  param([int]$Width, [int]$Height)
  if ($Width -eq $Height) { return "1/1" }
  if ($Width -gt $Height) { return "4/3" }
  return "3/4"
}

$files = Get-ChildItem -Path $SourceDir -File |
  Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' } |
  Sort-Object Name

if ($files.Count -eq 0) {
  Write-Error "No images in $SourceDir"
}

Write-Host "Found $($files.Count) image(s) in $SourceDir"

$items = @()
$index = 0

foreach ($file in $files) {
  $index++
  $id = "g$index"
  $key = "gallery/$id.jpg"
  $img = [System.Drawing.Image]::FromFile($file.FullName)
  $ratio = Get-AspectRatio -Width $img.Width -Height $img.Height
  $img.Dispose()
  $contentType = Get-ContentType $file.Extension

  Write-Host "Uploading $($file.Name) -> $key ($contentType)"
  npx wrangler r2 object put "${Bucket}/${key}" `
    --file="$($file.FullName)" `
    --content-type=$contentType `
    --remote
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $items += [ordered]@{
    id          = $id
    title       = "随拍 $index"
    caption     = "个人画廊"
    tags        = @("摄影", "生活")
    aspectRatio = $ratio
    imageKey    = $key
    likes       = 0
  }
}

# Keep UTF-8 manifest in repo (edit r2/gallery/manifest.json titles if needed).
$manifestPath = "r2/gallery/manifest.json"
if (-not (Test-Path $manifestPath)) {
  Write-Error "Missing $manifestPath — create it before upload."
}
Write-Host "Using $manifestPath (edit titles in repo before re-run if needed)"

Write-Host "Uploading gallery/manifest.json ..."
npx wrangler r2 object put "${Bucket}/gallery/manifest.json" `
  --file=$manifestPath `
  --content-type="application/json; charset=utf-8" `
  --remote
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done. $($items.Count) image(s) + manifest in R2. Open site -> 画廊 to view."
