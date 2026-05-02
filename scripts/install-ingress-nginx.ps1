#Requires -Version 5.1
<#
  Installs ingress-nginx on the current kubectl context (EKS) via Helm.
  Run from PowerShell (not cmd.exe):  .\scripts\install-ingress-nginx.ps1
  If blocked:  powershell -ExecutionPolicy Bypass -File .\scripts\install-ingress-nginx.ps1
#>
$ErrorActionPreference = "Stop"

Write-Host "Using kubectl context:" -ForegroundColor Cyan
kubectl config current-context

$Values = Join-Path $PSScriptRoot "values-ingress-nginx.yaml"
if (-not (Test-Path $Values)) {
  Write-Error "Missing values file: $Values"
}

if (-not (Get-Command helm -ErrorAction SilentlyContinue)) {
  Write-Error "Helm not in PATH. Close and reopen the terminal after winget install, or add Helm to PATH."
}

Write-Host "`nAdding Helm repo (ingress-nginx)..." -ForegroundColor Green
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>$null
helm repo update

# One process invocation — avoids cmd/bash line-continuation mistakes (`\` vs backtick).
Write-Host "`nhelm upgrade --install ... (may take a few minutes)" -ForegroundColor Green
$helmArgs = @(
  "upgrade", "--install",
  "ingress-nginx", "ingress-nginx/ingress-nginx",
  "--namespace", "ingress-nginx",
  "--create-namespace",
  "--values", $Values,
  "--wait",
  "--timeout", "10m"
)
& helm @helmArgs

Write-Host "`nIngressClass:" -ForegroundColor Green
kubectl get ingressclass

Write-Host "`nService (wait for EXTERNAL-IP / hostname):" -ForegroundColor Green
kubectl get svc -n ingress-nginx ingress-nginx-controller

Write-Host "`nThen: kubectl get ingress -n vprofile" -ForegroundColor Cyan
