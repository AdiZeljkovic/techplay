# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TechPlay (techplay.gg) is a gaming media platform with three independently deployable components:

- **`backend/`** — Laravel 12 REST API (PHP 8.2+), served via Laravel Octane
- **`frontend/`** — Next.js 16 app (React 19, TypeScript), SSR + ISR
- **`discord/`** — TypeScript Discord bot named "Professor Buffy" (discord.js v14)

Production URLs: `techplay.gg` (frontend), `api.techplay.gg` (backend). Beta: `beta.techplay.gg` / `api-beta.techplay.gg`.

---

## Commands

### Backend (run from `backend/`)

```bash
composer dev            # Start all: Laravel server, queue, pail logs, Vite
php artisan serve       # Backend only on :8000
php artisan queue:listen --tries=1
php artisan test                        # All tests
php artisan test --filter TestName      # Single test
php artisan test tests/Feature/GameTest.php
vendor/bin/pint                         # Code formatter (Laravel Pint)
php artisan migrate
php artisan migrate:fresh --seed
php artisan env:validate                # Check required env vars
```

### Frontend (run from `frontend/`)

```bash
npm run dev             # Next.js dev server on :3000
npm run build           # Production build
npm run lint            # ESLint
npm run analyze         # Bundle analyzer (set ANALYZE=true)
```

### Discord Bot (run from `discord/`)

```bash
npm run dev             # ts-node src/index.ts (dev, with live reload)
npm run build           # tsc
npm start               # node dist/index.js (production)
```

### Deployment

```powershell
./deployment/push_and_deploy.ps1   # Windows: export DB, git push, SSH deploy
```

---

## Architecture

### Backend — Laravel 12

**API structure:** All endpoints are versioned under `/api/v1/` in `backend/routes/api.php`. Controllers live in `app/Http/Controllers/Api/V1/`. The `ApiResponse` trait (`app/Traits/ApiResponse.php`) standardizes `{ success, data, message }` JSON responses — use it in all controllers.

**Auth:** Laravel Sanctum with Bearer tokens. Token stored in frontend `localStorage`. Discord OAuth and Battle.net OAuth via `SocialAuthController` / `BattleNetAuthController`. No server-side session auth for API routes.

**Content model:** The central article type is `Article` (news, reviews, tech/hardware, guides, videos all share this model via polymorphic category association). Separate `Post` and `Thread` models handle the forum. `Game` is a standalone model populated from MobyGames.

**Observers + cache revalidation:** Every content model has an Observer in `app/Observers/`. On publish/update, observers call `CacheRevalidationService::revalidateArticle()`, which POSTs to the Next.js `/api/revalidate` endpoint to invalidate ISR cache. All observers are registered in `AppServiceProvider`.

**Games database:** Populated from MobyGames API (`MobyGamesService`). Games are stored locally in PostgreSQL — the API **never proxies live MobyGames requests**. `Game.genre_names` and `Game.platform_names` are PostgreSQL `TEXT[]` columns; queries use `@> ARRAY[?]::text[]` syntax. The `pgArray()` helper in `GameController` handles deserializing these when PHP receives them as strings.

**AI integrations:** `GeminiService` (Gemini 2.5 Flash) and `OpenAIService` (GPT-4 Turbo) both provide WoW character readiness analysis. `BlizzardService` fetches character data from the Blizzard API; `BlizzardDataTransformer` / `BlizzardDataTransformerV2` minify it before passing to AI. `GroqService` is available for fast inference.

**XP / gamification:** `XpService` awards XP for comments and article reads with a 100 XP/day cap and 60s cooldown. XP gates rank promotions via `Rank` model. Discord bot mirrors this system through the `/api/v1/discord/xp` endpoint.

**Admin panel:** Filament v5 at `/admin`. Resources cover all content types. Uses the NeoBrutalism theme (`caresome/filament-neobrutalism-theme`).

**Key services:**
- `SanitizationService` — XSS protection for all user content
- `ImageService` / `ImageOptimizationService` — upload validation + processing
- `IndexNowService` — pings Bing/Yandex on publish via `PingIndexNow` job
- `SchemaService` — generates JSON-LD structured data
- `PayPalService` + `PayPalWebhookController` — shop orders and subscriptions (signature-verified webhooks)
- `CacheService` / `RevalidationService` — Redis-backed caching with on-demand Next.js revalidation

**Real-time:** Laravel Reverb (WebSocket server) + Pusher protocol. Frontend uses `laravel-echo` + `pusher-js`. Events in `app/Events/` broadcast on publish (articles, comments, forum posts, etc.).

