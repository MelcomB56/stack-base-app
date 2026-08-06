import { AGENT_GUIDE } from "./agent-guide";

// Shared CSS — reused across all platform docs
const CSS = `<style>
.ag{--bg:#0B1220;--card:#111C2D;--border:#1E3050;--primary:#2563E8;--fg:#EDF2F7;--muted:#7A8BA6;--code-bg:#0d1929;--green:#10B981;--yellow:#EAB308;--red:#EF4444;display:block;color:var(--fg);font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;padding:8px 0 40px}
.ag .wrap{max-width:680px}
.ag .header{margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid var(--border)}
.ag .badge{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);background:#1a3a6e22;border:1px solid #2563e844;border-radius:4px;padding:2px 10px;margin-bottom:12px}
.ag h1{font-size:24px;font-weight:700;letter-spacing:-.02em;color:var(--fg);margin:0 0 8px}
.ag .subtitle{color:var(--muted);font-size:14px;margin:0}
.ag .section{margin-bottom:28px}
.ag h2{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
.ag .info{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-size:14px;color:var(--muted);line-height:1.7}
.ag .info strong{color:var(--fg)}
.ag .step{display:flex;gap:16px;margin-bottom:24px}
.ag .step-num{flex-shrink:0;width:30px;height:30px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;margin-top:2px}
.ag .step-body{flex:1;min-width:0}
.ag .step-title{font-size:15px;font-weight:600;color:var(--fg);margin:0 0 8px}
.ag .step-desc{font-size:14px;color:var(--muted);margin:0 0 10px;line-height:1.7}
.ag .step-desc strong{color:var(--fg)}
.ag .code-block{background:var(--code-bg);border:1px solid var(--border);border-radius:8px;overflow-x:auto;margin:8px 0}
.ag .code-label{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);padding:7px 12px 4px;border-bottom:1px solid var(--border)}
.ag pre{font-family:'Cascadia Code','Fira Code',Consolas,monospace;font-size:12.5px;color:#c9d1d9;padding:10px 12px;white-space:pre;line-height:1.6;margin:0}
.ag .comment{color:#4a6580}
.ag .note{background:#1a3a6e18;border:1px solid #2563e830;border-left:3px solid var(--primary);border-radius:6px;padding:10px 14px;font-size:13px;color:var(--muted);margin:10px 0}
.ag .note strong{color:var(--fg)}
.ag .warn{background:#eab30812;border:1px solid #eab30830;border-left:3px solid var(--yellow);border-radius:6px;padding:10px 14px;font-size:13px;color:var(--muted);margin:10px 0}
.ag .warn strong{color:var(--fg)}
.ag .check-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;margin:0}
.ag .check-list li{font-size:14px;color:var(--muted);display:flex;align-items:baseline;gap:8px}
.ag .check-list li::before{content:"✓";color:var(--green);font-weight:700;flex-shrink:0}
.ag .trouble-item{margin-bottom:14px}
.ag .trouble-q{font-size:14px;font-weight:600;color:var(--fg);margin:0 0 4px}
.ag .trouble-a{font-size:13px;color:var(--muted);line-height:1.6;margin:0}
.ag .trouble-a code,.ag ic{background:var(--code-bg);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-family:monospace;font-size:12px;color:#c9d1d9}
.ag hr{border:none;border-top:1px solid var(--border);margin:24px 0}
.ag .field-table{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0}
.ag .field-table th{text-align:left;color:var(--muted);font-weight:600;padding:6px 10px;border-bottom:1px solid var(--border)}
.ag .field-table td{padding:7px 10px;color:var(--muted);border-bottom:1px solid #0F1D30;vertical-align:top}
.ag .field-table td:first-child{color:var(--fg);font-family:monospace;font-size:12px;white-space:nowrap}
.ag .badge-green{display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#10b98118;color:var(--green);border:1px solid #10b98130}
.ag .badge-yellow{display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#eab30818;color:var(--yellow);border:1px solid #eab30830}
.ag .badge-red{display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#ef444418;color:var(--red);border:1px solid #ef444430}
.ag .badge-blue{display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#2563e818;color:var(--primary);border:1px solid #2563e830}
</style>`;

function doc(content: string) {
  return `<div class="ag">${CSS}<div class="wrap">${content}</div></div>`;
}

// ─── Doc 1: App anlegen & konfigurieren ──────────────────────────────────────

