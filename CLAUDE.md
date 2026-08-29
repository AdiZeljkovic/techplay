# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TechPlay (techplay.gg) is a gaming media platform with three independently deployable components:

- **`backend/`** — Laravel 12 REST API (PHP 8.2+), served via Laravel Octane
- **`frontend/`** — Next.js 16 app (React 19, TypeScript), SSR + ISR
- **`discord/`** — TypeScript Discord bot named "Professor Buffy" (discord.js v14)

Production URLs (site is LIVE): `techplay.gg` (frontend), `api-beta.techplay.gg` (backend API + Filament admin — the "beta" in the hostname is historical, this IS production). There is no separate staging environment; every deploy goes straight to the live site.

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
php artisan env:validate                # Check the config the app will actually run with
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

On the server, deploy through the script — ownership is split and doing it by
hand gets it wrong quietly:

```bash
techplay-deploy.sh              # git pull, both halves, health check
techplay-deploy.sh frontend     # one half
techplay-deploy.sh --no-pull    # when the pull already happened
```

`deploy.sh` is retired (29 Aug 2026) and now only prints where to go: it built
as whoever ran it, which over SSH is root, so it left a root-owned `.next` in a
`techplay` tree and reloaded root's empty pm2 daemon. The frontend half of
`techplay-deploy.sh` hands off to `deployment/deploy_frontend.sh`, which carries
the chunk archive (no ChunkLoadError for open tabs), the `fetch-cache` wipe
(without it admin edits never reach the site), the nginx `/games/` purge, the
Cloudflare purge, and an asset check that reads the pages back. Those five were
missing from the split-ownership script for a day.

**Ownership, since 28 Aug 2026:** `backend/` is `www-data` (octane, reverb,
queue worker), `frontend/` and `discord/` are `techplay` (next-server and the
bot under pm2), the repo root is `root`. A `git pull` as root leaves root-owned
files in a techplay tree and the next build fails on permissions — silently,
until the following restart. The script restores ownership before it builds,
which is the only reason it exists. Nothing runs as root any more except the
pull itself.

---

## Architecture

### Backend — Laravel 12

**API structure:** All endpoints are versioned under `/api/v1/` in `backend/routes/api.php`. Controllers live in `app/Http/Controllers/Api/V1/`. The `ApiResponse` trait (`app/Traits/ApiResponse.php`) standardizes `{ success, data, message }` JSON responses — use it in all controllers.

**Auth:** Laravel Sanctum with Bearer tokens. Token stored in frontend `localStorage`. Discord OAuth and Battle.net OAuth via `SocialAuthController` / `BattleNetAuthController`. No server-side session auth for API routes.

**Content model:** The central article type is `Article` (news, reviews, tech/hardware, guides, videos all share this model via polymorphic category association). Separate `Post` and `Thread` models handle the forum. `Game` is a standalone model populated by the store aggregator (`Services/Releases/BlindCatalogueSync`, `SteamService`, `PlayStationService`), not from MobyGames — that source was retired in the 08/2026 catalogue rebuild. **332,455 rows** (305,581 with a description) since the IGDB import of 20 Aug 2026 — the figure has been wrong in three docs at once, so read it from the database rather than from prose.

**Observers + cache revalidation:** Every content model has an Observer in `app/Observers/`. On publish, update **and delete**, observers call `RevalidationService::revalidateArticle()`, which POSTs to the Next.js `/api/revalidate` endpoint. There used to be two services doing this — `CacheRevalidationService` and `RevalidationService` — which is how `deleted()` came to clear Redis without telling the frontend; they were merged 18 Aug 2026. **All observers are registered in `AppServiceProvider`, and nowhere else** — `ArticleObserver` was also registered in `Article::booted()`, Laravel appends a listener per registration rather than deduplicating, and for two months every publish ran the whole fan-out twice: two Discord announcements, two notification walks, two payouts to the author (fixed 29 Aug 2026, guarded by `tests/Feature/PublishHappensOnceTest.php`).

