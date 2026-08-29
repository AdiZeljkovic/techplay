# TechPlay.gg — Dokumentacija

## Šta je TechPlay.gg?

TechPlay.gg je custom gaming platforma koja kombinuje gaming magazin, game database, release calendar, community forum, korisnički profilni sistem s XP/achievements mehanizmima, Discord bota i vanjska API integracije. Nije generički gaming blog — cilj je postati centralna, premium gaming platforma za globalnu gaming zajednicu.

**Produkcija:** `techplay.gg` (frontend) | `api-beta.techplay.gg` (backend)
**Beta:** `beta.techplay.gg` | `api-beta.techplay.gg`

---

## Kome je namijenjena ova dokumentacija?

- **Developerima** koji rade na projektu — za onboarding i referenentni pregled
- **AI agentima** (Claude Code i sl.) — za kontekst prije većih intervencija
- **Product owneru** — za pregled stanja platforme i planiranje razvoja

---

## Kako koristiti dokumentaciju?

1. Počni s `01-project-overview.md` za visoki pregled
2. Pročitaj `02-system-architecture.md` za razumijevanje arhitekture
3. Za specifičnu funkcionalnost — traži odgovarajući tematski fajl (10–18)
4. Prije AI intervencija — pročitaj `32-future-ai-instructions.md`
5. Za onboarding novog developera — pročitaj `31-maintenance-guide.md`

> **VAŽNO:** Dokumentacija mora biti ažurirana nakon svake veće promjene u kodu!

---

## Sadržaj dokumentacije

| Fajl | Opis |
|------|------|
| [01-project-overview.md](01-project-overview.md) | Visoki pregled platforme, tehnologije, status implementacije |
| [02-system-architecture.md](02-system-architecture.md) | Kompletna arhitektura sistema, komunikacija između dijelova |
| [03-folder-structure.md](03-folder-structure.md) | Detaljna mapa foldera sva tri podsistema |
| [04-frontend-map.md](04-frontend-map.md) | Next.js rute, komponente, konteksti, data fetching |
| [05-backend-map.md](05-backend-map.md) | Laravel kontroleri, modeli, servisi, middleware |
| [06-admin-panel-map.md](06-admin-panel-map.md) | Filament admin resursi i workflow |
| [07-database-map.md](07-database-map.md) | Sve tabele, relacije, pivot tabele, migracije |
| [08-api-map.md](08-api-map.md) | Kompletna lista API endpointa s metodama i auth zahtjevima |
| [09-auth-permissions-map.md](09-auth-permissions-map.md) | Auth flow, role, permisije, zaštita ruta |
| [10-features-map.md](10-features-map.md) | Status svake funkcionalnosti (COMPLETE/PARTIAL/BROKEN) |
| [11-user-flows.md](11-user-flows.md) | Korisničke putanje kroz sistem |
| [12-content-system-map.md](12-content-system-map.md) | Content tipovi, publishing flow, kategorije |
| [13-game-database-map.md](13-game-database-map.md) | Game database, MobyGames import, RAWG integracija |
| [14-release-calendar-map.md](14-release-calendar-map.md) | Release calendar sistem |
| [15-forum-map.md](15-forum-map.md) | Forum kategorije, teme, postovi, moderacija |
| [16-profile-xp-achievements-map.md](16-profile-xp-achievements-map.md) | Profili, XP sistem, achievements |
| [17-comments-map.md](17-comments-map.md) | Comment sistem, moderacija, glasanje |
| [18-discord-bot-map.md](18-discord-bot-map.md) | Professor Buffy bot — komande, servisi, integracija |
| [19-external-integrations.md](19-external-integrations.md) | MobyGames, RAWG, Steam, Blizzard, PayPal, AI servisi |
| [20-seo-map.md](20-seo-map.md) | SEO strategija, meta tagovi, structured data, sitemap |
| [21-jobs-crons-queues-map.md](21-jobs-crons-queues-map.md) | Background jobs, cron commands, queue sistem |
| [22-admin-workflows.md](22-admin-workflows.md) | Admin workflow za svaki tip sadržaja |
| [23-frontend-backend-connections.md](23-frontend-backend-connections.md) | Mapa Frontend stranica → API → Backend → DB |
| [24-security-notes.md](24-security-notes.md) | Sigurnosne napomene i rizici |
| [25-known-issues.md](25-known-issues.md) | Poznati problemi i nedovršene funkcije |
| [26-technical-debt.md](26-technical-debt.md) | Tehnički dug po prioritetu |
| [27-missing-features.md](27-missing-features.md) | Funkcionalnosti koje nedostaju ili su djelimične |
| [28-development-roadmap.md](28-development-roadmap.md) | Razvojni roadmap u fazama |
| [29-business-product-map.md](29-business-product-map.md) | Biznis i product perspektiva |
| [30-architecture-diagrams.md](30-architecture-diagrams.md) | Mermaid dijagrami arhitekture |
| [31-maintenance-guide.md](31-maintenance-guide.md) | Vodič za održavanje i onboarding |
| [32-future-ai-instructions.md](32-future-ai-instructions.md) | Instrukcije za buduće AI sesije |

---

*Dokumentacija generisana: 2026-06-20 | Verzija projekta: Jun 2026*