export const APP_GUIDE = doc(`
<div class="header">
  <div class="badge">Stack-Base · Grundlagen</div>
  <h1>App anlegen &amp; konfigurieren</h1>
  <p class="subtitle">Eine neue Webanwendung in Stack-Base registrieren und vollständig einrichten</p>
</div>

<div class="section">
  <h2>Was ist eine App in Stack-Base?</h2>
  <div class="info">
    Eine <strong>App</strong> ist ein zentraler Eintrag für eine Webanwendung — mit URL, Status, Tech-Stack, GitHub-Repo, Environments und mehr.
    Stack-Base dient als Informationszentrale: nicht als Deployment-Tool, sondern als <strong>lebende Dokumentation</strong> jeder Anwendung an einem Ort.
  </div>
</div>

<div class="section">
  <h2>App erstellen</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <p class="step-title">Neue App öffnen</p>
      <p class="step-desc">Im linken Menü <strong>Apps</strong> klicken, dann oben rechts <strong>+ Neue App</strong>.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <p class="step-title">Pflichtfelder ausfüllen</p>
      <p class="step-desc">Nur Name und Status sind Pflicht. Alles andere kann später ergänzt werden.</p>
      <table class="field-table">
        <tr><th>Feld</th><th>Beschreibung</th></tr>
        <tr><td>Name *</td><td>Anzeigename der App — wird überall in Stack-Base verwendet</td></tr>
        <tr><td>Kurzbeschreibung *</td><td>Ein Satz was die App tut</td></tr>
        <tr><td>Status *</td><td><span class="badge-green">Produktion</span> · <span class="badge-blue">Entwicklung</span> · Testing · Wartung · Archiviert</td></tr>
        <tr><td>Produktion-URL</td><td>Öffentliche URL — wird für Healthchecks und Quick-Links verwendet</td></tr>
        <tr><td>Repository</td><td>GitHub-Repo-URL (z.B. <ic>https://github.com/user/repo</ic>)</td></tr>
      </table>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <p class="step-title">Tech-Stack & Klassifizierungen</p>
      <p class="step-desc">Im Abschnitt <strong>Technologien</strong> können Frontend, Backend, Datenbank und Infrastruktur-Tags gesetzt werden.
        Kategorien und Stacks gruppieren Apps plattformweit — sinnvoll wenn viele Apps vorhanden sind.</p>
      <div class="note"><strong>Tipp:</strong> Technologien werden im globalen Dependency Graph und in der Suchansicht ausgewertet.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">4</div>
    <div class="step-body">
      <p class="step-title">Speichern</p>
      <p class="step-desc">Unten rechts auf <strong>Speichern</strong> klicken. Die App-Detailseite öffnet sich automatisch.</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>App bearbeiten</h2>
  <div class="step">
    <div class="step-num" style="background:#1E3050">✎</div>
    <div class="step-body">
      <p class="step-title">Aktionen → Bearbeiten</p>
      <p class="step-desc">Auf der App-Detailseite oben rechts <strong>Aktionen → Bearbeiten</strong>. Alle Felder können jederzeit geändert werden.
        Der <strong>Ressourcen-Monitoring</strong>-Abschnitt enthält Agent-URL und Token für Live-Metriken.</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>Status-Bedeutung</h2>
  <table class="field-table">
    <tr><th>Status</th><th>Bedeutung</th></tr>
    <tr><td><span class="badge-green">Produktion</span></td><td>Live, öffentlich erreichbar, aktiv gewartet</td></tr>
    <tr><td><span class="badge-blue">Entwicklung</span></td><td>In aktiver Entwicklung, noch nicht live</td></tr>
    <tr><td><span class="badge-yellow">Testing</span></td><td>Staging oder QA — wird getestet vor dem Release</td></tr>
    <tr><td>Wartung</td><td>Vorübergehend offline oder in Umbau</td></tr>
    <tr><td>Archiviert</td><td>Nicht mehr aktiv — bleibt zur Dokumentation erhalten</td></tr>
  </table>
</div>
`);

// ─── Doc 2: Monitoring & Healthchecks ────────────────────────────────────────

