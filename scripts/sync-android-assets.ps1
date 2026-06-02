# Copy fresh Vite build into Capacitor Android project. Never bundle *.apk inside assets.
param([switch]$Release)

$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
$gradleTask = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }
$apkName = if ($Release) { 'app-release-unsigned.apk' } else { 'app-debug.apk' }
$apkSubPath = if ($Release) { 'release' } else { 'debug' }

Write-Host "Building web (dist/)..."
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$dist = Join-Path $Root "dist"
$public = Join-Path $Root "android\app\src\main\assets\public"

if (-not (Test-Path $dist)) {
  Write-Error "dist/ not found after build"
  exit 1
}

Write-Host "Copying dist -> $public (excluding *.apk; nested APK inflates bundle past 100MB)"
if (Test-Path $public) { Remove-Item $public -Recurse -Force }
New-Item -ItemType Directory -Path $public -Force | Out-Null
Get-ChildItem -Path $dist -Force | Where-Object { $_.Extension -ne '.apk' } | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $public -Recurse -Force
}
$nestedApk = Join-Path $public "app-debug.apk"
if (Test-Path $nestedApk) {
  Remove-Item $nestedApk -Force
  Write-Warning "Removed nested app-debug.apk from Android assets"
}
$assetsMb = [math]::Round(
  (Get-ChildItem $public -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB,
  1
)
Write-Host "Android web assets: $assetsMb MB"
if ($assetsMb -gt 25) {
  Write-Warning "Web assets unusually large (>25 MB). Check for accidental binaries in public/ or dist/."
}

$configSrc = Join-Path $Root "capacitor.config.ts"
if (Test-Path (Join-Path $Root "android\app\src\main\assets\capacitor.config.json")) {
  $cap = Get-Content (Join-Path $Root "android\app\src\main\assets\capacitor.config.json") -Raw | ConvertFrom-Json
  $cap.appName = "AnimaStage Lite"
  $cap | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Root "android\app\src\main\assets\capacitor.config.json") -Encoding UTF8
}

Write-Host "Building Android APK ($gradleTask)..."
Push-Location (Join-Path $Root "android")
& .\gradlew.bat $gradleTask
$gradleExit = $LASTEXITCODE
Pop-Location
if ($gradleExit -ne 0) { exit $gradleExit }

$apkSrc = Join-Path $Root "android\app\build\outputs\apk\$apkSubPath\$apkName"
$apkDst = Join-Path $Root "public\app-debug.apk"
if (Test-Path $apkSrc) {
  Copy-Item $apkSrc $apkDst -Force
  $mb = [math]::Round((Get-Item $apkDst).Length / 1MB, 1)
  Write-Host ("Copied APK -> public/app-debug.apk (" + $mb + " MB)")
  if ($mb -ge 100) {
    Write-Warning "APK is ${mb} MB (at or above 100). Do not copy app-debug.apk into android assets."
    exit 1
  }
} else {
  Write-Error "APK not found at $apkSrc"
  exit 1
}

Write-Host "Done. Install public/app-debug.apk (web assets exclude nested APK)."
