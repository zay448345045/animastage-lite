# Copy fresh Vite build into existing Capacitor Android project (no RTX stripping).
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "Building web (dist/)..."
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$dist = Join-Path $Root "dist"
$public = Join-Path $Root "android\app\src\main\assets\public"

if (-not (Test-Path $dist)) {
  Write-Error "dist/ not found after build"
  exit 1
}

Write-Host "Copying dist -> $public"
if (Test-Path $public) { Remove-Item $public -Recurse -Force }
New-Item -ItemType Directory -Path $public -Force | Out-Null
Copy-Item -Path "$dist\*" -Destination $public -Recurse -Force

$configSrc = Join-Path $Root "capacitor.config.ts"
if (Test-Path (Join-Path $Root "android\app\src\main\assets\capacitor.config.json")) {
  $cap = Get-Content (Join-Path $Root "android\app\src\main\assets\capacitor.config.json") -Raw | ConvertFrom-Json
  $cap.appName = "AnimaStage Lite"
  $cap | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Root "android\app\src\main\assets\capacitor.config.json") -Encoding UTF8
}

$apkSrc = Join-Path $Root "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDst = Join-Path $Root "public\app-debug.apk"
if (Test-Path $apkSrc) {
  Copy-Item $apkSrc $apkDst -Force
  $mb = [math]::Round((Get-Item $apkDst).Length / 1MB, 1)
  Write-Host "Copied APK -> public/app-debug.apk ($mb MB)"
} else {
  Write-Host "APK not found. Run: cd android && .\gradlew.bat assembleDebug"
}

Write-Host "Done. Deploy dist/ (includes app-debug.apk after npm run build)."
