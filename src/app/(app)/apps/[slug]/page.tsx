import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { AppStatusBadge } from "@/components/apps/AppStatusBadge";
import { FavoriteButton } from "@/components/apps/FavoriteButton";
import { AppStatus } from "@/generated/prisma/client";
import {
  ExternalLink,
  GitBranch,
  Globe,
  Server,
  Database,
  Mail,
  User,
  Calendar,
  Edit,
  Tag,
  Layers,
  Cpu,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  PRODUCTION:  "#10B981",
  DEVELOPMENT: "#3B82F6",
  TESTING:     "#F59E0B",
  MAINTENANCE: "#F97316",
  ARCHIVED:    "#6B7280",
};

const CHANGELOG_COLORS: Record<string, string> = {
  ADDED:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  CHANGED:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
  FIXED:      "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  REMOVED:    "text-red-400 bg-red-500/10 border-red-500/20",
  SECURITY:   "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DEPRECATED: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const CHANGELOG_LABELS: Record<string, string> = {
  ADDED: "Neu", CHANGED: "Geändert", FIXED: "Behoben",
  REMOVED: "Entfernt", SECURITY: "Sicherheit", DEPRECATED: "Veraltet",
};

const RELEASE_TYPE_COLORS: Record<string, string> = {
  MAJOR:      "bg-red-500/15 text-red-400 border-red-500/30",
  MINOR:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PATCH:      "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  HOTFIX:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  PRERELEASE: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(d));
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [app, session] = await Promise.all([getApp(slug), auth()]);
  if (!app) notFound();

  const userId = session?.user?.id;
  const isFavorited = userId
    ? !!(await db.userFavorite.findUnique({
        where: { userId_appId: { userId, appId: app.id } },
      }))
    : false;

  const currentRelease = app.releases.find((r) => r.isCurrent);
  const accentColor = STATUS_ACCENT[app.status] ?? "#6B7280";

  return (
    <div className="p-6 space-y-5 max-w-5xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/apps" className="hover:text-foreground transition-colors">Apps</Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">{app.name}</span>
      </nav>

      {/* Hero-Karte */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-0.5 w-full" style={{ background: accentColor }} />
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {app.logoUrl ? (
              <img src={app.logoUrl} alt={app.name} className="w-14 h-14 rounded-xl object-contain shrink-0" />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}22` }}
              >
                <Globe size={26} style={{ color: accentColor }} />
              </div>
            )}

            <div>
              {/* Name + Status + Version */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">{app.name}</h1>
                <AppStatusBadge status={app.status as AppStatus} />
                {currentRelease && (
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    v{currentRelease.version}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-1">{app.shortDesc}</p>

              {/* Quick-Links */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <FavoriteButton appId={app.id} initialFavorited={isFavorited} />
                {app.urlProd && (
                  <a
                    href={app.urlProd}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink size={11} />
                    Live öffnen
                  </a>
                )}
                {app.repoUrl && (
                  <a
                    href={app.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-border bg-card hover:border-primary/40 transition-colors"
                  >
                    <GitBranch size={11} />
                    Repository
                  </a>
                )}
                {app.urlStaging && (
                  <a
                    href={app.urlStaging}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-border bg-card hover:border-primary/40 transition-colors text-muted-foreground"
                  >
                    <ExternalLink size={11} />
                    Staging
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bearbeiten-Button */}
          <Link href={`/apps/${app.slug}/edit`}>
            <Button size="sm" variant="secondary" className="gap-1.5 shrink-0">
              <Edit size={13} />
              Bearbeiten
            </Button>
          </Link>
        </div>
      </div>

      {/* Meta-Chips (Infra + Kontakt) */}
      {(app.dockerImage || app.dbType || app.language || app.contactName || app.supportEmail) && (
        <div className="flex flex-wrap gap-2">
          {app.dockerImage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
              <Server size={12} className="text-muted-foreground shrink-0" />
              <span className="font-mono">{app.dockerImage}</span>
            </div>
          )}
          {app.dbType && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
              <Database size={12} className="text-muted-foreground shrink-0" />
              {app.dbType}
            </div>
          )}
          {app.language && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
              <Cpu size={12} className="text-muted-foreground shrink-0" />
              {app.language}
            </div>
          )}
          {app.contactName && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
              <User size={12} className="text-muted-foreground shrink-0" />
              {app.contactName}
            </div>
          )}
          {app.supportEmail && (
            <a
              href={`mailto:${app.supportEmail}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs hover:border-primary/40 transition-colors"
            >
              <Mail size={12} className="text-muted-foreground shrink-0" />
              {app.supportEmail}
            </a>
          )}
        </div>
      )}

      {/* Klassifizierungs-Chips (Kategorien + Tags + Stacks) */}
      {(app.categories.length > 0 || app.tags.length > 0 || app.stacks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {app.categories.map(({ category }) => (
            <span
              key={category.id}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{ color: category.color, borderColor: `${category.color}44`, backgroundColor: `${category.color}18` }}
            >
              <Tag size={10} />
              {category.name}
            </span>
          ))}
          {app.stacks.map(({ stack }) => (
            <span
              key={stack.id}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary"
            >
              <Layers size={10} />
              {stack.name}
            </span>
          ))}
          {app.tags.map(({ tag }) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              #{tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="releases">
            Releases
            {app.releases.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground tabular-nums">
                {app.releases.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="changelog">
            Changelog
            {app.changelogEntries.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground tabular-nums">
                {app.changelogEntries.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Übersicht */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {app.longDesc && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {app.longDesc}
              </p>
            </div>
          )}

          {app.technologies.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Technologien</p>
              <div className="flex flex-wrap gap-2">
                {app.technologies.map(({ technology }) => (
                  <div key={technology.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs">
                    {technology.logoUrl && (
                      <img src={technology.logoUrl} alt="" className="w-3.5 h-3.5 object-contain" />
                    )}
                    {technology.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">Erstellt von</p>
              <p className="font-semibold">{app.createdBy.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Erstellt am</p>
              <p className="font-semibold">{fmt(app.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Zuletzt bearbeitet</p>
              <p className="font-semibold">{fmt(app.updatedAt)}</p>
            </div>
            {currentRelease && (
              <div>
                <p className="text-muted-foreground mb-1">Aktuelle Version</p>
                <p className="font-semibold font-mono">v{currentRelease.version}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Releases */}
        <TabsContent value="releases" className="mt-4">
          {app.releases.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Noch keine Releases eingetragen.</p>
          ) : (
            <div className="space-y-2">
              {app.releases.map((release) => (
                <div key={release.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm">v{release.version}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${RELEASE_TYPE_COLORS[release.releaseType] ?? ""}`}
                      >
                        {release.releaseType}
                      </span>
                      {release.isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/30">
                          aktuell
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Calendar size={10} />
                        {fmt(release.releasedAt)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{release.createdBy.name}</p>
                    </div>
                  </div>
                  {release.description && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                      {release.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Changelog */}
        <TabsContent value="changelog" className="mt-4">
          {app.changelogEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Noch keine Changelog-Einträge vorhanden.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {app.changelogEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${CHANGELOG_COLORS[entry.type] ?? ""}`}
                  >
                    {CHANGELOG_LABELS[entry.type] ?? entry.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{fmt(entry.entryDate)}</span>
                      {entry.release && (
                        <span className="text-[10px] text-primary font-mono">v{entry.release.version}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
