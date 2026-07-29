import cron from "node-cron";
import { runHealthchecks } from "./healthcheck";

console.log("[worker] Monitoring-Worker gestartet");

// Alle 5 Minuten alle aktivierten Healthchecks ausführen
cron.schedule("*/5 * * * *", async () => {
  console.log(`[worker] Healthchecks starten — ${new Date().toISOString()}`);
  try {
    await runHealthchecks();
    console.log("[worker] Healthchecks abgeschlossen");
  } catch (err) {
    console.error("[worker] Fehler:", err);
  }
});

// Sofort beim Start einmal durchlaufen
runHealthchecks().catch(console.error);
