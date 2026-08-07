import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { HealthStatus } from "@/generated/prisma/client";

const CONSECUTIVE_FAILURES = 2;

async function checkUrl(
  configId: string,
  appId: string,
  url: string,
  timeoutSec: number,
  expectedStatus: number,
): Promise<{ status: HealthStatus; responseTime: number | null; statusCode: number | null; errorMsg: string | null }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timeoutId);

    const responseTime = Date.now() - start;
    const statusCode = res.status;
    let status: HealthStatus;
    let errorMsg: string | null = null;

    if (res.status === expectedStatus) {
      status = "UP";
    } else if (res.status >= 500) {
      status = "DOWN";
      errorMsg = `HTTP ${res.status}`;
    } else {
      status = "DEGRADED";
      errorMsg = `HTTP ${res.status} (erwartet ${expectedStatus})`;
    }
    return { status, responseTime, statusCode, errorMsg };
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    let errorMsg = "Unbekannter Fehler";
    if (err instanceof Error) {
      errorMsg = err.name === "AbortError" ? `Timeout nach ${timeoutSec}s` : err.message;
    }
    return { status: "DOWN", responseTime, statusCode: null, errorMsg };
  }
}

// POST — sofortiger Check für alle Configs einer App (oder ?id= für einzelne Config)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const err = await guard(session, "app_monitoring.update");
  if (err) return err;

  const { slug } = await params;
  const url = new URL(req.url);
  const configId = url.searchParams.get("id");

  const app = await db.app.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!app) return apiError("App nicht gefunden", 404);

  const where = configId
    ? { id: configId, appId: app.id, checkUrl: { not: null } }
    : { appId: app.id, checkUrl: { not: null } };

  const configs = await db.monitorConfig.findMany({ where });
  if (configs.length === 0) return apiError("Keine Configs mit Check-URL gefunden", 404);

  const results = await Promise.all(
    configs.map(async (cfg) => {
      const result = await checkUrl(
        cfg.id,
        app.id,
        cfg.checkUrl!,
        cfg.timeoutSec,
        cfg.expectedStatus,
      );

      const check = await db.healthCheck.create({
        data: {
          appId: app.id,
          configId: cfg.id,
          checkUrl: cfg.checkUrl!,
          ...result,
        },
      });

      // Auto-Incident-Logik
      if (result.status === "DOWN") {
        const recent = await db.healthCheck.findMany({
          where: { configId: cfg.id },
          orderBy: { checkedAt: "desc" },
          take: CONSECUTIVE_FAILURES,
        });
        const allDown =
          recent.length >= CONSECUTIVE_FAILURES &&
          recent.every((c) => c.status === "DOWN");

        if (allDown) {
          const existing = await db.incident.findFirst({
            where: { appId: app.id, status: { in: ["OPEN", "INVESTIGATING"] }, autoCreated: true },
          });
          if (!existing) {
            await db.incident.create({
              data: {
                appId: app.id,
                title: `${app.name} — ${cfg.label} nicht erreichbar`,
                description: `Automatisch erstellt nach ${CONSECUTIVE_FAILURES} DOWN-Checks.`,
                severity: "HIGH",
                status: "OPEN",
                autoCreated: true,
              },
            });
          }
        }
      } else if (result.status === "UP") {
        await db.incident.updateMany({
          where: { appId: app.id, status: { in: ["OPEN", "INVESTIGATING"] }, autoCreated: true },
          data: { status: "RESOLVED", resolvedAt: new Date() },
        });
      }

      return { configId: cfg.id, label: cfg.label, checkUrl: cfg.checkUrl, ...result };
    }),
  );

  return Response.json(results);
}
