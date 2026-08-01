export const AGENT_GUIDE = `# Stack-Base Agent — Einrichtungsanleitung

Der **Stack-Base Agent** ist ein kleines Programm, das auf deinem Server läuft und Ressourcen-Daten sammelt (CPU, RAM, Netzwerk). Stack-Base fragt den Agent regelmäßig ab und zeigt die Daten im **Ressourcen-Tab** der App.

Es gibt zwei Modi:
- **Container-Monitoring** — überwacht einen bestimmten Docker-Container
- **System-Metriken** — überwacht den gesamten Server (CPU/RAM/Netzwerk des Hosts)

---

## Voraussetzungen

- Docker ist auf dem Zielserver installiert
- Port **9101** ist von Stack-Base aus erreichbar (ggf. Firewall-Freigabe nötig)
- Bei Container-Monitoring: Der zu überwachende Container läuft bereits

---

## Schritt 1 — Agent starten

### Variante A: Mit Container-Monitoring

Überwacht einen bestimmten Docker-Container. \`SB_CONTAINER\` muss den exakten Namen des Containers enthalten.

\`\`\`bash
docker run -d --name stackbase-agent \\
  --restart unless-stopped \\
  -p 9101:9101 \\
  -e SB_CONTAINER=mein-container-name \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  ghcr.io/melcomb56/stackbase-agent:latest
\`\`\`

> Container-Namen prüfen: \`docker ps\`

### Variante B: Nur Host-System-Metriken

Überwacht den gesamten Server. Kein Docker-Socket nötig.

\`\`\`bash
docker run -d --name stackbase-agent \\
  --restart unless-stopped \\
  -p 9101:9101 \\
  ghcr.io/melcomb56/stackbase-agent:latest
\`\`\`

---

## Schritt 2 — Token aus den Logs kopieren

Der Agent generiert beim ersten Start automatisch einen Zugriffstoken:

\`\`\`bash
docker logs stackbase-agent
\`\`\`

In der Ausgabe erscheint:

\`\`\`
====================================
  Stack-Base Agent v1.0
====================================
  Port:  :9101
  Token: sb_a3f8c2d1e4b7...
====================================
\`\`\`

Den kompletten Wert ab \`sb_\` für Schritt 3 kopieren.

---

## Schritt 3 — In Stack-Base eintragen

App öffnen → **Bearbeiten** → Abschnitt **Ressourcen-Monitoring**:

| Feld | Wert |
|------|------|
| Agent-URL | \`http://SERVER-IP:9101\` |
| Agent-Token | Token aus Schritt 2 |

Nach dem Speichern → Tab **Ressourcen** → **Jetzt abfragen** klicken.

---

## Optional — Eigenen Token setzen

Damit der Token nach einem Container-Neustart gleich bleibt:

\`\`\`bash
docker run -d --name stackbase-agent \\
  --restart unless-stopped \\
  -p 9101:9101 \\
  -e SB_API_KEY=mein-geheimer-token \\
  ghcr.io/melcomb56/stackbase-agent:latest
\`\`\`

Einen langen, zufälligen Wert wählen (mindestens 20 Zeichen).

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| „Connection refused" | Firewall prüfen: \`ufw allow 9101\`; Container-Status: \`docker ps \\| grep stackbase-agent\` |
| „Unauthorized" (401) | Token stimmt nicht — Logs neu lesen: \`docker logs stackbase-agent\` |
| CPU zeigt 0 % | Container-Name prüfen: \`docker ps --format '{{.Names}}'\`; Docker-Socket muss gemountet sein |
| Agent nach Neustart weg | \`--restart unless-stopped\` nicht vergessen |
`;