export const MONITORING_GUIDE = doc(`
<div class="header">
  <div class="badge">Stack-Base · Modul 7</div>
  <h1>Monitoring &amp; Healthchecks einrichten</h1>
  <p class="subtitle">Automatische Erreichbarkeits-Prüfung für jede App konfigurieren</p>
</div>

<div class="section">
  <h2>Wie funktioniert das Monitoring?</h2>
  <div class="info">
    Stack-Base sendet in konfigurierbaren Intervallen einen HTTP-Request an die angegebene URL und prüft den Statuscode.
    Das Ergebnis wird als <strong>UP</strong>, <strong>DEGRADED</strong> oder <strong>DOWN</strong> gespeichert und im Dashboard sowie im Monitoring-Tab angezeigt.
    Mehrere Monitor-Konfigurationen pro App sind möglich — z.B. für API, Frontend und Health-Endpoint getrennt.
  </div>
</div>

<div class="section">
  <h2>Monitor einrichten</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <p class="step-title">Monitoring-Tab öffnen</p>
      <p class="step-desc">App-Detailseite → Tab <strong>Monitoring</strong>. Dort erscheinen alle Monitor-Konfigurationen dieser App.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <p class="step-title">Neue Konfiguration anlegen</p>
      <p class="step-desc">Auf <strong>Monitor hinzufügen</strong> klicken. Ein Formular öffnet sich:</p>
      <table class="field-table">
        <tr><th>Feld</th><th>Beschreibung</th></tr>
        <tr><td>Label</td><td>Name der Konfiguration, z.B. <ic>Production</ic> oder <ic>API Health</ic></td></tr>
        <tr><td>URL</td><td>Zu prüfende URL — leer lassen um die Produktion-URL der App zu verwenden</td></tr>
        <tr><td>Erwarteter Status</td><td>HTTP-Statuscode der als Erfolg gilt, Standard: <ic>200</ic></td></tr>
        <tr><td>Intervall</td><td>Wie oft geprüft wird (Minuten), Standard: 5</td></tr>
        <tr><td>Timeout</td><td>Maximale Wartezeit in Sekunden, Standard: 10</td></tr>
        <tr><td>Aktiviert</td><td>Monitor ein- oder ausschalten ohne ihn zu löschen</td></tr>
      </table>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <p class="step-title">Ersten Check manuell auslösen</p>
      <p class="step-desc">Nach dem Speichern auf <strong>Jetzt prüfen</strong> klicken. Das Ergebnis erscheint sofort im Monitoring-Tab
        und der Health-Dot auf dem Dashboard aktualisiert sich.</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>Status-Bedeutung</h2>
  <table class="field-table">
    <tr><th>Status</th><th>Wann</th></tr>
    <tr><td><span class="badge-green">UP</span></td><td>HTTP-Antwort mit erwartetem Statuscode innerhalb des Timeouts</td></tr>
    <tr><td><span class="badge-yellow">DEGRADED</span></td><td>Antwort erhalten, aber Statuscode weicht ab oder Antwortzeit sehr hoch</td></tr>
    <tr><td><span class="badge-red">DOWN</span></td><td>Kein Response, Timeout oder Verbindungsfehler</td></tr>
    <tr><td>UNKNOWN</td><td>Noch kein Check durchgeführt oder Monitor deaktiviert</td></tr>
  </table>
</div>

<div class="section">
  <h2>Troubleshooting</h2>
  <div class="trouble-item">
    <p class="trouble-q">Monitor zeigt DOWN, App ist aber erreichbar</p>
    <p class="trouble-a">Den erwarteten Statuscode prüfen — manche Seiten antworten mit <code>301</code> oder <code>302</code> statt <code>200</code>.
      Den Wert im Monitor auf den tatsächlichen Code anpassen.</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">Timeout-Fehler bei interner URL</p>
    <p class="trouble-a">Stack-Base muss die URL direkt erreichen können. Interne IPs (<code>192.168.x.x</code>) nur verwenden wenn Stack-Base im selben Netzwerk läuft.</p>
  </div>
</div>
`);

// ─── Doc 3: Environments verwalten ───────────────────────────────────────────

export const ENVIRONMENTS_GUIDE = doc(`
<div class="header">
  <div class="badge">Stack-Base · Modul 27</div>
  <h1>Environments verwalten</h1>
  <p class="subtitle">Produktion, Staging und Entwicklungs-Instanzen einer App dokumentieren</p>
</div>

<div class="section">
  <h2>Was sind Environments?</h2>
  <div class="info">
    Jede App kann mehrere <strong>Environments</strong> haben — z.B. Produktion, Staging und lokale Entwicklung.
    Jedes Environment hat eine eigene URL, einen Status und kann eine Versionsnummer tragen.
    So ist auf einen Blick sichtbar, <strong>was wo läuft</strong> — ohne im Code nachzusehen.
  </div>
</div>

<div class="section">
  <h2>Environment hinzufügen</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <p class="step-title">Environments-Tab öffnen</p>
      <p class="step-desc">App-Detailseite → Tab <strong>Environments</strong>. Die Liste aller Environments dieser App wird angezeigt.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <p class="step-title">Environment anlegen</p>
      <p class="step-desc">Auf <strong>+ Environment</strong> klicken und die Felder ausfüllen:</p>
      <table class="field-table">
        <tr><th>Feld</th><th>Beschreibung</th></tr>
        <tr><td>Name</td><td>z.B. <ic>Production</ic>, <ic>Staging</ic>, <ic>Development</ic></td></tr>
        <tr><td>URL</td><td>Vollständige URL dieses Environments</td></tr>
        <tr><td>Status</td><td>Aktueller Zustand: Aktiv / Inaktiv / Wartung</td></tr>
        <tr><td>Version</td><td>Deployed Version, z.B. <ic>v2.3.1</ic> — optional</td></tr>
        <tr><td>Beschreibung</td><td>Kurze Notiz, z.B. "Stabil, letzter Release 2026-07-30"</td></tr>
      </table>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <p class="step-title">Version aktuell halten</p>
      <p class="step-desc">Nach einem Deployment die Version im Environment-Eintrag manuell aktualisieren.
        Bei aktiver GitHub-Integration (siehe <strong>GitHub-Integration einrichten</strong>) werden Releases automatisch importiert.</p>
      <div class="note"><strong>Tipp:</strong> Die Produktion-URL der App (Bearbeiten → URLs) wird automatisch als Haupt-Environment angezeigt.
        Das Environments-Tab ist für zusätzliche Instanzen gedacht.</div>
    </div>
  </div>
</div>
`);

