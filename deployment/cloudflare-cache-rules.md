# Cloudflare Edge Cache Configuration for TechPlay

> **Status, 17 August 2026 — read this before the rest of the file.**
>
> The zone was read through the API. Seven cache rules exist, and four of them
> cache nothing at all: `Cache Home API`, `Cache News API`, `Cache Navigation
> API` and `Cache Settings API` each carry `"cache": true` together with
> `edge_ttl.mode = "bypass_by_default"`, which is a contradiction — eligible for
> cache, then bypassed. They should be deleted rather than trusted.
>
> Measured on the live site the same day:
>
> | URL | `cf-cache-status` | why |
> |---|---|---|
> | `/_next/static/…` | `HIT` | the one rule that works |
> | `/news` | `DYNAMIC` | no rule marks HTML cacheable, so a perfectly good `s-maxage=300` is ignored |
> | `/games/evoland` | `BYPASS` | origin sends `no-store`; the rule that exists does not override it |
>
> **The game pages no longer depend on this.** nginx caches them at the origin
> instead — see `nginx-games-cache.conf`, which works whether or not the edge is
> ever configured. What is still open at the edge is HTML in general, and one
> rule that is actively harmful:
>
> **Rate limiting → "Games scraper protection"** blocks anything exceeding 50
> requests per 10 seconds on `/games/*`, with no exemption for search engines.
> Googlebot walking a 114,000-page catalogue goes faster than that. The
> expression needs `and not cf.client.bot` appended — that field is true only
> for crawlers Cloudflare itself verifies, so a scraper gains nothing.
>
> A script that applies all of this is in the session scratchpad
> (`cf_apply.py`); it backs each ruleset up to JSON before writing.
>
> The 14400 below is nobody's decision — it is Cloudflare's default Browser
> Cache TTL of 4 hours, applied because the origin sent no `Cache-Control`.

---

## Step 0: Browser Cache TTL — do this first

**Caching → Configuration → Browser Cache TTL → `Respect Existing Headers`**

Everything else here is about the *edge*. This one setting is about what the
*visitor's browser* is told, and while it says "4 hours" Cloudflare overwrites
whatever the origin sends.

The origin is now correct: nginx serves `/storage/` from disk with
`public, max-age=31536000, immutable` (see `nginx-storage-cache.conf`). Those
filenames are ULIDs and the files never change. Until this dropdown is
switched, every returning visitor still re-downloads all of it twice a day.

Verify:

```bash
curl -sI https://api-beta.techplay.gg/storage/articles/<any>.jpg | grep -i cache-control
# want: public, max-age=31536000, immutable
```

## Step 1: Enable APO (Automatic Platform Optimization)

If you have a Business plan, enable APO. Otherwise, use manual cache rules below.

---

## Step 2: Configure Cache Rules

Go to: **Cloudflare Dashboard → Rules → Cache Rules**

### Rule 1: Cache API Public Endpoints (60 seconds)

**When incoming requests match:**
```
(http.request.uri.path matches "^/api/v1/(home|news|reviews|guides|videos|tech|navigation|settings|staff)")
```

**Then:**
- Cache eligibility: **Eligible for cache**
- Edge TTL: **60 seconds**
- Browser TTL: **60 seconds**

---

### Rule 2: Cache Static Assets (1 year)

**When incoming requests match:**
```
(http.request.uri.path matches "\.(jpg|jpeg|png|webp|gif|svg|ico|css|js|woff2?)$")
```

**Then:**
- Cache eligibility: **Eligible for cache**
- Edge TTL: **31536000** (1 year)

---

### Rule 3: Bypass Cache for Auth/Write Endpoints

**When incoming requests match:**
```
(http.request.uri.path contains "/auth") or
(http.request.method eq "POST") or
(http.request.method eq "PUT") or
(http.request.method eq "DELETE")
```

**Then:**
- Cache eligibility: **Bypass cache**

---

## Step 3: Add Page Rules (Alternative Method)

If Cache Rules are limited, use Page Rules:

| URL Pattern | Setting | Value |
|-------------|---------|-------|
| `*api-beta.techplay.gg/api/v1/home*` | Cache Level | Cache Everything |
| `*api-beta.techplay.gg/api/v1/home*` | Edge Cache TTL | 1 minute |
| `*api-beta.techplay.gg/api/v1/news*` | Cache Level | Cache Everything |
| `*api-beta.techplay.gg/api/v1/news*` | Edge Cache TTL | 1 minute |

---

## Step 4: Verify Caching Works

After setup, run:
```bash
curl -I https://api-beta.techplay.gg/api/v1/home
```

Look for:
```
cf-cache-status: HIT  ← This means cached!
```

Values:
- `HIT` = Served from Cloudflare edge cache
- `MISS` = Fetched from origin, now cached
- `DYNAMIC` = Not cached

---

## Purge Cache on Publish (Optional)

Add to ArticleObserver to purge Cloudflare cache when publishing:

```php
// Requires Cloudflare API token
Http::withToken(config('services.cloudflare.token'))
    ->post("https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache", [
        'files' => [
            config('app.url') . '/api/v1/home',
            config('app.url') . '/api/v1/news',
        ]
    ]);
```

Add to `.env`:
```
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```
