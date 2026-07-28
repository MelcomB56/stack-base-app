import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { AppStatusBadge } from "@/components/apps/AppStatusBadge";
import { FavoriteButton } from "@/components/apps/FavoriteButton";
import { AppStatus } from "@/generated/prisma/client";
import {
  ExternalLink, GitBranch, Globe, Server, Database,
  Mail, User, Calendar, Edit, Tag, Layers, Cpu, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getApp(slug: string) {
  return db.app.findUnique({
    where: { slug, deletedAt: null },
    include: {
      createdBy: { select: { name: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      stacks: { include: { stack: true } },
      technologies: { include: { technology: true } },
      releases: {
        orderBy: { releasedAt: "desc" },
        take: 10,
        include: { createdBy: { select: { name: true } } },
      },
      changelogEntries: {
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
        take: 20,
        include: { release: { select: { version: true } } },
      },
    },
  });
}

const STATUS_ACCENT: Record<string, string> = {
  PRODUCTION: "#10B981", DEVELOPMENT: "#3B82F6", TESTING: "#F59E0B",
  MAINTENANCE: "#F97316", ARCHIVED: "#6B7280",
};

const CHANGELOG_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  ADDED:      { color: "#34D399", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", label: "Neu" },
  CHANGED:    { color: "#60A5FA", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", label: "Geändert" },
  FIXED:      { color: "#FBBF24", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "Behoben" },
  REMOVED:    { color: "#F87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  label: "Entfernt" },
  SECURITY:   { color: "#C084FC", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.25)", label: "Sicherheit" },
  DEPRECATED: { color: "#FB923C", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", label: "Veraltet" },
};

const RELEASE_TYPE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  MAJOR:      { color: "#F87171", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)"  },
  MINOR:      { color: "#60A5FA", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  PATCH:      { color: "#94A3B8", bg: "rgba(100,116,139,0.12)",border: "rgba(100,116,139,0.3)"},
  HOTFIX:     { color: "#FB923C", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  PRERELEASE: { color: "#C084FC", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)" },
};

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(d));
}

export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [app, session] = await Promise.all([getApp(slug), auth()]);
  if (!app) notFound();

  const userId = session?.user?.id;
  const isFavorited = userId
    ? !!(await db.userFavorite.findUnique({ where: { userId_appId: { userId, appId: app.id } } }))
    : false;

  const currentRelease = app.releases.find((r) => r.isCurrent);
  const accentColor = STATUS_ACCENT[app.status] ?? "#6B7280";

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7A8BA6" }}>
        <Link href="/apps" style={{ color: "#7A8BA6", textDecoration: "none" }}>Apps</Link>
        <ChevronRight size={11} />
        <span style={{ color: "#EDF2F7", fontWeight: 500 }}>{app.name}</span>
      </nav>

      {/* Hero */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 2, background: accentColor }} />
        <div style={{ padding: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {app.logoUrl ? (
              <img src={app.logoUrl} alt={app.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "contain", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 10, background: `${accentColor}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Globe size={24} style={{ color: accentColor }} />
              </div>
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>{app.name}</h1>
                <AppStatusBadge status={app.status as AppStatus} />
                {currentRelease && (
                  <span style={{ fontSize: 11, color: "#7A8BA6", fontFamily: "monospace", background: "#1A2640", padding: "1px 8px", borderRadius: 4 }}>
                    v{currentRelease.version}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>{app.shortDesc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <FavoriteButton appId={app.id} initialFavorited={isFavorited} />
                {app.urlProd && (
                  <a href={app.urlProd} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#2563E8", color: "#fff", borderRadius: 7, fontSize: 11, fontWeight: 500, textDecoration: "none" }}>
                    <ExternalLink size={10} /> Live öffnen
                  </a>
                )}
                {app.repoUrl && (
                  <a href={app.repoUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#1A2640", color: "#EDF2F7", borderRadius: 7, fontSize: 11, border: "1px solid #1E3050", textDecoration: "none" }}>
                    <GitBranch size={10} /> Repository
                  </a>
                )}
                {app.urlStaging && (
                  <a href={app.urlStaging} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#1A2640", color: "#7A8BA6", borderRadius: 7, fontSize: 11, border: "1px solid #1E3050", textDecoration: "none" }}>
                    <ExternalLink size={10} /> Staging
                  </a>
                )}
              </div>
            </div>
          </div>
          <Link href={`/apps/${app.slug}/edit`} style={{ textDecoration: "none", flexShrink: 0 }}>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#1A2640", color: "#EDF2F7", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid #1E3050", cursor: "pointer" }}>
              <Edit size={12} /> Bearbeiten
            </button>
          </Link>
        </div>
      </div>

      {/* Meta-Chips */}
      {(app.dockerImage || app.dbType || app.language || app.contactName || app.supportEmail) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            app.dockerImage && { icon: <Server size={11} />, text: app.dockerImage, mono: true },
            app.dbType      && { icon: <Database size={11} />, text: app.dbType },
            app.language    && { icon: <Cpu size={11} />, text: app.language },
            app.contactName && { icon: <User size={11} />, text: app.contactName },
          ].filter(Boolean).map((chip, i) => chip && (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#111C2D", border: "1px solid #1E3050", borderRadius: 7, fontSize: 11, color: "#EDF2F7" }}>
              <span style={{ color: "#7A8BA6" }}>{chip.icon}</span>
              <span style={chip.mono ? { fontFamily: "monospace" } : undefined}>{chip.text}</span>
            </div>
          ))}
          {app.supportEmail && (
            <a href={`mailto:${app.supportEmail}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#111C2D", border: "1px solid #1E3050", borderRadius: 7, fontSize: 11, color: "#EDF2F7", textDecoration: "none" }}>
              <Mail size={11} style={{ color: "#7A8BA6" }} /> {app.supportEmail}
            </a>
          )}
        </div>
      )}

      {/* Klassifizierungen */}
      {(app.categories.length > 0 || app.tags.length > 0 || app.stacks.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {app.categories.map(({ category }) => (
            <span key={category.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, border: `1px solid ${category.color}44`, color: category.color, background: `${category.color}18` }}>
              <Tag size={9} /> {category.name}
            </span>
          ))}
          {app.stacks.map(({ stack }) => (
            <span key={stack.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", background: "rgba(37,99,232,0.1)" }}>
              <Layers size={9} /> {stack.name}
            </span>
          ))}
          {app.tags.map(({ tag }) => (
            <span key={tag.id} style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, fontSize: 11, background: "#1A2640", color: "#7A8BA6", border: "1px solid #1E3050" }}>
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="releases">
            Releases
            {app.releases.length > 0 && (
              <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 99, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                {app.releases.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="changelog">
            Changelog
            {app.changelogEntries.length > 0 && (
              <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 99, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                {app.changelogEntries.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Übersicht */}
        <TabsContent value="overview">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {app.longDesc && (
              <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 13, color: "#C8D8EC", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{app.longDesc}</p>
              </div>
            )}
            {app.technologies.length > 0 && (
              <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", marginBottom: 10 }}>Technologien</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {app.technologies.map(({ technology }) => (
                    <div key={technology.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#1A2640", borderRadius: 6, fontSize: 11 }}>
                      {technology.logoUrl && <img src={technology.logoUrl} alt="" style={{ width: 13, height: 13, objectFit: "contain" }} />}
                      <span style={{ color: "#EDF2F7" }}>{technology.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Erstellt von", value: app.createdBy.name },
                { label: "Erstellt am", value: fmt(app.createdAt) },
                { label: "Zuletzt bearbeitet", value: fmt(app.updatedAt) },
                currentRelease ? { label: "Aktuelle Version", value: `v${currentRelease.version}`, mono: true } : null,
              ].filter(Boolean).map((item) => item && (
                <div key={item.label}>
                  <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>{item.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0, fontFamily: item.mono ? "monospace" : undefined }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Releases */}
        <TabsContent value="releases">
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {app.releases.length === 0 ? (
              <p style={{ fontSize: 13, color: "#7A8BA6", padding: "16px 0" }}>Noch keine Releases eingetragen.</p>
            ) : app.releases.map((release) => {
              const rt = RELEASE_TYPE_STYLE[release.releaseType];
              return (
                <div key={release.id} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#EDF2F7" }}>v{release.version}</span>
                      {rt && (
                        <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: rt.color, background: rt.bg, border: `1px solid ${rt.border}` }}>
                          {release.releaseType}
                        </span>
                      )}
                      {release.isCurrent && (
                        <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: "#2563E8", background: "rgba(37,99,232,0.12)", border: "1px solid rgba(37,99,232,0.3)" }}>
                          aktuell
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 11, color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <Calendar size={10} /> {fmt(release.releasedAt)}
                      </p>
                      <p style={{ fontSize: 10, color: "#7A8BA6", margin: "2px 0 0" }}>{release.createdBy.name}</p>
                    </div>
                  </div>
                  {release.description && (
                    <p style={{ fontSize: 12, color: "#7A8BA6", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(30,48,80,0.6)" }}>
                      {release.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Changelog */}
        <TabsContent value="changelog">
          <div style={{ marginTop: 12 }}>
            {app.changelogEntries.length === 0 ? (
              <p style={{ fontSize: 13, color: "#7A8BA6", padding: "16px 0" }}>Noch keine Changelog-Einträge vorhanden.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {app.changelogEntries.map((entry, i) => {
                  const cs = CHANGELOG_STYLE[entry.type] ?? CHANGELOG_STYLE.CHANGED;
                  return (
                    <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < app.changelogEntries.length - 1 ? "1px solid rgba(30,48,80,0.4)" : "none" }}>
                      <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: cs.color, background: cs.bg, border: `1px solid ${cs.border}` }}>
                        {cs.label}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "#C8D8EC", margin: 0 }}>{entry.description}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: "#7A8BA6" }}>{fmt(entry.entryDate)}</span>
                          {entry.release && (
                            <span style={{ fontSize: 10, color: "#2563E8", fontFamily: "monospace" }}>v{entry.release.version}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
