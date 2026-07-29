import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    if (!session) return apiError("Nicht authentifiziert", 401);

    const { slug } = await params;

    const app = await db.app.findUnique({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        repoUrl: true,
        githubToken: true,
        releases: { select: { version: true } },
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
      // Repo-Info-Fehler nicht fatal — weiter mit Releases
    }

    // Schon vorhandene Versionen (mit und ohne "v"-Prefix)
    const existingVersions = new Set(
      app.releases.flatMap((r) => [r.version, `v${r.version}`, r.version.replace(/^v/, "")]),
    );

    let importedCount = 0;
    let skippedCount = 0;

    // ─── 2. Formelle GitHub-Releases ──────────────────────────────────────────
    const ghReleases = await githubFetch(
      `/repos/${owner}/${repo}/releases?per_page=100`,
      token,
    ) as GHRelease[];

    const releasesFromGitHub = new Set<string>(); // Versionen die über Releases kommen

    for (const gh of ghReleases) {
      if (gh.draft) continue; // Drafts überspringen

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
          createdById: session.user!.id!,
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
            createdById: session.user!.id!,
          },
        });
      }

      existingVersions.add(version);
      importedCount++;
    }

    // ─── 3. Fallback: Git-Tags (wenn keine formellen Releases oder zusätzliche Tags) ──
    const ghTags = await githubFetch(
      `/repos/${owner}/${repo}/tags?per_page=100`,
      token,
    ) as GHTag[];

    for (const tag of ghTags) {
      const version = tag.name.replace(/^v/, "");

      // Bereits via Releases importiert oder schon in DB
      if (releasesFromGitHub.has(version)) continue;
      if (existingVersions.has(version)) { skippedCount++; continue; }

      // Commit-Datum holen für releasedAt
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
          createdById: session.user!.id!,
        },
      });

      existingVersions.add(version);
      importedCount++;
    }

    // ─── 4. Neuesten Release als "current" markieren ──────────────────────────
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

    // ─── 5. Sync-Timestamp ────────────────────────────────────────────────────
    await db.app.update({
      where: { id: app.id },
      data: { githubSyncedAt: new Date() },
    });

    return Response.json({
      imported: importedCount,
      skipped: skippedCount,
      releasesFound: ghReleases.filter((r) => !r.draft).length,
      tagsFound: ghTags.length,
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
