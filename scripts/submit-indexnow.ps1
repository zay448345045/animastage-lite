# Submit sitemap URLs to IndexNow (Bing, Yandex, etc.).
# Prerequisite: deploy public/881aa01e5ee84d8e8c67fc91620b0285.txt to the live site first.
param(
  [string]$HostName = "animastage-lite.app",
  [string]$Key = "881aa01e5ee84d8e8c67fc91620b0285",
  [string[]]$Urls = @(
    "https://animastage-lite.app/",
    "https://animastage-lite.app/app"
  ),
  [switch]$SkipKeyCheck
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$keyFileName = "$Key.txt"
$keyPath = Join-Path $Root "public\$keyFileName"
$keyLocation = "https://$HostName/$keyFileName"

if (-not (Test-Path $keyPath)) {
  Write-Error "Key file missing: public\$keyFileName"
  exit 1
}

$localKey = (Get-Content $keyPath -Raw).Trim()
if ($localKey -ne $Key) {
  Write-Error "public\$keyFileName content does not match the configured key."
  exit 1
}

if (-not $SkipKeyCheck) {
  Write-Host "Checking key file on live site: $keyLocation"
  try {
    $liveKey = (Invoke-WebRequest -Uri $keyLocation -UseBasicParsing -TimeoutSec 20).Content.Trim()
    if ($liveKey -ne $Key) {
      Write-Error "Live key file mismatch. Deploy the site first, then rerun."
      exit 1
    }
    Write-Host "Live key file OK."
  } catch {
    Write-Error "Cannot fetch $keyLocation - deploy first or pass -SkipKeyCheck to submit anyway."
    exit 1
  }
}

$body = @{
  host        = $HostName
  key         = $Key
  keyLocation = $keyLocation
  urlList     = $Urls
} | ConvertTo-Json -Compress

Write-Host "Submitting $($Urls.Count) URL(s) to IndexNow..."
Write-Host ($Urls -join "`n")

$endpoints = @(
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow"
)

foreach ($endpoint in $endpoints) {
  try {
    $response = Invoke-WebRequest `
      -Uri $endpoint `
      -Method POST `
      -ContentType "application/json; charset=utf-8" `
      -Body $body `
      -UseBasicParsing `
      -TimeoutSec 30

    Write-Host "[$($response.StatusCode)] $endpoint"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status) {
      Write-Warning "[$status] $endpoint"
    } else {
      Write-Warning "$endpoint - $($_.Exception.Message)"
    }
  }
}

Write-Host "Done. Check Bing Webmaster Tools for crawl status."