// ─── Doc 4: Incidents verwalten ──────────────────────────────────────────────

export const INCIDENTS_GUIDE = doc(`
<div class="header">
  <div class="badge">Stack-Base · Incident Management</div>
  <h1>Incidents verwalten</h1>
  <p class="subtitle">Ausfälle und Störungen dokumentieren, verfolgen und lösen</p>
</div>

<div class="section">
  <h2>Was ist ein Incident?</h2>
  <div class="info">
    Ein <strong>Incident</strong> ist ein dokumentierter Vorfall — Ausfall, Degradierung, Sicherheitsproblem oder kritischer Bug.
    Incidents werden pro App geführt und haben einen Lebenszyklus von <strong>OPEN</strong> über <strong>INVESTIGATING</strong> bis <strong>RESOLVED</strong>.
    Offene Incidents erscheinen im Dashboard und auf der App-Übersicht.
  </div>
</div>

<div class="section">
  <h2>Incident anlegen</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <p class="step-title">Incidents-Tab öffnen</p>
      <p class="step-desc">App-Detailseite → Tab <strong>Incidents</strong> → <strong>Incident melden</strong>.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <p class="step-title">Incident-Details ausfüllen</p>
      <table class="field-table">
        <tr><th>Feld</th><th>Beschreibung</th></tr>
        <tr><td>Titel</td><td>Kurze präzise Beschreibung, z.B. <ic>API antwortet nicht auf /health</ic></td></tr>
        <tr><td>Severity</td><td>
          <span class="badge-red">CRITICAL</span> Totalausfall ·
          <span class="badge-red">HIGH</span> Großer Impact ·
          <span class="badge-yellow">MEDIUM</span> Teilausfall ·
          LOW Geringfügig
        </td></tr>
        <tr><td>Beschreibung</td><td>Was passiert, seit wann, erste Beobachtungen</td></tr>
        <tr><td>Status</td><td>OPEN (neu), INVESTIGATING (in Bearbeitung), RESOLVED (gelöst)</td></tr>
      </table>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <p class="step-title">Status während der Untersuchung aktualisieren</p>
      <p class="step-desc">Im Incident-Eintrag den Status auf <strong>INVESTIGATING</strong> setzen sobald jemand daran arbeitet.
        In der Beschreibung laufend Updates notieren — Datum + Uhrzeit voranstellen ist empfehlenswert.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">4</div>
    <div class="step-body">
      <p class="step-title">Incident lösen</p>
      <p class="step-desc">Status auf <strong>RESOLVED</strong> setzen und eine kurze Post-Mortem-Notiz hinterlassen:
        Was war die Ursache? Was wurde behoben? Wie lange dauerte der Ausfall?</p>
      <div class="note"><strong>Nach der Lösung:</strong> Der Incident verschwindet aus dem Dashboard-Panel, bleibt aber in der History der App erhalten.</div>
    </div>
  </div>
</div>

<div class="section">
  <h2>Severity-Richtlinie</h2>
  <table class="field-table">
    <tr><th>Severity</th><th>Wann verwenden</th><th>Beispiele</th></tr>
    <tr><td><span class="badge-red">CRITICAL</span></td><td>Kompletter Ausfall, alle Nutzer betroffen</td><td>App down, DB nicht erreichbar</td></tr>
    <tr><td><span class="badge-red">HIGH</span></td><td>Hauptfunktionen gestört, viele Nutzer betroffen</td><td>Login funktioniert nicht, Datenverlust</td></tr>
    <tr><td><span class="badge-yellow">MEDIUM</span></td><td>Teilfunktion gestört, Workaround verfügbar</td><td>Export schlägt fehl, langsame API</td></tr>
    <tr><td>LOW</td><td>Kosmetisches Problem, minimaler Impact</td><td>Darstellungsfehler, falsche Meldung</td></tr>
  </table>
</div>
`);

