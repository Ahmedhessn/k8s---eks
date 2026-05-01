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

- **workflow_dispatch:** اختر **`unified`** للكلاستر الواحد (`<project>-eks`)، أو `dev` / `staging` للنموذج القديم (`<project>-<env>-eks`).
- **repository_dispatch** (`eks-infra-applied`): من `infra---eks` مع `environment: unified` عند استخدام الـ stack الموحّد.

**ملاحظة:** dev و staging و prod **على نفس الـ EKS** يتم عزلهم بـ **namespaces** (مثلاً `vprofile-dev`، `vprofile-staging`) وليس بكلاسترات منفصلة.

**Secret:** `AWS_EKS_DEPLOY_ROLE_ARN` — وصول لـ EKS API للكلاستر المناسب.
