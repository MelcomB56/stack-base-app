# Stack-Base

> Zentrale WebApp-Management-Plattform für eigene Anwendungen — vergleichbar mit dem Azure Portal, aber für selbst entwickelte Apps.

**Version:** v0.8.0 | **Live:** [www.stack-base.de](https://www.stack-base.de)

---

## Features

### App-Verwaltung
- **App-Katalog:** Apps anlegen, bearbeiten, löschen, Status verwalten (Produktion / Entwicklung / Wartung / Archiv)
- **Logo-Upload:** PNG, SVG, WebP, ICO — gespeichert in MinIO, öffentlich via `media.stack-base.de`
- **Favoriten & Suche:** Schnellzugriff, Volltextsuche über alle Apps
- **Kategorien, Stacks, Technologien:** Klassifizierung des Tech-Stacks

### Dashboard
- StatCards mit Recharts-Sparklines, Status-Donut
- Top-Apps, Aktivitäts-Feed, Hosting-Kosten-Widget
- Ankündigungen-Widget (Modul 15)

### Monitoring (Modul 7 + 34)
- **Healthchecks:** alle 5 Minuten per Worker, HTTP-Statusprüfung aller Apps
- **Stack-Base Agent:** portables Go-Binary, deploye auf beliebigem Server; liefert CPU, RAM, Netzwerk per Bearer-Auth (`GET /metrics`)
- **Zertifikat-Monitor (Modul 31):** TLS-Ablaufdaten täglich geprüft, Status VALID/EXPIRING_SOON/EXPIRED
- **Resource Monitor (Modul 34):** CPU/RAM/Netzwerk-Verlauf, Sparklines über 24h

### Pro-App Tabs
| Tab | Inhalt |
|-----|--------|
| Übersicht | Status, URLs, Health Score, Beschreibung |
| Environments | Dev/Staging/Prod mit URL + Status (Modul 27) |
| Abhängigkeiten | Liste + Canvas-Graph (Modul 28) |
| Releases | Versionshistorie mit Changelog-Markdown |
| Kosten | Monatskosten pro Kategorie, Trends (Modul 29) |
| Zertifikat | TLS-Status, Ablaufdatum, Verlauf (Modul 31) |
| Ressourcen | CPU/RAM-Live-Daten via Agent (Modul 34) |
| Screenshots | Mediengalerie |
| Benachrichtigungen | E-Mail bei Statuswechsel (Modul 22) |
| Dokumentation | Markdown-Editor (Handbuch/FAQ/API/Sonstiges) |
| Aktivitäten | Audit-Log aller Aktionen |
| Monitoring | Monitoring-Konfiguration, Incident-Liste |

### Plattform
- **Product Health Score (Modul 39):** 8-Kriterien-Score 0–100, Note A–D, SVG-Ring-Gauge
- **Dependency Graph (Modul 28):** Force-Directed-Canvas-Graph aller App-Beziehungen
- **Plattform-Docs:** Globale Dokumentationsseite (Markdown), Auto-Seed mit Agent-Anleitung
- **Ankündigungen (Modul 15):** Admin-Verwaltung, Dashboard-Widget
- **Deployment-Targets:** Zielumgebungen mit App-Liste und Kostendiagramm
- **Einstellungen:** SMTP, globale Systemkonfiguration, Worker-Status

### Authentifizierung
- Credentials-Login (bcrypt, lokale DB-User)
- Authentik OIDC (optional, via `NEXT_PUBLIC_AUTHENTIK_ENABLED`)

---

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| Frontend | Next.js 16, Tailwind v4, shadcn/ui (@base-ui/react) |
| Backend | Next.js API Routes (App Router) |
| ORM | Prisma 7 mit PostgreSQL-Adapter |
| Datenbank | PostgreSQL 17 |
| Cache | Redis 7 |
| Storage | MinIO |
| Worker | Node.js + node-cron (separater Container) |
| Agent | Go 1.22 (statisches Binary, kein Runtime) |
| Container | Docker Compose |
| Proxy | Traefik |

---

## Entwicklung

### Voraussetzungen

- Node.js 22+, npm
- Docker + Docker Compose

### Setup

```bash
# Infrastruktur starten (Postgres, Redis, MinIO)
docker compose up -d

# Abhängigkeiten installieren
npm install

# Prisma-Client generieren
npx prisma generate

# Datenbank migrieren
npx prisma migrate dev

# Dev-Server + Worker parallel starten
npm run dev:all
```

App läuft unter [http://localhost:3000](http://localhost:3000).

### Nützliche Befehle

```bash
npm run dev          # Nur Next.js
npm run worker       # Nur Worker
npm run dev:all      # Next.js + Worker parallel
npm run build        # Produktions-Build
npx prisma studio    # Datenbank-Browser
npm run seed         # Seed-Daten einspielen
```

---

## Produktion (Docker)

### Stack starten

```bash
docker compose -f docker-compose.prod.yml up -d
```

Der Stack besteht aus 5 Containern: `app`, `worker`, `postgres`, `redis`, `minio`.

### Datenbank-Migration (einmalig / nach Updates)

```bash
docker compose -f docker-compose.prod.yml run --rm \
  --entrypoint "npx prisma migrate deploy" app
```

---

## Umgebungsvariablen

### Pflicht

| Variable | Beschreibung |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL-Connection-String |
| `AUTH_SECRET` | Zufälliger Secret für Next-Auth (min. 32 Zeichen) |
| `AUTH_URL` | Öffentliche URL der App, z.B. `https://www.stack-base.de` |

### Storage (MinIO)

| Variable | Beschreibung |
|----------|-------------|
| `MINIO_ENDPOINT` | Interne URL, z.B. `http://minio:9000` |
| `MINIO_PUBLIC_URL` | Öffentliche URL für Datei-Downloads, z.B. `https://media.stack-base.de` |
| `MINIO_ACCESS_KEY` | MinIO Access Key |
| `MINIO_SECRET_KEY` | MinIO Secret Key |
| `MINIO_BUCKET` | Bucket-Name (Standard: `stack-base`) |
| `MINIO_ROOT_USER` | MinIO Root-User (für MinIO-Container) |
| `MINIO_ROOT_PASSWORD` | MinIO Root-Passwort (für MinIO-Container) |

### Datenbank (für Postgres-Container)

| Variable | Beschreibung |
|----------|-------------|
| `POSTGRES_USER` | Datenbankbenutzer |
| `POSTGRES_PASSWORD` | Datenbankpasswort |
| `POSTGRES_DB` | Datenbankname |

### Optional (Authentik OIDC)

| Variable | Beschreibung |
|----------|-------------|
| `AUTHENTIK_CLIENT_ID` | OAuth2 Client-ID |
| `AUTHENTIK_CLIENT_SECRET` | OAuth2 Client-Secret |
| `AUTHENTIK_ISSUER` | Issuer-URL, z.B. `https://auth.example.com/application/o/stack-base/` |
| `NEXT_PUBLIC_AUTHENTIK_ENABLED` | `true` um OIDC-Login-Button anzuzeigen |

---

## Stack-Base Agent

Der Agent ist ein statisches Go-Binary — kein Runtime, keine Abhängigkeiten.

```bash
# Kompilieren (für Linux x64)
cd agent
GOOS=linux GOARCH=amd64 go build -o stackbase-agent main.go

# Starten (generiert Token automatisch)
./stackbase-agent

# Mit eigenem Token
SB_API_KEY=mein-token ./stackbase-agent

# Als Docker-Container mit Container-Monitoring
SB_CONTAINER=mein-container-name ./stackbase-agent
```

Der Agent lauscht auf Port `9101`. In Stack-Base unter App → Bearbeiten → Integrationen: `Agent URL` und `Agent Token` eintragen.

---

## Verzeichnisstruktur

```
stack-base/
├── agent/                  # Go-Agent (statisches Binary)
│   ├── main.go
│   └── go.mod
├── prisma/                 # Schema + Migrationen
├── public/                 # Statische Assets
├── src/
│   ├── app/
│   │   ├── (app)/          # Route Group mit Sidebar-Layout
│   │   │   ├── dashboard/
│   │   │   ├── apps/[slug]/
│   │   │   ├── docs/
│   │   │   ├── announcements/
│   │   │   └── settings/
│   │   ├── api/            # REST API-Routen
│   │   └── auth/           # Next-Auth Handler
│   ├── components/
│   │   ├── apps/detail/    # App-Detail-Tabs
│   │   ├── dashboard/      # Dashboard-Widgets
│   │   ├── layout/         # Sidebar, Topbar
│   │   └── ui/             # shadcn/ui Basiskomponenten
│   ├── lib/
│   │   ├── db.ts           # Prisma Client (server-only)
│   │   ├── storage.ts      # MinIO Upload/Delete
│   │   ├── healthScore.ts  # Health-Score-Algorithmus
│   │   └── activity.ts     # Aktivitäts-Logging
│   ├── worker/             # Background-Worker (eigener Prozess)
│   │   ├── index.ts        # Cron-Jobs + Heartbeat
│   │   ├── healthcheck.ts  # HTTP-Healthchecks
│   │   ├── certcheck.ts    # TLS-Zertifikat-Prüfung
│   │   └── resourcemonitor.ts # Agent-Abfrage
│   └── generated/prisma/   # Generierter Prisma Client
├── Dockerfile              # Multi-Stage: deps → builder → worker-runner → runner
├── docker-compose.yml      # Entwicklung
└── docker-compose.prod.yml # Produktion (5 Container)
```

---

## Lizenz

Privates Projekt — alle Rechte vorbehalten.
