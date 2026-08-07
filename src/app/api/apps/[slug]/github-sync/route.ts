import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

async function githubFetch(path: string, token: string | null): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        token
          ? "Repository nicht gefunden (404) — prüfe ob der Token Zugriff auf dieses Repo hat"
          : "Repository nicht gefunden oder privat — bitte GitHub-Token in den App-Einstellungen hinterlegen",
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("GitHub-Token ungültig oder abgelaufen — bitte Token in den App-Einstellungen aktualisieren");
    }
    throw new Error(`GitHub API ${res.status}`);
  }
  return res.json();
}

function releaseTypeFromVersion(version: string, prerelease: boolean) {
  const parts = version.split(".");
  if (prerelease) return "PRERELEASE" as const;
  if (parts.length >= 3 && parts[1] === "0" && parts[2] === "0" && parts[0] !== "0") return "MAJOR" as const;
  if (parts.length >= 3 && parts[2] === "0") return "MINOR" as const;
  return "PATCH" as const;
}

// ── README-Parser ─────────────────────────────────────────────────────────────
// Erkennt Versions-Einträge in einem README-Markdown-String.
//
// Unterstützte Formate:
//   ## [1.2.3] — 2024-01-15       (Keep a Changelog, Heading)
//   ### v1.2.3 (2024-01-15)       (Heading)
//   ## v1.2.3                     (Heading)
//   **v1.2.3** (2024-01-15)       (Fett-Marker, kein Heading)
//   **v1.2.3**:                   (Fett-Marker)
//   ### Version 1.2.3             (Heading mit "Version"-Wort)
//
// Gibt eine geordnete Liste von { version, date?, body } zurück.
type ReadmeVersion = {
  version: string;
  date: Date | null;
  body: string;
};

// Optionale Datumsgruppen: em-Dash-Format oder Klammer-Format
const DATE_SUFFIX = String.raw`(?:\s*[—–-]\s*(\d{4}-\d{2}-\d{2}))?(?:\s*\((\d{4}-\d{2}-\d{2})\))?`;

// Muster 1: Headings (#, ##, ###) — mit optionalem Präfix "v", "[", "Version"
const HEADING_RE = new RegExp(
  String.raw`^#{1,4}\s+(?:Version\s+|Release\s+)?(?:\[)?v?(\d+\.\d+(?:\.\d+)?(?:[-\w.+]+)?)(?:\])?` + DATE_SUFFIX,
  "gm",
);

// Muster 2: Fett-markierte Versionen am Zeilenanfang — **v1.2.3** oder **1.2.3**
const BOLD_RE = new RegExp(
  String.raw`^\*\*v?(\d+\.\d+(?:\.\d+)?(?:[-\w.+]+)?)\*\*` + DATE_SUFFIX,
  "gm",
);

// Muster 3: Tabellen-Zeilen — | **2.3.3** | 2026-07-13 | Beschreibung |
//                           oder | 2.3.3 | 2026-07-13 | Beschreibung |
const TABLE_ROW_RE = /^\|\s*\*{0,2}v?(\d+\.\d+(?:\.\d+)?(?:[-\w.+]+)?)\*{0,2}\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|\r\n]+)/gm;

function extractVersionMatches(
  content: string,
  re: RegExp,
): { version: string; date: Date | null; index: number; matchLen: number }[] {
  const hits = [];
  for (const m of content.matchAll(re)) {
    const version = m[1];
    if (!/^\d+\.\d+/.test(version)) continue;
    const rawDate = m[2] ?? m[3] ?? null;
    const date = rawDate ? new Date(rawDate) : null;
    hits.push({ version, date, index: m.index ?? 0, matchLen: m[0].length });
  }
  return hits;
}

