# Changelog

Alle wesentlichen Änderungen an Stack-Base werden in dieser Datei dokumentiert.
Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [0.7.7] – 2026-08-07

### Hinzugefügt
- **PermissionsContext** (`src/lib/permissions-context.tsx`) — Client-seitiger Provider + `useCan()` Hook macht `allowedPerms` app-weit per React Context verfügbar

### Geändert
- **AppDetailActions:** "Bearbeiten"-Link nur sichtbar wenn `apps.update`
- **AnnouncementsClient:** Erstellen-Button nur bei `announcements.create`, Pin/Unpin nur bei `announcements.update`, Löschen-Menü nur bei `announcements.delete`
- **CategoriesManager:** Neue/Bearbeiten/Löschen-Buttons nur bei entsprechenden `categories.*`-Permissions
- **StacksManager:** Neue/Bearbeiten/Löschen-Buttons nur bei `stacks.*`
- **TagsManager:** Neue/Bearbeiten/Löschen-Buttons nur bei `tags.*`
- **TechnologiesManager:** Neue/Bearbeiten/Löschen-Buttons nur bei `technologies.*`
- **TargetsClient:** Status-Toggle, Bearbeiten, Löschen nur bei `targets.update/delete`, Neues-Target-Block nur bei `targets.create`
- **Apps-Seite:** "Neue App"-Button nur bei `apps.create` (serverseitig geprüft)

---

## [0.7.6] – 2026-08-07

### Geändert
- **Sidebar:** Nav-Items ohne Berechtigung werden ausgeblendet (permission-basierte Filterung)
- **Sidebar:** Verwaltungs-Sektion wird komplett ausgeblendet wenn der User keine einzige Verwaltungs-Permission hat
- **Layout (app):** Server Component lädt Permissions einmalig pro Request, gibt `allowedPerms` als Prop an Sidebar — kein Client-seitiger DB-Zugriff nötig
- ADMIN/SUPER_ADMIN erhalten Wildcard `*` und sehen alle Items

---

## [0.7.5] – 2026-08-06

### Geändert
- **Topbar:** Avatar-Bild aus Session anzeigen (bisher immer nur Initialen) + Klick führt zur Profilseite
- **auth.ts:** Avatar-URL (avatarUrl) wird bei Sign-in aus DB in JWT geladen (`token.picture`) + `trigger === "update"` Unterstützung für sofortige Session-Aktualisierung nach Upload
- **Sidebar:** Versionsnummer 0.7.5

### Behoben
- Avatar nach Upload erscheint nun sofort in Sidebar und Topbar (vorher wurde das Token nicht korrekt befüllt)

---

## [0.7.4] – 2026-08-06

### Geändert
- **AnnouncementsWidget (Dashboard):** Zwei-Spalten-Layout wiederhergestellt (Featured links + Kompaktliste rechts) mit neuen Gradient-Icon-Boxen und NEU-Badge — kein Dashboard-Flooding mehr

---

## [0.7.3] – 2026-08-05

### Hinzugefügt
- **Ankündigungs-Seite (`/announcements`):** Redesign mit 68×68px Gradient-Icon-Boxen, keyword-basierter Icon-Zuordnung (Megaphone/Shield/Code/Wrench/Rocket/Bell), NEU-Badge, MoreHorizontal-Dropdown, Footer-Zählzeile
- **Sidebar:** Label "Menü einkappen" + Versionsnummer im Footer

### Geändert
- `AUTH_URL`: Logout-Redirect korrigiert (nicht mehr `0.0.0.0:3000/login`)
- `storage.ts`: `MINIO_PUBLIC_URL` für zurückgegebene Datei-URLs; `MINIO_ENDPOINT` nur intern

### Behoben
- MinIO-Bucket-Policy auf `download` gesetzt (Logos waren privat trotz Upload)
- Monitoring Worker startet jetzt korrekt in Produktion (eigener Docker-Stage `worker-runner`)

---

## [0.7.2] – 2026-07-27

### Hinzugefügt
- Modul 34: Resource Monitor — CPU/RAM-Verlauf via Agent, Sparklines über 24h
- Modul 31: Zertifikat-Monitor — TLS-Ablaufdaten, Status VALID/EXPIRING_SOON/EXPIRED
- Modul 28: Dependency Graph — Force-Directed-Canvas, Beziehungsregister
- Modul 27: Environment Management — Dev/Staging/Prod pro App
- Modul 29: Cost Tracking — Hosting-Kosten pro App, Monatsdiagramm
- Modul 39: Product Health Score — 8 Kriterien, Note A–D, SVG-Ring-Gauge
- Worker-Container als separater Docker-Stage + `.dockerignore`

### Geändert
- Dockerfile: Multi-Stage `deps → builder → worker-runner → runner`
- README: vollständige Dokumentation aller Module, Env-Variablen, Agent-Setup

---

## [0.7.0] – 2026-07-20

### Hinzugefügt
- Modul 15: Ankündigungen — Admin-Verwaltung, Dashboard-Widget
- Modul 22: E-Mail-Benachrichtigungen bei Statuswechsel (SMTP)
- Monitoring-Worker: Cron-Jobs für Healthchecks, Zertifikat-Prüfung, Agent-Abfrage
- Stack-Base Agent: portables Go-Binary, Bearer-Auth, Container-Monitoring

---

## [0.6.0] – 2026-07-10

### Hinzugefügt
- Authentik OIDC als zweiter Login-Provider
- Favoriten (`/favorites`)
- Plattform-Docs (Markdown, Auto-Seed mit Agent-Anleitung)
- Deployment-Targets mit App-Liste und Kostendiagramm

---

## [0.5.0] – 2026-07-01

### Hinzugefügt
- MVP: App-Katalog, Logo-Upload (MinIO), Kategorien, Stacks, Technologien, Tags
- Dashboard mit StatCards, Recharts-Sparklines, Status-Donut
- Pro-App-Tabs: Übersicht, Releases, Aktivitäten, Monitoring, Dokumentation, Screenshots
- Healthchecks via Background-Worker
- PostgreSQL + Prisma, Redis, Docker Compose
- Traefik-Proxy auf `www.stack-base.de`
