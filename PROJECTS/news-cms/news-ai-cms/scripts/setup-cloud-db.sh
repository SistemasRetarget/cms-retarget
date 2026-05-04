#!/bin/bash
# Setup completo de DB + secretos + redeploy + verificación
# Uso: bash scripts/setup-cloud-db.sh

set -e

PROJECT_ID="retarget-mcp"
REGION="europe-west1"
SERVICE_NAME="cms-retarget-news"
DB_INSTANCE="cms-news-db"
DB_NAME="news_db"
DB_USER="news_user"
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
PAYLOAD_SECRET="$(openssl rand -base64 48)"

echo "🔧 Setup CMS News — Google Cloud"
echo "=================================="
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# 1. Re-auth si es necesario
echo "1️⃣  Verificando auth..."
gcloud auth list --format="value(account)" || {
  echo "❌ Necesita re-auth. Ejecuta: gcloud auth login"
  exit 1
}
gcloud config set project "$PROJECT_ID"

# 2. Habilitar APIs
echo ""
echo "2️⃣  Habilitando APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com

# 3. Crear instancia Cloud SQL si no existe
echo ""
echo "3️⃣  Verificando Cloud SQL instance..."
if ! gcloud sql instances describe "$DB_INSTANCE" --quiet 2>/dev/null; then
  echo "Creando instancia $DB_INSTANCE (toma 5-10 min)..."
  gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --root-password="$DB_PASSWORD" \
    --no-backup
else
  echo "✓ Instancia $DB_INSTANCE ya existe"
fi

# 4. Crear DB y user si no existen
echo ""
echo "4️⃣  Configurando database y usuario..."
gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE" --quiet 2>/dev/null || echo "✓ DB ya existe"
gcloud sql users create "$DB_USER" --instance="$DB_INSTANCE" --password="$DB_PASSWORD" --quiet 2>/dev/null || echo "✓ Usuario ya existe"

# 5. Obtener connection name
INSTANCE_CONNECTION=$(gcloud sql instances describe "$DB_INSTANCE" --format="value(connectionName)")
echo "✓ Connection: $INSTANCE_CONNECTION"

# 6. Crear DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION}"
echo ""
echo "5️⃣  Creando secretos..."

# Database URL secret
echo -n "$DATABASE_URL" | gcloud secrets create cms-news-database-url --data-file=- --quiet 2>/dev/null || \
  echo -n "$DATABASE_URL" | gcloud secrets versions add cms-news-database-url --data-file=-

# Payload secret
echo -n "$PAYLOAD_SECRET" | gcloud secrets create cms-news-payload-secret --data-file=- --quiet 2>/dev/null || \
  echo -n "$PAYLOAD_SECRET" | gcloud secrets versions add cms-news-payload-secret --data-file=-

# Bootstrap secret
echo -n "dev-news-secret-a7f3b9c1d5e2" | gcloud secrets create cms-news-bootstrap-secret --data-file=- --quiet 2>/dev/null || true

# 7. Permisos al service account
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo ""
echo "6️⃣  Asignando permisos a $SA..."
for SECRET in cms-news-database-url cms-news-payload-secret cms-news-bootstrap-secret; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor" --quiet 2>/dev/null || true
done

# 8. Update Cloud Run service
echo ""
echo "7️⃣  Actualizando Cloud Run service..."
gcloud run services update "$SERVICE_NAME" \
  --region="$REGION" \
  --add-cloudsql-instances="$INSTANCE_CONNECTION" \
  --update-secrets="DATABASE_URL=cms-news-database-url:latest,PAYLOAD_SECRET=cms-news-payload-secret:latest,BOOTSTRAP_SECRET=cms-news-bootstrap-secret:latest" \
  --update-env-vars="PAYLOAD_FORCE_PUSH=true,NODE_ENV=production,SITE_PROFILE=news-ai,NEXT_PUBLIC_SITE_URL=https://cms-retarget-news-201530409487.europe-west1.run.app"

# 9. Esperar a que el servicio esté listo
echo ""
echo "8️⃣  Esperando que el servicio esté listo..."
sleep 20

# 10. Verificar
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")
echo ""
echo "9️⃣  Verificando..."
echo "URL: $SERVICE_URL"
curl -s "$SERVICE_URL/api/health" | head -5
echo ""
curl -s -o /dev/null -w "Articles API: %{http_code}\n" "$SERVICE_URL/api/articles"
curl -s -o /dev/null -w "Admin: %{http_code}\n" "$SERVICE_URL/admin"

echo ""
echo "✅ Setup completo"
echo ""
echo "Credenciales:"
echo "  DB user: $DB_USER"
echo "  DB pass: $DB_PASSWORD"
echo "  Payload secret: (en Secret Manager)"
echo ""
echo "Próximo paso — bootstrap admin user:"
echo "  curl -X POST $SERVICE_URL/api/bootstrap-admin \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'x-bootstrap-secret: dev-news-secret-a7f3b9c1d5e2' \\"
echo "    -d '{\"email\":\"sistemas@retarget.cl\",\"password\":\"Retarget.CMS.2026!\",\"name\":\"Sistemas Retarget\"}'"
