import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";

const OFFLINE_THRESHOLD_MS = 90_000; // 90s — Worker pingt alle 30s

export async function GET() {
  try {
    const session = await auth();
    if (!session) return apiError("Nicht authentifiziert", 401);

    const hb = await db.workerHeartbeat.findUnique({ where: { id: "singleton" } });

    if (!hb) {
      return Response.json({ status: "offline", lastPing: null, startedAt: null, checksRun: 0, pid: null });
    }

    const age = Date.now() - hb.lastPing.getTime();
    const status = age < OFFLINE_THRESHOLD_MS ? "online" : "offline";

    return Response.json({
      status,
      lastPing: hb.lastPing.toISOString(),
      startedAt: hb.startedAt.toISOString(),
      checksRun: hb.checksRun,
      pid: hb.pid,
      ageSeconds: Math.floor(age / 1000),
    });
  } catch (err) {
    return apiError(String(err), 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Nicht authentifiziert", 401);

    const { action } = await req.json() as { action: "start" | "stop" };

    if (action === "stop") {
      const hb = await db.workerHeartbeat.findUnique({ where: { id: "singleton" } });
      if (!hb?.pid) return apiError("Kein laufender Worker-Prozess gefunden", 400);

      try {
        process.kill(hb.pid, "SIGTERM");
        await db.workerHeartbeat.update({ where: { id: "singleton" }, data: { pid: null } });
        return Response.json({ ok: true, message: `Worker (PID ${hb.pid}) gestoppt` });
      } catch {
        // PID nicht mehr vorhanden — trotzdem aufräumen
        await db.workerHeartbeat.update({ where: { id: "singleton" }, data: { pid: null } });
        return Response.json({ ok: true, message: "Worker war bereits beendet" });
      }
    }

    if (action === "start") {
      // Prüfen ob schon einer läuft
      const hb = await db.workerHeartbeat.findUnique({ where: { id: "singleton" } });
      if (hb) {
        const age = Date.now() - hb.lastPing.getTime();
        if (age < OFFLINE_THRESHOLD_MS && hb.pid) {
          return apiError("Worker läuft bereits", 409);
        }
      }

      // Worker als Kindprozess starten (erbt DATABASE_URL etc. aus process.env)
      const workerPath = join(process.cwd(), "src", "worker", "index.ts");
      // Auf Windows sind .bin-Dateien .cmd-Skripte — shell:true löst das auf allen Plattformen
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
