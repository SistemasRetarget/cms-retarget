# Deploy en Google Cloud Run

## Requisitos previos

1. **Google Cloud CLI** instalado y autenticado:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **APIs habilitadas:**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

3. **Cloud SQL PostgreSQL** o **Neon/Supabase** (URL externa):
   - Crear instancia
   - Obtener `DATABASE_URL`

## Paso 1: Crear secretos

```bash
# Database URL
echo -n "postgresql://user:pass@host:5432/news_db?sslmode=require" | \
  gcloud secrets create cms-news-database-url --data-file=-

# Payload Secret (genera uno único)
echo -n "$(openssl rand -base64 48)" | \
  gcloud secrets create cms-news-payload-secret --data-file=-

# Dar permisos al Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding cms-news-database-url \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding cms-news-payload-secret \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Paso 2: Build + Deploy manual

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Paso 3: Verificar

```bash
gcloud run services describe cms-news-ai --region=europe-west1 --format="value(status.url)"
```

Visitar la URL retornada → admin en `/admin`.

## Paso 4: Trigger automático (CI/CD)

```bash
gcloud builds triggers create github \
  --repo-name=cms-retarget \
  --repo-owner=SistemasRetarget \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name=cms-news-deploy-main
```

## Configuración runtime

Variables de entorno establecidas automáticamente:
- `NODE_ENV=production`
- `SITE_PROFILE=news-ai`
- `PORT=3000`

Secretos inyectados:
- `DATABASE_URL` ← `cms-news-database-url`
- `PAYLOAD_SECRET` ← `cms-news-payload-secret`

## Configuración Cloud Run

| Setting | Value |
|---------|-------|
| Memory | 1 GiB |
| CPU | 1 |
| Min instances | 0 (scale to zero) |
| Max instances | 3 |
| Timeout | 300s |
| Port | 3000 |
| Region | europe-west1 |

## Bootstrap admin (primera vez)

Después del primer deploy, crear usuario admin:

```bash
URL=$(gcloud run services describe cms-news-ai --region=europe-west1 --format="value(status.url)")

curl -X POST "${URL}/api/bootstrap-admin" \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: dev-news-secret-a7f3b9c1d5e2" \
  -d '{
    "email": "sistemas@retarget.cl",
    "password": "Retarget.CMS.2026!",
    "name": "Sistemas Retarget"
  }'
```

## Rollback

```bash
# Listar revisiones
gcloud run revisions list --service=cms-news-ai --region=europe-west1

# Rollback a revisión específica
gcloud run services update-traffic cms-news-ai \
  --to-revisions=REVISION_NAME=100 \
  --region=europe-west1
```

## Custom Domain

```bash
gcloud run domain-mappings create \
  --service=cms-news-ai \
  --domain=cms.retarget.cl \
  --region=europe-west1
```

## Logs y monitoreo

```bash
# Ver logs en tiempo real
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=cms-news-ai" \
  --format="value(textPayload)"

# Métricas en Cloud Console
# https://console.cloud.google.com/run/detail/europe-west1/cms-news-ai/metrics
```

## Costos estimados

Con configuración default (scale to zero):
- **Idle:** $0/mes
- **100 req/día:** ~$2-5/mes
- **10,000 req/día:** ~$15-30/mes
