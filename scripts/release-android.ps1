# Build signed Android App Bundle (AAB) for Google Play.
# Prerequisites: android/keystore.properties (see android/keystore.properties.example)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AndroidDir = Join-Path $Root "android"
$KeystoreProps = Join-Path $AndroidDir "keystore.properties"
$JavaPropsFile = Join-Path $AndroidDir "java.properties"

if (Test-Path -LiteralPath $JavaPropsFile) {
  foreach ($line in Get-Content -LiteralPath $JavaPropsFile) {
    $trimmed = $line.Trim()
    if ($trimmed -match "^java\.home=(.+)$") {
      $env:JAVA_HOME = $Matches[1].Trim().Trim('"')
      break
    }
  }
}

if (-not (Test-Path $KeystoreProps)) {
  Write-Host ""
  Write-Host "Missing android/keystore.properties" -ForegroundColor Red
  Write-Host "Run once: npm run setup:android-signing"
  Write-Host "Or copy android/keystore.properties.example -> android/keystore.properties"
  Write-Host ""
  exit 1
}

$npm = "C:\Program Files\nodejs\npm.cmd"
$npx = "C:\Program Files\nodejs\npx.cmd"
if (-not (Test-Path $npm)) {
  $npm = "npm"
  $npx = "npx"
}

Set-Location $Root
Write-Host ">> Building web assets..." -ForegroundColor Cyan
& $npm run build:mobile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ">> Capacitor sync android..." -ForegroundColor Cyan
& $npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ">> Gradle bundleRelease..." -ForegroundColor Cyan
Set-Location $AndroidDir
& .\gradlew.bat bundleRelease
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Aab = Join-Path $AndroidDir "app\build\outputs\bundle\release\app-release.aab"
Write-Host ""
Write-Host "Release AAB ready:" -ForegroundColor Green
Write-Host $AAB
Write-Host ""
Write-Host "Upload to Play Console -> Release -> Production / Internal testing"
