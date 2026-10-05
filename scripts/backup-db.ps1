param(
    [string]$Container = "sticommande-postgres",
    [string]$Database = "sticommande_db",
    [string]$User = "sticommande_user",
    [string]$OutputDir = (Join-Path (Split-Path -Parent $PSScriptRoot) "backups")
)

$ErrorActionPreference = "Stop"

$running = docker ps --filter "name=$Container" --format "{{.Names}}"
if (-not $running) {
    throw "Container '$Container' is not running."
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDir "$Database-$stamp.dump"

$redirect = "docker exec $Container pg_dump -U $User -Fc -d $Database > `"$file`""
& cmd /c $redirect
if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $file -ErrorAction SilentlyContinue
    throw "pg_dump failed with exit code $LASTEXITCODE"
}

Write-Host "Backup created: $file"
