# TechPlay

Gaming media platform — news, reviews, a games database, a forum, profiles with
XP and clans, a shop and giveaways. Live at **techplay.gg**, with the API and
admin at **api-beta.techplay.gg** (the "beta" is historical; that *is*
production).

Three independently deployable parts:

| | What | Stack |
|---|---|---|
| `backend/` | REST API + Filament admin | Laravel 12, PHP 8.3, PostgreSQL, Redis, Octane |
| `frontend/` | The site | Next.js 16 (App Router), React 19, TypeScript |
| `discord/` | "Professor Buffy" bot | discord.js v14, TypeScript |

---

## Running it locally

Start the backend first — the frontend renders against it on the server, so it
will not come up cleanly on its own.

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Then edit `.env`. The defaults will boot, but not against the real stack:

- `DB_CONNECTION=pgsql` — the example says `sqlite`, which is what the test
  suite uses. Production is Postgres, and some code paths are Postgres-only.
- `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD`
- `REDIS_CLIENT=phpredis` — `predis` works but is slower under Octane
- `FRONTEND_URL=http://localhost:3000` — **one URL, not a list**. Several
  things concatenate it directly.

```bash
php artisan migrate --seed
php artisan storage:link
composer dev          # serves API, queue worker, logs and Vite together
```

The admin panel is at `/admin`.

### 2. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

The variables that matter, and the two that are easy to miss:

| Variable | Why |
|---|---|
| `NEXT_PUBLIC_API_URL` | What the browser calls, e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_STORAGE_URL` | Where uploads live, e.g. `http://localhost:8000/storage` |
| `NEXT_PRIVATE_API_URL` | **Server-side only.** SSR uses this to reach the API directly instead of going back out through Cloudflare. Without it, server rendering is slow and can be blocked. |
| `REVALIDATE_SECRET_TOKEN` | **Must match the backend's.** This is how publishing an article purges the cache; when the two names drifted apart, edited articles silently never went live. |
| `INTERNAL_API_TOKEN` | Must match the backend's. Exempts SSR from the per-IP rate limit — without it every server render shares one budget. |

### 3. Discord bot (optional for site work)

```bash
cd discord
npm install
cp .env.example .env    # DISCORD_TOKEN, API_URL, DISCORD_BOT_SECRET
npm run dev
```

---

## Commands worth knowing

```bash
# backend
php artisan test                     # 356 tests, in-memory SQLite
vendor/bin/pint                      # formatter
php artisan env:validate             # checks required env vars

# frontend
npm run build
npx tsc --noEmit                     # what CI type-checks
npm run lint
```

CI (`.github/workflows/ci.yml`) runs the backend tests, a frontend type check
and lint, and a bot type check on every push and pull request.

---

## Deploying

```bash
cd /var/www/techplay && git pull
cd backend && php artisan migrate --force && php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:* && supervisorctl restart techplay-worker:*
cd /var/www/techplay && bash deployment/deploy_frontend.sh
```

`deploy_frontend.sh` archives the previous build's hashed chunks and merges
them back after building, so browsers holding stale HTML can still fetch the
files it asks for. Restarting Octane uses `supervisorctl restart`, never
`octane:reload` — reload has leaked database connections here before.

More detail, and the things that still need doing, in `docs/`:

- `docs/34-sistemski-pregled-08-2026.md` — the current system audit and work plan
- `docs/02-system-architecture.md` — how the pieces fit
- `docs/04-frontend-map.md`, `docs/05-backend-map.md`, `docs/07-database-map.md`
- `deployment/README.md` — server provisioning

---

## House rules

- Prefer small, reversible changes; the site is live and there is no staging.
- **When you replace something, delete what it replaced in the same commit.**
  Most of the confusion in this codebase came from rewrites that added a second
  implementation and left the first one running.
- All user-generated content goes through `SanitizationService`.
- API controllers answer through the `ApiResponse` trait.
- Update the relevant file in `docs/` with the change.
