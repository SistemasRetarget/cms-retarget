# Security Status — cms-retarget

Auditoría de seguridad de dependencias. Última revisión: **2026-04-23**

---

## Vulnerabilidades conocidas

### 1. **dompurify** — 8 CVEs (XSS)
- **Severidad:** Moderate
- **Afectados:** `monaco-editor`
- **CVEs:** 
  - GHSA-h8r8-wccr-v5f2 (mutation-XSS)
  - GHSA-v2wj-7wpq-c8vv (XSS)
  - GHSA-cjmm-f4jc-qw8r (ADD_ATTR URI bypass)
  - GHSA-cj63-jhhr-wcxv (prototype pollution)
  - Y 4 más
- **Status:** `@payloadcms/ui` → `monaco-editor` → `dompurify`
- **Mitigation:** 
  - Editor Monaco es sandbox en admin panel, no procesa user input directo
  - Payload CMS actualiza `dompurify` en futuras releases (rastrear 3.84+)
- **Action:** Monitor próximas versiones de `@payloadcms/ui`

### 2. **esbuild** — 1 CVE (dev server exposure)
- **Severidad:** Moderate
- **Afectados:** `@esbuild-kit/core-utils` → `drizzle-kit`
- **CVE:** GHSA-67mh-4wv8-2f99
- **Status:** Development dependency chain (no impacta runtime)
- **Mitigation:** Nunca expongas el dev server a internet. Railway/prod usan build estático.
- **Action:** N/A (dev-only)

### 3. **next.js** — 4 CVEs (DoS + security issues)
- **Severidad:** High
- **CVEs:**
  - GHSA-9g9p-9gw9-jx7f (Image Optimizer DoS via remotePatterns)
  - GHSA-ggv3-7p47-pfv8 (HTTP request smuggling in rewrites)
  - GHSA-3x4c-7xq6-9pq8 (Image cache growth DOS)
  - GHSA-q4gf-8mx6-v5v3 (Server Components DoS)
- **Status:** Versión actual 15.4.11 (fix disponible en 15.5.15)
- **Mitigation:**
  - Image Optimizer: usamos solo imágenes de `/public`, no `remotePatterns` expuestas
  - Rewrites: configuración estándar sin regex complejos
  - Server Components: validación de props en Payload
- **Action:** Actualizar a 15.5.15 en próxima ventana (breaking change menor)

### 4. **uuid** — 1 CVE (buffer bounds check)
- **Severidad:** Moderate
- **CVE:** GHSA-w5hq-g745-h8pq
- **Afectados:** Todo Payload CMS y dependencias
- **Status:** uuid <14.0.0
- **Mitigation:** 
  - UUID se genera server-side, no desde user input directo
  - No contacta buffer externo sin validar
- **Action:** Esperar a Payload CMS que actualice uuid internamente

---

## Resumen de riesgo

| Categoría | Estado | Acción |
|-----------|--------|--------|
| **XSS (dompurify)** | Monitoreado | Actualizar cuando Payload CMS suelte fix |
| **Dev tools (esbuild)** | Sin riesgo prod | Ninguna |
| **Next.js core** | Bajo (mitigado) | Actualizar en próxima sprint |
| **UUID** | Bajo (server-side) | Esperar Payload update |

---

## Protocolo de respuesta ante CVE

1. **Severity Critical/High** → actualizar dentro de 7 días
2. **Severity Moderate** → planificar en próxima sprint
3. **Dev-only** → considerar en próxima actualización mayor

---

## Cómo auditar localmente

```bash
npm audit --production              # ver todas las vulns
bash scripts/pre-deploy.sh          # full pre-deploy check
npm outdated                         # ver qué está desactualizado
```

## Próxima revisión

- [ ] Revisar releases de `@payloadcms/ui` 3.84+ en 2026-05
- [ ] Probar actualización a Next.js 15.5.15
- [ ] Evaluar migración a PostgreSQL (mejor que SQLite para prod)
- [ ] Actualizar Node.js a 22.x si todas las deps lo soportan
