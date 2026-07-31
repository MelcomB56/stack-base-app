# Stack-Base

Zentrale WebApp-Management-Plattform für eigene Anwendungen — vergleichbar mit dem Azure Portal, aber für selbst entwickelte Apps.

**Version:** v0.4.7-dev

## Features (v0.1.0)

- **Auth:** next-auth v5 mit Credentials-Login (bcrypt) + optionalem Authentik OIDC
- **App-Verwaltung:** Apps anlegen, bearbeiten, löschen, Status verwalten
- **Dashboard:** StatCards mit Recharts-Sparklines, Status-Donut, Top-Apps, Aktivitäts-Feed
- **Releases & Changelog:** Versionshistorie pro App
- **Favoriten & Suche:** Schnellzugriff auf häufig genutzte Apps
- **Kategorien, Stacks, Technologien:** Klassifizierung des Tech-Stacks
- **Design-System v2:** Navy-Farbpalette mit Cyan-Akzent, kollapsierbare Sidebar, Topbar

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
│   ├── layout/         # Sidebar, Topbar
│   ├── dashboard/      # DashboardClient (Recharts)
│   ├── apps/           # AppCard, AppStatusBadge, EditAppForm
│   └── ui/             # shadcn/ui Komponenten
├── lib/
│   ├── db.ts           # Prisma Client (server-only)
│   ├── server-utils.ts # Server-seitige Hilfsfunktionen
│   └── utils.ts        # cn() — nur Client-sicher
└── generated/prisma/   # Generierter Prisma Client
```

## Umgebungsvariablen

```env
# Pflicht
DATABASE_URL=postgresql://...
AUTH_SECRET=<zufälliger Secret>

# Optionales Authentik OIDC
AUTHENTIK_CLIENT_ID=...
AUTHENTIK_CLIENT_SECRET=...
AUTHENTIK_ISSUER=https://auth.example.com/application/o/stack-base/
NEXT_PUBLIC_AUTHENTIK_ENABLED=true
```

## Offen (nächste Schritte)

- Favoriten-Toggle auf App-Detail-Seite (Herz-Button → API-Call)
- Authentik OIDC: OAuth2-App in Authentik anlegen, Redirect URI konfigurieren
- Kategorien/Stacks/Technologien: Verwaltungs-CRUD (anlegen, bearbeiten, löschen)
- Passwort-Änderung + 2FA in Einstellungen
