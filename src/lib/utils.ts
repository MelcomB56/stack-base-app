import { db } from "@/lib/db";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[äöüÄÖÜ]/g, (c) =>
      ({ ä: "ae", ö: "oe", ü: "ue", Ä: "ae", Ö: "oe", Ü: "ue" })[c] ?? c
    )
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uniqueAppSlug(base: string): Promise<string> {
  const slug = slugify(base);
  const existing = await db.app.findMany({
    where: { slug: { startsWith: slug }, deletedAt: null },
    select: { slug: true },
  });
  if (!existing.length) return slug;
  const suffixes = existing.map((a: { slug: string }) => {
    const match = a.slug.match(/-(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  });
  return `${slug}-${Math.max(...suffixes) + 1}`;
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
