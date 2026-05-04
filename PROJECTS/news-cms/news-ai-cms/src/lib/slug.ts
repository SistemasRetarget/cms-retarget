import { v7 as uuidv7 } from "uuid";

export function slugify(s: string, maxLength = 80): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
}

// UUID v7 is time-ordered and collision-resistant.
// We take the last 6 chars for readability while preserving uniqueness.
export function uniqueSuffix(): string {
  return uuidv7().replace(/-/g, "").slice(-6);
}

export function uniqueSlug(title: string, maxLength = 80): string {
  const base = slugify(title, maxLength - 7);
  return `${base}-${uniqueSuffix()}`;
}
