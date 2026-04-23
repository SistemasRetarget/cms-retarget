import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "editor") {
    return NextResponse.json({ error: "Requiere rol editor o admin" }, { status: 403 });
  }

  let body: { id?: string | number; reason?: string };
  try { body = await req.json(); } catch { body = {}; }
  if (!body.id) return NextResponse.json({ error: "Falta id del artículo" }, { status: 400 });

  const reason = (body.reason || "").trim().slice(0, 2000);

  try {
    const updated = await payload.update({
      collection: "articles",
      id: body.id,
      data: {
        status: "draft",
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason || "Devuelto sin motivo especificado"
      }
    });
    return NextResponse.json({ ok: true, article: { id: updated.id, title: updated.title } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
