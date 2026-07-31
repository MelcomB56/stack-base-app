import http from "http";
import https from "https";
import type { PrismaClient } from "@/generated/prisma/client";

interface DockerStats {
  cpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
    online_cpus?: number;
  };
  precpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
    limit: number;
    stats?: { cache: number };
  };
  networks?: Record<string, { rx_bytes: number; tx_bytes: number }>;
}

function fetchDockerStats(dockerHost: string, containerName: string): Promise<DockerStats> {
  return new Promise((resolve, reject) => {
    const url = `${dockerHost}/containers/${encodeURIComponent(containerName)}/stats?stream=false`;
    const lib = url.startsWith("https") ? https : http;

    const req = lib.get(url, { timeout: 15_000 }, (res) => {
      if (res.statusCode === 404) {
        reject(new Error(`Container "${containerName}" not found`));
        return;
      }
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body) as DockerStats);
        } catch {
          reject(new Error("Invalid JSON from Docker API"));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Docker API timeout"));
    });
  });
}

function calcCpu(stats: DockerStats): number | null {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const sysDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  if (sysDelta <= 0 || cpuDelta < 0) return null;
  const numCpus = stats.cpu_stats.online_cpus ?? 1;
  return (cpuDelta / sysDelta) * numCpus * 100;
}

function calcMem(stats: DockerStats): { used: bigint; limit: bigint; pct: number } | null {
  const { usage, limit, stats: memStats } = stats.memory_stats;
  if (!usage || !limit || limit === 0) return null;
  const cache = memStats?.cache ?? 0;
  const used = BigInt(usage - cache);
  const lim = BigInt(limit);
  const pct = Number(used) / Number(lim) * 100;
  return { used, limit: lim, pct };
}

function calcNet(stats: DockerStats): { in: bigint; out: bigint } | null {
  if (!stats.networks) return null;
  let rx = 0;
  let tx = 0;
  for (const net of Object.values(stats.networks)) {
    rx += net.rx_bytes;
    tx += net.tx_bytes;
  }
  return { in: BigInt(rx), out: BigInt(tx) };
}

export async function checkResourceForApp(
  db: PrismaClient,
  appId: string,
  dockerHost: string,
  dockerContainer: string
): Promise<void> {
  const raw = await fetchDockerStats(dockerHost, dockerContainer);

  const cpu = calcCpu(raw);
  const mem = calcMem(raw);
  const net = calcNet(raw);

  await db.resourceReading.create({
    data: {
      appId,
      cpuPercent: cpu ?? undefined,
      memUsed: mem?.used ?? undefined,
      memLimit: mem?.limit ?? undefined,
      memPercent: mem?.pct ?? undefined,
      netIn: net?.in ?? undefined,
      netOut: net?.out ?? undefined,
    },
  });
}

export async function runResourceChecks(db: PrismaClient): Promise<number> {
  const apps = await db.app.findMany({
    where: {
      deletedAt: null,
      dockerHost: { not: null },
      dockerContainer: { not: null },
    },
    select: { id: true, name: true, dockerHost: true, dockerContainer: true },
  });

  if (apps.length === 0) return 0;

  const results = await Promise.allSettled(
    apps.map((app) =>
      checkResourceForApp(db, app.id, app.dockerHost!, app.dockerContainer!)
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    for (const f of failed) {
      if (f.status === "rejected") console.error("[resource-monitor]", f.reason);
    }
  }

  // Alte Readings (>7 Tage) löschen, um DB klein zu halten
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await db.resourceReading.deleteMany({ where: { readAt: { lt: cutoff } } });

  return results.filter((r) => r.status === "fulfilled").length;
}
