#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALUES="${ROOT}/scripts/values-ingress-nginx.yaml"

command -v helm >/dev/null 2>&1 || { echo "Install Helm 3: https://helm.sh/docs/intro/install/"; exit 1; }

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>/dev/null || true
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --values "${VALUES}" \
  --wait \
  --timeout 10m

echo ""
echo "IngressClass:"
kubectl get ingressclass

echo ""
echo "Service (wait for EXTERNAL-IP / hostname):"
kubectl get svc -n ingress-nginx ingress-nginx-controller

echo ""
echo "Then: kubectl get ingress -n vprofile"
