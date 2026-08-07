import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

const OFFLINE_THRESHOLD_MS = 90_000;

const JOB_LABELS: Record<string, string> = {
  healthcheck:     "Healthcheck",
  certcheck:       "Zertifikat-Check",
  resourcemonitor: "Resource-Monitor",
};

export async function GET() {
  try {
    const session = await auth();
    const err = await guard(session, "settings.read");
    if (err) return err;

    const hb = await db.workerHeartbeat.findUnique({ where: { id: "singleton" } });

    const age = hb ? Date.now() - hb.lastPing.getTime() : Infinity;
    const status = hb && age < OFFLINE_THRESHOLD_MS ? "online" : "offline";

    // Letzter Lauf pro Job
    const jobNames = Object.keys(JOB_LABELS);
    const latestJobs = await Promise.all(
      jobNames.map((name) =>
        db.workerJob.findFirst({
          where: { name },
          orderBy: { startedAt: "desc" },
          select: { name: true, startedAt: true, finishedAt: true, status: true, itemCount: true, error: true },
        })
      )
    );

    const jobs = jobNames.map((name, i) => {
      // latestJobs[i] enthält auch `name` — explizit excludieren um TS-Fehler zu vermeiden
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name: _n, ...rest } = latestJobs[i] ?? { startedAt: null, finishedAt: null, status: "never" as const, itemCount: null, error: null };
      return { name, label: JOB_LABELS[name], ...rest };
    });

    return Response.json({
      status,
      lastPing: hb?.lastPing.toISOString() ?? null,
      startedAt: hb?.startedAt.toISOString() ?? null,
      checksRun: hb?.checksRun ?? 0,
      pid: hb?.pid ?? null,
      ageSeconds: hb ? Math.floor(age / 1000) : null,
      jobs,
    });
  } catch (err) {
    return apiError(String(err), 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const errP = await guard(session, "settings.update");
    if (errP) return errP;

    const body = await req.json() as { action: "start" | "stop" | "trigger"; job?: string };
    const { action } = body;

    if (action === "trigger") {
      const jobName = body.job;
      if (!jobName || !JOB_LABELS[jobName]) return apiError("Unbekannter Job-Name", 400);

      // Job direkt aus dem API-Prozess heraus ausführen (gleiche Node.js-Umgebung)
      // Wir importieren dynamisch, damit der Build nicht scheitert wenn Worker nicht läuft
      try {
        const jobRecord = await db.workerJob.create({
          data: { name: jobName, startedAt: new Date(), status: "running" },
        });

        // Async ausführen — API gibt sofort zurück
        (async () => {
          try {
            let count = 0;
            if (jobName === "healthcheck") {
              const { runHealthchecks } = await import("@/worker/healthcheck");
              count = await runHealthchecks();
            } else if (jobName === "certcheck") {
              const { runCertChecks } = await import("@/worker/certcheck");
              count = await runCertChecks(db);
            } else if (jobName === "resourcemonitor") {
              const { runResourceChecks } = await import("@/worker/resourcemonitor");
              count = await runResourceChecks(db);
            }
            await db.workerJob.update({
              where: { id: jobRecord.id },
              data: { finishedAt: new Date(), status: "success", itemCount: count },
            });
          } catch (err) {
            await db.workerJob.update({
              where: { id: jobRecord.id },
              data: { finishedAt: new Date(), status: "error", error: String(err).slice(0, 500) },
            });
          }
        })();

        return Response.json({ ok: true, message: `${JOB_LABELS[jobName]} gestartet` });
      } catch (err) {
        return apiError(String(err), 500);
      }
    }

    if (action === "stop") {
      const hb = await db.workerHeartbeat.findUnique({ where: { id: "singleton" } });
      if (!hb?.pid) return apiError("Kein laufender Worker-Prozess gefunden", 400);
      try {
        process.kill(hb.pid, "SIGTERM");
        await db.workerHeartbeat.update({ where: { id: "singleton" }, data: { pid: null } });
        return Response.json({ ok: true, message: `Worker (PID ${hb.pid}) gestoppt` });
      } catch {
        await db.workerHeartbeat.update({ where: { id: "singleton" }, data: { pid: null } });
        return Response.json({ ok: true, message: "Worker war bereits beendet" });
      }
    }

    if (action === "start") {
      const hb = await db.workerHeartbeat.findUnique({ where: { id: "singleton" } });
      if (hb) {
        const age = Date.now() - hb.lastPing.getTime();
        if (age < OFFLINE_THRESHOLD_MS && hb.pid) return apiError("Worker läuft bereits", 409);
      }
      const workerPath = join(process.cwd(), "src", "worker", "index.ts");
      const child = spawn("npx", ["tsx", workerPath], {
        detached: true,
        stdio: "ignore",
        shell: true,
        env: { ...process.env },
      });
      child.unref();
      return Response.json({ ok: true, message: `Worker gestartet (PID ${child.pid})` });
    }

    return apiError("Ungültige Aktion", 400);
  } catch (err) {
    return apiError(String(err), 500);
  }
}
