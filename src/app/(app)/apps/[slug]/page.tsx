import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { AppStatusBadge } from "@/components/apps/AppStatusBadge";
import { FavoriteButton } from "@/components/apps/FavoriteButton";
import { AppStatus } from "@/generated/prisma/client";
import { ExternalLink, GitBranch, Globe, Edit, ChevronRight, Activity, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReleasesTab } from "@/components/apps/ReleasesTab";
import { ChangelogTab } from "@/components/apps/ChangelogTab";
import { OverviewTab } from "@/components/apps/detail/OverviewTab";
import { IncidentsTab } from "@/components/apps/detail/IncidentsTab";
import { MonitorTab } from "@/components/apps/detail/MonitorTab";
import { DependenciesTab } from "@/components/apps/detail/DependenciesTab";

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
        include: {
          release: { select: { id: true, version: true } },
          createdBy: { select: { name: true } },
        },
      },
      monitorConfigs: {
        orderBy: { createdAt: "asc" as const },
        include: {
          healthChecks: {
            orderBy: { checkedAt: "desc" as const },
            take: 288,
          },
        },
      },
      incidents: {
        orderBy: { startedAt: "desc" },
        take: 20,
      },
      dependencies: {
        include: { dependsOnApp: { select: { id: true, name: true, slug: true, status: true } } },
      },
      dependents: {
        include: { app: { select: { id: true, name: true, slug: true, status: true } } },
      },
    },
  });
}

const STATUS_ACCENT: Record<string, string> = {
  PRODUCTION: "#10B981", DEVELOPMENT: "#3B82F6", TESTING: "#F59E0B",
  MAINTENANCE: "#F97316", ARCHIVED: "#6B7280",
};

const CRITICALITY_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#10B981",
};

