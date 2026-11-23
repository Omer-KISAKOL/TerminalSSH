# TerminalSSH: GitHub push öncesi SSH + senkron (PowerShell)
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent

Write-Host '=== SSH agent ===' -ForegroundColor Cyan
$svc = Get-Service ssh-agent
if ($svc.StartType -eq 'Disabled' -or $svc.Status -ne 'Running') {
  Write-Host 'ssh-agent çalışmıyor. Yönetici PowerShell ile bir kez:' -ForegroundColor Yellow
  Write-Host '  Set-ExecutionPolicy -Scope Process Bypass -Force'
  Write-Host '  & "$PSScriptRoot\enable-ssh-agent.ps1"'
  & (Join-Path $PSScriptRoot 'enable-ssh-agent.ps1') -ErrorAction SilentlyContinue
  $svc = Get-Service ssh-agent
  if ($svc.Status -ne 'Running') {
    exit 1
  }
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
$sshTest = ssh -o BatchMode=yes -T git@github.com 2>&1 | Out-String
if ($sshTest -notmatch 'successfully authenticated|Hi ') {
  Write-Host $sshTest -ForegroundColor Red
  Write-Host 'SSH başarısız: anahtar ekleyin (parola sorulabilir): ssh-add' -ForegroundColor Yellow
  exit 1
}
Write-Host $sshTest.Trim()

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