import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const GTM_REGEX = /^GTM-[A-Z0-9]{4,}$/i;
const GA4_REGEX = /^G-[A-Z0-9]{8,}$/i;

async function checkGTM(id: string): Promise<{ ok: boolean; message: string }> {
  if (!GTM_REGEX.test(id)) {
    return { ok: false, message: `Formato inválido. Debe ser GTM-XXXXXXX (recibido: ${id})` };
  }
  try {
    const res = await fetch(`https://www.googletagmanager.com/gtm.js?id=${id}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      return { ok: true, message: `Container ${id} verificado correctamente ✓` };
    }
    if (res.status === 400) {
      return { ok: false, message: `Container ${id} no encontrado. Verifica que el ID sea correcto y el container esté publicado.` };
    }
    return { ok: false, message: `Respuesta inesperada del servidor de Google (${res.status})` };
  } catch {
    return { ok: false, message: "No se pudo conectar con Google Tag Manager. Verifica tu conexión." };
  }
}

async function checkGA4(id: string): Promise<{ ok: boolean; message: string }> {
  if (!GA4_REGEX.test(id)) {
    return { ok: false, message: `Formato inválido. Debe ser G-XXXXXXXXXX (recibido: ${id})` };
  }
  try {
    const res = await fetch(`https://www.googletagmanager.com/gtag/js?id=${id}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      return { ok: true, message: `Propiedad ${id} verificada correctamente ✓` };
    }
    return { ok: false, message: `No se pudo verificar la propiedad GA4 ${id} (status ${res.status})` };
  } catch {
    return { ok: false, message: "No se pudo conectar con los servidores de Google Analytics." };
  }
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user || (user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as { gtmId?: string; ga4Id?: string };
  const results: {
    gtm?: { ok: boolean; message: string };
    ga4?: { ok: boolean; message: string };
  } = {};

  const checks: Promise<void>[] = [];

  if (body.gtmId?.trim()) {
    checks.push(
      checkGTM(body.gtmId.trim()).then(r => { results.gtm = r; })
    );
  }

  if (body.ga4Id?.trim()) {
    checks.push(
      checkGA4(body.ga4Id.trim()).then(r => { results.ga4 = r; })
    );
  }

  if (checks.length === 0) {
    return NextResponse.json({ error: "Ingresa al menos un ID para verificar" }, { status: 400 });
  }

  await Promise.all(checks);

  return NextResponse.json(results);
}