**Publishing is a model event.** Anything that changes an article's status must go through the model (`$article->update(...)`), never a query-builder `update()` — a bulk update fires no events, so nothing downstream happens. `articles:publish-scheduled` did exactly that until 29 Aug 2026, and scheduled articles reached readers only when a listing TTL happened to lapse.

**Games database:** Built by the store aggregator — `SyncReleases` / `MergeReleases` over `Services/Releases/`, with `SteamService` and `PlayStationService` as sources. MobyGames and RAWG were retired in the 08/2026 rebuild. IGDB was not a source but a one-off import (20–21 Aug 2026) that roughly doubled the catalogue; its staging tables — `igdb_raw`, 8.16M rows and 65% of the database — and all eleven `igdb:*` commands were removed on 29 Aug once the derived data was verified in `games`, `game_external_ids`, `game_links`, `game_relations` and `studios`. The raw pull is archived at `/var/backups/igdb-archive/igdb-staging-2026-08-29.dump` (490 MB) and the tooling is in that commit, if the two are ever wanted together again. Games are stored locally in PostgreSQL; the API **never proxies a live request to a store**. `Game.genres` and `Game.platforms` are `TEXT[]` columns (renamed from `genre_names` / `platform_names` in that rebuild, along with `background_image` → `cover_url`) and are queried with `@> ARRAY[?]::text[]`, which is what the `games_genres_gin` / `games_platforms_gin` indexes answer. The `pgArray()` helper in `GameController` deserialises them when PDO hands them back as strings.

**AI integrations:** WoW character readiness analysis runs on `GroqService`. `BlizzardService` fetches character data from the Blizzard API and `BlizzardDataTransformerV2` minifies it before the model sees it; `RaiderIOService` supplies the rest. `GeminiService` and `OpenAIService` were described here for months and called by nothing — both deleted 18 Aug 2026.

**XP / gamification:** `XpService` awards XP for comments, games added, games completed and game reviews, with a 100 XP/day cap and 60s cooldown. (Article reads award nothing — the constant existed but nothing ever called it, and it was removed on 11 Aug 2026 along with the per-visit view logs.) XP gates rank promotions via `Rank` model. Discord bot mirrors this system through the `/api/v1/discord/xp` endpoint.

**Admin panel:** Filament v5 at `/admin`, 38 resources. There is **no theme package** — `viteTheme('resources/css/filament/admin/theme.css')` compiles the site's own design tokens onto Filament. (This file claimed NeoBrutalism, then Brisk; neither is installed.) Two plugins: `croustibat/filament-jobs-monitor` and `leandrocfe/filament-apex-charts`.

**Key services:**
- `SanitizationService` — XSS protection for all user content
- `ImageService` / `ImageOptimizationService` — upload validation + processing
- `IndexNowService` — pings Bing/Yandex on publish via the `SubmitIndexNow` job
- `SchemaService` — generates JSON-LD structured data
- `PayPalService` + `PayPalWebhookController` — shop orders and subscriptions (signature-verified webhooks)
- `CacheService` / `RevalidationService` — response caching with on-demand Next.js revalidation. The store is **Redis** (`CACHE_STORE=redis`, verified at runtime 28 Aug 2026 — this line has claimed `file` and, before that, Redis; it is Redis). Listing keys are still kept in a register as they are written, which is machinery a file store needed and Redis does not; it is harmless and has not been unwound. **Article cache keys are built by `CacheService::articleShowKey()` and cleared by `forgetArticle()` / `forgetListings()` — never write one out by hand, in code or in a test.** They were spelled in three places once, the versions drifted, and edits stopped reaching readers for an hour while a test that hardcoded the stale key reported green (fixed 19 Aug 2026).

