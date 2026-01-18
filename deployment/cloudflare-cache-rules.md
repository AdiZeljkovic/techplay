# Cloudflare Edge Cache Configuration for TechPlay

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