// ─── Doc 5: GitHub-Integration ───────────────────────────────────────────────

export const GITHUB_GUIDE = doc(`
<div class="header">
  <div class="badge">Stack-Base · Modul 33</div>
  <h1>GitHub-Integration einrichten</h1>
  <p class="subtitle">Releases und Changelog automatisch aus GitHub importieren</p>
</div>

<div class="section">
  <h2>Was wird synchronisiert?</h2>
  <div class="info">
    Mit einer GitHub-Verbindung importiert Stack-Base automatisch <strong>Releases</strong> aus GitHub Releases
    und trägt sie in den Release-Tab der App ein. Changelog-Einträge können ebenfalls aus den Release-Notes befüllt werden.
    Für öffentliche Repos ist kein Token nötig — nur für private.
  </div>
</div>

<div class="section">
  <h2>Integration einrichten</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <p class="step-title">Repository-URL eintragen</p>
      <p class="step-desc"><strong>Aktionen → Bearbeiten → URLs → Repository</strong>: Die vollständige GitHub-URL eintragen,
        z.B. <ic>https://github.com/user/mein-repo</ic>.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <p class="step-title">Personal Access Token erstellen (nur für private Repos)</p>
      <p class="step-desc">Auf GitHub unter <strong>Settings → Developer settings → Personal access tokens → Tokens (classic)</strong>
        einen neuen Token mit dem Scope <ic>repo</ic> (read-only reicht) erstellen.</p>
      <div class="warn"><strong>Achtung:</strong> Den Token sicher aufbewahren — er wird in Stack-Base verschlüsselt gespeichert und ist danach nicht mehr sichtbar.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <p class="step-title">Token in der App hinterlegen</p>
      <p class="step-desc"><strong>Aktionen → Bearbeiten → GitHub Integration → GitHub Personal Access Token</strong> ausfüllen und speichern.
        Für öffentliche Repos dieses Feld leer lassen.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">4</div>
    <div class="step-body">
      <p class="step-title">GitHub Sync ausführen</p>
      <p class="step-desc">Auf der App-Detailseite <strong>Aktionen → GitHub Sync</strong>. Stack-Base ruft alle Releases aus dem Repository ab
        und legt sie im Release-Tab an. Bereits vorhandene Releases werden nicht doppelt angelegt.</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>Troubleshooting</h2>
  <div class="trouble-item">
    <p class="trouble-q">Sync schlägt mit 404 fehl</p>
    <p class="trouble-a">Repository-URL prüfen — sie muss exakt <code>https://github.com/user/repo</code> lauten (kein Trailing Slash, keine .git-Endung).</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">Sync schlägt mit 401/403 fehl</p>
    <p class="trouble-a">Der Token hat nicht den richtigen Scope oder ist abgelaufen. Neuen Token mit <code>repo</code>-Scope erstellen und in der App aktualisieren.</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">Keine Releases werden importiert</p>
    <p class="trouble-a">Releases müssen auf GitHub als <em>Published Release</em> vorhanden sein — Drafts und Pre-Releases werden übersprungen.</p>
  </div>
</div>
`);

// ─── Doc 6: Dependency Graph ──────────────────────────────────────────────────

