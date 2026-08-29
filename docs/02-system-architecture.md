# 02 — System Architecture

## Pregled arhitekture

TechPlay.gg se sastoji od tri samostalno deployabilna komponenta koja međusobno komuniciraju kroz definisane API i WebSocket interfejse.

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
│                                                             │
│  Korisnik ──→ techplay.gg ──→ [ Next.js Frontend ]        │
│  Korisnik ──→ api-beta.techplay.gg → [ Laravel Backend ]        │
│  Admin ──────────────────────→ [ Filament Admin Panel ]    │
│  Discord Server ─────────────→ [ Professor Buffy Bot ]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Komunikacija između komponenti

### Frontend ↔ Backend
- Frontend šalje HTTP REST API pozive na `api-beta.techplay.gg/api/v1/*`
- Server Components fetchuju direktno za SSR/ISR
- Client Components koriste `lib/api.ts` i custom hooks
- Auth: Bearer token u `Authorization` headeru
- Real-time: `laravel-echo` + `pusher-js` → Laravel Reverb WebSocket

### Backend ↔ Database (PostgreSQL)
- Laravel Eloquent ORM
- Sve poslovne operacije kroz modele
- Redis za cache i job queue
- N+1 zaštita: `Model::preventLazyLoading(!app()->isProduction())`

### Backend → Frontend (Cache revalidacija)
- Observer na modelu (npr. `ArticleObserver`) detektuje publish/update
- Poziva `CacheRevalidationService::revalidateArticle()`
- Šalje POST na `{FRONTEND_URL}/api/revalidate` s Bearer `REVALIDATION_SECRET`
- Next.js purge ISR cache za pogođene putanje

### Discord Bot ↔ Backend
- Bot komunicira s backendom kroz `api-beta.techplay.gg/api/v1/discord/*`
- Autentifikacija: zajednički `DISCORD_BOT_SECRET` (ne Sanctum token)
- Dedicated route middleware: `throttle:300,1`
- Bot NEMA direktan pristup bazi podataka

### Admin Panel ↔ Backend
- Filament v5 je integrisan unutar Laravel aplikacije (`/admin`)
- Koristi iste modele, ali direktno kroz Eloquent (ne API)
- Ima vlastiti auth guard (Filament panel provider)

---

## Stack po slojevima

### Prezentacijski sloj (Frontend)
```
browser → Next.js App Router → React Server Components → ISR/SSR
                             → React Client Components → REST API
                             → WebSocket (Reverb/Pusher) → real-time
```

### API sloj (Backend)
```
HTTP request → Laravel Router → Middleware stack:
  - SecurityHeaders
  - throttle:60,1 (public)
  - throttle:300,1 (Discord bot)
  - auth:sanctum (protected)
  → Controller → Service → Eloquent Model → PostgreSQL
                         → Redis (cache)
                         → Job Queue (Redis)
                         → Reverb WebSocket Event
```

### Background sloj
```
Redis Queue → Job worker → FetchOgData / FlushViewCounters /
                           MobyEnrichmentJob / PingIndexNow /
                           PollSteamPresence / SendGiveawayReminders /
                           SyncSteamLibrary / SendChatReminder /
                           SubmitIndexNow
```

### Scheduled sloj (Artisan Commands)
```
Cron → php artisan schedule:run → Artisan Commands:
  - PublishScheduledArticles
  - GenerateSitemap
  - FlushViewCounters
  - SyncAchievements
  - SnapshotReputation
  - CheckWishlistReleases
  - CleanOldViewTracking
  - ScanBrokenLinks
  - SyncAdMetrics
  - SyncUserXP
```

---

## Environment varijable

### Backend (`backend/.env`)
| Varijabla | Opis |
|-----------|------|
| `APP_URL` | Backend base URL |
| `FRONTEND_URL` | Frontend URL za revalidaciju |
| `DB_CONNECTION` | `pgsql` (prod) / `sqlite` (test) |
| `REDIS_HOST` | Redis server |
| `QUEUE_CONNECTION` | `redis` |
| `BROADCAST_CONNECTION` | `reverb` |
| `REVERB_*` | Reverb WebSocket config |
| `DISCORD_BOT_SECRET` | Shared secret za bota |
| `REVALIDATE_SECRET_TOKEN` | Next.js revalidacija secret |
| `INDEXNOW_KEY` | IndexNow key |
| `SANCTUM_STATEFUL_DOMAINS` | Dozvoljeni domeni za Sanctum |
| `BLIZZARD_CLIENT_ID/SECRET` | Battle.net OAuth |
| `DISCORD_CLIENT_ID/SECRET` | Discord OAuth |
| `PAYPAL_CLIENT_ID/SECRET` | PayPal integracija |
| `OPENAI_API_KEY` | GPT-4 Turbo |
| `GEMINI_API_KEY` | Gemini 2.5 Flash |
| `GROQ_API_KEY` | Groq inferencija |
| `RAWG_API_KEY` | RAWG game data |
| `STEAM_API_KEY` | Steam Web API |
| `RAIDERIO_*` | RaiderIO API |
| `MOBY_API_KEY` | MobyGames API |

### Frontend (`frontend/.env.local`)
| Varijabla | Opis |
|-----------|------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_STORAGE_URL` | Storage URL za slike |
| `NEXT_PUBLIC_APP_URL` | Frontend base URL |
| `REVALIDATION_SECRET` | Secret za on-demand ISR |
| `NEXT_PUBLIC_REVERB_*` | WebSocket config |

### Discord Bot (`discord/.env`)
| Varijabla | Opis |
|-----------|------|
| `DISCORD_TOKEN` | Bot token |
| `DISCORD_CLIENT_ID` | App ID |
| `DISCORD_GUILD_ID` | Server ID |
| `DISCORD_BOT_SECRET` | Backend auth secret |
| `API_URL` | Backend API base URL |
| `RECAP_CHANNEL_ID` | Channel za weekly recap |
| `LATEST_NEWS_CHANNEL_ID` | Channel za news |

---

## Deployment flow

```
Windows → push_and_deploy.ps1:
  1. Export PostgreSQL dump
  2. git add + commit + push
  3. SSH na server
  4. git pull
  5. composer install --no-dev
  6. php artisan migrate
  7. php artisan config:cache
  8. php artisan route:cache
  9. Restart Octane/queue
```

---

## Sistemski zahtjevi (servisi)

- PHP 8.2+ (Octane/FrankenPHP ili Swoole)
- PostgreSQL 14+
- Redis 7+
- Node.js 20+ (za Discord bot)
- Reverb WebSocket server (uključen u Laravel)
