import "server-only";
import { db } from "@/lib/db";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueAppSlug(name: string): Promise<string> {
  const base = slugify(name);
  const existing = await db.app.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  if (!existing.find((a: { slug: string }) => a.slug === base)) return base;
  let i = 2;
  while (existing.find((a: { slug: string }) => a.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
