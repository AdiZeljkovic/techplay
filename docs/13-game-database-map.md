# 13 — Game Database Map

## Svrha

Lokalna baza igara koja korisnicima omogućuje pregled igara, ocjenjivanje, dodavanje u kolekciju, praćenje novih izdanja kroz Release Calendar i generisanje SEO sadržaja za svaku igru.

**Ključna napomena:** API NIKAD ne proxira live MobyGames ili RAWG zahtjeve za osnove podatke. Igre su uvijek u lokalnom PostgreSQL-u. RAWG se koristi samo za supplementarne podatke (screenshoti, filmovi, prijedlozi).

---

## Izvor podataka

### MobyGames (primarni izvor)
- **Servis:** `MobyGamesService`
- **Import putevi:**
  - `php artisan moby:fetch` — fetch igara iz MobyGames API
  - `php artisan import:moby-csv` — import iz CSV dump-a
  - `MobyEnrichmentJob` — background enrich za pojedinačne igre
  - `php artisan moby:enrich` — ručni enrich
- **Podaci koji dolaze:** naziv, opis, cover, release date, developer, publisher, žanrovi, platforme, MobyGames ID

### RAWG (supplementarni, fallback)
- **Servis:** `RawgService`
- **API ključ:** `RAWG_API_KEY` env var
- **Koristi se za:** screenshoti, filmovi/traileri, suggested igre
- **Endpointi:**
  - `GET /games/rawg/{slug}` — RAWG game detalji
  - `GET /games/rawg/{slug}/screenshots` — screenshoti
  - `GET /games/rawg/{slug}/movies` — filmovi
  - `GET /games/rawg/{slug}/suggested` — prijedlozi
- **Napomena:** RAWG endpointi su live proxy pozivi (throttle:60,1). Može biti problem ako RAWG API key istekne.

### Legacy (IGDB)
- `CrawlIgdbGames` i `CrawlIgdbStatus` komande postoje — vjerovatno legacy, zamijenjen MobyGames
- `update_games_table_for_igdb.php` migracija → zatim `replace_igdb_id_with_moby_id.php`
- IGDB integracija je napuštena, zamjenjena MobyGames

---

## Game model (`games` tabela)

**Ključne kolone:**
- `id` — interni ID
- `moby_id` — MobyGames ID
- `rawg_slug` — RAWG slug za fallback
- `name` — naziv igre
- `slug` — URL slug
- `description` — opis (nullable — `has_description` boolean)
- `cover_image` — URL cover slike
- `release_date` — datum izlaska
- `developer` — developer naziv
- `publisher` — publisher naziv
- `rating` — prosječna ocjena
- `genre_names TEXT[]` — žanrovi (PostgreSQL array)
- `platform_names TEXT[]` — platforme (PostgreSQL array)
- `tag_names TEXT[]` — tagovi (PostgreSQL array)
- `moby_group` — MobyGames group za series detection

**Kritično:** `genre_names`, `platform_names`, `tag_names` su `TEXT[]` kolone. PHP iz PDO dobija raw string format `{Action,"Role-Playing (RPG)"}`. UVIJEK koristiti `pgArray()` helper u `GameController` prije array operacija.

---

## Relacije

```
Game
 ├── hasMany → GameExternalId (rawg_id, igdb_id, steam_id, itd.)
 ├── hasMany → GameRating (user ocjene)
 ├── hasMany → UserGame (u čijoj je biblioteci)
 ├── hasMany → GameListItem (u kojim listama)
 ├── belongsToMany → GameCompany (developer/publisher)
 ├── hasMany → Article (game_id FK — noviji, za vezane vijesti)
 └── hasMany → Presence (korisnici koji trenutno igraju)
```

---

## Filtriranje i pretraga

`GameController::index` podržava:
- `?q=` — tekstualna pretraga
- `?genre=` — filter po žanru (TEXT[] query: `@> ARRAY[?]::text[]`)
- `?platform=` — filter po platformi
- `?year=` — filter po godini izlaska
- `?sort=` — sortiranje (naziv, ocjena, datum)
- `?page=` — paginacija

---

## User Game Ratings

- `GameRating` model: user_id, game_id, rating (0-10), review_text
- `GET /games/{slug}/ratings` — sve ocjene za igru (javno)
- `GET /games/{slug}/ratings/my` — moja ocjena (auth)
- `POST /games/{slug}/ratings` — upsert ocjene (auth)
- `GET /games/hub/{type}/{value}` — hub po žanru ili platformi s agregiranim ocjenama

---

## Game Collection (korisnička biblioteka)

