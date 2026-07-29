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

async function githubFetch(path: string, token: string | null) {
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

  // ─── 1. Repo-Info → Private-Tag ───────────────────────────────────────────
  const repoInfo = await githubFetch(`/repos/${owner}/${repo}`, token).catch((e) => {
    throw new Error(`Repo-Info: ${e.message}`);
  });

  const isPrivate: boolean = repoInfo.private;
  const existingPrivateTag = await db.tag.findFirst({ where: { name: "Privat" } });

  if (isPrivate) {
    const privTag = existingPrivateTag ?? await db.tag.create({
      data: { name: "Privat", slug: "privat", color: "#6B7280" },
    });
    const alreadyTagged = app.tags.some((t) => t.tag.name === "Privat");
    if (!alreadyTagged) {
      await db.appTag.create({ data: { appId: app.id, tagId: privTag.id } });
    }
  } else if (existingPrivateTag) {
    await db.appTag.deleteMany({
      where: { appId: app.id, tagId: existingPrivateTag.id },
    });
  }

  // ─── 2. Releases holen ────────────────────────────────────────────────────
  const ghReleases: GHRelease[] = await githubFetch(
    `/repos/${owner}/${repo}/releases?per_page=50`,
    token,
  ).catch((e) => { throw new Error(`Releases: ${e.message}`); });

  const existingVersions = new Set(app.releases.map((r) => r.version));
  let importedCount = 0;

  for (const gh of ghReleases) {
    const version = gh.tag_name.replace(/^v/, "");
    if (existingVersions.has(version)) continue;

    const releasedAt = gh.published_at ? new Date(gh.published_at) : new Date();

    // Release-Typ aus Tag ableiten (v1.0.0 = MAJOR, v1.1.0 = MINOR, v1.1.1 = PATCH)
    const parts = version.split(".");
    const releaseType =
      parts[0] !== "0" && parts[1] === "0" && parts[2] === "0" ? "MAJOR" as const
      : parts[2] === "0" ? "MINOR" as const
      : gh.prerelease ? "PRERELEASE" as const
      : "PATCH" as const;

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

    // ChangelogEintrag aus Release-Body erzeugen
    if (gh.body && gh.body.trim()) {
      await db.changelogEntry.create({
        data: {
          appId: app.id,
          releaseId: release.id,
          type: "ADDED" as const,
          description: `**${gh.name || `Release v${version}`}**\n\n${gh.body}`.slice(0, 5000),
          entryDate: releasedAt,
          createdById: session.user!.id!,
        },
      });
    }

    importedCount++;
  }

  // Neuesten Release als "current" markieren (wenn noch keiner gesetzt)
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

  // ─── 3. Sync-Timestamp aktualisieren ──────────────────────────────────────
  await db.app.update({
    where: { id: app.id },
    data: { githubSyncedAt: new Date() },
  });

  return Response.json({
    imported: importedCount,
    total: ghReleases.length,
    isPrivate,
    privateTagSet: isPrivate,
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