export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [app, session] = await Promise.all([getApp(slug), auth()]);
  if (!app) notFound();

  const userId = session?.user?.id;

  const [isFavorited, healthData, allApps] = await Promise.all([
    userId
      ? db.userFavorite.findUnique({ where: { userId_appId: { userId, appId: app.id } } }).then(Boolean)
      : Promise.resolve(false),
    db.healthCheck.findMany({
      where: { appId: app.id },
      orderBy: { checkedAt: "desc" },
      take: 288,
    }),
    db.app.findMany({
      where: { deletedAt: null, NOT: { id: app.id } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const currentRelease = app.releases.find((r) => r.isCurrent);
  const accentColor = STATUS_ACCENT[app.status] ?? "#6B7280";
  const openIncidents = app.incidents.filter((i) => i.status !== "RESOLVED");

  // Letzter Healthcheck-Status
  const lastHealth = healthData[0];
  const healthColor = lastHealth
    ? { UP: "#10B981", DEGRADED: "#F59E0B", DOWN: "#EF4444", UNKNOWN: "#7A8BA6" }[lastHealth.status] ?? "#7A8BA6"
    : null;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 960 }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7A8BA6" }}>
        <Link href="/apps" style={{ color: "#7A8BA6", textDecoration: "none" }}>Apps</Link>
        <ChevronRight size={11} />
        <span style={{ color: "#EDF2F7", fontWeight: 500 }}>{app.name}</span>
      </nav>

      {/* Hero */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 2, background: accentColor }} />
        <div style={{ padding: "16px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Logo/Icon */}
            {app.logoUrl ? (
              <img src={app.logoUrl} alt={app.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 10, background: `${accentColor}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Globe size={22} style={{ color: accentColor }} />
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>{app.name}</h1>
                <AppStatusBadge status={app.status as AppStatus} />
                {currentRelease && (
                  <span style={{ fontSize: 11, color: "#7A8BA6", fontFamily: "monospace", background: "#1A2640", padding: "1px 8px", borderRadius: 4 }}>
                    v{currentRelease.version}
                  </span>
                )}
                {/* Health-Dot */}
                {healthColor && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: healthColor }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: healthColor, display: "inline-block" }} />
                    {lastHealth.status}
                  </span>
                )}
                {/* Kritikalität */}
                {app.criticality && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 99, background: `${CRITICALITY_COLORS[app.criticality]}18`, color: CRITICALITY_COLORS[app.criticality], border: `1px solid ${CRITICALITY_COLORS[app.criticality]}44` }}>
                    <Shield size={8} />
                    {app.criticality}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4, marginBottom: 0 }}>{app.shortDesc}</p>
            </div>
          </div>

          {/* Aktionen */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <FavoriteButton appId={app.id} initialFavorited={isFavorited} />
            {app.urlProd && (
              <a href={app.urlProd} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#2563E8", color: "#fff", borderRadius: 7, fontSize: 11, fontWeight: 500, textDecoration: "none" }}>
                <ExternalLink size={10} /> Öffnen
              </a>
            )}
            {app.repoUrl && (
              <a href={app.repoUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#1A2640", color: "#EDF2F7", borderRadius: 7, fontSize: 11, border: "1px solid #1E3050", textDecoration: "none" }}>
                <GitBranch size={10} />
              </a>
            )}
            <Link href={`/apps/${app.slug}/edit`} style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#1A2640", color: "#EDF2F7", borderRadius: 7, fontSize: 11, fontWeight: 500, border: "1px solid #1E3050", cursor: "pointer" }}>
                <Edit size={10} /> Bearbeiten
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="dependencies">
            Abhängigkeiten
            {(app.dependencies.length + app.dependents.length) > 0 && (
              <span style={{ marginLeft: 5, padding: "1px 6px", borderRadius: 99, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                {app.dependencies.length + app.dependents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="incidents">
            Incidents
            {openIncidents.length > 0 && (
              <span style={{ marginLeft: 5, padding: "1px 6px", borderRadius: 99, background: "rgba(239,68,68,0.2)", fontSize: 10, color: "#F87171", fontWeight: 700 }}>
                {openIncidents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="releases">
            Releases
            {app.releases.length > 0 && (
              <span style={{ marginLeft: 5, padding: "1px 6px", borderRadius: 99, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                {app.releases.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="changelog">
            Changelog
            {app.changelogEntries.length > 0 && (
              <span style={{ marginLeft: 5, padding: "1px 6px", borderRadius: 99, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                {app.changelogEntries.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity size={11} style={{ marginRight: 4 }} />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            app={{
              ...app,
              criticality: app.criticality ?? null,
              vendor: app.vendor ?? null,
            }}
            healthChecks={healthData.map((h) => ({ ...h, checkedAt: h.checkedAt.toISOString() }))}
            monitorConfigs={app.monitorConfigs}
          />
        </TabsContent>

        <TabsContent value="dependencies">
          <DependenciesTab
            appSlug={app.slug}
            initial={{
              outgoing: app.dependencies.map((d) => ({
                ...d,
                dependsOnApp: d.dependsOnApp,
              })),
              incoming: app.dependents,
            }}
            availableApps={allApps}
          />
        </TabsContent>

        <TabsContent value="incidents">
          <IncidentsTab
            appSlug={app.slug}
            initial={app.incidents.map((i) => ({
              ...i,
              startedAt: i.startedAt.toISOString(),
              resolvedAt: i.resolvedAt?.toISOString() ?? null,
            }))}
          />
        </TabsContent>

        <TabsContent value="releases">
          <ReleasesTab appSlug={app.slug} initial={app.releases} />
        </TabsContent>

        <TabsContent value="changelog">
          <ChangelogTab appSlug={app.slug} initial={app.changelogEntries} releases={app.releases} />
        </TabsContent>

        <TabsContent value="monitoring">
          <MonitorTab
            appSlug={app.slug}
            initial={app.monitorConfigs.map((cfg) => ({
              ...cfg,
              healthChecks: cfg.healthChecks.map((h) => ({
                ...h,
                checkedAt: h.checkedAt.toISOString(),
              })),
            }))}
            appUrls={[
              ...(app.urlProd ? [{ label: "Production", url: app.urlProd }] : []),
              ...(app.urlStaging ? [{ label: "Staging", url: app.urlStaging }] : []),
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
