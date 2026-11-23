# TerminalSSH: GitHub push öncesi SSH + senkron (PowerShell)
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent

Write-Host '=== SSH agent ===' -ForegroundColor Cyan
$svc = Get-Service ssh-agent
if ($svc.StartType -eq 'Disabled') {
  Write-Host 'ssh-agent kapalı. Yönetici PowerShell ile bir kez çalıştırın:'
  Write-Host '  Get-Service ssh-agent | Set-Service -StartupType Automatic'
  Write-Host '  Start-Service ssh-agent'
}

if ($svc.Status -ne 'Running') {
  Start-Service ssh-agent -ErrorAction SilentlyContinue
}

$key = Join-Path $env:USERPROFILE '.ssh\id_ed25519_second'
if (-not (Test-Path $key)) {
  $key = Join-Path $env:USERPROFILE '.ssh\id_ed25519'
}

if (Test-Path $key) {
  Write-Host "Anahtar ekleniyor: $key (parola sorulabilir)"
  ssh-add $key
} else {
  Write-Host 'SSH anahtar bulunamadı.' -ForegroundColor Yellow
}

Write-Host "`n=== GitHub bağlantı testi ===" -ForegroundColor Cyan
ssh -T git@github.com

Set-Location $RepoRoot
Write-Host "`n=== Uzak depo ile senkron ===" -ForegroundColor Cyan
git lfs install 2>$null | Out-Null
git fetch origin
$status = git status -sb
Write-Host $status

if ($status -match 'behind') {
  git pull --rebase origin main
  git lfs pull origin main
}

Write-Host "`n=== Push (LFS dahil) ===" -ForegroundColor Cyan
git push origin main
Write-Host 'Tamam.' -ForegroundColor Green