**Real-time:** Laravel Reverb (WebSocket server) + Pusher protocol. Frontend uses `laravel-echo` + `pusher-js`. Events in `app/Events/` broadcast on publish (articles, comments, forum posts, etc.) — for forum content specifically, dispatch happens inside Model Observers (`ThreadObserver`, `ForumPostObserver`), not inline in the controller.

**Queue jobs:** `FlushViewCounters`, `PollSteamPresence`, `PublishArticleFanout`, `SubmitIndexNow`, `SendGiveawayReminders`, `SendReleaseReminders`, `EnrichSteamBatch`, `Sync{Steam,Xbox,Gog,PlayStation,Epic}Library`. (`FetchOgData`, `MobyEnrichmentJob`, `SendChatReminder` and `PingIndexNow` were listed here and do not exist.)

**Two queues, two workers.** `default` carries the heavy work (enrichment, library syncs, the publish fan-out); `live` carries only broadcasts, and has its own process so a chat message does not wait behind a five-minute sync. Events get there through the `BroadcastsOnTheLiveQueue` trait — add it to any new `ShouldBroadcast` event. Worker config lives in `deployment/supervisor-worker.conf` and the deploy script syncs it to `/etc/supervisor/conf.d/`.

**The scheduler runs as `www-data`** (its crontab), not root. Anything Laravel writes — compiled views, caches, `public/sitemap*.xml` — belongs to the `www-data` tree, and a root-run task leaves files the application cannot later overwrite. That is not hypothetical: on 29 Aug 2026 every sitemap was `root:root 644`, so `ArticleObserver` could not have rewritten `sitemap-news.xml` on publish.

