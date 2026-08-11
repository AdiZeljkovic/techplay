# 21 — Jobs, Crons & Queues Map

## Queue konfiguracija

- **Driver:** Redis (`QUEUE_CONNECTION=redis`)
- **Worker pokretanje:** `php artisan queue:listen --tries=1`
- **Queue worker** mora biti aktivan u produkciji (supervisor ili systemd)
- Composer dev: `composer dev` pokreće sve zajedno (server + queue + pail + Vite)

---

## Background Jobs (`app/Jobs/`)

| Job | Trigger | Svrha |
|-----|---------|-------|
| `FetchOgData` | Editorial message s URL-om | Fetchuje OG metadata za link preview |
| `FlushViewCounters` | Scheduled (5 min) | Prelije Redis brojače `views:*` u kolone `views`/`view_count` na articles, threads, games, guides i ad_campaigns |
| `MobyEnrichmentJob` | Artisan/observer | Enrich game detalja iz MobyGames API |
| `PingIndexNow` | Observer (publish) | Ping Bing/Yandex za instant indexing |
| `PollSteamPresence` | Scheduled | Polling Steam API za user presence |
| `SendChatReminder` | Scheduled/event | Reminder notifikacija za editorial chat |
| `SendGiveawayReminders` | Scheduled | Email reminders za giveaway koji uskoro ističu |
| `SubmitIndexNow` | Observer (publish) | Submit URL listu IndexNow protokolom |
| `SyncSteamLibrary` | User trigger/scheduled | Sinkronizacija Steam biblioteke u user_games |

### IGDB Jobs (Legacy?)
- `Igdb/` subfolder postoji u Jobs — vjerovatno legacy IGDB job(s)

---

## Artisan komande (Scheduled) (`app/Console/Commands/`)

| Komanda | Svrha | Vjerovatni interval |
|---------|-------|-------------------|
| `PublishScheduledArticles` | Publishuje članak ako je `published_at` u prošlosti | Svaki sat ili svako par minuta |
| `FlushViewCounters` | Redis → DB view counter sync | Svakih 5-15 minuta |
| `SnapshotReputation` | Snapshot XP/rank za sve korisnike | Dnevno |
| `SyncAchievements` | Provjera i dodjela achievementa | Dnevno/satno |
| `CheckWishlistReleases` | Provjera novih release datuma za wishlist | Dnevno |
| `ScanBrokenLinks` | Skan broken linkova | Tjedni |
| `SyncAdMetrics` | Sinkronizacija ad metrika | Dnevno |
| `SyncUserXP` | Sinkronizacija XP (UNKNOWN što radi) | UNKNOWN |
| `GenerateSitemap` | XML sitemap generisanje | Dnevno ili tjedni |
| `MobyFetch` | Fetch novih igara iz MobyGames | UNKNOWN (ručni ili periodic) |
| `MobyEnrich` | Enrich detalja igara | UNKNOWN (ručni ili periodic) |
| `OptimizeExistingImages` | Optimizacija slika | UNKNOWN (jednokratno ili periodic) |
| `GenerateImageVariants` | Image varijante generisanje | UNKNOWN |
| `SyncMediaLibrary` | Media library sync | UNKNOWN |
| `IndexGameTags` | Indeksiranje game tagova | UNKNOWN |
| `ValidateEnv` | Provjera .env varijabli | Ručni |

**Napomena:** Stvarni cron raspored nije potvrđen. Scheduling je definisan u `app/Console/Kernel.php` (UNKNOWN sadržaj bez čitanja).

---

## Gdje je definisan cron schedule?

**Lokacija:** `app/Console/Kernel.php` (Laravel scheduling)

Produkcijska cron linija na serveru:
```
* * * * * php /path/to/backend/artisan schedule:run >> /dev/null 2>&1
```

---

## Discord bot background procesi

Discord bot ima vlastite scheduled servise (ne Laravel queue):

| Servis | Interval | Svrha |
|--------|---------|-------|
| `PollingService` | `CHECK_INTERVAL_SECONDS` (default: 600s) | News/giveaway polling |
| `ServerStatsService` | UNKNOWN | Voice channel stats update |
| `TriviaService` | UNKNOWN | Scheduled trivia pitanja |
| `RecapService` | Tjedni (Sunday?) | Tjedni activity recap |
| `StatusService` | UNKNOWN | Bot status rotacija |

---

## Rizici i problemi

### Queue worker
- Ako queue worker padne, svi background jobs se zaustave
- PingIndexNow, email reminders, OG fetch — sve stoji dok se worker ne restartuje
- **Preporuka:** Supervisor ili systemd za auto-restart queue workera

### Redis
- Ako Redis padne: cache, queue, session sve pukne odjednom
- **Preporuka:** Redis sentinel ili cluster za HA u produkciji

### View counter flushing
- `FlushViewCounters` mora se pokrenuti redovno
- Ako ne radi, Redis akumulira view data bez DB upisa

### Steam polling
- `PollSteamPresence` polling Steam API periodično
- Steam API ima rate limits — prečesto može uzrokovati 429 greške

### MobyGames import
- Ručni proces (nije automatski scheduled)
- Baza igara zastarjeva bez redovnog importa
- **Preporuka:** Schedulovani weekly MobyFetch

### Giveaway reminders
- `SendGiveawayReminders` šalje email — potreban ispravni mail config
- UNKNOWN da li je mail podešen u produkciji

---

## Monitoring

- **Laravel Pulse** — `create_pulse_tables.php` migracija postoji
- Pruža monitoring queue, cache, exceptions u real-time
- URL: `/pulse` (UNKNOWN da li je konfigurisan za produkciju)
- **Laravel Pail** — `composer dev` pokreće pail (log tailing)