- `UserGame` model: user_id, game_id, status, hours_played, notes
- Status vrijednosti: `playing`, `finished`, `wishlist`, `dropped`, `backlog`
- Korisnik može dodati igru s bilo kojim statusom
- `GET /collection/index` — mapa slug→status za badge rendering (za cijelu biblioteku odjednom)
- Javno vidljivo na profilu: `GET /users/{username}/collection`

---

## Game Lists (custom liste)

- `GameList` model: user_id, name, slug, is_public
- `GameListItem` model: list_id, game_id, position, notes
- Svaki korisnik može kreirati custom liste (npr. "Top 10 RPG-ova")
- Javno vidljive: `GET /users/{username}/lists`
- Detalj liste: `GET /game-lists/{id}`

---

## Release Calendar

- Podaci dolaze iz `games.release_date` kolone
- `GET /games/calendar` — endpoint za calendar prikaz
- Filtriranje po date range parametrima
- Veza s kolekcijom: wishlist igre korisnika mogu triggerat notifikacije (CheckWishlistReleases komanda)

---

## Game detail page (frontend)

**Lokacija:** `app/games/[slug]`

**Podaci koji se fetchuju:**
1. `GET /games/{slug}` — osnov podaci (lokalni)
2. `GET /games/{slug}/screenshots` (lokalni) ili RAWG fallback
3. `GET /games/{slug}/ratings` — user ocjene
4. Ako auth: `GET /collection/games/{slug}` — status u biblioteci
5. Slične igre: `GET /games/{slug}/suggested` ili RAWG fallback

---

## Game companies (`game_companies` tabela)

- `id`, `name`, `slug`, `moby_id`
- Pivot veza s games (developer/publisher role)

---

## External IDs (`game_external_ids` tabela)

- Čuva IDeve za različite platforme: RAWG, IGDB, Steam
- Omogućuje cross-reference između platformi
- `GameExternalId` model: game_id, provider, external_id

---

## SEO za igre

- Svaka game stranica treba unique title/description
- Game detalj API vraća SEO-relevantne podatke
- `SchemaService` može generisati Game JSON-LD schema
- Crawled slugs endpoint: `GET /games/crawled-slugs` — vjerovatno za sitemap

---

## Poznati problemi

1. TEXT[] kolone zahtijevaju `pgArray()` helper — greška-prone
2. RAWG API fallback je live proxy — ako RAWG key istekne, game stranice nemaju screenshote
3. Igre bez opisa (`has_description: false`) prikazuju se bez punog sadržaja
4. IGDB legacy komande postoje ali su napuštene — mogu zbuniti novog developera

---

## Changelog 2026-07-03 — Game Database audit implementacija (Faze 0-4)

Kompletan audit + implementacija u 5 commitova (273a085, 64c8d75, ea30aa6, a2329ca, 57a9acb).

### Faza 0 — Quick fixes
- Popravljeni broken linkovi `/games/calendar` -> `/calendar` (homepage + sidebar widget)
- `SitemapController`: games page-count filter usklađen s `has_description`, junk slugovi (`-`, `_`) se preskaču, year hub koristi tekuću godinu umjesto hardkodirane 2025
- **Novi `GameObserver`** (registrovan u `AppServiceProvider`): na izmjenu igre bustuje `games.show.v1.{slug}` cache, poziva `CacheRevalidationService::revalidateGame()` (novi `game` tip u Next `/api/revalidate` + Cloudflare purge), i pinga IndexNow kad igra dobije opis. HTTP pozivi se preskaču u konzoli (bulk import)
- Rate limiti: rating write `throttle:30,1`; collection + game-lists write `throttle:60,1`
- `MobyFetch::upsertCompanies` više ne duplo broji `games_count`
- Homepage `GameDatabaseSection`: dinamički count igara (200K+), genre/tag linkovi vode na hub rute (prije su bili mrtvi `?genre=` parametri); obrisan neiskorišteni `HypeMeter.tsx`

### Faza 1 — SEO
- **Novi endpoint `GET /games/{slug}/articles`** — objavljeni članci preko `articles.game_id` (cache 10 min); frontend "News & Reviews" sekcija na `/games/[slug]`
- `/calendar/[slug]`: canonical + VideoGame/BreadcrumbList JSON-LD (prije nije imao ništa)
- `/games/[slug]` JSON-LD: dodani `screenshot` i `alternateName`
- `InternalLinkService::suggestGameLinks()` — editor link prijedlozi sada uključuju game stranice (mergano u `POST /seo/suggest-links`)