export const DEPENDENCY_GUIDE = doc(`
<div class="header">
  <div class="badge">Stack-Base · Modul 28</div>
  <h1>Dependency Graph</h1>
  <p class="subtitle">Abhängigkeiten zwischen Apps visualisieren und verstehen</p>
</div>

<div class="section">
  <h2>Was zeigt der Dependency Graph?</h2>
  <div class="info">
    Der <strong>Dependency Graph</strong> visualisiert welche Apps von welchen anderen Apps oder Services abhängig sind.
    Das hilft beim Verstehen von Auswirkungen: <em>Was bricht, wenn App X ausfällt?</em>
    Es gibt zwei Ansichten — den App-spezifischen Graph im Abhängigkeiten-Tab und den globalen Graph unter <strong>/dependency-graph</strong>.
  </div>
</div>

<div class="section">
  <h2>Abhängigkeit hinzufügen</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <p class="step-title">Abhängigkeiten-Tab öffnen</p>
      <p class="step-desc">App-Detailseite → Tab <strong>Abhängigkeiten</strong>. Hier werden alle eingehenden und ausgehenden Verbindungen angezeigt.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <p class="step-title">Abhängigkeit anlegen</p>
      <p class="step-desc">Auf <strong>Abhängigkeit hinzufügen</strong> klicken und die Ziel-App auswählen.
        Optional: Typ der Abhängigkeit angeben (API, Datenbank, Auth, etc.) und eine Beschreibung hinterlassen.</p>
      <div class="note"><strong>Leserichtung:</strong> "Diese App benötigt → Ziel-App". Also: AzubiSuite → PostgreSQL bedeutet <em>AzubiSuite braucht PostgreSQL</em>.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <p class="step-title">Globaler Graph</p>
      <p class="step-desc">Unter <strong>Dependency Graph</strong> im linken Menü erscheint eine radiale Visualisierung aller Apps und ihrer Verbindungen.
        Klick auf einen Knoten öffnet die App-Detailseite.</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>Best Practices</h2>
  <ul class="check-list">
    <li>Abhängigkeiten direkt beim Anlegen einer neuen App eintragen — nicht nachträglich vergessen</li>
    <li>Nur direkte Abhängigkeiten eintragen — nicht transitiv (A → B → C: nur A → B und B → C)</li>
    <li>Externe Services (z.B. Stripe, Sendgrid) als App ohne URL anlegen und als Abhängigkeit verknüpfen</li>
    <li>Beim Entfernen einer App zuerst prüfen ob andere Apps davon abhängen</li>
  </ul>
</div>
`);

// ─── Doc 7: SSO mit Authentik einrichten ─────────────────────────────────────

