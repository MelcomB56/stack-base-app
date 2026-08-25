import { PrismaClient, HealthStatus } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const CONSECUTIVE_FAILURES_BEFORE_INCIDENT = 2;

export async function runHealthchecks(): Promise<number> {
  const configs = await db.monitorConfig.findMany({
    where: { enabled: true, checkUrl: { not: null } },
    include: { app: { select: { id: true, name: true, slug: true } } },
  });

  await Promise.allSettled(configs.map(checkEndpoint));
  return configs.length;
}

type ConfigWithApp = {
  id: string;
  appId: string;
  label: string;
  checkUrl: string | null;
  timeoutSec: number;
  expectedStatus: number;
  app: { id: string; name: string; slug: string };
};

async function checkEndpoint(config: ConfigWithApp) {
  const url = config.checkUrl!;
  const start = Date.now();
  let status: HealthStatus = "UNKNOWN";
  let statusCode: number | null = null;
  let errorMsg: string | null = null;
  let responseTime: number | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutSec * 1000);

    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timeoutId);

    responseTime = Date.now() - start;
    statusCode = res.status;

    if (res.status === config.expectedStatus) {
      status = "UP";
    } else if (res.status >= 500) {
      status = "DOWN";
      errorMsg = `HTTP ${res.status}`;
    } else {
      status = "DEGRADED";
      errorMsg = `HTTP ${res.status} (erwartet ${config.expectedStatus})`;
    }
  } catch (err: unknown) {
    responseTime = Date.now() - start;
    status = "DOWN";
    if (err instanceof Error) {
      errorMsg = err.name === "AbortError" ? `Timeout nach ${config.timeoutSec}s` : err.message;
    } else {
      errorMsg = "Unbekannter Fehler";
    }
  }

  await db.healthCheck.create({
    data: {
      appId: config.appId,
      configId: config.id,
      checkUrl: url,
      status,
      responseTime,
      statusCode,
      errorMsg,
    },
  });

  await handleIncidents(config.appId, config.app.name, config.label, status);
}

async function handleIncidents(
  appId: string,
  appName: string,
  endpointLabel: string,
  currentStatus: HealthStatus,
) {
  if (currentStatus === "DOWN") {
    const recent = await db.healthCheck.findMany({
      where: { appId },
      orderBy: { checkedAt: "desc" },
      take: CONSECUTIVE_FAILURES_BEFORE_INCIDENT,
    });

    const allDown =
      recent.length >= CONSECUTIVE_FAILURES_BEFORE_INCIDENT &&
      recent.every((c) => c.status === "DOWN");

    if (!allDown) return;

    const existing = await db.incident.findFirst({
      where: { appId, status: { in: ["OPEN", "INVESTIGATING"] }, autoCreated: true },
    });

    if (!existing) {
      await db.incident.create({
        data: {
          appId,
          title: `${appName} — ${endpointLabel} nicht erreichbar`,
          description: `Automatisch erstellt: ${CONSECUTIVE_FAILURES_BEFORE_INCIDENT} aufeinanderfolgende DOWN-Checks.`,
          severity: "HIGH",
          status: "OPEN",
          autoCreated: true,
        },
      });
    }
  } else if (currentStatus === "UP") {
    await db.incident.updateMany({
      where: { appId, status: { in: ["OPEN", "INVESTIGATING"] }, autoCreated: true },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }
}
