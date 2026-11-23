#Requires -RunAsAdministrator
# Bir kez çalıştırın: OpenSSH Authentication Agent açık kalsın (GitHub push).
$svc = Get-Service ssh-agent
if ($svc.StartType -eq 'Disabled') {
  Set-Service ssh-agent -StartupType Automatic
}
Start-Service ssh-agent
Write-Host "ssh-agent: $((Get-Service ssh-agent).Status) / $((Get-Service ssh-agent).StartType)" -ForegroundColor Green
Write-Host 'Sonraki adım (normal PowerShell): ssh-add $env:USERPROFILE\.ssh\id_ed25519_second'