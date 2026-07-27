# Changelog

Alle wesentlichen Änderungen an Stack-Base werden hier dokumentiert.
Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/).

## [0.1.0-dev] — 2026-07-27

### Added

**Frontend**
- Sidebar-Navigation mit aktiven States, Tooltips und Versionsnummer
- Dashboard-Seite mit App-Statistiken (Status-Counts, letzte Aktivitäten)
- Apps-Übersicht mit Text-/Status-/Kategorie-Filter und App-Kacheln (AppCard)
- App-Detail-Seite mit Tabs (Übersicht, Releases, Changelog), Metadaten, externe Links
- Neue-App-Formular (Basis-Informationen, URLs, Infrastruktur, Kontakt)
- Dark-Navy-Theme (erzwungener Dark Mode via `dark` class auf `<html>`)
- Route Group `(app)/` mit Sidebar-Layout für alle App-Seiten
- Root `/` redirectet auf `/dashboard`

**shadcn/ui + Komponenten**
- shadcn/ui mit @base-ui/react installiert und konfiguriert
- UI-Komponenten: button, card, input, select, badge, table, tabs, tooltip, label, textarea, separator, dialog, dropdown-menu, command, avatar
- AppStatusBadge: farbige Status-Badges mit Dot-Indikator
- AppCard: App-Kachel mit Logo-Fallback und Status

**API**
- Vollständige REST-API: Apps, Kategorien, Tags, Stacks, Technologien
- Releases & Changelog pro App (CRUD)
- Favoriten (Hinzufügen/Entfernen)
- Globale Suche
- Dashboard-Statistiken

**Infrastruktur**
- `server-utils.ts` (server-only) für DB-Hilfsfunktionen (slugify, apiError)
- `utils.ts` auf reines `cn()` reduziert (Client-Bundle-Sicherheit)
- `next.config.ts`: serverExternalPackages für Prisma/pg

### Changed

- `utils.ts`: DB-Imports entfernt (nur noch `cn()`)
- `db.ts`: `import "server-only"` ergänzt
- Alle API-Routen: `apiError` Import von `@/lib/utils` auf `@/lib/server-utils` umgestellt

## [0.0.3] — vor 2026-07-27

### Added

- Vollständige Prisma-Schema-Migration (Apps, Categories, Tags, Stacks, Technologies, Releases, Changelog, Favorites, ActivityLog, Users)
- Prisma Client generiert nach `src/generated/prisma/`

## [0.0.2] — vor 2026-07-27

### Added

- Basis-API-Routen: App-CRUD, Kategorien, Tags, Stacks, Technologien, Releases, Changelog, Favorites, Search
- Validierungsschemas mit Zod v4
- Seed-Script: 10 Kategorien, 15 Technologien

## [0.0.1] — vor 2026-07-27

### Added

- Initiales Next.js 16 Grundgerüst (App Router, TypeScript, Tailwind v4, `src/`)
- Docker Compose: PostgreSQL (5435), Redis, MinIO, App
- Prisma 7 mit `@prisma/adapter-pg` und PrismaPg-Adapter
- `@/` Import-Alias
