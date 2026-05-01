# k8s---eks

ملفات **Kubernetes** (Kustomize) للتطبيق وقواعد البيانات والخدمات المساعدة.

- **الصور:** تُبنى من [`src---eks`](https://github.com/Ahmedhessn/src---eks)؛ الـ CI يحدّث الوسوم في `kustomization.yaml` تلقائياً عند وجود `K8S_REPO_PAT` في مستودع المصدر.  
- **الـ EKS:** يُنشأ من [`infra---eks`](https://github.com/Ahmedhessn/infra---eks).

## النشر

```bash
kubectl apply -k .
```

(من جذر هذا المستودع، بعد ضبط `kubectl` على الكلاستر.)
