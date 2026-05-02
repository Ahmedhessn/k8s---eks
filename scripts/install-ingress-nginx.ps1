#Requires -Version 5.1
<#
  Installs ingress-nginx on the current kubectl context (EKS).
  Prereq: Helm 3 (https://helm.sh/docs/intro/install/)
#>
$ErrorActionPreference = "Stop"
$Values = Join-Path $PSScriptRoot "values-ingress-nginx.yaml"

if (-not (Get-Command helm -ErrorAction SilentlyContinue)) {
  Write-Error "Install Helm 3 first: https://helm.sh/docs/intro/install/"
}

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>$null
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx `
  --namespace ingress-nginx `
  --create-namespace `
  --values $Values `
  --wait `
  --timeout 10m

Write-Host "`nIngressClass:" -ForegroundColor Green
kubectl get ingressclass

Write-Host "`nService (wait for EXTERNAL-IP / hostname):" -ForegroundColor Green
kubectl get svc -n ingress-nginx ingress-nginx-controller

Write-Host "`nThen check: kubectl get ingress -n vprofile" -ForegroundColor Cyan