export const SSO_GUIDE = doc(`
<div class="header">
  <div class="badge">Stack-Base · Authentifizierung</div>
  <h1>SSO mit Authentik einrichten</h1>
  <p class="subtitle">Single Sign-On über Authentik konfigurieren — von der Authentik-App bis zum ersten Login</p>
</div>

<div class="section">
  <h2>Voraussetzungen</h2>
  <div class="info">
    <strong>Auf Authentik-Seite:</strong> Admin-Zugang zu einer laufenden Authentik-Instanz.<br>
    <strong>Auf Stack-Base-Seite:</strong> Rolle <strong>ADMIN</strong> oder <strong>SUPER_ADMIN</strong> — nur diese können SSO-Einstellungen ändern.<br>
    <strong>Netzwerk:</strong> Stack-Base muss die Authentik-Instanz direkt erreichen können (für OIDC Discovery und Token-Exchange).
  </div>
</div>

<div class="section">
  <h2>Schritt 1 — Authentik: OAuth2-Provider erstellen</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <p class="step-title">Authentik Admin-Interface öffnen</p>
      <p class="step-desc">Im Authentik-Admin-UI zu <strong>Applications → Providers</strong> navigieren, dann oben rechts <strong>Create</strong> klicken.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <p class="step-title">Provider-Typ wählen</p>
      <p class="step-desc"><strong>OAuth2/OpenID Provider</strong> auswählen und auf <strong>Next</strong> klicken.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <p class="step-title">Provider konfigurieren</p>
      <p class="step-desc">Die Pflichtfelder ausfüllen:</p>
      <table class="field-table">
        <tr><th>Feld</th><th>Wert</th></tr>
        <tr><td>Name</td><td>z.B. <ic>stack-base</ic></td></tr>
        <tr><td>Authorization flow</td><td>Vorhandenen Explicit-Consent-Flow auswählen, z.B. <ic>default-provider-authorization-explicit-consent</ic></td></tr>
        <tr><td>Client type</td><td><strong>Confidential</strong> (wichtig — ermöglicht Client Secret)</td></tr>
        <tr><td>Client ID</td><td>Automatisch generiert — kann übernommen oder geändert werden</td></tr>
        <tr><td>Client Secret</td><td>Automatisch generiert — sicher kopieren, wird nur einmal angezeigt</td></tr>
        <tr><td>Redirect URIs</td><td>Callback-URL von Stack-Base (siehe unten)</td></tr>
      </table>
      <div class="warn"><strong>Redirect URI:</strong> Genau diese URL eintragen — kein Trailing Slash, exakte Schreibweise:
        <br><ic>https://&lt;deine-domain&gt;/api/auth/callback/authentik</ic>
        <br>Die korrekte URL für diese Instanz findest du unter <strong>Einstellungen → SSO</strong> im Feld <em>Callback-URL</em>.
      </div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">4</div>
    <div class="step-body">
      <p class="step-title">Scopes prüfen</p>
      <p class="step-desc">Im Abschnitt <strong>Advanced protocol settings</strong> sicherstellen dass die Scopes
        <ic>openid</ic>, <ic>email</ic> und <ic>profile</ic> aktiviert sind.
        Stack-Base benötigt <strong>email</strong> (Benutzer-Identifikation) und <strong>profile</strong> (Name).</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">5</div>
    <div class="step-body">
      <p class="step-title">Provider speichern</p>
      <p class="step-desc">Auf <strong>Finish</strong> klicken. <strong>Client ID</strong> und <strong>Client Secret</strong> jetzt kopieren und sicher aufbewahren.</p>
      <div class="note"><strong>Issuer URL</strong> merken — sie folgt dem Muster:<br>
        <ic>https://&lt;authentik-domain&gt;/application/o/&lt;provider-slug&gt;/</ic><br>
        Den genauen Wert findest du in Authentik unter dem Provider → <em>OpenID Configuration URL</em> (den Pfad bis <ic>/o/name/</ic> nehmen).
      </div>
    </div>
  </div>
</div>

<div class="section">
  <h2>Schritt 2 — Authentik: Application anlegen</h2>

  <div class="step">
    <div class="step-num">6</div>
    <div class="step-body">
      <p class="step-title">Neue Application erstellen</p>
      <p class="step-desc">In Authentik zu <strong>Applications → Applications → Create</strong> gehen.</p>
      <table class="field-table">
        <tr><th>Feld</th><th>Wert</th></tr>
        <tr><td>Name</td><td><ic>Stack-Base</ic> (Anzeigename)</td></tr>
        <tr><td>Slug</td><td><ic>stack-base</ic> (URL-Kennung)</td></tr>
        <tr><td>Provider</td><td>Den gerade erstellten Provider auswählen</td></tr>
      </table>
      <p class="step-desc">Auf <strong>Create</strong> klicken. Die Application verknüpft den Provider mit dem Authentik-Anmeldeportal.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">7</div>
    <div class="step-body">
      <p class="step-title">Zugriff für Nutzer und Gruppen einrichten</p>
      <p class="step-desc">In der erstellten Application unter dem Reiter <strong>Policy / Group / User Bindings</strong>
        Gruppen oder einzelne Nutzer hinzufügen, die sich über SSO anmelden dürfen.
        Ohne Binding haben alle Authentik-Nutzer Zugriff.</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>Schritt 3 — Stack-Base: SSO konfigurieren</h2>

  <div class="step">
    <div class="step-num">8</div>
    <div class="step-body">
      <p class="step-title">Einstellungen → SSO öffnen</p>
      <p class="step-desc">In Stack-Base: linkes Menü → <strong>Einstellungen</strong> → Abschnitt <strong>SSO / Authentik</strong>.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">9</div>
    <div class="step-body">
      <p class="step-title">Felder ausfüllen</p>
      <table class="field-table">
        <tr><th>Feld</th><th>Wert aus Authentik</th></tr>
        <tr><td>Issuer URL</td><td><ic>https://&lt;authentik-domain&gt;/application/o/&lt;slug&gt;/</ic> — mit Trailing Slash</td></tr>
        <tr><td>Client ID</td><td>Aus Schritt 3 kopierter Wert</td></tr>
        <tr><td>Client Secret</td><td>Aus Schritt 3 kopierter Wert</td></tr>
        <tr><td>Button-Beschriftung</td><td>Text des SSO-Buttons auf der Anmeldeseite, z.B. <ic>Mit Authentik anmelden</ic></td></tr>
        <tr><td>Standard-Rolle</td><td>Rolle die neue Nutzer beim ersten SSO-Login erhalten — empfohlen: <strong>Gast</strong></td></tr>
      </table>
    </div>
  </div>

  <div class="step">
    <div class="step-num">10</div>
    <div class="step-body">
      <p class="step-title">Verbindung testen</p>
      <p class="step-desc">Unter dem Issuer-URL-Feld auf <strong>Verbindung testen</strong> klicken.
        Stack-Base ruft das OIDC Discovery-Dokument ab und meldet ob die Authentik-Instanz erreichbar ist.
        Erst wenn der Test erfolgreich ist weitermachen.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">11</div>
    <div class="step-body">
      <p class="step-title">SSO aktivieren und speichern</p>
      <p class="step-desc">Den Toggle <strong>SSO aktiviert</strong> einschalten, dann auf <strong>Speichern</strong> klicken.
        Änderungen werden innerhalb von 60 Sekunden aktiv — kein Neustart erforderlich.</p>
      <div class="note"><strong>Ergebnis:</strong> Auf der Anmeldeseite (<ic>/login</ic>) erscheint jetzt der Authentik-Button unterhalb des normalen Anmeldeformulars.</div>
    </div>
  </div>
</div>

<div class="section">
  <h2>Schritt 4 — Ersten SSO-Login testen</h2>

  <div class="step">
    <div class="step-num">12</div>
    <div class="step-body">
      <p class="step-title">Anmeldeseite aufrufen</p>
      <p class="step-desc">Die Stack-Base-Anmeldeseite im Browser öffnen. Der <strong>Authentik-Button</strong> sollte sichtbar sein.
        Auf den Button klicken — Authentik öffnet sich zur Anmeldung.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">13</div>
    <div class="step-body">
      <p class="step-title">Mit Authentik-Konto anmelden</p>
      <p class="step-desc">Nach erfolgreicher Authentik-Anmeldung leitet Authentik zurück zu Stack-Base.
        Stack-Base legt beim ersten Login automatisch einen Datenbanknutzer mit der konfigurierten Standard-Rolle an.</p>
      <div class="note"><strong>Rollen anpassen:</strong> Die Rolle eines SSO-Nutzers kann danach wie bei jedem anderen Nutzer
        unter <strong>Verwaltung → Nutzer → Rolle bearbeiten</strong> geändert werden.</div>
    </div>
  </div>
</div>

<div class="section">
  <h2>Troubleshooting</h2>
  <div class="trouble-item">
    <p class="trouble-q">Verbindungstest schlägt fehl — "ECONNREFUSED" oder Timeout</p>
    <p class="trouble-a">Stack-Base kann die Authentik-Instanz nicht erreichen. Netzwerkverbindung prüfen — beide Instanzen müssen sich gegenseitig erreichen können. Kein VPN oder Firewall-Block zwischen den Servern?</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">Verbindungstest schlägt fehl — "Ungültiges OIDC-Discovery-Dokument"</p>
    <p class="trouble-a">Die Issuer URL ist falsch. Sie muss exakt mit dem Trailing Slash enden: <code>https://auth.example.com/application/o/stack-base/</code>. Den Wert in Authentik unter dem Provider → OpenID Configuration URL ablesen.</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">Redirect-Fehler nach Authentik-Anmeldung ("redirect_uri mismatch")</p>
    <p class="trouble-a">Die Callback-URL in Authentik stimmt nicht mit der tatsächlichen Stack-Base-URL überein. In Authentik → Provider → Redirect URIs den Wert aus dem SSO-Einstellungs-Formular exakt eintragen — inklusive Protokoll und ohne Trailing Slash.</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">SSO-Button erscheint nicht auf der Anmeldeseite</p>
    <p class="trouble-a">SSO ist noch nicht aktiv. Entweder wurde der Toggle nicht eingeschaltet, oder die Konfiguration wurde noch nicht gespeichert. Die 60-Sekunden-Frist nach dem Speichern abwarten und dann die Seite neu laden.</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">Nutzer landet nach SSO-Login auf Fehlerseite</p>
    <p class="trouble-a">Meist fehlt die E-Mail im Authentik-Profil. Stack-Base identifiziert Nutzer anhand der E-Mail-Adresse — diese muss im Authentik-Account hinterlegt und im Token vorhanden sein (Scope <code>email</code> muss aktiviert sein).</p>
  </div>
  <div class="trouble-item">
    <p class="trouble-q">Vorhandener Nutzer kann sich nach SSO-Aktivierung nicht mehr per Passwort anmelden</p>
    <p class="trouble-a">SSO und Passwort-Login koexistieren. Das normale Anmeldeformular bleibt immer verfügbar — beide Methoden funktionieren parallel.</p>
  </div>
</div>
`);

