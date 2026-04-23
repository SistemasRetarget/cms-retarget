#!/usr/bin/env node
/* Seed inicial: admin + categorías base + 2 fuentes RSS de ejemplo */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@news.local";
const PASS = process.env.SEED_ADMIN_PASSWORD || "Admin.1234!";

async function api(url, opts = {}, token) {
  const r = await fetch(`${BASE}${url}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(opts.headers || {})
    }
  });
  const txt = await r.text();
  let body; try { body = JSON.parse(txt); } catch { body = txt; }
  if (!r.ok) throw new Error(`${r.status} ${url}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  console.log("═══ SEED News AI CMS ═══");

  let token;
  try {
    const r = await api("/api/users/first-register", {
      method: "POST",
      body: JSON.stringify({ email: EMAIL, password: PASS, name: "Administrador", role: "admin" })
    });
    token = r.token;
    console.log(`  ✓ Admin: ${EMAIL} / ${PASS}`);
  } catch {
    const r = await api("/api/users/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASS }) });
    token = r.token;
    console.log(`  · Admin existente, login OK`);
  }

  const CATS = [
    { slug: "politica", name: "Política", color: "#c0392b", description: "Política nacional e internacional" },
    { slug: "economia", name: "Economía", color: "#8b7355", description: "Economía, mercados, empresas y finanzas" },
    { slug: "eventos", name: "Eventos", color: "#e67e22", description: "Agenda y cobertura de eventos" },
    { slug: "farandula", name: "Farándula", color: "#9b59b6", description: "Entretenimiento, celebridades y espectáculos" },
    { slug: "deportes", name: "Deportes", color: "#27ae60", description: "Fútbol, tenis y deportes en general" },
    { slug: "internacional", name: "Internacional", color: "#2c3e50", description: "Noticias del mundo" },
    { slug: "tecnologia", name: "Tecnología", color: "#4a7c3a", description: "IA, software, hardware y startups" },
    { slug: "cultura", name: "Cultura", color: "#d35400", description: "Arte, música, cine y literatura" }
  ];

  const createdCats = {};
  for (const c of CATS) {
    const existing = await api(`/api/categories?where[slug][equals]=${c.slug}&limit=1`, {}, token);
    if (existing.docs[0]) {
      createdCats[c.slug] = existing.docs[0].id;
      console.log(`  · Categoría existe: ${c.name}`);
    } else {
      const r = await api("/api/categories?locale=es", {
        method: "POST",
        body: JSON.stringify({ ...c, order: CATS.indexOf(c) })
      }, token);
      createdCats[c.slug] = r.doc.id;
      console.log(`  ✓ Categoría: ${c.name}`);
    }
  }

  const SOURCES = [
    { name: "Xataka", type: "rss", url: "https://www.xataka.com/index.xml", language: "es",
      categories: [createdCats.tecnologia], maxArticlesPerFetch: 3 },
    { name: "BBC Mundo", type: "rss", url: "https://feeds.bbci.co.uk/mundo/rss.xml", language: "es",
      categories: [createdCats.internacional], maxArticlesPerFetch: 3 }
  ];
  for (const s of SOURCES) {
    const existing = await api(`/api/sources?where[url][equals]=${encodeURIComponent(s.url)}&limit=1`, {}, token);
    if (existing.docs[0]) { console.log(`  · Fuente existe: ${s.name}`); continue; }
    await api("/api/sources", { method: "POST", body: JSON.stringify({ ...s, active: true }) }, token);
    console.log(`  ✓ Fuente: ${s.name}`);
  }

  console.log(`\n✅ SEED OK`);
  console.log(`   → ${BASE}/admin`);
  console.log(`   → ${EMAIL} / ${PASS}`);
  console.log(`   → Configura API keys en: ${BASE}/admin/globals/ai-settings`);
  console.log(`   → Luego presiona "⚡ Fetch ahora" en el dashboard\n`);
}
main().catch((e) => { console.error("✗", e.message); process.exit(1); });