**Testing:** PHPUnit, in-memory SQLite for tests (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`). Run `php artisan test`.

### Frontend — Next.js 16

**Routing:** App Router. Pages are under `frontend/app/`. Route groups: `(auth)` for login/register/verify-email. Key sections: `/news`, `/reviews`, `/games`, `/forum`, `/guides`, `/videos`, `/hardware` (tech), `/wow-analyzer`, `/giveaways`, `/shop`, `/profile`, `/settings`, `/friends`, `/messages`.

**Data fetching strategy:** Server components fetch directly from backend at build/request time (`next: { revalidate: N }`). ISR is the primary caching strategy. Image optimization is **on**, with `unoptimized` set per image at the call site for everything that is not ours — game covers, Steam icons, Discord avatars, all already served by someone else's CDN. It read as globally disabled here for months; the switch was inverted because the global setting also stripped `srcset` and `sizes` from our own uploads, so a 412px phone was downloading a 1170px hero JPEG, and Next 16 offers no way back in (a custom loader and `unoptimized: true` both remove the `/_next/image` endpoint that a per-image `unoptimized={false}` would need). See the comment on `images` in `next.config.ts`.

**Auth:** Client-side only. `AuthContext` (`context/AuthContext.tsx`) stores token + user in `localStorage`, restores on mount, verifies in background. Middleware (`middleware.ts`) does not enforce auth — it cannot, since the token lives in `localStorage`. It no longer checks maintenance mode either; that was removed with maintenance mode itself.

**API client:** `lib/api.ts` exports `getApiUrl()` which replaces `localhost` with `127.0.0.1` to avoid IPv6 issues in Node.js SSR. All fetch calls use `process.env.NEXT_PUBLIC_API_URL`.

**Contexts:** `AuthContext`, `CartContext`, `SiteSettingsContext`, `MobileMenuContext` — all wrap the app in `layout.tsx`. (`ThemeContext` was listed here and does not exist; the site is dark only, and `globals.css` carries no light palette or `prefers-color-scheme` block.)

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
| `StatusService` | Bot status rotation |

Slash commands defined in `src/commands/definitions.ts`, dispatched via `src/handlers/commands.ts`. Event handlers (welcome, moderation, challenge reactions) in `src/handlers/events.ts`.

Bot authenticates to the backend using a shared API token (not Sanctum — uses `throttle:300,1` Discord-specific routes).

---

## Key Conventions

**PostgreSQL TEXT[] arrays:** Game genre/platform/tag data is stored as PostgreSQL array columns. When PHP receives values from DB via PDO, they may arrive as raw strings like `{Action,"Role-Playing (RPG)"}`. Always pass through the `pgArray()` helper before using `array_map` or similar PHP array functions.

**Content revalidation flow:** Publish, update or delete an Article → Observer fires → `RevalidationService::revalidateArticle()` → POST to `{FRONTEND_URL}/api/revalidate` with Bearer **`REVALIDATE_SECRET_TOKEN`** (not `REVALIDATION_SECRET`; both names were in circulation and the endpoint reads either) → Next purges by **tag**. Note `revalidatePath()` on a dynamic route is a no-op in Next 16 — the tag purge is what actually works.

**N+1 prevention:** `Model::preventLazyLoading(!app()->isProduction())` is enabled in `AppServiceProvider`. All new queries must eager-load relationships. Violations throw in dev/staging.

**Maintenance mode:** removed (18 Aug 2026). The middleware that polled `/api/v1/system/status` and the `/coming-soon` page were deleted some time earlier; the `maintenance_mode` setting outlived both, still toggleable from the admin and connected to nothing, so switching it on would have claimed the site was down while the site kept serving. To take the site down deliberately, use `php artisan down` or nginx — neither costs a database round trip per request. `/api/v1/system/status` still exists as a liveness ping for the Discord bot.


---

## Documentation

Full project documentation is in `/docs/`. Always read before major changes:

| When | Read |
|------|------|
| Any change | `docs/10-features-map.md` (feature status) |
| Frontend changes | `docs/04-frontend-map.md`, `docs/23-frontend-backend-connections.md` |
| Backend/API changes | `docs/05-backend-map.md`, `docs/08-api-map.md` |
| Database changes | `docs/07-database-map.md` |
| Discord bot changes | `docs/18-discord-bot-map.md` |
| Architecture questions | `docs/02-system-architecture.md` |
| AI agent onboarding | `docs/32-future-ai-instructions.md` |

Update the relevant doc file after every code change.

---

## Platform Areas

TechPlay.gg is NOT just a gaming news blog. Platform areas:
- News (SEO trafik)
- Reviews (kredibilitet + SEO)
- Tech/Hardware (affiliate monetizacija)
- Guides (community + SEO)
- Game Database (SEO at scale, tisuće stranica)
- Release Calendar (recurring visits)
- Forum (community, retention)
- User Profiles + XP + Achievements (retention, gamification)
- Comments (engagement)
- Discord Bot (Professor Buffy — bridging web i Discord)
- Shop + Giveaways (monetizacija + lead gen)
- WoW Analyzer (niche tool, diferencijacija)

---

## Rules

- Always inspect existing code before making assumptions
- Do not break existing public routes or SEO pages
- Do not remove features without explicit instruction
- Keep frontend, backend, admin panel, database and Discord bot aligned
- When changing frontend behavior, check related API and backend logic
- When changing backend/API behavior, check frontend usage
- When changing database structure, update `docs/07-database-map.md`
- When implementing new features, update `/docs`
- If something is unclear, write UNKNOWN and ask for clarification
- Prefer small, safe changes over large risky rewrites
- Always use `SanitizationService` for user-generated content
- Always use `ApiResponse` trait in controllers

---

## Product Direction

- News brings traffic
- Reviews bring credibility
- Game Database brings SEO scale
- Release Calendar brings recurring visits
- Forum brings community
- Profiles bring retention
- XP and achievements bring engagement
- Discord bot connects website and community
- Hardware/Tech content brings sponsorship and monetization potential

Avoid: generic blog structure, duplicated logic, undocumented hidden behavior, frontend-only features without backend support, unsafe Discord token handling.
