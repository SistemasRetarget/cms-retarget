// Validación ligera sin dependencias (evita bundle grande de zod para esta demo)
// Se puede reemplazar por zod cuando se agregue Payload/API más compleja.

export type ContactInput = { nombre: string; email: string; mensaje: string; lang?: string; website?: string };

export function validateContact(input: Record<string, string>): { ok: true; data: ContactInput } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const nombre = (input.nombre || "").trim();
  const email = (input.email || "").trim();
  const mensaje = (input.mensaje || "").trim();
  const website = (input.website || "").trim(); // honeypot

  if (website.length > 0) errors.push("bot");
  if (nombre.length < 2 || nombre.length > 100) errors.push("nombre inválido");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push("email inválido");
  if (mensaje.length < 10 || mensaje.length > 2000) errors.push("mensaje debe tener entre 10 y 2000 caracteres");

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { nombre, email, mensaje, lang: input.lang, website } };
}
