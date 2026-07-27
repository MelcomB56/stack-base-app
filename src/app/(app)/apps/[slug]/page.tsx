import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { AppStatusBadge } from "@/components/apps/AppStatusBadge";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

const CHANGELOG_COLORS: Record<string, string> = {
  ADDED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  CHANGED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  FIXED: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  REMOVED: "text-red-400 bg-red-500/10 border-red-500/20",
  SECURITY: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DEPRECATED: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const CHANGELOG_LABELS: Record<string, string> = {
  ADDED: "Neu",
  CHANGED: "Geändert",
  FIXED: "Behoben",
  REMOVED: "Entfernt",
  SECURITY: "Sicherheit",
  DEPRECATED: "Veraltet",
};

const RELEASE_TYPE_COLORS: Record<string, string> = {
  MAJOR: "bg-red-500/15 text-red-400 border-red-500/30",
  MINOR: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PATCH: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  HOTFIX: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  PRERELEASE: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(d));
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await getApp(slug);
  if (!app) notFound();

  const currentRelease = app.releases.find((r) => r.isCurrent);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {app.logoUrl ? (
            <img src={app.logoUrl} alt={app.name} className="w-12 h-12 rounded-xl object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Globe size={20} className="text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{app.name}</h1>
              <AppStatusBadge status={app.status as AppStatus} />
              {currentRelease && (
                <span className="text-xs text-muted-foreground font-mono">
                  v{currentRelease.version}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">{app.shortDesc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {app.urlProd && (
            <a href={app.urlProd} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink size={13} />
                Live
              </Button>
            </a>
          )}
          <Link href={`/apps/${app.slug}/edit`}>
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Edit size={13} />
              Bearbeiten
            </Button>
          </Link>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {app.repoUrl && (
          <a
            href={app.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border text-sm hover:border-primary/40 transition-colors"
          >
            <GitBranch size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate text-xs">{app.repoUrl.replace(/^https?:\/\//, "")}</span>
          </a>
        )}
        {app.dockerImage && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
            <Server size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate text-xs font-mono">{app.dockerImage}</span>
          </div>
        )}
        {app.dbType && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
            <Database size={14} className="text-muted-foreground shrink-0" />
            <span className="text-xs">{app.dbType}</span>
          </div>
        )}
        {app.language && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
            <Cpu size={14} className="text-muted-foreground shrink-0" />
            <span className="text-xs">{app.language}</span>
          </div>
        )}
        {app.contactName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
            <User size={14} className="text-muted-foreground shrink-0" />
            <span className="text-xs">{app.contactName}</span>
          </div>
        )}
        {app.supportEmail && (
          <a
            href={`mailto:${app.supportEmail}`}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <Mail size={14} className="text-muted-foreground shrink-0" />
            <span className="text-xs truncate">{app.supportEmail}</span>
          </a>
        )}
      </div>

      {/* Tags + Kategorien */}
      <div className="flex flex-wrap gap-2">
        {app.categories.map(({ category }) => (
          <span
            key={category.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
            style={{ color: category.color, borderColor: `${category.color}44`, backgroundColor: `${category.color}18` }}
          >
            <Tag size={10} />
            {category.name}
          </span>
        ))}
        {app.tags.map(({ tag }) => (
          <Badge key={tag.id} variant="secondary" className="text-xs">
            #{tag.name}
          </Badge>
        ))}
        {app.stacks.map(({ stack }) => (
          <span
            key={stack.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary"
          >
            <Layers size={10} />
            {stack.name}
          </span>
        ))}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="releases">
            Releases
            {app.releases.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                {app.releases.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="changelog">
            Changelog
            {app.changelogEntries.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                {app.changelogEntries.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {app.longDesc ? (
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {app.longDesc}
                </p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Keine Beschreibung vorhanden.</p>
          )}

          {app.technologies.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Technologien</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {app.technologies.map(({ technology }) => (
                  <div
                    key={technology.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs"
                  >
                    {technology.logoUrl && (
                      <img src={technology.logoUrl} alt="" className="w-3.5 h-3.5 object-contain" />
                    )}
                    {technology.name}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-card">
            <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Erstellt von</p>
                <p className="font-medium mt-0.5">{app.createdBy.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Erstellt am</p>
                <p className="font-medium mt-0.5">{formatDate(app.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Zuletzt aktualisiert</p>
                <p className="font-medium mt-0.5">{formatDate(app.updatedAt)}</p>
              </div>
              {app.urlStaging && (
                <div>
                  <p className="text-muted-foreground">Staging</p>
                  <a
                    href={app.urlStaging}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium mt-0.5 text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={10} />
                    {app.urlStaging.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Releases */}
        <TabsContent value="releases" className="mt-4">
          {app.releases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Releases</p>
          ) : (
            <div className="space-y-2">
              {app.releases.map((release) => (
                <Card key={release.id} className="border-border bg-card">
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm">v{release.version}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${RELEASE_TYPE_COLORS[release.releaseType]}`}
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
                        {formatDate(release.releasedAt)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {release.createdBy.name}
                      </p>
                    </div>
                  </CardContent>
                  {release.description && (
                    <div className="px-4 pb-3 border-t border-border/50 pt-2">
                      <p className="text-xs text-muted-foreground">{release.description}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Changelog */}
        <TabsContent value="changelog" className="mt-4">
          {app.changelogEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Changelog-Einträge</p>
          ) : (
            <div className="space-y-2">
              {app.changelogEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0"
                >
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${CHANGELOG_COLORS[entry.type]}`}
                  >
                    {CHANGELOG_LABELS[entry.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(entry.entryDate)}
                      </span>
                      {entry.release && (
                        <span className="text-[10px] text-primary font-mono">
                          v{entry.release.version}
                        </span>
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
