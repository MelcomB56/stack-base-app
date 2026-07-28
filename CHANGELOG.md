# Changelog

Alle wesentlichen Änderungen an Stack-Base werden hier dokumentiert.
Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/).

## [0.3.0-dev] — 2026-07-28

### Added

**Login-Seite (Design v2)**
- Hexagon-Logo + STACK·BASE + "One Platform. All Ops." zentriert
- Ambient-Glow-Hintergrundeffekt (radialer Primary-Farbgradient)
- Glassmorphism-Card (bg-card/80 + backdrop-blur)
- Icon-Inputs (Mail, Lock) mit eigenem Styling

**Neue Seiten**
- `/favorites` — App-Grid der gemerkten Favoriten (Session → UserFavorite)
- `/search` — Volltext-Suche über Name, Beschreibung, Sprache, Docker-Image
- `/categories` — Kachel-Grid mit Buchstaben-Avatar, App-Count, Link zu gefilterten Apps
- `/stacks` — 2-Spalten-Karten mit Tech-Chips (max. 5) + App-Count
- `/technologies` — Nach Kategorie gruppiert (Sprache/Frontend/Backend/DB/Infra/Tool/Sonstige)
- `/settings` — Profil-Karte (Name, E-Mail, Rolle, Daten), Sicherheit + Notifications als Platzhalter

## [0.2.1-dev] — 2026-07-28

### Added

**Sidebar-Collapse-Sync**
- Sidebar schreibt `--sidebar-w` (220 → 60 px) via `useEffect` auf `:root`
- AppLayout reagiert per `style={{ marginLeft: "var(--sidebar-w)" }}` mit `transition-[margin]`

**AppCard (Design v2)**
- Farbiger Status-Akzentstreifen oben (grün/blau/gelb/orange/grau je Status)
- Logo-Box mit Status-Farbe als Tint-Hintergrund
- Hover: dezenter Primary-Glow statt nur Border-Tint
- Kategorie-Chips durch Border-Trennlinie abgesetzt

**App-Detail-Seite (Design v2)**
- Breadcrumb-Navigation `Apps > App-Name`
- Hero-Karte mit Status-Streifen, größerem Logo, Inline-Quick-Links (Live, Repository, Staging)
- Meta-Chips als Pill-Reihe (Docker-Image, DB-Typ, Sprache, Kontakt, E-Mail)
- Releases + Changelog schlanker ohne Card-Wrapper

## [0.2.0-dev] — 2026-07-28

### Added

**Auth (next-auth v5)**
- `auth.config.ts` (Edge-safe, kein DB-Import) für Middleware
- `auth.ts` mit Credentials- und optionalem Authentik-OIDC-Provider (bcrypt-Vergleich)
- `middleware.ts` schützt alle Routen außer `/login` und `/api/auth/*`
- Login-Seite (`/login`) mit E-Mail/Passwort-Formular und optionalem SSO-Button
- `SessionProvider` in `providers.tsx` für Client-Komponenten
- Alle 6 Mutations-API-Routen auf Session-Auth umgestellt (kein User-Lookup mehr nötig)

**App-Bearbeitung**
- `/apps/[slug]/edit` — Formular mit vorausgefüllten Feldern, PATCH auf API, Slug-Redirect
- Delete-Button in EditAppForm mit Bestätigungs-Dialog → DELETE → Redirect `/apps`

**Design-System v2**
- Neue Farbpalette: Primary `#2563E8`, Accent Cyan `#22D3EE`, Success `#10B981`, Warning `#F59E0B`, Danger `#EF4444`
- Tieferes Background-Navy (`oklch(0.075 0.025 255)` ≈ `#0B1220`)
- Neue CSS-Tokens: `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--cyan`
- Sidebar-spezifische Farbtokens (`--sidebar`, `--sidebar-foreground`, `--sidebar-border` etc.)

**Layout**
- Sidebar: STACK·BASE Hexagon-Logo mit Tagline, Minimieren-Toggle (220px ↔ 60px), User-Avatar mit Initialen, neue NavLink-Styles mit Dot-Indikator, Abmelden-Button
- Topbar: Global-Suche, Notifications-Bell (Warning-Badge), User-Avatar — in AppLayout integriert

**Dashboard (komplett überarbeitet)**
- 6 StatCards mit Recharts-Sparklines (LineChart, Mock-Daten)
- StatusDonut (PieChart mit innerRadius, Legende, zentrierte Gesamt-Zahl)
- Top-Apps-Liste mit Progress-Bars nach Status-Farbe
- Aktivitäts-Feed mit Timeline-Dots und `timeAgo()`-Funktion
- Server Component (page.tsx) + Client Component (DashboardClient.tsx) mit korrekter Date-Serialisierung

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
