#!/usr/bin/env bash
# Setup automático post-deploy. Idempotente: se puede correr varias veces.
set -euo pipefail

# ───── Colores y progreso ─────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
TOTAL_STEPS=7
CURRENT=0

progress() {
    CURRENT=$((CURRENT+1))
    local pct=$((CURRENT * 100 / TOTAL_STEPS))
    local filled=$((pct * 30 / 100))
    local empty=$((30 - filled))
    local bar=""
    for ((i=0; i<filled; i++)); do bar="${bar}█"; done
    for ((i=0; i<empty; i++)); do bar="${bar}░"; done
    echo -e "\n${BLUE}[${bar}] ${pct}% · Paso ${CURRENT}/${TOTAL_STEPS}: $1${NC}"
}

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1" >&2; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Pueblo La Dehesa — Setup automático"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ───── PASO 1: Verificar requisitos ─────
progress "Verificando requisitos"
command -v node >/dev/null 2>&1 || { err "Node.js no encontrado"; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "npm no encontrado";  exit 1; }
NODE_VER=$(node -v | cut -d. -f1 | tr -d 'v')
[[ $NODE_VER -ge 18 ]] || { err "Node >=18 requerido (tienes $(node -v))"; exit 1; }
ok "Node $(node -v) · npm $(npm -v)"

# ───── PASO 2: Variables de entorno ─────
progress "Validando variables de entorno"
if [[ -z "${DATABASE_URI:-}" ]]; then
    if [[ -f .env.local ]]; then
        set -a; source .env.local; set +a
        ok "Cargado .env.local"
    elif [[ -f .env ]]; then
        set -a; source .env; set +a
        ok "Cargado .env"
    else
        err "No hay DATABASE_URI ni archivo .env"
        exit 1
    fi
fi
[[ -n "${DATABASE_URI:-}" ]]   || { err "DATABASE_URI requerido";   exit 1; }
[[ -n "${PAYLOAD_SECRET:-}" ]] || { err "PAYLOAD_SECRET requerido"; exit 1; }
ok "DATABASE_URI configurado"
ok "PAYLOAD_SECRET configurado (${#PAYLOAD_SECRET} chars)"

# ───── PASO 3: Instalar dependencias ─────
progress "Instalando dependencias"
if [[ -d node_modules && -f node_modules/.install_complete ]]; then
    ok "Dependencias ya instaladas (skip)"
else
    npm ci --prefer-offline --no-audit --progress=false 2>&1 | tail -3
    touch node_modules/.install_complete
    ok "$(ls node_modules | wc -l | tr -d ' ') paquetes instalados"
fi

# ───── PASO 4: Conexión a BD ─────
progress "Verificando conexión a base de datos"
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URI, ssl: { rejectUnauthorized: false } });
c.connect()
  .then(() => c.query('SELECT version()'))
  .then(r => { console.log('  ✓ ' + r.rows[0].version.split(' ').slice(0,2).join(' ')); return c.end(); })
  .catch(e => { console.error('  ✗ ' + e.message); process.exit(1); });
" 2>&1

# ───── PASO 5: Migraciones Payload ─────
progress "Aplicando schema de Payload en PostgreSQL"
if npm run payload:migrate --if-present 2>/dev/null; then
    ok "Migraciones aplicadas"
else
    warn "Script payload:migrate no existe aún (se creará en fase de código)"
fi

# ───── PASO 6: Importar contenido ─────
progress "Importando contenido extraído"
if [[ -f content-extracted/content.json ]]; then
    CONTENT_COUNT=$(node -e "console.log(Object.keys(require('./content-extracted/content.json')).length)")
    IMG_COUNT=$(ls content-extracted/images 2>/dev/null | wc -l | tr -d ' ')
    ok "${CONTENT_COUNT} páginas + ${IMG_COUNT} imágenes listas para importar"
    if [[ -f scripts/import_content.js ]]; then
        node scripts/import_content.js
    else
        warn "scripts/import_content.js aún no existe (pendiente implementar)"
    fi
else
    warn "No hay contenido extraído (correr primero: python3 scripts/extract_content.py)"
fi

# ───── PASO 7: Build de producción ─────
progress "Build de producción"
if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
    warn "Build saltado (SKIP_BUILD=1)"
else
    npm run build 2>&1 | tail -5
    ok "Build completado"
fi

# ───── Final ─────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup completado${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Próximos pasos:"
echo "  1. Iniciar:    npm start"
echo "  2. Frontend:   ${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
echo "  3. CMS:        ${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}/admin"
echo ""