### Faza 2 — Search & performanse
- Migracija: `pg_trgm` ekstenzija + GIN trgm indeks na `games.name` (ILIKE pretraga na 200K redova bila sequential scan)
- **Novi endpoint `GET /search/games`** + igre u globalnom search dropdownu (paralelno s člancima)
- `GameController::index` (5 min) i `show` (10 min) keširani u Redis
- **View tracking**: `games.views` kolona + Redis brojač (`views:game:{id}`, IP throttle 30 min) -> `FlushViewCounters`; novi sort `-views` ("Trending") na `/games`

### Faza 3 — Data model & ingestion
- `game_ratings.game_id` FK (backfilled iz sluga; `game_slug` zadržan); review tekst se strip_tags-uje
- Collection auto-create ojačan: RateLimiter 10 novih igara/h po korisniku, RAWG rezultat mora odgovarati slugu, RAWG ID se upisuje u `game_external_ids`
- **Nova komanda `games:sync-new-releases`** (RAWG releases -14d/+60d), scheduled sedmično ponedjeljkom 04:00 — zamjena za penzionisani Moby bulk import

### Faza 4 — Community & gamifikacija
- XP: +5 dodavanje igre (jednom po igri), +15 completion, +10 prva ocjena s reviewom (`XpService` konstante `XP_GAME_*`)
- **Bugfix**: completion bounty se nikad nije dodjeljivao na tranziciji statusa (getOriginal čitan poslije save())
- Discord: nova `/game` komanda (pretraga baze, embed); **bugfix** `/search` je čitao pogrešan response ključ (uvijek "No results")
- **TechPlay Score**: editorial `review_score` (60%) + community prosjek (40%) u `GET /games/{slug}/ratings` responsu + prikaz na game stranici
- Search analytics: dnevni Redis zset `analytics:game_search:{Y-m-d}` (30 dana)
- **Novi Filament resurs `GameRatingResource`** (grupa Game Database) — moderacija community ocjena/reviewa

## Changelog 2026-08-11 — /games hub: audit i redizajn ulaza

**Payload (izmjereno na produkciji, brotli):** `/games/hub` 1.318 B, `/games?page=1`
1.432 B, `/games/hidden-gems` 509 B, `/games/on-this-day` 486 B, HTML 64 KB.
Nema viška — za razliku od listinga članaka ovdje se ništa ne trimuje.

**Ukinuta search analitika:**
- `GameController::logSearchQuery()` obrisan — pisao je u `analytics:game_search:{Y-m-d}`
  zset na svaku prvu stranicu pretrage.
- `GameHubController::trendingSearches()` obrisan — jedini čitalac; na svaki cache
  miss huba radio je 30 `ZREVRANGE` poziva (jedan po danu retencije).
- `trending_searches` više nije u `/games/hub` responsu, widget je skinut s desne
  trake. Isti razlog kao kod članaka: internu analitiku pokriva Google Analytics.

**Frontend (`components/games/GameDatabaseHub.tsx`):**
- Hero search polje dobilo oblik header search bara (`--surface-2`, `--line-strong`,
  `--radius-card`, accent ring na fokusu) umjesto vlastitog pill oblika.
- Četiri "ways in" pločice: art 64 px -> 36 px, strelica uklonjena, dodano aktivno
  stanje (accent rub + traka po dnu) i `active:scale` na klik.
- Lijeva traka filtera: `FilterGroup` je sada preklopiv, jedan otvoren u isto vrijeme,
  zatvoren pokazuje trenutnu vrijednost. "Explore by Platform" otvara Platform grupu.

**Napomena o `games.views`:** ostaje — prikazuje se na `/games/{slug}` stranici.
Sort `-views` postoji u API-ju ali ga frontend ne nudi.

**Dopuna istog dana — trake i brojke:**
- Obje bočne trake bile su `sticky top-4`, a header je fiksan (~88 px) — prvi red
  panela klizio je ispod headera, a sve preko jednog ekrana visjelo je izvan
  dohvata. Sada `top-[96px]` + `max-h-[calc(100vh-112px)]` s vlastitim skrolom.
- Traka brojki na dnu (`Figure` × 4) obrisana. S njom je otišlo i šest od sedam
  polja u `/games/hub` `stats` — `rated`, `upcoming`, `genres`, `platforms`,
  `community_ratings`, `tracked`; dvije od tih brojki bile su
  `count(distinct unnest(...))` preko 141k redova. Ostaje samo `games`, koji
  hero rečenica i dalje čita. Cache ključ podignut na `games.hub.stats.v2`.
