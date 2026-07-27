# Stack-Base

Zentrale WebApp-Management-Plattform für eigene Anwendungen — vergleichbar mit dem Azure Portal, aber für selbst entwickelte Apps.

**Version:** v0.1.0-dev

## Features (v0.1.0)

- **App-Verwaltung:** Apps anlegen, einsehen, Status verwalten
- **Dashboard:** Überblick aller Apps mit Status-Counts und letzten Aktivitäten
- **Releases & Changelog:** Versionshistorie pro App
- **Favoriten & Suche:** Schnellzugriff auf häufig genutzte Apps
- **Kategorien, Stacks, Technologien:** Klassifizierung des Tech-Stacks

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| Frontend | Next.js 16, Tailwind v4, shadcn/ui (@base-ui/react) |
| Backend | Next.js API Routes (App Router) |
| ORM | Prisma 7 mit PostgreSQL-Adapter |
| Datenbank | PostgreSQL 17 (Port 5435) |
| Cache | Redis |
| Storage | MinIO |
| Container | Docker Compose |

## Entwicklung

```bash
# Infrastruktur starten
docker compose up -d

# Datenbank migrieren
npx prisma migrate deploy

# Dev-Server
npm run dev
```

App läuft unter [http://localhost:3000](http://localhost:3000).

## Struktur

```
src/
├── app/
│   ├── (app)/          # Route Group mit Sidebar-Layout
│   │   ├── dashboard/
│   │   ├── apps/
│   │   │   ├── [slug]/
│   │   │   └── new/
│   │   └── layout.tsx
│   └── api/            # REST API-Routen
├── components/
│   ├── layout/         # Sidebar
│   ├── apps/           # AppCard, AppStatusBadge
│   └── ui/             # shadcn/ui Komponenten
├── lib/
│   ├── db.ts           # Prisma Client (server-only)
│   ├── server-utils.ts # Server-seitige Hilfsfunktionen
│   └── utils.ts        # cn() — nur Client-sicher
└── generated/prisma/   # Generierter Prisma Client
```

## Offen (nächste Schritte)

- App-Bearbeitungsseite (`/apps/[slug]/edit`)
- Authentifizierung (next-auth v5 + Authentik OIDC)
- Weitere Seiten: Favoriten, Suche, Kategorien, Stacks, Technologien, Einstellungen
