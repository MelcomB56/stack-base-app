import cron from "node-cron";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runHealthchecks } from "./healthcheck";

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

async function main() {
  console.log(`[worker] Monitoring-Worker gestartet (PID ${process.pid})`);

  // Initialen Heartbeat mit startedAt + PID schreiben
  await db.workerHeartbeat.upsert({
    where: { id: "singleton" },
    update: { lastPing: new Date(), startedAt: new Date(), pid: process.pid, checksRun: 0 },
    create: { id: "singleton", lastPing: new Date(), startedAt: new Date(), pid: process.pid, checksRun: 0 },
  });

  // Heartbeat alle 30 Sekunden aktualisieren
  setInterval(() => writeHeartbeat(), 30_000);

  // Healthchecks alle 5 Minuten
  cron.schedule("*/5 * * * *", async () => {
    console.log(`[worker] Healthchecks starten — ${new Date().toISOString()}`);
    try {
      const count = await runHealthchecks();
      await writeHeartbeat(count);
      console.log(`[worker] ${count} Checks abgeschlossen`);
    } catch (err) {
      console.error("[worker] Fehler:", err);
    }
  });

  // Sofort einmal durchlaufen
  try {
    const count = await runHealthchecks();
    await writeHeartbeat(count);
  } catch (err) {
    console.error("[worker] Initialer Check fehlgeschlagen:", err);
  }

  // Sauber beenden wenn SIGTERM empfangen
  process.on("SIGTERM", async () => {
    console.log("[worker] SIGTERM empfangen — beende Worker");
    try {
      await db.workerHeartbeat.update({
        where: { id: "singleton" },
        data: { pid: null },
      });
    } catch { /* ignore */ }
    process.exit(0);
  });
}

main().catch(console.error);
