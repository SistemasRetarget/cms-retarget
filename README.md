# Pueblo La Dehesa — Rediseño Web

Rediseño de [puebloladehesa.cl](https://puebloladehesa.cl) con **Next.js 15** + **Payload CMS 3**.

## Stack

- **Frontend:** Next.js 15 (App Router, SSG/SSR)
- **CMS:** Payload 3 (headless, self-hosted)
- **Database:** PostgreSQL
- **Hosting:** Railway (o similar)
- **Styling:** Tailwind CSS
- **Images:** Next.js Image Optimization (AVIF/WebP)
- **Analytics:** GA4 + GTM con Consent Mode v2

## Objetivos

✅ **PageSpeed ≥90 móvil / ≥95 desktop**  
✅ **SEO nativo** (Schema.org, meta tags, sitemap)  
✅ **Panel CMS visual** en español  
✅ **Autoadministrable** sin depender del desarrollador  
✅ **Código en repositorio propio** (GitHub/GitLab)  

## Estructura del proyecto

```
.
├── app/                    # Next.js App Router
│   ├── components/         # Componentes React reutilizables
│   ├── lib/                # Utilidades y helpers
│   ├── api/                # API routes (Payload, webhooks)
│   ├── styles/             # CSS global y Tailwind
│   ├── (pages)/            # Rutas públicas
│   └── layout.tsx          # Layout principal
├── payload/                # Configuración de Payload CMS
│   ├── collections/        # Colecciones (Casa, Experiencia, Blog, etc)
│   ├── blocks/             # Bloques de contenido
│   └── config.ts           # Configuración principal
├── public/                 # Assets estáticos
│   ├── images/
│   └── fonts/
├── .env.example            # Variables de entorno (plantilla)
├── next.config.js          # Configuración de Next.js
├── Dockerfile              # Para Railway
├── railway.json            # Configuración de Railway
└── README.md               # Este archivo
```

## Instalación local

### Requisitos

- Node.js ≥18
- PostgreSQL 14+
- Git

### Pasos

1. **Clonar repositorio**
   ```bash
   git clone https://github.com/tuorganizacion/puebloladehesa-rediseno.git
   cd puebloladehesa-rediseno
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus valores
   ```

4. **Crear base de datos**
   ```bash
   createdb puebloladehesa
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - CMS: http://localhost:3000/admin

## Despliegue en Railway

### 1. Conectar repositorio

1. Ir a [railway.app](https://railway.app)
2. Crear nuevo proyecto
3. Conectar repositorio de GitHub

### 2. Configurar variables de entorno

En Railway → Project Settings → Variables:

```
DATABASE_URI=postgresql://...
PAYLOAD_SECRET=tu-secret-aqui
NEXT_PUBLIC_GA_ID=G-XXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXXX
NEXT_PUBLIC_WHATSAPP_NUMBER=56912345678
NODE_ENV=production
```

### 3. Agregar servicio PostgreSQL

1. Railway → Add Service → PostgreSQL
2. Las credenciales se inyectarán automáticamente como `DATABASE_URL`

### 4. Deploy

El deploy ocurre automáticamente al hacer push a `main`.

## Ramas Git

- **`main`** — Producción (Railway)
- **`develop`** — Staging (cambios en revisión)
- **`feature/*`** — Ramas de features (crear desde `develop`)

### Flujo de trabajo

```bash
# Crear rama de feature
git checkout -b feature/nombre-feature develop

# Hacer cambios, commit
git add .
git commit -m "feat: descripción del cambio"

# Push a GitHub
git push origin feature/nombre-feature

# Crear Pull Request en GitHub
# Revisar, mergear a develop
# Cuando esté listo para producción, mergear develop → main
```

## Colecciones del CMS

### Casa
- Nombre, slug, descripción corta/larga
- Precio base, capacidad
- Galería de imágenes
- Amenities (wifi, cocina, chimenea, etc)
- Disponibilidad (date range)
- SEO (meta, og_image, keywords)

### Experiencia
- Nombre, slug, descripción
- Imagen hero, duración, precio
- Capacidad máxima, horarios
- SEO

### Página
- Slug, título, contenido (richtext)
- Bloques de contenido
- SEO, publicada (boolean)

### Blog
- Título, slug, contenido
- Autor, fecha de publicación
- Imagen destacada
- SEO

### Configuración
- Nombre del sitio, email, teléfono WhatsApp
- Redes sociales
- IDs de Google Analytics y GTM

## Performance

### Optimizaciones implementadas

- ✅ **SSG (Static Site Generation)** para páginas de contenido
- ✅ **Imágenes en AVIF/WebP** con lazy loading
- ✅ **Blur placeholder** para evitar CLS
- ✅ **Fonts preloaded** (system fonts o Google Fonts optimizado)
- ✅ **Scripts de terceros diferidos** (GA4, GTM, Pixel)
- ✅ **Consent Mode v2** para cumplir GDPR
- ✅ **CDN global** (Vercel o Cloudflare)

### Métricas objetivo

| Métrica | Móvil | Desktop |
|---------|-------|---------|
| Lighthouse | ≥90 | ≥95 |
| LCP | <2.5s | <1.5s |
| INP | <200ms | <100ms |
| CLS | <0.1 | <0.05 |

## SEO

- **Sitemap automático** generado en build time
- **Robots.txt** configurado
- **Schema.org** para Casa, Experiencia, Organización
- **Meta tags dinámicos** por página
- **Open Graph + Twitter Cards**
- **Canonical URLs**
- **Hreflang** para multi-idioma (ES/EN)

## Monitoreo

- **Sentry** para error tracking (opcional)
- **Vercel Analytics** o **Google Analytics 4**
- **Lighthouse CI** en cada PR (opcional)

## Soporte

Para dudas o problemas:
1. Revisar [documentación de Next.js](https://nextjs.org/docs)
2. Revisar [documentación de Payload](https://payloadcms.com/docs)
3. Crear issue en el repositorio

---

**Última actualización:** Abril 2026  
**Responsable:** Luis Alberto Maldonado — Sistemas
