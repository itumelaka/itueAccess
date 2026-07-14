param(
  [string]$OutputDirectory = ".\backups"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
  throw "SUPABASE_DB_URL mesti ditetapkan sebelum backup dijalankan."
}

$supabaseCommand = Get-Command "supabase" -ErrorAction SilentlyContinue
if ($null -eq $supabaseCommand) {
  $localCli = Join-Path $PSScriptRoot "..\node_modules\.bin\supabase.CMD"
  if (-not (Test-Path -LiteralPath $localCli)) {
    throw "Supabase CLI tidak ditemui. Jalankan pnpm install dahulu."
  }
  $supabasePath = (Resolve-Path -LiteralPath $localCli).Path
} else {
  $supabasePath = $supabaseCommand.Source
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dumpPath = Join-Path $OutputDirectory "itu-eaccess-$timestamp.sql"

& $supabasePath db dump --db-url $env:SUPABASE_DB_URL --file $dumpPath --use-copy
if ($LASTEXITCODE -ne 0) {
  throw "Supabase database dump gagal dengan kod $LASTEXITCODE."
}

$dump = Get-Item -LiteralPath $dumpPath
if ($dump.Length -le 0) {
  throw "Fail backup kosong: $dumpPath"
}

$hash = Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256
$sidecarPath = "$dumpPath.sha256"
Set-Content -LiteralPath $sidecarPath -Value "$($hash.Hash.ToLowerInvariant())  $($dump.Name)" -Encoding utf8

[pscustomobject]@{
  Backup = $dump.FullName
  Sha256 = $hash.Hash.ToLowerInvariant()
  Sidecar = (Resolve-Path -LiteralPath $sidecarPath).Path
  Bytes = $dump.Length
}