// ─── All docs to seed ─────────────────────────────────────────────────────────

export const PLATFORM_DOCS = [
  { title: "App anlegen & konfigurieren",       slug: "app-anlegen-konfigurieren",        content: APP_GUIDE,         sortOrder: 10 },
  { title: "Monitoring & Healthchecks",          slug: "monitoring-healthchecks",           content: MONITORING_GUIDE,  sortOrder: 20 },
  { title: "Environments verwalten",             slug: "environments-verwalten",            content: ENVIRONMENTS_GUIDE,sortOrder: 30 },
  { title: "Incidents verwalten",                slug: "incidents-verwalten",               content: INCIDENTS_GUIDE,   sortOrder: 40 },
  { title: "GitHub-Integration einrichten",      slug: "github-integration",                content: GITHUB_GUIDE,      sortOrder: 50 },
  { title: "Dependency Graph",                   slug: "dependency-graph",                  content: DEPENDENCY_GUIDE,  sortOrder: 60 },
  { title: "Stack-Base Agent einrichten",        slug: "stackbase-agent-einrichten",        content: AGENT_GUIDE,       sortOrder: 70 },
  { title: "SSO mit Authentik einrichten",       slug: "sso-authentik-einrichten",          content: SSO_GUIDE,         sortOrder: 80 },
];