function parseReadmeVersions(content: string): ReadmeVersion[] {
  const headingHits = extractVersionMatches(content, HEADING_RE);
  const boldHits = extractVersionMatches(content, BOLD_RE);

  // Tabellen-Zeilen direkt auswerten (kompaktes Format, Body = 3. Spalte)
  const tableVersions: ReadmeVersion[] = [];
  for (const m of content.matchAll(TABLE_ROW_RE)) {
    const version = m[1];
    if (!/^\d+\.\d+/.test(version)) continue;
    // Trennzeilen (|---|) überspringen
    if (/^-+$/.test(m[1])) continue;
    const date = new Date(m[2]);
    const body = m[3].trim();
    tableVersions.push({ version, date, body });
  }

  // Wenn Tabellen-Einträge gefunden → direkt zurückgeben (kein Heading-Muster nötig)
  if (tableVersions.length > 0) return tableVersions;

  // Sonst: Headings + Bold-Muster kombinieren
  const allHits = [...headingHits, ...boldHits]
    .sort((a, b) => a.index - b.index)
    .filter((h, i, arr) => i === 0 || h.index !== arr[i - 1].index);

  const versions: ReadmeVersion[] = [];
  for (let i = 0; i < allHits.length; i++) {
    const h = allHits[i];
    const bodyStart = h.index + h.matchLen;
    const bodyEnd = i + 1 < allHits.length ? allHits[i + 1].index : content.length;
    const body = content.slice(bodyStart, bodyEnd).trim();
    if (body.length >= 10 || h.date) {
      versions.push({ version: h.version, date: h.date, body });
    }
  }
  return versions;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    const err = await guard(session, "apps.update");
    if (err) return err;

    const { slug } = await params;

    const app = await db.app.findUnique({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        repoUrl: true,
        githubToken: true,
        releases: {
          select: {
            id: true,
            version: true,
            description: true,
            releasedAt: true,
            _count: { select: { changelogEntries: true } },
          },
        },
        tags: { include: { tag: true } },
      },
    });
    if (!app) return apiError("App nicht gefunden", 404);
    if (!app.repoUrl) return apiError("Kein Repository-URL eingetragen", 400);

    const parsed = parseGithubRepo(app.repoUrl);
    if (!parsed) return apiError("Keine gültige GitHub-URL (github.com/owner/repo)", 400);

    const { owner, repo } = parsed;
    const token = app.githubToken;

    // ─── 1. Repo-Info → Private-Tag (nicht-fatal) ──────────────────────────
    let isPrivate = false;
    try {
      const repoInfo = await githubFetch(`/repos/${owner}/${repo}`, token) as { private: boolean };
      isPrivate = repoInfo.private;

      const privTag = await db.tag.upsert({
        where: { slug: "privat" },
        update: {},
        create: { name: "Privat", slug: "privat", color: "#6B7280" },
      });

      if (isPrivate) {
        const alreadyTagged = app.tags.some((t) => t.tag.slug === "privat");
        if (!alreadyTagged) {
          await db.appTag.create({ data: { appId: app.id, tagId: privTag.id } });
        }
      } else {
        await db.appTag.deleteMany({ where: { appId: app.id, tagId: privTag.id } });
      }
    } catch {
      // Nicht fatal — weiter mit Releases/Tags
    }

    // Schon vorhandene Versionen (mit und ohne "v"-Prefix)
    const existingVersions = new Set(
      app.releases.flatMap((r) => [r.version, `v${r.version}`, r.version.replace(/^v/, "")]),
    );

    // Lookup-Map für Changelog-Backfill (version → Release-Datensatz)
    const releaseMap = new Map(app.releases.map((r) => [r.version, r]));

    let importedCount = 0;
    let skippedCount = 0;

    // ─── 2. Formelle GitHub-Releases ───────────────────────────────────────
    const ghReleases = await githubFetch(
      `/repos/${owner}/${repo}/releases?per_page=100`,
      token,
    ) as GHRelease[];

    const releasesFromGitHub = new Set<string>();

    for (const gh of ghReleases) {
      if (gh.draft) continue;

      const version = gh.tag_name.replace(/^v/, "");
      releasesFromGitHub.add(version);

      if (existingVersions.has(version)) { skippedCount++; continue; }

      const releasedAt = gh.published_at ? new Date(gh.published_at) : new Date();
      const releaseType = releaseTypeFromVersion(version, gh.prerelease);

      const release = await db.release.create({
        data: {
          appId: app.id,
          version,
          releaseType,
          description: gh.body ? gh.body.slice(0, 2000) : (gh.name || null),
          releasedAt,
          isCurrent: false,
          createdById: session!.user!.id!,
        },
      });

      if (gh.body && gh.body.trim()) {
        await db.changelogEntry.create({
          data: {
            appId: app.id,
            releaseId: release.id,
            type: gh.prerelease ? ("CHANGED" as const) : ("ADDED" as const),
            description: `**${gh.name || `v${version}`}**\n\n${gh.body}`.slice(0, 5000),
            entryDate: releasedAt,
            createdById: session!.user!.id!,
          },
        });
      }

      existingVersions.add(version);
      importedCount++;
    }

    // ─── 3. Fallback: Git-Tags ─────────────────────────────────────────────
    const ghTags = await githubFetch(
      `/repos/${owner}/${repo}/tags?per_page=100`,
      token,
    ) as GHTag[];

    for (const tag of ghTags) {
      const version = tag.name.replace(/^v/, "");

      if (releasesFromGitHub.has(version)) continue;
      if (existingVersions.has(version)) { skippedCount++; continue; }

      let releasedAt = new Date();
      try {
        const commit = await githubFetch(
          `/repos/${owner}/${repo}/commits/${tag.commit.sha}`,
          token,
        ) as { commit: { committer: { date: string } } };
        releasedAt = new Date(commit.commit.committer.date);
      } catch {
        // Datum nicht verfügbar — Jetzt-Datum verwenden
      }

      const releaseType = releaseTypeFromVersion(version, false);

      await db.release.create({
        data: {
          appId: app.id,
          version,
          releaseType,
          description: null,
          releasedAt,
          isCurrent: false,
          createdById: session!.user!.id!,
        },
      });

      existingVersions.add(version);
      importedCount++;
    }

    // ─── 4. README-Changelog ────────────────────────────────────────────────
    // Immer versuchen: neue Releases importieren + Changelog für vorhandene
    // Releases ohne Einträge nacherfassen (z. B. aus Git-Tags importierte).
    let readmeVersionsFound = 0;
    let readmeImported = 0;
    let changelogBackfilled = 0;

    try {
      const readmeData = await githubFetch(
        `/repos/${owner}/${repo}/readme`,
        token,
      ) as { content: string; encoding: string };

      if (readmeData.encoding === "base64") {
        const readmeText = Buffer.from(readmeData.content, "base64").toString("utf-8");
        const readmeVersions = parseReadmeVersions(readmeText);
        readmeVersionsFound = readmeVersions.length;

        for (const rv of readmeVersions) {
          const version = rv.version.replace(/^v/, "");
          const existing = releaseMap.get(version);

          if (!existing) {
            // Version noch nicht in DB → neuen Release anlegen
            if (existingVersions.has(version)) { skippedCount++; continue; }

            const releasedAt = rv.date ?? new Date();
            const isPrerelease = /[-](alpha|beta|rc|dev|pre)/i.test(version);
            const releaseType = releaseTypeFromVersion(version, isPrerelease);

            const release = await db.release.create({
              data: {
                appId: app.id,
                version,
                releaseType,
                description: rv.body ? rv.body.slice(0, 2000) : null,
                releasedAt,
                isCurrent: false,
                createdById: session!.user!.id!,
              },
            });

            if (rv.body && rv.body.trim()) {
              await db.changelogEntry.create({
                data: {
                  appId: app.id,
                  releaseId: release.id,
                  type: isPrerelease ? ("CHANGED" as const) : ("ADDED" as const),
                  description: rv.body.slice(0, 5000),
                  entryDate: releasedAt,
                  createdById: session!.user!.id!,
                },
              });
            }

            existingVersions.add(version);
            importedCount++;
            readmeImported++;
          } else if (existing._count.changelogEntries === 0 && rv.body && rv.body.trim()) {
            // Release vorhanden, aber kein Changelog-Eintrag → nacherfassen
            const isPrerelease = /[-](alpha|beta|rc|dev|pre)/i.test(version);

            await db.changelogEntry.create({
              data: {
                appId: app.id,
                releaseId: existing.id,
                type: isPrerelease ? ("CHANGED" as const) : ("ADDED" as const),
                description: rv.body.slice(0, 5000),
                entryDate: existing.releasedAt,
                createdById: session!.user!.id!,
              },
            });

            // Release-Beschreibung setzen wenn noch leer
            if (!existing.description) {
              await db.release.update({
                where: { id: existing.id },
                data: { description: rv.body.slice(0, 2000) },
              });
            }

            changelogBackfilled++;
          }
        }
      }
    } catch {
      // README nicht vorhanden oder nicht parsebar — kein Fehler
    }

    // ─── 5. Neuesten Release als "current" markieren ───────────────────────
    if (importedCount > 0) {
      const currentExists = await db.release.findFirst({
        where: { appId: app.id, isCurrent: true },
      });
      if (!currentExists) {
        const newest = await db.release.findFirst({
          where: { appId: app.id },
          orderBy: { releasedAt: "desc" },
        });
        if (newest) {
          await db.release.update({ where: { id: newest.id }, data: { isCurrent: true } });
        }
      }
    }

    // ─── 6. Sync-Timestamp ─────────────────────────────────────────────────
    await db.app.update({
      where: { id: app.id },
      data: { githubSyncedAt: new Date() },
    });

    return Response.json({
      imported: importedCount,
      skipped: skippedCount,
      releasesFound: ghReleases.filter((r) => !r.draft).length,
      tagsFound: ghTags.length,
      readmeVersionsFound,
      readmeImported,
      changelogBackfilled,
      isPrivate,
      repo: `${owner}/${repo}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[github-sync]", msg);
    return apiError(`Sync-Fehler: ${msg}`, 500);
  }
}

type GHRelease = {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
};

type GHTag = {
  name: string;
  commit: { sha: string };
};
