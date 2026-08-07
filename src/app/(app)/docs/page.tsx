import { db } from "@/lib/db";
import { PlatformDocsPage } from "@/components/docs/PlatformDocsPage";
import { PLATFORM_DOCS } from "@/lib/platform-docs";
import { requirePermission } from "@/lib/page-guard";

export default async function DocsPage() {
  const session = await requirePermission("platform_docs.read");

  // Sync platform docs: create missing, update content of existing seeded docs
  const existing = await db.docPage.findMany({ where: { appId: null }, select: { id: true, title: true, content: true } });
  const existingMap = new Map(existing.map((d) => [d.title, d]));

  const missing = PLATFORM_DOCS.filter((d) => !existingMap.has(d.title));
  if (missing.length > 0) {
    await db.docPage.createMany({
      data: missing.map((d) => ({
        appId: null, title: d.title, slug: d.slug, content: d.content,
        type: "MANUAL" as const, isPublic: false, sortOrder: d.sortOrder,
        createdById: session.user!.id!,
      })),
    });
  }

  // Update content if changed in code (only for seeded docs, identified by matching title)
  const updates = PLATFORM_DOCS.filter((d) => {
    const row = existingMap.get(d.title);
    return row && row.content !== d.content;
  });
  await Promise.all(
    updates.map((d) =>
      db.docPage.update({ where: { id: existingMap.get(d.title)!.id }, data: { content: d.content } })
    )
  );

  const docs = await db.docPage.findMany({
    where: { appId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#EDF2F7", margin: 0, letterSpacing: "-0.02em" }}>Dokumentation</h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", margin: "4px 0 0" }}>Plattform-weite Anleitungen und Referenzdokumente</p>
      </div>
      <PlatformDocsPage initial={docs.map((d) => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() }))} />
    </div>
  );
}
