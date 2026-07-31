import cron from "node-cron";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runHealthchecks } from "./healthcheck";
import { runCertChecks } from "./certcheck";
import { runResourceChecks } from "./resourcemonitor";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function writeHeartbeat(checksRun?: number) {
  try {
    await db.workerHeartbeat.upsert({
      where: { id: "singleton" },
      update: {
        lastPing: new Date(),
        ...(checksRun !== undefined ? { checksRun: { increment: checksRun } } : {}),
      },
      create: {
        id: "singleton",
        lastPing: new Date(),
        startedAt: new Date(),
        checksRun: 0,
        pid: process.pid,
      },
    });
  } catch {
    // Heartbeat-Fehler nicht fatal
  }
}

async function logJob(
  name: string,
  fn: () => Promise<number>
): Promise<number> {
  const job = await db.workerJob.create({
    data: { name, startedAt: new Date(), status: "running" },
  });
  try {
    const count = await fn();
    await db.workerJob.update({
      where: { id: job.id },
      data: { finishedAt: new Date(), status: "success", itemCount: count },
    });
    // Alte Logs (>30 Tage) pro Job bereinigen
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db.workerJob.deleteMany({ where: { name, startedAt: { lt: cutoff } } });
    return count;
  } catch (err) {
    await db.workerJob.update({
      where: { id: job.id },
      data: { finishedAt: new Date(), status: "error", error: String(err).slice(0, 500) },
    });
    throw err;
  }
}

async function main() {
  console.log(`[worker] Monitoring-Worker gestartet (PID ${process.pid})`);

  await db.workerHeartbeat.upsert({
    where: { id: "singleton" },
    update: { lastPing: new Date(), startedAt: new Date(), pid: process.pid, checksRun: 0 },
    create: { id: "singleton", lastPing: new Date(), startedAt: new Date(), pid: process.pid, checksRun: 0 },
  });

  setInterval(() => writeHeartbeat(), 30_000);

  // Healthchecks alle 5 Minuten
  cron.schedule("*/5 * * * *", async () => {
    try {
      const count = await logJob("healthcheck", () => runHealthchecks());
      await writeHeartbeat(count);
      console.log(`[worker] Healthcheck: ${count} Apps`);
    } catch (err) {
      console.error("[worker] Healthcheck Fehler:", err);
    }
  });

  // Zertifikat-Checks täglich um 03:00 Uhr
  cron.schedule("0 3 * * *", async () => {
    try {
      const count = await logJob("certcheck", () => runCertChecks(db));
      console.log(`[worker] Certcheck: ${count} Apps`);
    } catch (err) {
      console.error("[worker] Certcheck Fehler:", err);
    }
  });

  // Resource-Monitor alle 5 Minuten
  cron.schedule("*/5 * * * *", async () => {
    try {
      const count = await logJob("resourcemonitor", () => runResourceChecks(db));
      if (count > 0) console.log(`[worker] Resource-Monitor: ${count} Apps`);
    } catch (err) {
      console.error("[worker] Resource-Monitor Fehler:", err);
    }
  });

  // Initialer Durchlauf beim Start
  logJob("healthcheck", () => runHealthchecks())
    .then((n) => writeHeartbeat(n))
    .catch(console.error);

  logJob("certcheck", () => runCertChecks(db))
    .then((n) => console.log(`[worker] Init-Certcheck: ${n}`))
    .catch(console.error);

  logJob("resourcemonitor", () => runResourceChecks(db))
    .then((n) => { if (n > 0) console.log(`[worker] Init-Resource: ${n}`); })
    .catch(console.error);

  process.on("SIGTERM", async () => {
    console.log("[worker] SIGTERM empfangen — beende Worker");
    try {
      await db.workerHeartbeat.update({ where: { id: "singleton" }, data: { pid: null } });
    } catch { /* ignore */ }
    process.exit(0);
  });
}

main().catch(console.error);
