import "server-only";

export interface HealthScoreCriteria {
  key: string;
  label: string;
  weight: number;    // 0–1
  passed: boolean;
  points: number;    // tatsächlich erzielte Punkte (0 oder weight*100)
  hint?: string;
  alwaysShowHint?: boolean;
}

export interface HealthScoreResult {
  total: number;               // 0–100
  grade: "A" | "B" | "C" | "D";
  color: string;
  criteria: HealthScoreCriteria[];
}

interface AppForScore {
  wikiSections:       { id: string }[];
  docPages:           { type: string; content?: string | null }[];
  testCoveragePercent:  number | null;
  changelogEntries:   { createdAt: Date }[];
  lastDeploymentSuccess: boolean | null;
  monitorConfigs:     { checkUrl?: string | null }[];
  healthChecks:       { status: string; checkedAt: Date }[];
  securityRating:     number | null;
  status:             string;
  incidents:          { status: string; severity: string }[];
}

export function calculateHealthScore(app: AppForScore): HealthScoreResult {
  const now = Date.now();
  const days90 = 90 * 24 * 60 * 60 * 1000;

  // 1. Dokumentation vorhanden (10%) — mind. 3 Doc-Pages oder Wiki-Seiten
  const docsOk = (app.docPages.length + app.wikiSections.length) >= 3;

  // 2. API dokumentiert (10%) — DocPage mit type "api" oder Wiki-Seite mit "api" im Titel
  const apiOk = app.docPages.some((p) => p.type?.toLowerCase() === "api" || (p.content ?? "").length > 100);

  // 3. Tests vorhanden (15%) — testCoveragePercent gesetzt und > 0
  const testsOk = app.testCoveragePercent !== null && app.testCoveragePercent > 0;

  // 4. Changelog aktuell (10%) — letzter Eintrag < 90 Tage
  const lastChangelog = app.changelogEntries[0]?.createdAt;
  const changelogOk = lastChangelog ? now - new Date(lastChangelog).getTime() < days90 : false;

  // 5. Letztes Deployment erfolgreich (10%)
  const deployOk = app.lastDeploymentSuccess === true;

  // 6. Monitoring aktiv (10%) — Healthcheck-URL konfiguriert + Uptime > 95 % der letzten 20 Checks
  const hasMonitor = app.monitorConfigs.some((m) => m.checkUrl);
  let uptimeOk = false;
  if (hasMonitor && app.healthChecks.length >= 5) {
    const recent = app.healthChecks.slice(0, 20);
    const up = recent.filter((h) => h.status === "UP").length;
    uptimeOk = up / recent.length >= 0.95;
  }
  const monitoringOk = hasMonitor && uptimeOk;

  // 7. Sicherheitsbewertung (20%) — proportional: securityRating/100 * 20 Punkte
  const securityRatingVal = app.securityRating ?? 0;
  const securityPoints    = app.securityRating !== null ? Math.round((securityRatingVal / 100) * 20) : 0;
  const securityOk        = app.securityRating !== null && securityRatingVal >= 70;

  // 8. Wartungsstatus aktuell (15%) — nicht archiviert + kein offener kritischer Incident
  const notArchived = app.status !== "ARCHIVED";
  const noCritical = !app.incidents.some((i) => i.status !== "RESOLVED" && i.severity === "CRITICAL");
  const maintenanceOk = notArchived && noCritical;

  const criteria: HealthScoreCriteria[] = [
    { key: "docs",       label: "Dokumentation vorhanden", weight: 0.10, passed: docsOk,       points: docsOk       ? 10 : 0, hint: "Mind. 3 Dokumentationsseiten oder Wiki-Seiten anlegen" },
    { key: "api",        label: "API dokumentiert",         weight: 0.10, passed: apiOk,        points: apiOk        ? 10 : 0, hint: "API-Dokumentationsseite anlegen" },
    { key: "tests",      label: "Tests vorhanden",          weight: 0.15, passed: testsOk,      points: testsOk      ? 15 : 0, hint: "Testabdeckung in den App-Details eintragen" },
    { key: "changelog",  label: "Changelog aktuell",        weight: 0.10, passed: changelogOk,  points: changelogOk  ? 10 : 0, hint: "Letzter Eintrag ist älter als 90 Tage" },
    { key: "deploy",     label: "Letztes Deployment OK",    weight: 0.10, passed: deployOk,     points: deployOk     ? 10 : 0, hint: "Deployment-Status in den App-Details setzen" },
    { key: "monitoring", label: "Monitoring aktiv (≥95 %)", weight: 0.10, passed: monitoringOk, points: monitoringOk ? 10 : 0, hint: "Healthcheck-URL konfigurieren und Uptime verbessern" },
    { key: "security",   label: "Sicherheitsbewertung",     weight: 0.20, passed: securityOk,   points: securityPoints, alwaysShowHint: app.securityRating !== null, hint: app.securityRating !== null ? `Wizard-Score ${securityRatingVal}/100 → ${securityPoints} Pkt. (grüner Haken ab ≥70)` : "Sicherheitsbewertung mit dem Wizard durchführen" },
    { key: "status",     label: "Wartungsstatus in Ordnung",weight: 0.15, passed: maintenanceOk,points: maintenanceOk? 15 : 0, hint: notArchived ? "Kritischen Incident schließen" : "App ist archiviert" },
  ];

  const total = criteria.reduce((sum, c) => sum + c.points, 0);
  const grade: "A" | "B" | "C" | "D" = total >= 90 ? "A" : total >= 70 ? "B" : total >= 50 ? "C" : "D";
  const color = total >= 90 ? "#10B981" : total >= 70 ? "#F59E0B" : total >= 50 ? "#F97316" : "#EF4444";

  return { total, grade, color, criteria };
}
