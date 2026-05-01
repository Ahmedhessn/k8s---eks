# k8s---eks

ملفات **Kubernetes** (Kustomize) للتطبيق وقواعد البيانات والخدمات المساعدة.

- **الصور:** تُبنى من [`src---eks`](https://github.com/Ahmedhessn/src---eks)؛ الـ CI يحدّث الوسوم في `kustomization.yaml` تلقائياً عند وجود `K8S_REPO_PAT` في مستودع المصدر.  
- **الـ EKS:** يُنشأ من [`infra---eks`](https://github.com/Ahmedhessn/infra---eks).

## النشر

```bash
kubectl apply -k .
```

(من جذر هذا المستودع، بعد ضبط `kubectl` على الكلاستر.)

## GitHub Actions — `deploy-eks.yml`

- **workflow_dispatch:** اختر `dev` أو `staging` + المنطقة + بادئة المشروع (نفس `var.project` في Terraform).
- **repository_dispatch** (`eks-infra-applied`): يُرسل من `infra---eks` بعد `terraform apply` عند تفعيل «notify k8s» (ليس لـ prod).

**Secret:** `AWS_EKS_DEPLOY_ROLE_ARN` (OIDC أو مستخدم CI) بصلاحيات وصول لـ EKS API لاسم الكلاستر  
`<project>-<env>-eks`.
