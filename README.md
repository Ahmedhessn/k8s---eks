# k8s---eks

ملفات **Kubernetes** (Kustomize) للتطبيق وقواعد البيانات والخدمات المساعدة.

- **الصور:** تُبنى من [`src---eks`](https://github.com/Ahmedhessn/src---eks)؛ الـ CI يحدّث **`overlays/dev/kustomization.yaml`** فقط (للصور التي بُنيت في ذلك الـ run). بعد الاختبار شغّل **`Promote images (dev → prod)`** في هذا المستودع لنسخ الوسوم إلى **`overlays/prod`**.  
- **تدفق مقترح:** push → build → نشر dev (`kustomize_overlay=dev`) → اختبار → **Promote** → نشر prod (`kustomize_overlay=prod`).  
- **الـ EKS:** يُنشأ من [`infra---eks`](https://github.com/Ahmedhessn/infra---eks).

## النشر

```bash
# افتراضيًا الجذر يوجّه إلى نفس موارد dev
kubectl apply -k .

# أو صراحةً:
kubectl apply -k overlays/dev
kubectl apply -k overlays/prod
```

(بعد ضبط `kubectl` على الكلاستر المطلوب.)

## Ingress NGINX (عشان الـ `Ingress` ياخد عنوان)

الـ manifest `base/ingress.yaml` يستخدم `ingressClassName: nginx` — لازم يكون فيه **Ingress Controller** على الكلاستر.

**بعد تثبيت Helm 3** وضبط `kubectl` على EKS:

```powershell
cd k8s---eks
.\scripts\install-ingress-nginx.ps1
```

أو على Linux/macOS:

```bash
chmod +x scripts/install-ingress-nginx.sh
./scripts/install-ingress-nginx.sh
```

ثم راقب حتى يظهر عنوان على `ingress-nginx-controller`:

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller -w
kubectl get ingress -n vprofile
```

لو تحتاج NLB داخلي فقط، غيّر في `scripts/values-ingress-nginx.yaml` القيمة إلى `internal` بدل `internet-facing`.

## GitHub Actions — `deploy-eks.yml`

- **workflow_dispatch:** اختر **`unified`** للكلاستر الواحد (`<project>-eks`)، أو `dev` / `staging` / **`prod`** (`<project>-<env>-eks`)، واختر **`kustomize_overlay`**: `dev` (افتراضي بعد الـ build) أو `prod` بعد الـ promote.
- **repository_dispatch** (`eks-infra-applied`): من `infra---eks` مع `kustomize_overlay: dev`.

**ملاحظة:** dev و staging و prod **على نفس الـ EKS** يتم عزلهم بـ **namespaces** (مثلاً `vprofile-dev`، `vprofile-staging`) وليس بكلاسترات منفصلة.

**Secret:** `AWS_EKS_DEPLOY_ROLE_ARN` — وصول لـ EKS API للكلاستر المناسب.
