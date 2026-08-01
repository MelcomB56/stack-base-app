import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PlatformDocsPage } from "@/components/docs/PlatformDocsPage";
import { AGENT_GUIDE } from "@/lib/agent-guide";

export default async function DocsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let docs = await db.docPage.findMany({
    where: { appId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { createdBy: { select: { name: true } } },
  });

  if (docs.length === 0) {
    const created = await db.docPage.create({
      data: {
        appId: null,
        title: "Stack-Base Agent einrichten",
        slug: "stackbase-agent-einrichten",
        content: AGENT_GUIDE,
        type: "MANUAL",
        isPublic: false,
        sortOrder: 0,
        createdById: session.user!.id!,
      },
      include: { createdBy: { select: { name: true } } },
    });
    docs = [created];
  }

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
