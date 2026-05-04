# Instalación en hosting — Guía rápida

El proyecto está preparado para desplegar en **3 clics** en los hostings más populares. Elige uno:

---

## 🚀 Opción 1 · Railway (recomendado)

**Tiempo: ~5 minutos · Costo: $5/mes (hobby)**

Railway detecta el `Dockerfile` y la base de datos automáticamente.

### Pasos

1. Fork del repositorio en GitHub
2. Ir a [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo**
3. Seleccionar el repositorio
4. Railway creará el servicio web
5. Click **+ New** → **Database** → **PostgreSQL** (inyecta `DATABASE_URL` automáticamente)
6. En **Variables**, agregar:
   ```
   PAYLOAD_SECRET=<generar con: openssl rand -hex 32>
   NEXT_PUBLIC_GA_ID=G-XXXXXXXX
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXXX
   NEXT_PUBLIC_WHATSAPP_NUMBER=56912345678
   ```
7. Click **Deploy**. Listo.

✅ Deploys automáticos con cada push a `main`  
✅ SSL gratis  
✅ Backups automáticos de PostgreSQL  
✅ Logs y métricas incluidos

---

## 🚀 Opción 2 · Vercel + Neon (stack gratis hasta cierto tráfico)

**Tiempo: ~5 minutos · Costo: $0 hasta 100GB bandwidth**

### Pasos

1. Fork del repositorio en GitHub
2. Crear base de datos gratis en [neon.tech](https://neon.tech) → copiar `DATABASE_URL`
3. Ir a [vercel.com/new](https://vercel.com/new) → importar el repo
4. En **Environment Variables** pegar:
   ```
   DATABASE_URI=<pegar desde Neon>
   PAYLOAD_SECRET=<openssl rand -hex 32>
   NEXT_PUBLIC_GA_ID=...
   NEXT_PUBLIC_GTM_ID=...
   NEXT_PUBLIC_WHATSAPP_NUMBER=...
   ```
5. Click **Deploy**. Listo.

---

## 🚀 Opción 3 · VPS propio (DigitalOcean, Hetzner, Linode, etc)

**Tiempo: ~10 minutos · Costo: $5-10/mes**

Requiere SSH al servidor. Ya viene todo empaquetado con Docker Compose.

### Pasos

```bash
# 1. Conectar al servidor
ssh root@tu-servidor.com

# 2. Instalar Docker (si no está)
curl -fsSL https://get.docker.com | sh

# 3. Clonar repo
git clone https://github.com/tuorg/puebloladehesa-rediseno.git
cd puebloladehesa-rediseno

# 4. Configurar variables
cp .env.example .env
nano .env  # editar valores

# 5. Levantar todo (web + base de datos)
docker compose up -d

# 6. Verificar
docker compose ps
curl http://localhost:3000
```

Sitio disponible en `http://IP-DEL-SERVIDOR:3000`. Para dominio con HTTPS, poner Caddy o Nginx delante.

---

## 🚀 Opción 4 · Render.com

**Tiempo: ~5 minutos · Costo: $0 plan free / $7 para always-on**

1. Fork del repo
2. Ir a [render.com](https://render.com) → **New Blueprint**
3. Seleccionar repo (detecta `render.yaml`)
4. Render crea automáticamente: web service + PostgreSQL
5. Agregar `PAYLOAD_SECRET` manualmente en Environment
6. Deploy

---

## ⚙️ Setup inicial automatizado

Después del deploy (cualquier opción), ejecuta **una sola vez**:

```bash
# Desde local, apuntando a tu BD de producción:
DATABASE_URI="<url-produccion>" npm run setup
```

Esto ejecuta `scripts/setup.sh` que:
1. ✅ Crea tablas en PostgreSQL
2. ✅ Crea usuario admin (pregunta email/password)
3. ✅ Importa contenido desde `content-extracted/content.json`
4. ✅ Sube las 151 imágenes de `content-extracted/images/`
5. ✅ Optimiza imágenes a AVIF/WebP
6. ✅ Verifica que todo funcione

**Progreso paso a paso con barra visible durante todo el proceso.**

---

## 🔒 Variables de entorno mínimas

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URI` | ✅ | URL de PostgreSQL |
| `PAYLOAD_SECRET` | ✅ | Secret random de 32+ chars |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL pública (ej: `https://puebloladehesa.cl`) |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics |
| `NEXT_PUBLIC_GTM_ID` | ❌ | Google Tag Manager |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ❌ | WhatsApp para CTAs |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | ❌ | Envío de emails del CMS |

---

## 🆘 Troubleshooting

### "Application failed to start"
- Verificar que `DATABASE_URI` esté bien configurado
- Revisar logs: `docker compose logs web` o panel del hosting

### "Cannot connect to database"
- Verificar firewall (PostgreSQL puerto 5432 accesible)
- Verificar formato URL: `postgresql://user:pass@host:5432/db?sslmode=require`

### "Images not loading"
- Verificar `NEXT_PUBLIC_SITE_URL` correcto
- Verificar que el volumen de Docker persista (`docker volume ls`)

---

**Responsable:** Luis Alberto Maldonado — Sistemas
