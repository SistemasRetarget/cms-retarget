import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";

/**
 * Emergency bootstrap endpoint — creates (or resets password of) an admin user
 * when the native `/api/users/first-register` is locked because some non-admin
 * account already exists, or when credentials have been lost.
 *
 * Security:
 *   - Requires header `x-bootstrap-secret` exactly equal to `PAYLOAD_SECRET`
 *     (the same secret Payload already uses to sign JWTs — shared with the
 *     deploy, not exposed to end users).
 *   - Refuses to run if `PAYLOAD_SECRET` is missing or the default dev value.
 *
 * Body: { email: string; password: string; name?: string }
 *
 * Returns: { status: "created" | "reset", email }
 *
 * Intended for one-off use — remove the route (or rotate `PAYLOAD_SECRET`)
 * once the admin is recovered.
 */

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret || secret === "dev-only-change-me") {
    return NextResponse.json(
      { error: "Bootstrap disabled: PAYLOAD_SECRET not set to a strong value" },
      { status: 503 }
    );
  }

  const provided = req.headers.get("x-bootstrap-secret");
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, name } = parsed.data;

  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existing.totalDocs > 0) {
    const user = existing.docs[0] as { id: string | number };
    await payload.update({
      collection: "users",
      id: user.id,
      // Payload hashes the plaintext `password` field automatically via the
      // auth strategy's beforeChange hook — we never touch `hash`/`salt`.
      data: { password, role: "admin", ...(name ? { name } : {}) } as never,
    });
    return NextResponse.json({ status: "reset", email });
  }

  await payload.create({
    collection: "users",
    data: {
      email,
      password,
      role: "admin",
      ...(name ? { name } : { name: "Administrador" }),
    } as never,
  });

  return NextResponse.json({ status: "created", email });
}
