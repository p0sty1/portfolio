param(
  [ValidateSet("Debug", "Release")]
  [string]$BuildType = "Debug"
)

$projectDir = Resolve-Path "$PSScriptRoot\..\android-webview"
$gradle = Get-Command gradle -ErrorAction SilentlyContinue

if (-not $gradle) {
  throw "Gradle was not found on PATH. Open android-webview in Android Studio, or install Gradle and retry."
}

Push-Location $projectDir
try {
  & $gradle.Source ":app:assemblePublicApp$BuildType" ":app:assembleAdminApp$BuildType"

  Write-Host ""
  Write-Host "Public APK:"
  Write-Host "  $projectDir\app\build\outputs\apk\publicApp\$($BuildType.ToLower())\app-publicApp-$($BuildType.ToLower()).apk"
  Write-Host "Admin APK:"
  Write-Host "  $projectDir\app\build\outputs\apk\adminApp\$($BuildType.ToLower())\app-adminApp-$($BuildType.ToLower()).apk"
} finally {
  Pop-Location
}