**Queue jobs:** `FetchOgData`, `FlushViewCounters`, `MobyEnrichmentJob`, `PingIndexNow`, `SubmitIndexNow`, `SendGiveawayReminders`, `SendChatReminder`.

**Testing:** PHPUnit, in-memory SQLite for tests (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`). Run `php artisan test`.

### Frontend — Next.js 16

**Routing:** App Router. Pages are under `frontend/app/`. Route groups: `(auth)` for login/register/verify-email. Key sections: `/news`, `/reviews`, `/games`, `/forum`, `/guides`, `/videos`, `/hardware` (tech), `/wow-analyzer`, `/giveaways`, `/shop`, `/profile`, `/settings`, `/friends`, `/messages`.

**Data fetching strategy:** Server components fetch directly from backend at build/request time (`next: { revalidate: N }`). ISR is the primary caching strategy. Image optimization is **disabled** (`images: { unoptimized: true }`) to avoid disk exhaustion from the large game image library.

**Auth:** Client-side only. `AuthContext` (`context/AuthContext.tsx`) stores token + user in `localStorage`, restores on mount, verifies in background. Middleware (`middleware.ts`) only handles maintenance mode checks — it does not enforce auth (cannot access localStorage server-side).

**API client:** `lib/api.ts` exports `getApiUrl()` which replaces `localhost` with `127.0.0.1` to avoid IPv6 issues in Node.js SSR. All fetch calls use `process.env.NEXT_PUBLIC_API_URL`.

**Contexts:** `AuthContext`, `CartContext`, `ThemeContext`, `SiteSettingsContext`, `MobileMenuContext` — all wrap the app in `layout.tsx`.

**SEO:** `GlobalSeo` component renders dynamic meta tags. `SchemaService` (backend) and inline JSON-LD in `layout.tsx` provide Organization + WebSite structured data. `SeoMeta` / `PageSeo` models allow per-page SEO overrides via the admin panel.

**Environment variables:**
- `NEXT_PUBLIC_API_URL` — e.g., `https://api-beta.techplay.gg/api/v1`
- `NEXT_PUBLIC_STORAGE_URL` — e.g., `https://api-beta.techplay.gg/storage`
- `NEXT_PUBLIC_APP_URL` — frontend base URL
- `REVALIDATION_SECRET` — shared secret for on-demand ISR revalidation

### Discord Bot — Professor Buffy

Single-guild bot. Services are singletons started in the `ClientReady` event:

| Service | Purpose |
|---|---|
| `PollingService` | Polls backend for news/giveaway updates, posts to channels |
| `XpService` | Awards 15 XP/message (60s cooldown), syncs leaderboard |
| `ServerStatsService` | Updates voice channel names with live server stats |
| `TriviaService` | Scheduled gaming trivia questions |
| `RecapService` | Weekly activity recaps |
| `SubscriptionService` | Manages Discord channel subscriptions for news notifications |
| `ChallengeService` | Gaming challenges with reaction-based acceptance |
| `PriveeService` | Integration with Privée giveaway platform |
| `StatusService` | Bot status rotation |

Slash commands defined in `src/commands/definitions.ts`, dispatched via `src/handlers/commands.ts`. Event handlers (welcome, moderation, challenge reactions) in `src/handlers/events.ts`.

Bot authenticates to the backend using a shared API token (not Sanctum — uses `throttle:300,1` Discord-specific routes).

---

## Key Conventions

**PostgreSQL TEXT[] arrays:** Game genre/platform/tag data is stored as PostgreSQL array columns. When PHP receives values from DB via PDO, they may arrive as raw strings like `{Action,"Role-Playing (RPG)"}`. Always pass through the `pgArray()` helper before using `array_map` or similar PHP array functions.

**Content revalidation flow:** Publish/update an Article → Observer fires → `CacheRevalidationService::revalidateArticle()` → POST to `{FRONTEND_URL}/api/revalidate` with Bearer `REVALIDATION_SECRET` → Next.js purges ISR cache for affected paths.

**N+1 prevention:** `Model::preventLazyLoading(!app()->isProduction())` is enabled in `AppServiceProvider`. All new queries must eager-load relationships. Violations throw in dev/staging.

**Maintenance mode:** Controlled via `SiteSetting` model (database-driven). The Next.js middleware polls `/api/v1/system/status` on every page request and redirects to `/coming-soon` when `maintenance_mode === true`. Bypass via `techplay_maintenance_bypass` cookie.

**Privée giveaways:** Separate auth flow from TechPlay accounts. `PriveeGiveawayController` handles Google OAuth and Privée-specific login — no Sanctum token required.
