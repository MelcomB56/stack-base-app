@AGENTS.md

# Stack-Base — Code-Bridge

Dieses Projekt ist in **Second Brain** dokumentiert:
`D:\Claude\Projekt_Second_Brain\projects\aktiv\Stack-Base\`

## Schnellreferenz

| Eigenschaft | Wert |
|---|---|
| **GitHub** | https://github.com/MelcomB56/stack-base-app |
| **Domain** | app.stack-base.de |
| **Stack** | Next.js 16 · PostgreSQL 17 · Prisma 7 · Tailwind v4 · Redis |
| **Zielserver** | Hetzner cx33 (⏳ wartet auf Verfügbarkeit) |

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Datenbank + Services starten
docker compose up -d

# Datenbankschema anwenden
npx prisma migrate dev

# Dev-Server starten
npm run dev
```

## Deploy (Production)

```bash
TOKEN=$(gh auth token)
ssh jseifarth@<cx33-ip> "cd ~/stack-base && git pull https://${TOKEN}@github.com/MelcomB56/stack-base-app.git main"
ssh jseifarth@<cx33-ip> "cd ~/stack-base && sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build"
```

## Verbindliche Regel

Kein Modul ohne Spezifikation — alle 10 Pflichtfelder müssen in `projects/aktiv/Stack-Base/modules.md` beschrieben sein.
