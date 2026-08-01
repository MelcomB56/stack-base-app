export const AGENT_GUIDE = `<div class="ag">
<style>
.ag {
  --bg: #0B1220;
  --card: #111C2D;
  --border: #1E3050;
  --primary: #2563E8;
  --fg: #EDF2F7;
  --muted: #7A8BA6;
  --code-bg: #0d1929;
  --green: #10B981;
  --yellow: #EAB308;
  --red: #EF4444;
  display: block;
  color: var(--fg);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  padding: 8px 0 40px;
}
.ag .wrap { max-width: 680px; }
.ag .header { margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.ag .badge { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--primary); background: #1a3a6e22; border: 1px solid #2563e844; border-radius: 4px; padding: 2px 10px; margin-bottom: 12px; }
.ag h1 { font-size: 24px; font-weight: 700; letter-spacing: -.02em; color: var(--fg); margin: 0 0 8px; }
.ag .subtitle { color: var(--muted); font-size: 14px; margin: 0; }
.ag .section { margin-bottom: 28px; }
.ag h2 { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
.ag .info { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; font-size: 14px; color: var(--muted); line-height: 1.7; }
.ag .info strong { color: var(--fg); }
.ag .step { display: flex; gap: 16px; margin-bottom: 24px; }
.ag .step-num { flex-shrink: 0; width: 30px; height: 30px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; margin-top: 2px; }
.ag .step-body { flex: 1; min-width: 0; }
.ag .step-title { font-size: 15px; font-weight: 600; color: var(--fg); margin: 0 0 8px; }
.ag .step-desc { font-size: 14px; color: var(--muted); margin: 0 0 10px; line-height: 1.7; }
.ag .step-desc strong { color: var(--fg); }
.ag .code-block { background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px; overflow-x: auto; margin: 8px 0; }
.ag .code-label { font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); padding: 7px 12px 4px; border-bottom: 1px solid var(--border); }
.ag pre { font-family: 'Cascadia Code','Fira Code',Consolas,monospace; font-size: 12.5px; color: #c9d1d9; padding: 10px 12px; white-space: pre; line-height: 1.6; margin: 0; }
.ag .comment { color: #4a6580; }
.ag .env-var { color: #79c0ff; }
.ag .flag { color: #d2a8ff; }
.ag .value { color: #a5d6a7; }
.ag .cmd { color: #e3b341; }
.ag .variants { display: flex; flex-direction: column; gap: 10px; }
.ag .variant-header { font-size: 12px; font-weight: 600; color: var(--fg); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
.ag .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.ag .token-box { background: var(--code-bg); border: 1px solid var(--border); border-left: 3px solid var(--green); border-radius: 8px; padding: 10px 12px; font-family: monospace; font-size: 13px; color: var(--green); margin: 8px 0; }
.ag .note { background: #1a3a6e18; border: 1px solid #2563e830; border-left: 3px solid var(--primary); border-radius: 6px; padding: 10px 14px; font-size: 13px; color: var(--muted); margin: 10px 0; }
.ag .note strong { color: var(--fg); }
.ag .warn { background: #eab30812; border: 1px solid #eab30830; border-left: 3px solid var(--yellow); border-radius: 6px; padding: 10px 14px; font-size: 13px; color: var(--muted); margin: 10px 0; }
.ag .check-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; margin: 0; }
.ag .check-list li { font-size: 14px; color: var(--muted); display: flex; align-items: baseline; gap: 8px; }
.ag .check-list li::before { content: "✓"; color: var(--green); font-weight: 700; flex-shrink: 0; }
.ag .trouble-item { margin-bottom: 14px; }
.ag .trouble-q { font-size: 14px; font-weight: 600; color: var(--fg); margin: 0 0 4px; }
.ag .trouble-a { font-size: 13px; color: var(--muted); line-height: 1.6; margin: 0; }
.ag .trouble-a code { background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-family: monospace; font-size: 12px; color: #c9d1d9; }
.ag hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
.ag ic { background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-family: monospace; font-size: 12px; color: #c9d1d9; }
</style>

<div class="wrap">

  <div class="header">
    <div class="badge">Stack-Base · Modul 34</div>
    <h1>Stack-Base Agent einrichten</h1>
    <p class="subtitle">Schritt-für-Schritt: Agent auf einem Server deployen und mit Stack-Base verbinden</p>
  </div>

  <div class="section">
    <h2>Was macht der Agent?</h2>
    <div class="info">
      Der <strong>Stack-Base Agent</strong> ist ein kleines Programm, das auf deinem Server läuft und
      Ressourcen-Daten sammelt — CPU, RAM, Netzwerk. Stack-Base fragt den Agent alle paar Minuten ab
      und zeigt die Daten im <strong>Ressourcen-Tab</strong> der App.<br><br>
      Es gibt zwei Modi:
      <ul style="margin-top:8px;padding-left:18px;display:flex;flex-direction:column;gap:4px;">
        <li><strong>Container-Monitoring</strong> — überwacht einen bestimmten Docker-Container</li>
        <li><strong>System-Metriken</strong> — überwacht den gesamten Server (CPU/RAM/Netzwerk des Hosts)</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>Voraussetzungen</h2>
    <div class="info">
      <ul class="check-list">
        <li>Docker ist auf dem Zielserver installiert</li>
        <li>Port <strong>9101</strong> ist von Stack-Base aus erreichbar (Firewall, ggf. Port-Freigabe)</li>
        <li>Bei Container-Monitoring: Der zu überwachende Container läuft bereits</li>
      </ul>
    </div>
  </div>

  <hr>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <div class="step-title">Agent starten</div>
      <p class="step-desc">Wähle die Variante, die zu deinem Anwendungsfall passt — <strong>nicht beides</strong> nötig.</p>

      <div class="variants">
        <div>
          <div class="variant-header">
            <span class="dot" style="background:var(--primary);"></span>
            Variante A — Container-Monitoring
          </div>
          <p class="step-desc" style="margin-bottom:6px;">
            Überwacht einen bestimmten Docker-Container. <ic>SB_CONTAINER</ic> muss den exakten Container-Namen enthalten.
          </p>
          <div class="code-block">
            <div class="code-label">Auf dem Zielserver ausführen</div>
            <pre><span class="cmd">docker run</span> <span class="flag">-d</span> <span class="flag">--name</span> stackbase-agent \\
  <span class="flag">--restart</span> unless-stopped \\
  <span class="flag">-p</span> <span class="value">9101:9101</span> \\
  <span class="flag">-e</span> <span class="env-var">SB_CONTAINER</span>=<span class="value">mein-container-name</span> \\
  <span class="flag">-v</span> /var/run/docker.sock:/var/run/docker.sock \\
  ghcr.io/melcomb56/stackbase-agent:latest</pre>
          </div>
          <div class="note"><strong>Hinweis:</strong> Ersetze <ic>mein-container-name</ic> durch den tatsächlichen Namen. Prüfen mit: <ic>docker ps</ic></div>
        </div>

        <div style="margin-top:8px;">
          <div class="variant-header">
            <span class="dot" style="background:var(--muted);"></span>
            Variante B — Host-System-Metriken
          </div>
          <p class="step-desc" style="margin-bottom:6px;">Überwacht den gesamten Server. Kein Docker-Socket nötig.</p>
          <div class="code-block">
            <div class="code-label">Auf dem Zielserver ausführen</div>
            <pre><span class="cmd">docker run</span> <span class="flag">-d</span> <span class="flag">--name</span> stackbase-agent \\
  <span class="flag">--restart</span> unless-stopped \\
  <span class="flag">-p</span> <span class="value">9101:9101</span> \\
  ghcr.io/melcomb56/stackbase-agent:latest</pre>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <div class="step-title">Token aus den Logs kopieren</div>
      <p class="step-desc">Der Agent generiert beim ersten Start automatisch einen Zugriffstoken und zeigt ihn in den Logs an.</p>
      <div class="code-block">
        <div class="code-label">Logs abrufen</div>
        <pre><span class="cmd">docker logs</span> stackbase-agent</pre>
      </div>
      <p class="step-desc" style="margin-top:8px;">In der Ausgabe erscheint:</p>
      <div class="token-box">
        ====================================<br>
        &nbsp;&nbsp;Stack-Base Agent v1.0<br>
        ====================================<br>
        &nbsp;&nbsp;Port:&nbsp; :9101<br>
        &nbsp;&nbsp;Token: <strong>sb_a3f8c2d1e4b7...</strong><br>
        ====================================
      </div>
      <div class="note"><strong>Token kopieren</strong> — den kompletten Wert ab <ic>sb_</ic> brauchst du in Schritt 3.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <div class="step-title">In Stack-Base eintragen</div>
      <p class="step-desc">Öffne in Stack-Base die Einstellungen der App → Tab <strong>Bearbeiten</strong> → Abschnitt <strong>Ressourcen-Monitoring</strong>.</p>
      <div class="info" style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Agent-URL</div>
          <div style="font-family:monospace;font-size:13px;color:var(--fg);">http://<span style="color:var(--primary);">SERVER-IP</span>:9101</div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px;">Ersetze SERVER-IP durch die IP-Adresse des Zielservers.</div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Agent-Token</div>
          <div style="font-family:monospace;font-size:13px;color:var(--fg);">sb_a3f8c2d1e4b7... <span style="color:var(--muted);">(aus Schritt 2)</span></div>
        </div>
      </div>
      <div class="note" style="margin-top:10px;">Nach dem Speichern → Tab <strong>Ressourcen</strong> öffnen → <strong>Jetzt abfragen</strong> klicken. Die ersten Metriken erscheinen nach wenigen Sekunden.</div>
    </div>
  </div>

  <hr>

  <div class="section">
    <h2>Optional — Eigenen Token setzen</h2>
    <div class="info">
      Standardmäßig generiert der Agent bei jedem Neustart einen neuen Token.
      Um einen festen Token zu nutzen, setze ihn als Umgebungsvariable:
    </div>
    <div class="code-block" style="margin-top:10px;">
      <div class="code-label">Festen Token übergeben</div>
      <pre><span class="cmd">docker run</span> <span class="flag">-d</span> <span class="flag">--name</span> stackbase-agent \\
  <span class="flag">--restart</span> unless-stopped \\
  <span class="flag">-p</span> <span class="value">9101:9101</span> \\
  <span class="flag">-e</span> <span class="env-var">SB_API_KEY</span>=<span class="value">mein-geheimer-token</span> \\
  ghcr.io/melcomb56/stackbase-agent:latest</pre>
    </div>
    <div class="warn">Einen langen, zufälligen Wert wählen — mindestens 20 Zeichen.</div>
  </div>

  <hr>

  <div class="section">
    <h2>Troubleshooting</h2>

    <div class="trouble-item">
      <div class="trouble-q">„Connection refused" beim Abfragen</div>
      <div class="trouble-a">Port 9101 ist nicht erreichbar. Firewall prüfen: <code>ufw allow 9101</code> · Container-Status: <code>docker ps | grep stackbase-agent</code></div>
    </div>

    <div class="trouble-item">
      <div class="trouble-q">„Unauthorized" (401)</div>
      <div class="trouble-a">Token stimmt nicht. Logs neu lesen: <code>docker logs stackbase-agent</code> und Token in Stack-Base aktualisieren.</div>
    </div>

    <div class="trouble-item">
      <div class="trouble-q">CPU zeigt 0 % oder Container-Metriken fehlen</div>
      <div class="trouble-a">Container-Name prüfen: <code>docker ps --format '{{.Names}}'</code> · Docker-Socket muss gemountet sein: <code>-v /var/run/docker.sock:/var/run/docker.sock</code></div>
    </div>

    <div class="trouble-item">
      <div class="trouble-q">Agent nach Server-Neustart weg</div>
      <div class="trouble-a"><code>--restart unless-stopped</code> im <code>docker run</code>-Befehl nicht vergessen.</div>
    </div>
  </div>

</div>
</div>`;
