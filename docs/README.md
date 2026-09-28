# TechPlay — dokumentacija

Ovo je jedini referentni dokument projekta. Pisan je 7. septembra 2026. iz
**izmjerenog stanja** — brojke su iz produkcijske baze i logova toga dana,
verzije očitane sa servera, spiskovi izvučeni iz koda. Nijedan podatak nije
prepisan iz ranije dokumentacije, jer je upravo to bio njen problem.

Prije njega su postojala 89 dokumenata. Većina su bili jednokratni auditi i
planovi vezani za datum — zapisi odluka, ne referenca — pa su i zastarjeli
onako kako takvi dokumenti zastarijevaju: nikad nisu ni bili mišljeni da ostanu
tačni. Obrisani su iz radnog stabla; **git ih čuva**, vade se sa
`git log --diff-filter=D -- docs/`.

Ostao je `docs/incidenti/` — zapisi incidenata ne zastarijevaju.

> **Kad mijenjaš kod, mijenjaj i ovo.** Dokument koji laže gori je od nijednog,
> i to je jedina lekcija koju prethodnih 89 dokumenata zaista nose.

---

## Sadržaj

1. [Šta je TechPlay](#1-šta-je-techplay)
2. [Tri dijela i kako se drže](#2-tri-dijela-i-kako-se-drže)
3. [Gdje šta radi](#3-gdje-šta-radi)
4. [Šta se desi kad…](#4-šta-se-desi-kad)
5. [Backend](#5-backend)
6. [Frontend](#6-frontend)
7. [Admin panel](#7-admin-panel)
8. [Baza](#8-baza)
9. [Keš i revalidacija](#9-keš-i-revalidacija)
10. [Raspored poslova](#10-raspored-poslova)
11. [Vanjski servisi](#11-vanjski-servisi)
12. [SEO](#12-seo)
13. [Deploy](#13-deploy)
14. [Sigurnost i tajne](#14-sigurnost-i-tajne)
15. [Testovi](#15-testovi)
16. [Zamke](#16-zamke)
17. [Šta nije ono što izgleda](#17-šta-nije-ono-što-izgleda)
18. [Mobilna aplikacija](#18-mobilna-aplikacija)
19. [Mjerenje posjete](#19-mjerenje-posjete)
20. [Mail — šta šaljemo i odakle](#20-mail--šta-šaljemo-i-odakle)
21. [Guild Wars 2 — Progression Advisor](#21-guild-wars-2--progression-advisor)

---

## 1. Šta je TechPlay

Gaming platforma, ne blog. Živa je na **techplay.gg**.

Ono što korisnik dobija, poredano po težini:

| Dio | Šta je | Stanje |
|---|---|---|
| **Vijesti, recenzije, vodiči, hardver** | 638 članaka | živo, glavni izvor prometa |
| **Baza igara** | 333 198 igara, 57 630 studija | živo |
| **Kalendar izlazaka** | podsjetnici na izlazak | živo |
| **Profil, XP, rangovi, dostignuća** | 60 korisnika, 67 dostignuća, 20 rangova | živo |
| **Biblioteka i police** | uvoz sa Steama, Xboxa, PlayStationa, GOG-a, Epica | živo, 2 599 unosa |
| **Forum** | 7 tema | živo, tiho |
| **Komentari** | 22, prva tri po korisniku idu na odobrenje | živo |
| **Liste igara** | korisničke liste s rangiranjem | živo, 4 liste |
| **Discord bot** „Professor Buffy” | most između sajta i servera | živo |
| **GTA 6 hub** | 121 vozilo, 36 oružja, 12 likova, 1 058 lokacija | živo |
| **WoW Analyzer** | analiza spremnosti lika, Groq + Blizzard API | živo |
| **Giveawayi** | 2 | živo |
| **Help centar** | 50 članaka na zasebnom hostu | živo |
| **Shop** | 0 proizvoda, PayPal u sandboxu | **nije pušten** |

### Adrese

| | |
|---|---|
| `techplay.gg` | sajt |
| `api-beta.techplay.gg` | API i admin panel — *„beta” je istorijski ostatak, ovo JESTE produkcija* |
| `help.techplay.gg` | help centar; isti Next proces, prepisivanje po hostu |

Nema staging okruženja. Svaki deploy ide pravo na živo.

---

## 2. Tri dijela i kako se drže

```
                          ┌─────────────┐
   čitalac ──────────────▶│  Cloudflare │  WAF, bot kontrole, keš
                          └──────┬──────┘
                                 │  samo CF adrese smiju na 80/443
                          ┌──────▼──────┐
                          │    nginx    │  TLS, keš /games/, mapa 410
                          └──┬───────┬──┘
              techplay.gg    │       │   api-beta.techplay.gg
              help.techplay  │       │
                      ┌──────▼──┐ ┌──▼─────────┐
                      │  Next   │ │  Octane    │
                      │  :3000  │ │  :8000     │
                      │  (pm2)  │ │(supervisor)│
                      └────┬────┘ └──┬───┬─────┘
                           │         │   │
                           └─ SSR ──▶│   ├──▶ PostgreSQL :5432
                                     │   ├──▶ Redis :6379
                                     │   └──▶ Reverb :8080 (WebSocket)
                                     │
                      Discord bot ───┘  pm2, gađa API tokenom
```

**Ključno za razumjeti:** frontend **renderuje na serveru** i pri tome zove
backend. Ako backend padne, ne pada samo API — padaju i stranice. Zato
`lib/api.ts` zamjenjuje `localhost` sa `127.0.0.1`: Node bi inače pokušao IPv6
i čekao timeout.

**Autentikacija je klijentska.** Token stoji u `localStorage`. Server nikad ne
zna ko gleda stranicu — što je i razlog zašto nginx smije keširati `/games/`
između posjetilaca. **Nema `middleware.ts`**; svaka stranica se sama zaključava,
i ništa to ne može raditi na rubu jer token nikad ne stigne do servera.

---

## 3. Gdje šta radi

Jedna mašina, `46.224.110.57`.

| Proces | Pod čim | Kao ko | Port |
|---|---|---|---|
| nginx | systemd | root → www-data | 80, 443 |
| Octane (FrankenPHP) | supervisor `techplay-octane` | **www-data** | 8000 |
| Queue worker `default` | supervisor `techplay-worker` | www-data | — |
| Queue worker `live` | supervisor `techplay-worker-live` | www-data | — |
| Reverb (WebSocket) | supervisor `reverb` | www-data | 8080 |
| Next | pm2 `techplay-frontend` | **techplay** | 3000 |
| Discord bot | pm2 `techplay-bot` | techplay | — |
| PostgreSQL | systemd | postgres | 5432, samo lokalno |
| Redis | systemd | redis | 6379, samo lokalno |

**Dva reda, dva radnika.** `default` nosi težak posao (obogaćivanje, sinkronizacije
biblioteka, fan-out objave); `live` nosi samo broadcast, i ima svoj proces da
poruka u chatu ne čeka iza petominutne sinkronizacije. Događaji stižu tamo kroz
`BroadcastsOnTheLiveQueue` — dodaj ga svakom novom `ShouldBroadcast` eventu.

### Vlasništvo — izvor tihih kvarova

- `backend/` je **www-data**
- `frontend/` i `discord/` su **techplay**
- korijen repoa je **root**

`git pull` kao root ostavlja root-ove fajlove u techplay stablu i sljedeći build
pada na dozvolama — **tiho**, tek pri narednom restartu. Deploy skripta vraća
vlasništvo prije nego gradi; to joj je jedini razlog postojanja.

**Scheduler radi kao `www-data`** (njegov crontab). Sve što Laravel piše —
kompajlirani viewovi, keš, `public/sitemap*.xml` — pripada www-data stablu.
Zadatak pokrenut kao root ostavi fajlove koje aplikacija poslije ne može
prepisati. Nije hipotetski: 29. 8. 2026. su svi sitemapi bili `root:root`, pa
observer nije mogao prepisati `sitemap-news.xml` pri objavi.

Isto važi i za `bootstrap/cache/config.php` — provjeri vlasništvo nakon deploya.

### Verzije (7. 9. 2026.)

PHP 8.4.24 · Laravel 12.62 · Octane 2.17.5 · Filament 5.6.7 · PostgreSQL 16.15 ·
Redis 7.0.15 · Node 24.20 · Next 16.3.0 · React 19.2.3

---

## 4. Šta se desi kad…

### …čitalac otvori članak

1. Cloudflare → nginx → Next (`app/news/[slug]/page.tsx`)
2. Next zove `GET /api/v1/news/{slug}` **na 127.0.0.1:8000**
3. Backend čita iz Redisa (`CacheService::articleShowKey`), promašaj ide u Postgres
4. Next renderuje HTML, ISR ga drži prema `revalidate`
5. `GlobalSeo` i JSON-LD idu u `<head>`; GA tag je **u headu, ne poslije hidracije**

### …urednik objavi članak

1. Filament upiše `status = published` **kroz model** — nikad query builder, bulk update ne pali evente
2. `ArticleObserver` → `RevalidationService::revalidateArticle()`
3. POST na `{FRONTEND_URL}/api/revalidate` sa `REVALIDATE_SECRET_TOKEN`
4. Next čisti **po tagu** — `revalidatePath` na dinamičkoj ruti ne radi ništa
5. `PublishArticleFanout` u red: Discord objava, notifikacije, isplata autoru
6. `SubmitIndexNow` javlja Bingu i Yandexu
7. `sitemap:generate --content` ga pokupi u sljedećih 15 minuta

> **Observeri su registrovani samo u `AppServiceProvider`.** `ArticleObserver` je
> nekad bio registrovan i u `Article::booted()`; Laravel ne deduplicira, pa je
> dva mjeseca svaka objava išla dvaput — dvije Discord poruke, dvije isplate
> autoru. Čuva `tests/Feature/PublishHappensOnceTest.php`.

### …korisnik poveže Steam

1. `POST /connected-accounts/steam/connect` vrati OpenID URL s jednokratnim `state` u kešu
2. Steam vraća na `/steam/callback`; `Cache::pull` pročita i **obriše** state, pa ponovljeni callback ne nađe ništa
3. `SyncSteamLibrary` ide u red `default`
4. Igre se upisuju u `user_games`, `sources` dobija `steam`
5. Sinkronizacija **mijenja statuse**: backlog → playing/played ako je igrano, → completed ako su sva dostignuća

Za PlayStation nema OAuth-a — korisnik sam kopira `npsso`. Vidi [Zamke](#16-zamke).

### …korisnik ostavi komentar

1. Sanitizacija, provjera spama, cooldown 15 s, duplikat 5 min
2. **Prva tri komentara** svakog korisnika idu na odobrenje (`status = pending`)
3. Više od jednog linka → također `pending`
4. Odgovor nosi `status` i `message` **pored** `data`, ne unutra
5. Zadržani komentar **vidi samo njegov autor**, označen; XP i questovi čekaju odobrenje

---

## 5. Backend

Laravel 12 pod Octaneom (FrankenPHP). Sve rute su pod `/api/v1/`, kontroleri u
`app/Http/Controllers/Api/V1/` (**88 kontrolera**).

**Namjera je da svaki kontroler koristi `ApiResponse` trait** — odgovor
`{ success, message, data }`. **Stvarnost je drugačija i to je izmjereno.**

Sedam listing endpointa, 7. 9. 2026, odgovaraju u **šest oblika**:

| Endpoint | Oblik |
|---|---|
| `/news`, `/reviews` | `{ data, links, meta }` — resource kolekcija, bez `success` |
| `/guides` | goli Laravelov paginator |
| `/games` | `{ count, next, previous, results }` |
| `/studios` | `{ success, data, pagination }` — `ApiResponse::paginated` |
| `/home` | `{ success, message, data }` — `ApiResponse::success` |
| `/settings` | goli objekat, bez omotača |

Uz to, ime parametra za veličinu stranice nije isto — `per_page` radi na
`/news`, a `/studios` i `/games` ga ignorišu.

Web to nije primijetio jer je svaka stranica pisana uz svoj endpoint: stranica
koja čita jedan nikad ne sazna da se sljedeći ne slaže. **Aplikacija ne može
tako** — ona je jedan program koji čita sve, i za razliku od sajta se ne može
redeployati da se uskladi: oblik promijenjen nakon izdanja lomi kopiju koja je
već na nečijem telefonu.

Do normalizacije (koja je **prekidajuća izmjena** za web, dakle odluka a ne
commit), razliku upija `mobile/src/lib/paging.ts` — jedno mjesto, s popisom.

### Brojke

| | |
|---|---|
| modeli | 86 |
| servisi | 50 + `Chronicle/`, `Feed/`, `Releases/`, `Socialite/` |
| poslovi (jobs) | 15 |
| observeri | 23 |
| artisan naredbe | 49 |
| Filament resursi | 39 |

### Servisi koje treba znati

| Servis | Šta radi |
|---|---|
| `CacheService` | ključevi i brisanje keša — **nikad ne piši ključ rukom** |
| `RevalidationService` | javlja Nextu da očisti; jedini put, spojen iz dva servisa 18. 8. |
| `SanitizationService` | XSS zaštita, **obavezan za svaki korisnički sadržaj** |
| `XpService` | XP za komentare, dodane i završene igre, recenzije; 100 XP/dan, 60 s cooldown |
| `BountyService` | valuta; isplate su vezane za **ledger**, ne za status |
| `AchievementService` | 67 dostignuća, provjera po tipovima |
| `QuestService` | 53 questa, sezonski |
| `LevelService` / `RewardTierService` | nivoi i nagrade |
| `ProfileService` | sve što profil prikazuje, uključujući `collectionCounts()` |
| `GamerDnaService` / `TasteMatchService` | ukus korisnika, preporuke, poklapanje |
| `SteamService`, `OpenXblService`, `PlayStationService`, `GogService`, `EpicService` | pet platformi |
| `PresenceService` | ko šta trenutno igra (Steam) |
| `SchemaService` | JSON-LD — **ali ga čita samo staff debug endpoint**, vidi §17 |
| `IndexNowService` | javlja Bingu/Yandexu pri objavi |
| `NginxPageCache` | briše nginx keš za pojedinu igru |
| `ImageOptimizer` | GD, pravi `_thumb`/`_medium`/`_large` |
| `GroqService`, `BlizzardService`, `RaiderIOService` | WoW Analyzer |
| `PayPalService` | shop i pretplate, webhook s provjerom potpisa |

### Pravila koja se ne smiju prekršiti

1. **Objava je model event.** Sve što mijenja status članka mora ići kroz
   `$article->update(...)`. Query builder `update()` ne pali evente, pa se ništa
   nizvodno ne desi. `articles:publish-scheduled` je tačno to radio do 29. 8.,
   i zakazani članci su stizali do čitalaca tek kad bi TTL liste slučajno istekao.

2. **Observeri se registruju samo u `AppServiceProvider`.**

3. **Ključevi keša se prave kroz `CacheService`.** Bili su ispisani na tri
   mjesta, verzije su se razišle, izmjene sat vremena nisu stizale do čitalaca —
   a test koji je hardkodirao ustajali ključ je prijavljivao zeleno.

4. **N+1 je zabranjen.** `Model::preventLazyLoading(!app()->isProduction())` je
   uključen; svaki novi upit mora eager-loadovati.

5. **PostgreSQL `TEXT[]` kolone** (`games.genres`, `games.platforms`) se
   pretražuju sa `@> ARRAY[?]::text[]`. PDO ih ponekad vrati kao string
   `{Action,"Role-Playing (RPG)"}` — prije `array_map` obavezno kroz `pgArray()`.
   **Pažnja:** `user_games.sources` je `json`, ne `text[]` — isti pojam, drugi tip,
   i `@>` upit koji radi nad `games` puca nad `user_games`.

### Statusi police (`user_games.status`)

Sedam vrijednosti, od 4. 9. 2026:

`playing` · `replaying` · `played` · `backlog` · `completed` · `wishlist` · `dropped`

- `played` postoji jer uvoz sa Steama nema pošten koš: platforma javlja samo
  ukupno vrijeme, ne i je li igra završena. Bez njega je 1 602 sata Lord of the
  Rings Onlinea sjedilo pod „nisam počeo”.
- `replaying` je Goodreads model ponovnog čitanja. **`UserGame::ACTIVE`** je
  `['playing','replaying']` i **svaki upit koji broji „trenutno igra” mora ga
  koristiti** — inače ponavljanje tiho nestane s police koja ga opisuje.
- `playthroughs` broji **završetke, ne pokušaje**; raste samo na prelazu *u*
  `completed`.

Bounty i XP za završetak plaćaju se **jednom po igri zauvijek**, vezano za
ledger a ne za status — inače bi petlja završi → ponovi → završi bila farma.

---

## 6. Frontend

Next.js 16, App Router, React 19, TypeScript. **84 stranice**, 5 route handlera.

### Rute

```
/                       naslovna
/news /reviews /guides /hardware        + /[slug] i /page/[n]
/games                  /[slug] /genre/[g] /platform/[p] /series/[s] /tag/[t] /year/[y]
/studios                /[slug] /country/[iso]
/calendar               /[slug]
/forum                  /[category] /thread/[slug] /search /rules /create
/profile/[username]     /settings /friends /messages /social
/lists                  /[username]/[slug] /tag/[t]
/giveaways /giveaway/[slug]
/shop /shop/[slug] /shop/checkout /cart
/support /support/checkout      ← donacije, NE help
/help /help/[topic]/[slug]      ← help centar, služi se s help.techplay.gg
/gta6                   /characters /vehicles /weapons /map /everything-we-know
/wow-analyzer /backlog-advisor /leaderboard /last-disc /tools /frontiers
/about /contact /privacy /terms /cookies /impressum /marketing /roadmap /rating-system
(auth)/login /register /forgot-password /reset-password /verify-email
```

**Zamka u imenima:** `techplay.gg/support` su **donacije**, a
`help.techplay.gg` je **pomoć**. U navigaciji: „Support us” i „Help centre”.

### Route handleri

`/api/revalidate` · `/rss` · `/feed` · `/proxy/gtag` · `/proxy/ga/[...path]`

Zadnja dva su prvostrani relej za Google Analytics — vidi §12.

### Dohvat podataka

Server komponente zovu backend direktno, ISR je primarni keš
(`next: { revalidate: N }`). Optimizacija slika je **uključena**, a `unoptimized`
se postavlja **po slici** za sve što nije naše (naslovnice igara, Steam ikone,
Discord avatari — sve to već servira tuđi CDN). Globalno gašenje je skidalo
`srcset` i `sizes` i s naših uploada, pa je telefon od 412 px vukao hero od
1170 px.

### Konteksti

`AuthContext` · `CartContext` · `SiteSettingsContext` · `MobileMenuContext` —
svi omotavaju aplikaciju u `layout.tsx`. **Nema `ThemeContext`**; sajt je samo
taman i `globals.css` nema svijetlu paletu.

### Obrazac stranica

`page.tsx` (server, dohvat + metapodaci) → `Client.tsx` (interakcija). Prati ga
kad dodaješ stranicu.

### Prose tokeni

`lib/prose.ts` drži `DOC_SHARED` (zajedničko), pa `DOC_PROSE` (pravni tekstovi)
i `HELP_PROSE` (help). Ne dodaj treći skup — dva su već jednom bila razišla.

---

## 7. Admin panel

Filament 5.6.7 na `api-beta.techplay.gg/admin`, **39 resursa**, grupisani u
Content Studio i ostalo.

- **Nema theme paketa.** `viteTheme('resources/css/filament/admin/theme.css')`
  kompajlira dizajn tokene sajta na Filament. Dokumentacija je ranije tvrdila
  NeoBrutalism pa Brisk — nijedan nije instaliran.
- Dva plugina: `croustibat/filament-jobs-monitor`, `leandrocfe/filament-apex-charts`.
- **`AuthServiceProvider` mora mapirati svaki model na politiku.** Filament
  tretira nemapirani model kao dozvoljen — izostavljen unos nije nedostajuća
  funkcija nego otvorena vrata.

---

## 8. Baza

PostgreSQL 16, **120 tabela**, **2 031 MB**.

### Stvarne brojke (7. 9. 2026.)

| Tabela | Redova |
|---|---|
| `games` | 333 198 |
| `studios` | 57 630 |
| `game_tombstones` | 61 034 |
| `game_store_links` | ~47 964 |
| `steam_achievements` | ~16 438 |
| `user_games` | 2 599 |
| `articles` | 638 (635 objavljenih, 3 nacrta) |
| `notifications` | 420 |
| `user_achievements` | 240 |
| `quests` | 53 |
| `help_articles` | 50 |
| `site_settings` | 44 |
| `categories` | 31 |
| `comments` | 22 |
| `ranks` | 20 |
| `connected_accounts` | 13 |
| `users` | 60 |

**73 od 120 tabela je prazno.** To nisu sve greške — dio je za funkcije koje još
nisu puštene (`products`, `orders`, `support_tiers`), dio je mrtav ostatak
(`faq_items`, `seo_metas`). Vidi §17.

### Konvencije

- `games.genres` i `games.platforms` su `TEXT[]`, indeksirani GIN-om
  (`games_genres_gin`, `games_platforms_gin`)
- `user_games.sources` je `json` — **ne** `text[]`
- Igre dolaze iz agregatora prodavnica (`Services/Releases/`), IGDB je bio
  jednokratni uvoz 20–21. 8. 2026, ne izvor. Staging tabele (`igdb_raw`, 8,16 M
  redova) obrisane 29. 8.; arhiva je na
  `/var/backups/igdb-archive/igdb-staging-2026-08-29.dump`
- API **nikad** ne proksira živi zahtjev prema prodavnici

---

## 9. Keš i revalidacija

Četiri sloja, i svaki može zadržati ustajali odgovor:

```
Cloudflare  →  nginx (proxy_cache za /games/)  →  Next ISR  →  Redis
```

**Redis** je aplikacijski keš (`CACHE_STORE=redis`). Ključevi se prave i brišu
isključivo kroz `CacheService`.

**nginx** kešira `/games/*` pod granicom od 4 GB s LRU izbacivanjem. Sigurno je
dijeliti između posjetilaca jer je autentikacija u `localStorage` — server ne
zna ko pita, pa je svaki odgovor ionako anoniman. `proxy_cache_lock` sabija
navalu na isti URL u jedan render.

**Next ISR** drži stranice prema `revalidate`; čisti se **po tagu** iz backenda.
`revalidatePath()` na dinamičkoj ruti **ne radi ništa** — to je bio tihi kvar
mjesecima.

**Cloudflare** ima pravilo koje kešira `/games/*` i **gazi zaglavlja s origina**:
mjereno 7. 9. 2026. servirao je 404 sa `cf-cache-status: HIT` i `Age: 265`
iako origin šalje `Cache-Control: no-store`. Znači svaka izmjena stranice igre
čeka istek edge keša ili ručno čišćenje.

**Redoslijed pri deployu je obavezan:** prvo zagrij stranice koje si mijenjao,
pa **tek onda** očisti Cloudflare. Obrnuto zakešira ustajali ISR odgovor.

### Lanac revalidacije

```
izmjena modela → Observer → RevalidationService::revalidate*()
   → POST {FRONTEND_URL}/api/revalidate
   → Bearer REVALIDATE_SECRET_TOKEN   (ne REVALIDATION_SECRET — endpoint čita oba)
   → Next čisti po tagu
```

---

## 10. Raspored poslova

Scheduler je u `routes/console.php`, radi kao `www-data`. Svaki unos ima
`onFailure` koji javlja na Telegram.

| Kad | Šta |
|---|---|
| svake minute | `articles:publish-scheduled` |
| svake 2 min | `PollSteamPresence` |
| svakih 5 min | `FlushViewCounters` |
| svakih 15 min | `sitemap:generate --content` |
| svakih 30 min | `RefreshRecentSteamPlaytime` |
| svaki sat | `games:enrich-steam`, `forum:clear-expired-pins` |
| svakih 6 sati | `SendGiveawayReminders` |
| 00:20 | `season:conclude` |
| 02:10–02:40 | čišćenje: `model:prune`, `sanctum:prune-expired`, `queue:prune-failed`, `prune:derived-history` |
| 03:10 | `gw2:catalogue` |
| 03:20 | `users:prune-unverified` |
| 03:30 | `sitemap:generate` (puni), `gw2:sync-accounts` |
| 04:15 | `achievements:sync` |
| 04:40 | `RefreshShelfPrices` |
| 04:45 | `chronicle:rebuild --stale` |
| 05:00 | `games:sync-steam-achievements` |
| 05:30 | `games:enrich-opencritic` |
| 06:00 | `games:enrich-trailers` |
| 09:00 | `SendReleaseReminders`, `wishlist:check-releases` |
| 10:00 | `campaign:founders` |
| ponedjeljak | `releases:sync` (03:00), `releases:merge` (05:30), `games:sync-series` (06:30) |
| petak 16:00 | `profile:send-weekly-digest` |
| mjesečno | `profile:snapshot-reputation` |

**Nije zakazano, pokreće se ručno:** `games:purge-adult`, `games:purge-clutter`.

---

## 11. Vanjski servisi

| Servis | Za šta | Ključ u `.env` |
|---|---|---|
| **Steam** | biblioteka, prisutnost, dostignuća, cijene | `STEAM_KEY` |
| **OpenXBL** | Xbox biblioteka po gamertagu | `OPENXBL_API_KEY` |
| **PlayStation** | trofeji preko `npsso` | `PSN_ENABLED` |
| **GOG** | biblioteka preko koda | `GOG_ENABLED` |
| **Epic** | biblioteka preko koda | `EPIC_ENABLED` |
| **Google** | prijava „Sign in with Google" | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| **Discord** | OAuth prijava, bot, objave | `DISCORD_*` |
| **Battle.net** | OAuth prijava | `BATTLENET_*` |
| **Blizzard** | podaci o WoW liku | `BLIZZARD_*` |
| **Raider.IO** | dopuna WoW podataka | — |
| **Groq** | AI analiza WoW spremnosti | `GROQ_API_KEY` |
| **PayPal** | shop i pretplate | `PAYPAL_*` (**sandbox**) |
| **Cloudflare Turnstile** | zaštita registracije | `TURNSTILE_*` |
| **OpenCritic** | ocjene igara | `OPENCRITIC_KEY` |
| **YouTube** | trejleri | `YOUTUBE_KEY` |
| **IndexNow** | javljanje Bingu/Yandexu | `INDEXNOW_KEY` |
| **Telegram** | greške na telefon | `TELEGRAM_*` |
| **Resend / Postmark / SES** | mail | `RESEND_KEY` … |
| **Slack** | obavijesti | `SLACK_*` |

Jedan ključ nije vanjski servis nego dogovor između naša dva procesa:
`ANALYTICS_INGEST_TOKEN` mora biti **isti** u `backend/.env` i
`frontend/.env.local`. Frontendov GA relej njime potpisuje kopiju svakog
pogotka koju šalje backendu (vidi §19). Ako nije postavljen, prijem je ugašen —
endpoint vraća 404, a ne otvorena vrata.

`php artisan env:validate` provjerava da je sve što aplikacija stvarno traži
zaista postavljeno. Izlaz 1 znači „sajt ovako ne može raditi” i prekida deploy;
nedostajuća integracija je upozorenje i ne prekida ništa.

---

## 12. SEO

### Sitemapi

`sitemap.xml` je indeks nad 15 mapa. Igre su podijeljene u 6 fajlova po 50 000:
**295 024 URL-a**. `Game::indexable()` namjerno izostavlja igre s opisom kraćim
od 50 znakova nakon skidanja tagova.

### robots.txt

Dozvoljava sve osim `/api/`, `/admin/`, `/_next/data/`, `/login`, `/register` i
`?_rsc=`. Imenuje Googlebot, Googlebot-News, Bingbot, Mediapartners i AI botove;
`meta-externalagent` i `Amazonbot` su izričito zabranjeni.

### Obrisane igre vraćaju 410

Next **nema `gone()`** — postoje samo `notFound()`, `forbidden()` i
`unauthorized()` — pa stranica ne može vratiti 410 ni na koji način. Zato to radi
nginx:

```
php artisan games:gone-map            piše mapu u storage/app/nginx/
deployment/sync_gone_games.sh         instalira je i reloaduje, uz nginx -t
```

Mapa nosi ~60 900 slugova; `location ^~ /games/` provjerava `$tp_game_gone` i
vraća 410. Deploy je regeneriše. `GameObserver::deleted()` piše nadgrobnu ploču
pri svakom brisanju — ranije su ih pisale **samo dvije purge naredbe**, pa je
svaki drugi put brisanja ostavljao URL koji zauvijek vraća 404.

### Google Analytics

Prvostrani relej: biblioteka se servira sa `/proxy/gtag`, a mjerenja idu na
`/proxy/ga/g/collect` (`transport_url`) pa ih server prosljeđuje Googleu kroz
`after()`. Bez toga svaki ozbiljni blocker odbija beacon. `_uip`/`_uipv6` se
dodaju serverski, inače bi cijeli svijet pao pod jedan datacentar u Njemačkoj.

**Consent Mode v2**: `analytics_storage` je `denied` po defaultu i mijenja ga
samo banner. To znači da GA broji **samo one koji su pristali** — 7. 9. 2026. je
to bilo 25 od 2 137 mjerenja.

### Stanje u pretrazi (7. 9. 2026.)

| | |
|---|---|
| indeksirano | 56 355 |
| nije indeksirano | 338 358 |
| klikova dnevno | 1–2 (bilo ~100 do 17. 8.) |
| Googlebot | ~290 zahtjeva dnevno, od toga 77 stranica igara |
| stranica igara s ičim **našim** | **1 967 od 295 023** (0,7 %) |

17. 8. 2026. je Cloudflare počeo servirati 403 „Just a moment…” izazov i Google
je oslijepio na oko dvije i po sedmice. Danas je tehnički čisto — `index, follow`,
bez `X-Robots-Tag`, vatrozid propušta sve CF opsege — ali indeks se nije vratio.
Pri 77 stranica dnevno jedan prolaz kroz katalog traje deset godina.

---

## 13. Deploy

```bash
techplay-deploy.sh              # sve
techplay-deploy.sh frontend     # samo jedan dio
techplay-deploy.sh --no-pull    # kad je već povučeno
```

Sa Windowsa: `./deployment/push_and_deploy.ps1`.

Skripta radi, redom: `git pull` kao root → **vraćanje vlasništva** → migracije →
`config:cache`, `route:cache`, `view:cache` → `env:validate` → **mapa obrisanih
igara** → logrotate → build fronta → restart procesa → čišćenje nginx keša za
`/games/` → čišćenje Cloudflarea → provjera da stranice vraćaju 200.

Frontend polovina ide kroz `deployment/deploy_frontend.sh`, koja nosi arhivu
chunkova (da otvoreni tabovi ne dobiju `ChunkLoadError`), brisanje `fetch-cache`
(bez toga izmjene iz admina ne stižu na sajt), čišćenje nginx i Cloudflare keša,
i provjeru da stranice traže samo ono što postoji.

**`deploy.sh` je penzionisan** (29. 8. 2026.) i samo ispisuje gdje da se ide:
gradio je kao onaj ko ga pokrene — preko SSH-a root — pa je ostavljao root-ov
`.next` u techplay stablu i reloadovao rootov prazan pm2.

**Izmjena `.env` traži i `route:cache`** — bez toga pada admin panel, jer
Livewire ruta ovisi o `APP_DEBUG`.

**Octane se restartuje sa `supervisorctl restart`, ne `octane:reload`** —
reload curi konekcije na bazu (197 zombija u avgustu 2026).

---

## 14. Sigurnost i tajne

- **Sanctum bearer tokeni**, token u `localStorage`. Nema server-side sesije za API.
- **Turnstile** štiti registraciju; ako fali `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  dugme ostaje sivo i korisnik nema kako napraviti nalog. `env:validate` sada
  poredi obje polovine ključa.
- **Samo Cloudflare smije na 80 i 443** (ufw, 22 opsega). Lista se poredi sa
  `cloudflare.com/ips-v4` i `ips-v6`.
- **DNS, SPF, DKIM, DMARC i MX za techplay.gg se ne diraju** — ni kroz plugin, ni
  kroz Cloudflare, ni „da se poboljša isporuka”. Isto važi za SMTP postavke.
  Za sve što dodiruje DNS ili SMTP — pitati prije nego uraditi.
- **Tajne se pišu direktno na server**, ne kroz chat.
- `game_tombstones` i `MailSuppression` su podaci koji se ne brišu bez razloga.

### Log kanali

Produkcija radi na `LOG_LEVEL=error`, pa se sve ispod toga **baca**. Zato
postoji kanal **`connections`** (dnevni, `debug`, 14 dana) za dijagnostiku
povezivanja platformi — globalni nivo ga ne može ugasiti. Bez njega su dvije
istrage PlayStation kvara otvorile prazan fajl.

Greške i gore idu i na **Telegram**, deduplikovano.

---

## 15. Testovi

```bash
php artisan test                        # sve
php artisan test --filter TestName
vendor/bin/pint                         # formatiranje
```

**1 047 testova prolazi**, 8 preskočeno (7. 9. 2026). PHPUnit, SQLite u memoriji.

Frontend nema test alat — provjera je `npx tsc --noEmit`, `npx eslint` i
`npm run build`. **`npm run build` lokalno pada** na `ECONNREFUSED` prema
127.0.0.1:443 jer prerender traži backend; to je ograničenje lokalnog okruženja,
ne kvar.

Testovi koji čuvaju skupo naučene stvari:

| Test | Šta brani |
|---|---|
| `PublishHappensOnceTest` | dupli fan-out pri objavi |
| `ConnectingFitsInsideTheRequestTest` | budžet povezivanja ispod Octaneovog stropa |
| `PlayStationLinkingActuallyWorksTest` | Sonyjev stvarni oblik odgovora |
| `HeldCommentSaysSoTest` | zadržani komentar kaže da je zadržan i ne curi |
| `CommentPayloadTest` | tačan spisak polja koja komentar šalje |
| `ReplayingAGameTest` | ponavljanje se broji i ne može se farmati |
| `DeletedGamesAnswerGoneTest` | nadgrobne ploče i nginx mapa |
| `CollectionCountsPayloadTest` | svaki izračunat broj stvarno stigne do klijenta |
| `AboutPageTellsTheTruthTest` | brojke na /about se broje, ne pamte |
| `Gw2ConnectionTest` | GW2 ključ ne izađe u odgovoru; brzi prolaz ne prebriše puni |
| `Gw2AdvisorTest` | `access` nije istina o ekspanzijama; alati za branje nisu ascended slotovi |
| `UserDataExportTest` | nijedan kredencijal ne izađe u preuzetoj datoteci |
| `Gw2MasteryArithmeticTest` | potrošene mastery tačke se slažu sa onim što nalog prijavljuje |
| `Gw2RecipeTreeTest` | zaliha se oduzme tačno jednom, ma kroz koliko grana materijal stigao |
| `Gw2SessionPlanTest` | zadati budžet se ne prekoračuje; pravilo bez procjene nije besplatno |
| `Gw2PublicPagesTest` | sitemap navodi tačno ono do čega indeks dolazi; javno ne traži nalog |

---

## 16. Zamke

Stvari koje se ne vide iz koda i koje su plaćene greškama. Ovo je najkorisniji
dio dokumenta.

### `email_verified_at` se ne može postaviti kroz `create()`

Kolona **nije u `$fillable`**, i to namjerno: ona odlučuje je li adresa
dokazana, pa je nijedno tijelo zahtjeva ne smije postaviti. Posljedica je da
`User::create(['email_verified_at' => now()])` **ne pukne — tiho je odbaci**.

Tri toka prijave su radila tačno to, jedan od njih s komentarom
`// Verified via Discord` pored linije koja ništa nije radila. Rezultat: **2 od
6 naloga** koji su došli kroz Discord nemaju potvrđenu adresu, a iz koda se
činilo da je imaju. Nađeno 10. 9. 2026. dok se pisala Google prijava.

Piše se **poslije** stvaranja i eksplicitno:

```php
$user->forceFill(['email_verified_at' => now()])->save();
```

Isto vrijedi za `update()`. Ako dodaješ kolonu koja nosi lični podatak, vidi i
`AccountDeletionErasesEverythingTest` — on upiše probni podatak u svaku
tekstualnu kolonu i traži da nijedan ne preživi brisanje naloga. Uhvatio je
`google_id` i `google_avatar` isti dan kad su nastali.

### Octane ubija zahtjev na 30 sekundi

Nema `config/octane.php`, pa vrijedi Octaneov default:
`config('octane.max_execution_time', 30)`. Radnik se **ubija**, ne vraća grešku —
veza pukne, nginx upiše **502 bez tijela**, a naša poruka nikad ne bude
napisana. U logu izgleda kao pad servera.

Svaki zahtjev koji zove tuđi API mora stati ispod toga **zbrojem svih poziva**.
I `retry(2, …)` su **tri** pokušaja, ne dva.

| | Prije | Sada |
|---|---|---|
| PlayStation | 50 s | 22 s |
| Epic | 63 s | 8 s |
| GOG | 78 s | 14 s |
| Xbox | 94 s | 10 s |

Sinkronizacije zadržavaju duge budžete — one su u queueu gdje strop ne postoji.

### Cloudflare pojede tijelo 502 i 504

Zamjenjuje ih svojom stranicom. Poruka poslana s tim statusom **nikad ne stigne
do browsera**. Zato greške tipa „nismo uspjeli pročitati tvoj nalog” idu kao
**503**, koji prolazi — i iskreniji je, jer nije bad gateway.

Isto tako Cloudflare **kešira 404** na `/games/*` uprkos `no-store` s origina.

### PlayStation: `me` nije putanja koju Sony prihvata

Sonyjev token je JWT i **nema `sub`** — id naloga je claim **`account_id`**.
Puni set claimova: `account_id, account_uuid, age, authz_c, client_id, dcim_id,
env_iss_id, exp, grant_type, iat, is_child, iss, jti, legal_country, locale,
user_device_ip, ver`.

Profil se traži na `/userProfile/v1/internal/users/{accountId}/profiles` —
`me` na toj putanji vraća **400**. Zbog te dvije greške povezivanje PlayStationa
nije radilo **nijednom** do 4. 9. 2026.

### `actingAs` traje do kraja testa

Poslije njega običan `getJson` je i dalje prijavljen kao taj korisnik. Test koji
provjerava da nešto ne curi „odjavljenom čitaocu” tako prolazi iz pogrešnog
razloga. Rješenje: `$this->app->get('auth')->forgetGuards()`.

### `Http::fake()` se dodaje, ne zamjenjuje

Drugi poziv ne gazi prvi — **prvi registrovani stub pobjeđuje**. Za dva različita
odgovora na isti URL koristi `Http::sequence()`.

### `revalidatePath()` na dinamičkoj ruti ne radi ništa

Radi samo brisanje po tagu.

### Prepisivanje po hostu i `usePathname()`

Na `help.techplay.gg` prepisivanje je serversko, pa je `pathname` uvijek `/`,
nikad `/help`. Za prepoznavanje sekcije koristi `useSelectedLayoutSegment()`.
Prva verzija je isporučila zaglavlje sajta na subdomen s linkovima koji tamo
vraćaju 404.

### `libpcap` i IPv6

`tcp[tcpflags]` u tcpdump filteru hvata **samo IPv4**. `www.google-analytics.com`
se na ovom serveru razrješava na IPv6, pa je mjerenje s tim filterom pokazalo
nulu prometa koji je zapravo tekao. Koristi `ip6 and tcp port 443`.

### Dvije Tailwind klase za isto svojstvo

Imaju istu specifičnost, pa odlučuje redoslijed u stylesheetu. Sastavljaj iz
zajedničkih dijelova, nikad ne dodaji „override” na kraj.

### Element koji se vidi tek nakon hidracije

Cookie banner je isporučivan sa `opacity: 0` i pojavljivao se tek kad framer-motion
odradi animaciju — dakle poslije hidracije. Ko ode u prve dvije sekunde, nikad ga
ne vidi. Isto je jednom bilo i sa samim GA tagom. **Ako element odlučuje o nečemu
mjerljivom, mora biti vidljiv iz HTML-a.**

### `$get` u Filament formi se ne smije tipizirati

Filament v5 ubacuje `Filament\Schemas\Components\Utilities\Get`.
**`Filament\Forms\Get` u ovoj verziji ne postoji** — ime izgleda očigledno tačno
i očigledno je pogrešno. Tipiziran tako, cijela stranica vraća 500.

Podmuklo je što se otkrije tek kad je neko otvori: greška nastaje pri **gradnji
forme**, ne pri učitavanju klase, pa `php -l` prolazi i svi testovi logike
prolaze. Dvanaest testova je bilo zeleno dok se ekran nije mogao otvoriti.

Ostatak koda koristi netipizirani `$get` i to je ispravno — ubacivanje radi koja
god klasa da se prosljeđuje.

`MailDeskTest::test_the_admin_screens_open` sada otvara oba ekrana i traži 200.
Provjereno tako što je greška namjerno vraćena: test padne, pa prođe kad se
ukloni. **Svaki novi Filament ekran vrijedi dodati u tu petlju** — logika koja
radi iza stranice koja se ne otvara nije funkcija.

### Novi Filament resurs se ne pojavi dok se keš ne prebuildi

`bootstrap/cache/filament/panels/admin.php` drži spisak svih resursa, stranica i
widgeta koje panel poznaje. Napravi se jednom i onda mu se vjeruje — pa novi
resurs **ne postoji u meniju** ma koliko puta deployao. Fajlovi jesu na serveru,
klasa se učitava, `Filament::getPanel()->getResources()` je vidi iz konzole, a
menija nema.

Otkriveno 11.09.2026. s dva nova ekrana koja su bila živa i nevidljiva; keširani
fajl je bio od 09.09.

`techplay-deploy.sh` sada radi `php artisan filament:cache-components` uz
`config:cache` i ostale. Ako se ikad opet desi, to je prva komanda za pokrenuti —
i poslije nje `supervisorctl restart techplay-octane:*`, jer Octane drži stari
panel u memoriji.

### Mjerenje sa servera ne prolazi kroz Cloudflare

Javno ime vraća 403 izazov serverskim zahtjevima. Mjeri na `127.0.0.1:8000` sa
`Host` zaglavljem.

### Brisanje jednog dijela odnese i sve što je bilo pored njega

Commit `22e628f2` (02.03.2026) zove se *"remove leaderboard, center layout to
single column"* i skinuo je 183 linije sa `GiveawayClient.tsx`. Ljestvica je
bila **3** od njih. Ostalih 180 bio je desni stubac oko nje: bodovi učesnika,
šansa za dobitak, niz dana, referral link i dugme za dnevni bonus.

Ništa nije puklo i ništa nije prijavljeno. `POST /giveaways/{slug}/daily-bonus`
je nastavio raditi i odgovarati **šest mjeseci**, samo ga ništa na sajtu nije
zvalo; `handleClaimDailyBonus`, `handleCopyReferral`, `streakProgress` i
`RING_CIRCUMFERENCE` su cijelo to vrijeme stajali u fajlu, izračunati i
neiskorišteni. Ko bi ušao u nagradnu igru, ne bi dobio nikakvu potvrdu da jeste.

Vraćeno 09.09.2026. Pouka je opštija od nagradnih igara: **kad se briše jedan
element, provjeri šta je bilo u kontejneru oko njega** — i ako ostane funkcija
koju niko ne zove, to nije mrtav kod nego ekran koji je nestao. ESLint na ovom
projektu ne prijavljuje neiskorištene lokalne funkcije, pa nije ni imao ko reći.

---

### `specializations` i `skills` su objekti, `equipment` je lista

Isti odgovor `/v2/characters?ids=all`, različiti oblici. `equipment` i
`crafting` su liste; `specializations` i `skills` su **objekti po modu igre** —
`pve`, `pvp`, `wvw`, svaki sa svojim setom.

```sql
-- provjereno na živom liku 28. 9. 2026.
select jsonb_typeof(equipment), jsonb_typeof(specializations) from gw2_characters;
--  array | object
```

Ko čita build mora izabrati mod. Tretiranje kao ravne liste pročita pogrešan mod
ili ništa — `jsonb_array_length` na tome baci `cannot get array length of a
non-array`.

Uz to: Agony Resistance se sabira **isključivo** iz `equipment`, jer je to ono
što lik trenutno nosi. Sabiranje infuzija iz neaktivnog šablona bi prijavilo
oklop koji igrač nema na sebi.

### `updateOrInsert` prepiše `created_at` i na update putu

Vrijednosti iz drugog argumenta se primjene na **oba** puta. Zato je
`created_at` na `gw2_accounts` bio prepisivan svaki put kad bi neko ponovo
povezao ključ, a na `gw2_characters` **na svakoj sinhronizaciji**.

Taj datum ograničava dokle historija napretka može da dosegne, pa je to jedini
ovdje koji se ne smije micati. Rješenje je provjeriti postoji li red i onda
`update` ili `insert` — ne `updateOrInsert`.

### Dva formata za isti trenutak u jednom odgovoru

`last_synced_at` dolazi kroz Eloquent cast i serijalizuje se kao UTC ISO-8601;
`last_full_sync_at` je dolazio sa sirovog query builder reda, kao string koji je
PostgreSQL zapisao. Tako natpis „sinhronizovano prije 2 sata" promaši za dva
sata. Sirovi redovi se moraju `Carbon::parse`-ovati prije nego odu klijentu.

### Izvoz podataka čita query builderom, pa `$hidden` na modelu ne radi ništa

`UserDataExportService` vuče redove sa `DB::table(...)->get()`. Eloquentov
`$hidden` se tu **ne primjenjuje**, pa su `connected_accounts` i
`user_integrations` slali `access_token` i `refresh_token` u preuzetu datoteku.

Šifrovano, pa nije odmah upotrebljivo — ali šifrat tuđih Steam, Discord i GW2
kredencijala nije njegov da mu se preda u zipu, i ostaje dešifrabilan dokle god
je `APP_KEY` isti.

Rješenje je `SECRET_BY_TABLE` u servisu. Test provjerava **cijeli serijalizovani
dokument**, ne imenovane ključeve, jer sljedeća tabela s tokenom neće biti ove
dvije.

Uz to: `UserDataExportTest` skenira kolone (`user_id`, `author_id`, `sender_id`)
i pada kad neka tabela nije klasifikovana. GW2 tabele osim `gw2_accounts` vise o
`gw2_account_id`, pa ih skener **ne vidi** — zato su u `EXPORTED_VIA`, ručno.
`gw2_progress_history` je tu najvažniji: GW2 API nema lifetime pregled raidova ni
svjetskih bosova, pa su ti redovi jedini primjerak te historije koji postoji.

## 17. Šta nije ono što izgleda

Mrtvo, prazno ili nedovršeno — da niko ne gradi na tome.

| Stvar | Istina |
|---|---|
| `SchemaService` | radi, ali ga čita **samo staff debug endpoint** — ništa što emituje nikad nije stiglo do čitaoca. JSON-LD koji Google vidi piše frontend. |
| `ImageOptimizationService` | traži `intervention/image`, koje **nije u composer.json** — prijavljuje se kao nedostupan i svaki pozivalac tiho ne uradi ništa. Instaliraj paket ili obriši servis; **ne dodaj četvrti**. |
| `maintenance_mode` postavka | middleware i `/coming-soon` obrisani; postavka je preživjela i **spojena je ni na šta**. Za gašenje sajta koristi `php artisan down` ili nginx. |
| `faq_items`, `seo_metas` | prazne tabele bez modela; audit kaže da ih treba obrisati. **Nije urađeno** — brisanje tabela na produkciji traži izričitu odluku. |
| `products`, `orders`, `support_tiers` | prazne jer shop **nije pušten**. PayPal je u sandboxu, bez plan id-ova. |
| Registar listing ključeva | mašinerija koju je trebao file store, a Redis je ne treba. Bezopasna, nije razmotana. |
| `template/` | Next starter s kojim je sajt počeo. **Obrisan 7. 9. 2026** — niko ga nije referencirao od 20. juna. |
| `Vehicles/`, `weapons/` u korijenu | izvorne kopije GTA 6 slika. Iste slike su u `frontend/public/gta6/` i baza referencira **njih**. Nisu u gitu; ostavljene namjerno. |
| `game_tombstones` sa 61 034 reda | nisu smeće — bez njih obrisane igre vraćaju 404 zauvijek. |
| 4 vraćene obrisane igre | purge nije zakazan i uvoz ne konsultuje ploče, pa se obrisano može vratiti. |
| `SendChatReminder`, `FetchOgData`, `MobyEnrichmentJob`, `PingIndexNow` | navođeni u staroj dokumentaciji, **ne postoje**. |
| `GeminiService`, `OpenAIService` | opisivani mjesecima, nije ih zvao niko; obrisani 18. 8. 2026. |
| MobyGames, RAWG | penzionisani u pregradnji kataloga 08/2026. Nisu izvor. |

---

## 18. Mobilna aplikacija

Četvrti dio, mlađi od ostala tri i **pauziran 9. 9. 2026**. Expo / React
Native klijent u `mobile/`, čita isti API kao sajt (`api-beta.techplay.gg`).

Ne opisuje se ovdje — ima svoj zapis, i taj je detaljan:

**[`mobile/README.md`](../mobile/README.md)** — šta radi, šta ne, zamke, i
tačan popis onoga što je sljedeće.

Tri stvari vrijedi znati i bez otvaranja tog fajla:

**Aplikacija čita isti API i zato pokazuje njegove nedosljednosti.** Sedam
listajućih endpointa odgovara u šest oblika (vidi §16), a sajt to ne primjećuje
jer je svaka stranica pisana uz svoj endpoint. Jedan binarni klijent nema tu
mogućnost — razliku upija `mobile/src/lib/paging.ts`. **Kad se mijenja oblik
odgovora, mijenja se i ugovor s aplikacijom koja je već na nečijem telefonu.**

**Ikone su generisane iz `lucide-react` verzije koju frontend ima instaliranu**,
ne prepisane. Ako se ta verzija podigne, generiši ih ponovo — inače se setovi
tiho raziđu.

**Ništa se ne može poslati u prodavnice bez developerskih naloga.** Apple 99 $
godišnje s provjerom identiteta koja traje sedmicama, Google Play 25 $
jednokratno. Push, Sign in with Apple i provjereni deep linkovi svi čekaju to.

---

## 19. Mjerenje posjete

Postoje **dva brojača i oni se neće složiti**. To nije kvar; svaki broji drugu
stvar, i razlika je dvocifreni faktor.

### Google Analytics broji one koji su pristali

Od **2. septembra 2026.** banner za kolačiće je konačno spojen s Consent Mode.
Do tada je `<head>` bezuslovno tvrdio `analytics_storage: 'granted'` bez obzira
šta je čovjek kliknuo — i uz to `client_storage: 'none'`, pa GA nije smio
sačuvati identifikator. Posljedica: **svako učitavanje stranice bilo je novi
„aktivni korisnik"**. Odatle 70.000 korisnika u 90 dana i prosječno vrijeme
angažmana od pet sekundi.

Sada je tačno, i zato je malo: 8. septembra 2.094 pogotka su nosila `gcs=G100`
(odbijeno) i 157 `gcs=G111` (odobreno). GA je prijavio **11** aktivnih
korisnika. Stopa pristanka je 2–7%.

**Ne vraćati staro ponašanje.** Nije stvar u propisu nego u tome da imamo
zabilježeno „ne" i da smo pratili uprkos njemu — a i brojka je bila netačna.

### 20. septembra 2026: naš banner je zamijenjen Googleovim CMP-om

Onih 2–7% gore **više ne važi i brojka će naglo skočiti.** To nije kvar i nije
povratak na staro ponašanje; promijenilo se ko se uopšte pita.

AdSense je ograničio prikazivanje reklama na cijelom sajtu uz razlog „No CMP":
Google traži da izdavač koji prikazuje personalizovane reklame u EEA, UK i
Švicarskoj koristi platformu koju je **on certificirao po IAB TCF-u**. Naš
vlastiti dijalog, ma koliko ispravno radio, tome ne udovoljava jer nije
certificiran. Obrisan je, zajedno s `CookieConsentBanner.tsx`, njegovim CSS-om i
cijelim sistemom preferencija u `lib/consent.ts`. Pita sada Googleov CMP, kroz
AdSense skriptu koja je ionako na svakoj stranici.

Ostalo je samo zadano stanje — i **ono se ne piše u kodu nego ga servira
nginx**, na `/consent`.

Prvo je bilo napisano Googleovom `region:` opcijom, s listom od 32 zemlje u
`lib/consent.ts`. **To ne radi i pada nečujno.** gtag zemlju saznaje tek
asinhronim pozivom na `https://www.google.com/ccm/geo`; dok odgovor ne stigne
ne zna gdje je čitalac i ponaša se najstrože. A `page_view` puca odmah, iz
`<head>`-a. Rezultat: svaki pogodak sa sajta nosio je `gcs=G100` — odbijeno —
jednako za Bosnu i Ameriku kao za Njemačku. Izmjereno: 203 pogotka poslije
deploya, nijedan odobren, uključujući provjereno bosanski IP.

Stari baner je to skrivao koliko god je postojao, jer je slao `consent update`,
koji Google prihvata bilo kad. Onih 1–2% `G111` bili su ljudi koji su kliknuli
„prihvatam". Zadano stanje ispod njih **nikad nije važilo ni za koga**.

Cloudflare nam zemlju kaže prije nego nginx pošalje ijedan bajt, pa se odgovor
tvrdi umjesto da se čeka:

```
map $http_cf_ipcountry $tp_consent_state   conf.d/zz-techplay-consent.conf
location = /consent                        snippets/techplay-consent-js.conf
```

**Lista zaštićenih zemalja živi u nginxu, ne u repozitoriju** — dodavanje
zemlje je `nginx -s reload`, ne deploy. `XX` i `T1` (Cloudflareovo „ne znam" i
Tor) idu u odbijeno; prazna vrijednost znači da zahtjev nije ni prošao kroz
Cloudflare — naši health checkovi — i ostaje odobreno.

Dvije zamke u toj konfiguraciji, obje plaćene:

- **Ime `zz-…` nije stil nego nužnost.** `conf.d/*.conf` se učitava abecedno, a
  nginx fiksira veličinu heša na prvom `map` bloku — poslije čega
  `map_hash_max_size` u generisanom `techplay-gone-games.conf` puca kao
  duplikat i **cijela konfiguracija ne prolazi test**.
- **Putanja je `/consent`, bez `.js`.** Cloudflare po zadanom keširа po
  ekstenziji, a jedna keširana kopija servirala bi odgovor jedne zemlje cijelom
  svijetu — tj. tačno ovaj kvar, samo nevidljiv.

Provjera da radi (poslije svake izmjene liste):

```bash
for c in BA US DE GB; do printf "%-3s " $c; \
  curl -sk --resolve techplay.gg:443:127.0.0.1 https://techplay.gg/consent \
    -H "CF-IPCountry: $c" | grep -o 'analytics_storage:"[a-z]*"'; done
```

**Zašto `granted` van Europe, a ne `denied` svugdje.** Zato što više nemamo
banner koji bi to odobrio. Zadano `denied` na cijelom svijetu zvuči opreznije i
nije: svi bi zauvijek gledali jeftinije nepersonalizovane reklame, uključujući
one koje nijedan propis u njihovoj zemlji ne traži da tako tretiramo. Amerika
nam je 35% prometa i najskuplje tržište.

**Zato GA sada mjeri gotovo sve.** Ranije je zadano bilo odbijeno dok neko ne
klikne, pa je 93–98% prometa bilo nevidljivo. Sada je nevidljiv samo europski
dio koji odbije. Kad brojke skoče desetostruko — to je ovo, a ne kvar.

**CSP je dio ovoga i lako se previdi.** `adsbygoogle.js` poruku dovlači s
`fundingchoicesmessages.google.com`, drugog domena nego s kojeg se sam učitao.
Taj domen je u `script-src`, `connect-src` i `frame-src` u `next.config.ts`.
Ako ispadne odatle, kvar je nevidljiv na najgori način: tag se učita, poruka se
nikad ne nacrta, svaki Europljanin ostane na `denied`, a AdSense i dalje
prijavljuje „No CMP" dok mi mislimo da je riješeno.

**Američka poruka je uključena** (20.09.2026). Američki režim je opt-out, ne
opt-in: personalizovano je zadano, a poruka nudi „Do Not Sell or Share" onima
koji je traže. Nije bila obavezna — nijedan prag američkih zakona nije blizu —
ali ne košta ništa u kodu i pokriva treći kalifornijski prag (50% prihoda od
„dijeljenja"), koji je za sajt koji živi od AdSensea jedini koji nije čist.

`users.cookie_preferences` je istog dana obrisan iz koda. **Kolona nikad nije
postojala u bazi** i nijedna migracija je ne pravi, pa je `PUT
/user/preferences` mogao samo pasti — što niko nije otkrio jer ga niko nije ni
zvao.

### Naš brojač broji sve

Sajt već relejira svaki GA pogodak kroz `/proxy/ga` na vlastitom imenu (da
blokatori ne presijeku mjerenje). Taj relej sada šalje kopiju i nama:

```
pregledač → /proxy/ga/g/collect  (frontend)
                ├── Google
                └── POST /api/v1/analytics/collect  (backend)
```

Nema druge skripte na stranici i čitalac ne čeka ništa — oba slanja idu kroz
Next-ov `after()`, nakon što je odgovor već poslan.

**Zašto ne traži pristanak:** ne pohranjuje nijedan identifikator. Nema našeg
kolačića i **IP adresa se ne upisuje** — posjetilac je `sha256(so + IP +
agent)`, a so se baca i pravi nanovo svake noći.

**Cijena toga:** isti čovjek sutra je drugi heš. „Jedinstveni posjetioci ovog
mjeseca" je pitanje na koje ovaj dizajn **ne može** odgovoriti, i stranica to
piše umjesto da izmišlja. Plausible i slični prave istu zamjenu.

### Botovi se broje i pokazuju

Ne filtriraju se tiho. Svaki pogodak nosi `is_bot` i `bot_reason`, izvještaji
čitaju `is_bot = false`, a stranica **piše koliko je izuzela**. Broj koji tiho
izbacuje stvari je broj koji niko ne može provjeriti.

Pravilo koje odvaja: agent koji tvrdi da je Chrome a ne šalje `sec-ch-ua`.
Svaki pravi Chrome i Edge ga šalje od 2021. **Isto to pravilo je namjerno
odbijeno za blokiranje na nginxu** — Googlebotov agent također sadrži
`Chrome/`, a firewall ne smije biti u krivu oko Googlebota. Ovdje biti u pravu
o Googlebotu je poenta: on nije čitalac.

### Tabele i poslovi

| | |
|---|---|
| `analytics_events` | sirovi pogoci, brišu se nakon 90 dana |
| `analytics_daily` | dnevni zbirovi, čuvaju se zauvijek |
| `analytics_daily_breakdowns` | stranice, izvori, države, uređaji, pregledači |
| `analytics:rollup` | svakih 10 minuta; **gradi dan nanovo**, ne dodaje na njega |
| `analytics:prune` | 03:40, briše sirove redove starije od 90 dana |
| `ANALYTICS_INGEST_TOKEN` | mora biti isti u `backend/.env` i `frontend/.env.local`; ako nije postavljen, prijem je ugašen a ne otvoren |

Izvještaj je u Filamentu: **System → Analitika**.

---

## 20. Mail — šta šaljemo i odakle

Napravljeno 11.09.2026. Prije toga kampanja je bila **klasa**: `newsletter:launch`
je komanda u PHP-u, tekst u Blade fajlu, a drugo slanje s drugim riječima je
tražilo deploy. Publika je bila sve-ili-ništa i ništa nije bilježilo kome je
poslano.

### Koliko mailova sajt uopšte šalje

**Pet.** Ne 22.

| Mail | Klasa | Uređiv |
|---|---|---|
| Potvrda adrese | `VerifyEmailNotification` | da |
| Reset lozinke | `ResetPasswordNotification` | da |
| Potvrda newsletter prijave | `NewsletterVerification` | da |
| Kontakt forma (nama) | `ContactFormMessage` | ne |
| Kampanja | `CampaignMessage` | piše se u adminu |

Od 22 klase u `app/Notifications/`, **20 nikad ne izlaze iz sajta** — kanal im je
`['database']`, dakle stoje samo u zvoncu. To uključuje i `WeeklyDigestNotification`,
pa "sedmični pregled" niko ne dobija mailom. Ako se to ikad poželi, treba mu dodati
`mail` kanal — nije kvar, ali je lako pomisliti da radi.

### Tabele

| Tabela | Šta drži |
|---|---|
| `mail_templates` | riječi mailova koje sajt šalje sam |
| `mail_campaigns` | newsletter koji neko napiše i pošalje |
| `mail_campaign_recipients` | jedan red po osobi po kampanji — evidencija |
| `mail_campaign_clicks` | koji link, ko, kada |

### Granica koju ne treba pomjerati

Šabloni **nisu HTML**. Urednik iz admina mijenja naslov, naslovnu liniju, pasuse
i tekst na dugmetu. Link i token na dugmetu crta kod i nijedan šablon ih ne
dodiruje.

Razlog je konkretan: dva od tri mail-a nose jedini put u nalog. Šablon koji bi
mogao obrisati dugme je šablon koji zaključa svakog novog člana van sajta —
**tiho**, bez greške u logu, dok se neko ne javi da mail ne radi.

Prazan ili ugašen red nije greška. Klasa nosi svoju kopiju i koristi je, pa sajt
šalje ispravan mail i kad je tabela prazna. To čuva `MailDeskTest`.

### Ko smije dobiti mail

Jedan odgovor, na jednom mjestu: `CampaignAudience::resolve()` završava sa
`MailSuppression::filter()`, ma koji segment bio izabran. Novi segment ne može
doći do nekoga tako što zaboravi pitati.

- **Nepotvrđeni nalozi nikad nisu u publici.** Nemamo dokaz da adresa nekoga
  stiže, a slanje na adrese koje se odbijaju je kako pošiljalac bez reputacije
  gubi ono malo što ima.
- Publika se pretvara u listu **na početku slanja**, ne pri pisanju. Ko se odjavi
  između to dvoje, ne dobija poruku.
- Pita se **još jednom, po primaocu**, u trenutku slanja — jer dugo slanje traje
  minutama.

### Praćenje

Piksel za otvaranje i preusmjeravanje za klik, oba pod `/api/v1/mail/`.

**Otvaranja su donja granica, ne mjerenje.** Apple Mail Privacy Protection povuče
piksel bez obzira je li čovjek pogledao, a Gmail ga povlači kroz posrednika.
Klikovi su broj kojem se vjeruje. Klik se broji i kao otvaranje, jer ko ima
isključene slike nikad ne okine piksel.

**Ruta za klik mora ostati potpisana.** Bez potpisa je to otvoreno preusmjeravanje
s imenom našeg domena — svako bi mogao dijeliti `api-beta.techplay.gg/...` link
koji vodi bilo gdje i nositi našu reputaciju. To je tačno oblik phishing linka.
Test to čuva.

**Link za odjavu se namjerno ne prati.** Mora raditi kad sve drugo padne: ko se ne
može odjaviti, prijavi kao spam, a spam prijava je ono što mali pošiljalac ne
može platiti.

### Tempo

`batch_size` i `pause_seconds` po kampanji, po zadanom 10 poruka svake 3 sekunde.
Šaljemo s vlastitog servera koji kod Gmaila stiže bez ikakve reputacije; sto
poruka u sekundi je oblik spam kampanje i biti pročitan tako košta mnogo više od
minute koju pauza uzme.

### Zamke iz izrade

- `MailTemplate::substitute()` se **ne smije** zvati `fill()` — Eloquent već ima
  nestatičku `fill()`, a statička na njoj je fatalna greška pri učitavanju klase
  i cijela aplikacija prestane da se diže.
- Adrese se porede **malim slovima**. Provjera odjave je prvo tražila adresu
  onako kako je unesena, a redovi pretplatnika su spremljeni malim slovima — pa
  je promašivala i slala poruku onome ko se odjavio. Tiho, i u korist slanja.
- `MailSuppression::filter()` vraća **niz**, ne kolekciju.
- Preheader linija se ne vraća ni u jedan mail. Naš vlastiti filter ju je bodovao
  `ZERO_FONT 0.50` i `MANY_INVISIBLE_PARTS 0.80` jer je skriveni tekst s ključnim
  riječima način na koji spam radi. Prva vidljiva linija tijela radi taj posao.

---

## 21. Guild Wars 2 — Progression Advisor

Alat za GW2 igrače: šta im je otvoreno, šta im fali i šta se isplati raditi
sljedeće. Plan i analiza su u `gw2/ANALIZA-I-PLAN.md`; ovdje piše šta je
**izmjereno i pušteno**, 28. 9. 2026.

Dva dijela koja ne dijele ništa osim budžeta poziva: **katalog** (podaci igre,
isti za sve) i **nalog** (ono što jedan igrač ima).

### Rate limit je zajednički — i to je cijela arhitektura

Mjereno na živom API-ju 27. 9. 2026., ne prepisano iz dokumentacije:

| Mjerenje | Rezultat |
|---|---|
| 400 zahtjeva | prošlo u 7,5 s, nijedan odbijen |
| 1.000 zahtjeva | 500 prošlo, 500 odbijeno (429) |
| pauza 30 s, pa 200 | sve prošlo |
| `x-rate-limit-limit` | `600` |

Wiki tvrdi „5 zahtjeva u sekundi"; API je propuštao pedesetak. Bitno je nešto
drugo: **limit se broji po IP-u**, a svi naši zahtjevi izlaze sa jednog servera.
Budžet je dakle **sajtov, ne igračev** — četiri stotine zahtjeva potrošenih na
itemе su četiri stotine koje čitalac koji čeka nije dobio.

Zato `Gw2Client` drži svoj kanister u Redisu na **400 u minuti** (dvije trećine
izmjerenog), a **nijedan zahtjev prema ArenaNetu se ne šalje dok neko gleda
stranicu**. Sve ide kroz red poslova.

`429` nije greška — znači *kasnije*, ne *ne*. Tretirati ga kao grešku značilo bi
obilježiti ispravan nalog kao pokvaren i baciti sinhronizaciju kojoj je do kraja
falila jedna pauza.

### Katalog — `gw2:catalogue`, 03:10

Provjera košta **jedan zahtjev**: `/v2/build` vrati jedan cijeli broj. Ako se
build nije promijenio, run tu i završi. Kad se promijeni, ponovno čitanje svih
osamnaest endpointa je oko **495 zahtjeva**.

Stanje na build `207318` — 95.862 reda:

| Tabela | Redova |
|---|---|
| `gw2_items` | 74.265 |
| `gw2_recipes` | 13.198 |
| `gw2_achievements` | 8.339 |
| `gw2_reference` (14 vrsta) | 2.020 |
| `gw2_masteries` | 40 |

`gw2_reference` po vrsti: quests 586, titles 496, **achievements_categories
360**, itemstats 191, stories 148, specializations 81, currencies 79,
**achievements_groups 19**, worldbosses 15, stories_seasons 13, professions 9,
mounts_types 9, dungeons 8, raids 6.

`gw2_catalog_meta` pamti build i grešku po endpointu, pa jedan odbijen endpoint
ne obori ostale — sljedeći run pročita tačno ono što fali.

**`gw2_achievements.advisor_eligible`, `effort_band` i `reviewed_at` su naša
kuracija i namjerno su izvan osvježavanja.** Refresh ih ne dira; da ih dira,
svako čitanje kataloga bi obrisalo ručni rad.

#### Dvije zamke koje su se ponovile

**Ključ keša zna da se nalog promijenio, ne da se payload promijenio.**
`gw2:dashboard:*` nosi `observed_at`. Doda se polje u payload i svaki povezani
igrač sat vremena dobija stari oblik — uz deploy koji javlja uspjeh i stranicu
koja tiho ne crta ništa novo. Zato `Dashboard::PAYLOAD_VERSION`, isto kao na
javnim stranicama. **Mijenjaš oblik → mijenjaš broj, u istom commitu.**

**`CatalogueSync::store()` grana na *vrijednost* iz `ENDPOINTS`, ne na ključ.**
Za `achievements/categories` ta vrijednost je `reference`, ista kao za desetak
drugih. Grana pisana po imenu endpointa izgleda ispravno i nikad se ne izvrši —
`category_id` je ostao prazan kroz pun sync koji je javio 360 redova.

**I: isti id dvaput u jednom upsertu je Postgres greška**, ne no-op.
`/v2/mounts/skins` vrati 488 id-jeva od kojih su 487 različiti. Deduplikacija je
sad u `upsert()`, ne na pozivnom mjestu.

#### Korake postignuća piše ArenaNet, ne mi

`gw2_achievements.bits` je uređena lista koraka s tekstom koji je napisala
ArenaNet — *„Somewhere in Necrotic Coast."*. Zapis naloga za isto postignuće
nosi `bits` kao **listu indeksa već završenih koraka**. Jedno je mapa, drugo
čioda, i spajaju se po poziciji: korak tri je `bits[2]` i gotov je ako se 2
pojavi u nalogovoj listi.

Mjesec dana smo zrcalili prvo i čitali drugo i nikad ih spojili, pa je savjet
glasio „Skyscale Eggs — ostala 3 koraka" bez ijedne riječi **koja** tri. Sad
`AchievementSteps` radi to spajanje za oba pozivaoca (savjeti i vodiči), a
`AchievementStep.text` pada na ime predmeta iz `gw2_items` kad igra ne da tekst.
Gdje ni toga nema, `text` je `null` i crta se kao neimenovan korak — nikad
izmišljen.

**Ako walkthrough ikad počne čitati kao besmislica**, sumnjati na to da je
ArenaNet promijenila redoslijed u `bits` između buildova. Nije se desilo,
katalog se osvježava noću, a nalog se čita protiv istog builda — ali to je
jedini način da ovaj spoj tiho pukne.

`mastery_region` je izvučen iz `rewards[]` u kolonu jer je §12.1 filter a ne
prikaz: **909 postignuća** nosi mastery poen. Čuva se kako ga igra piše
(`Desert`, `Sky`), ne kako ga piše endpoint naloga (`Path of Fire`) — prijevod
je i dalje samo u `MasteryRegions`. **77 ih plaća u regiju `Magic`, koja nema
pandana u nalogu**, pa ta postignuća §12.1 ne može dizati; to je poznata
granica, ne kvar.

#### Ikonice — igra ih šalje, mi ih nismo prenosili

Svaki payload ovog alata bio je tekst i brojevi. To nije bila odluka o dizajnu:
slike stižu u istim odgovorima koje ionako plaćamo.

| Izvor | Pokrivenost |
|---|---|
| `gw2_items.icon` | 74.264 / 74.265 |
| `achievements/categories` ikonice | 360 / 360 |
| `gw2_achievements.icon` | 1.418 / 8.339 |
| **postignuće koje može nacrtati sliku** | **7.686 / 8.339 (92 %)** preko `category_id` |
| `gw2_masteries.background` | 40 / 40 — scene render po traci |
| `levels[].icon` | po stepenici, već je unutar `levels` |
| `mounts/skins` | mount ikonica preko `default_skin` |

`mounts/types` **nema** ikonicu — nosi samo `default_skin`, a slika je na skinu.
Zato je i taj endpoint u zrcalu.

Ono što API **ne** šalje i što se ovdje ne izmišlja: expansion key art iza hero
banera na mockupima i thumbnailovi događaja. To je ArenaNetova marketinška
grafika. `background` mastery trake je najbliža poštena stvar i bar jeste slika
nečega u toj regiji.

**Boja po domenu** je u `frontend/lib/gw2domain.ts` i namjerno **nije**
`--accent`. Akcenat pripada TechPlayu i prati korisnikovu postavku; ove boje
pripadaju igri i moraju stajati, jer igrač već povezuje rozu s ascended opremom.
`GameIcon` crta okvir u igrinoj boji rijetkosti.

#### Lanci mountova — šta je izvedeno a šta kurirano

§9.5 kaže da je put do mounta kurirani sadržaj, i to i dalje važi — ali manje
nego što je izgledalo.

**Ne radi:** `prerequisites` je postavljen na **jednom** od četrdeset Skyscale
postignuća. Kategorije ne pomažu — kolekcije sjede u „War Eternal" pored
trideset jedne nepovezane stvari. Traženje po imenu je pogađanje.

**Radi:** svaki mount ima mastery traku čiji `requirement` piše ArenaNet —
*„Complete the Guild Wars 2: Janthir Wilds story chapter Unknown Territory to
unlock the Warclaw Mastery track."* To je citat, i kičma je svih devet stranica
u `gw2_guides` s `family = 'mounts'`. (Usput rješava i ono što svi vodiči
pogriješe: warclaw je izašao iz WvW-a.)

Tri mounta idu dalje. Skyscale, Siege Turtle i Roller Beetle se otključavaju
kolekcijama, a kod Skyscalea **igra sama piše redoslijed**: njegovih pet faza
nosi `locked_text` tipa *„Unlocks a short time after completing the Saving
Skyscales collection."* — jedina četiri postignuća u katalogu od 8.339 koja to
rade. A svaka faza u svom tekstu koraka imenuje kolekcije koje traži.

Otud podjela: **čovjek drži kičmu u `gw2_guides.achievement_ids`, a
`gw2:expand-chains` izvede djecu iz teksta igre.** Skyscale: 6 upisanih → 30.
Komanda je namjerno ručna i dedupe-a po prvom pojavljivanju (drugi run je
no-op); nije u rasporedu jer bi komanda koja noću prepisuje uredničke podatke
jednom poništila nečiju ispravku.

Beetle je izuzetak u drugom smjeru — `Beetlemania` ima gole `id`-jeve bez teksta
pa se ništa ne izvodi, i njegova tri djeteta su upisana ručno.

**Sve stranice mountova su `reviewed_at = null`.** Proza je sastavljena iz
igrinih stringova i tačna je, ali je niko ko igra još nije pročitao.

### Nalog — `gw2:sync-accounts`, 03:30

ArenaNet je ukinuo OAuth. Igrač sam napravi ključ na account.arena.net, samo za
čitanje, sa dozvolama koje sam izabere. Ključ ide u `connected_accounts`
(šesti provider, uz Steam, Xbox, PlayStation, GOG i Epic) — šifrovan kroz
mutator, skriven iz serijalizacije.

`/v2/tokeninfo` se pita **prije** nego se bilo šta upiše. Ključ bez `account` i
`progression` se odbija uz objašnjenje, a ne sprema — spremljen mrtav ključ je
veza u koju igrač vjeruje i sinhronizacija koja pada svaku noć. Dozvole koje
fale se **imenuju** (`missing_features`), da UI može reći koja funkcija je
ugašena i zašto.

**Puno čitanje je 19 zahtjeva plus jedan po liku** — osamnaest `account/*` endpointa i jedan
`characters?ids=all`. To zadnje je iznenađenje: u jednom odgovoru vrati nošenu
opremu, torbe, specijalizacije, vještine, recepte i craft, pa `equipment_tabs` i
`build_tabs` uopšte ne trebaju dok se ne prikazuju neaktivni šabloni. Jedan
zahtjev po liku ide na `characters/:id/quests` — priča se vodi po liku i drugog
pogleda nema.
**Brzo čitanje je 6 zahtjeva** — ono što se mijenja unutar dana.

Provjereno na živom nalogu 28. 9.: 19 poziva, 1 lik, 832 reda u knjizi
predmeta, 6 poziva na brzom prolazu.

Tabele:

| Tabela | Šta je |
|---|---|
| `gw2_accounts` | visi o `connected_accounts`, umire s njim |
| `gw2_characters` | jedan red po liku; `equipment` je **nošeni** set |
| `gw2_account_state` | **jedan red po nalogu, prepisuje se** |
| `gw2_item_ledger` | sve što nalog ima, gdje god stoji |
| `gw2_progress_events` | **razlika između dva čitanja** |
| `gw2_rules` | šta savjetnik smije reći i kad — uredničko, ne kod |
| `gw2_events` | vremena bosova i meta; **prazna**, puni je čovjek koji provjeri |

### Zašto raspored, a ne dugme

`/v2/account/raids` vraća **samo ono očišćeno od sedmičnog reseta**, a
`/v2/account/worldbosses` od dnevnog. **Lifetime pregleda nema nigdje u API-ju.**

Od dana kad se nalog poveže, razlika između dva naša čitanja je **jedini zapis
te historije koji će ikad postojati**. Propuštena noć je sedmica tuđe historije
koju ništa poslije ne može rekonstruisati — i za igrača koji stranicu nije
otvorio. Zato je to noćni prolaz, a ne nešto što se pokrene kad neko dođe.

Poslovi se dispečuju **razmaknuti 5 sekundi**. Pedeset naloga odjednom je 900
zahtjeva, potrošen budžet, talas 429 i vraćanje kroz backoff od petnaest
minuta. Prozor je **20 sati, ne 24**, da zadatak koji zakasni par minuta ne
počne preskakati svaku drugu noć.

Sweep je pola sata **poslije** kataloga, ne pored njega: iz istog budžeta piju.

### API

| Ruta | Šta radi |
|---|---|
| `POST /api/v1/gw2/connect` | `throttle:10,1`, ključ ide u **tijelu** |
| `GET /api/v1/gw2/connection` | stanje, dozvole, šta fali |
| `POST /api/v1/gw2/sync` | brzo; `?full=1` najviše jednom u sat |
| `DELETE /api/v1/gw2/connection` | ključ i sve izvedeno |

Ključ nikad ne ide kroz query string — URL završi u access logu, u refereru i u
izvještaju o grešci, a ključ samo za čitanje je i dalje nečiji nalog.

Odgovor na traženje punog čitanja unutar sata je **vrijeme zadnje
sinhronizacije, ne greška**: ništa nije pokvareno, podaci su svježi koliko će i
biti.

### Testovi

`tests/Feature/Gw2ConnectionTest.php` — devet testova protiv stub klijenta, pa
ništa ne dira mrežu ni zajednički limit. Čuvaju četiri stvari koje bi svaka bila
tih kvar: ključ u odgovoru, brzi prolaz koji prebriše ono što čita samo puni,
izmišljena historija na prvom čitanju, i disconnect koji ostavi izvedene
podatke.

### Savjetnik — normalizacija, pravila, bodovanje

Radi od 28. 9. 2026. Tri sloja, i granica između njih je namjerna:
**mehanika je kod, politika su podaci.**

#### 1. Normalizacija — `Advisor\SnapshotReader` → `Snapshot`

Nijedno pravilo i nijedna kartica ne čita sirov oblik API-ja. Ovdje se jednom
odlučuje ono što bi se inače odlučivalo na petnaest mjesta:

| Šta | Kako |
|---|---|
| **Agony Resistance** | suma modifikatora infuzija iz **nošenog** seta, čitano iz `gw2_items.details.infix_upgrade` — ne iz imena predmeta |
| **Ascended slotovi** | **12**, ne 23: šest oklopa i šest nakita. Alati za branje, podvodna oprema i štap za ribolov su u istom nizu i ne ulaze |
| **Oružja** | odvojeno, jer build može imati jedno dvoručno ili četiri jednoručna — nema fiksnog imenioca |
| **Ekspanzije** | `access` je **pod**, a ne istina (vidi ispod) |
| **Nearly done** | postignuća iznad 80%, imenovana iz kataloga |
| **Owned** | suma po `item_id` kroz sve lokacije — knjiga drži red po mjestu, ovo odgovara na „imam li dovoljno" |

#### Polje `access` je riješeno

Testni nalog vraća `PathOfFire` a **ne** `HeartOfThorns` — a u istom odgovoru
ima **40 zarađenih Heart of Thorns mastery tačaka**. Tačke se ne mogu zaraditi u
sadržaju u koji nalog ne može ući, pa `access` imenuje **kupljeni proizvod**, ne
otključani sadržaj. (ArenaNet je te dvije ekspanzije spojio u jedan proizvod.)

Ne kodiramo ArenaNetova pravila o proizvodima, jer su njihova i mijenjaju se.
Umjesto toga `access` je pod, a dodaje se svaka regija u kojoj nalog **dokazano
igra** (`earned > 0`). Dokaz bije polje, i ne treba popravljati sljedeći put kad
se dvije ekspanzije spoje.

#### 2. Pravila — tabela `gw2_rules`, ne `match`

Ovo su **uredničke odluke, ne logika**: prag koji se pokaže pogrešnim, rečenica
koja loše zvuči, preporuka koja treba prestati da se pojavljuje. Svako od toga je
red koji se izmijeni u admin panelu, sa datumom, bez deploya.

| Kolona | Čemu |
|---|---|
| `producer` | koji generator gradi signal — imenovan, ne pogađan iz ključa, pa dva pravila dijele jednu mehaniku sa različitim pragovima |
| `requires` | `{path, op, value}` protiv **ravne mape činjenica** — namjerno bez jezika izraza |
| `weights` | množioci po činjenici; ovdje živi „16 nepotrošenih je važnije od 1" |
| `confidence` | `confirmed` → `high` → `medium` → `needs_confirmation` → `hidden` |
| `needs_expansion` | provjerava se protiv **razrješene** liste, ne sirovog `access`-a |

`Advisor\Facts` je jedini rječnik na koji `requires` smije gledati, i dodavanje
činjenice je namjerno izmjena koda — to je kapija koja čuva da tabela pravila
tiho ne zavisi od nekog ugniježđenog API oblika.

**Nepoznato nije nula.** Ključ bez `progression` dozvole nikad nije pročitao
trezor; `vault.open_objectives` je tada `null` i pada na svakom uporedjivanju.
Da je nula, nalog bi dobio savjet o nečemu što nikad nije izmjereno.

**`hidden` nije nivo nego penzija.** Pravilo koje se pokazalo pogrešnim prestaje
da se crta ali zadržava red, pa razlog zašto je postojalo ostaje zapisan.

#### 3. Mehanizam — `Advisor\Advisor`

```
pravila → filtriraj (namjera, vrijeme, ekspanzija, requires)
        → proizvedi signale
        → bodovanje (ograničeno na 0–200)
        → dedupliciraj (po subjektu, po identitetu, najviše 2 po cilju)
        → rangiraj (round-robin po domenu)
        → 3 glavne + 3 alternative
```

Dvije stvari su nađene tek gledajući stvarni izlaz, ne čitajući kod:

**Isto postignuće dvaput.** Dva pravila dijele proizvođača postignuća na
različitim pragovima, pa je ista stvar izlazila kao „Finish Auric Basin Explorer
— 1 step left" i „Close on Auric Basin Explorer". Dedupe ide i po subjektu, ne
samo po identitetu.

**Jedan domen pojede sve.** Trezor i mastery regije legitimno pobjeđuju po
bodovima — i na testnom nalogu su napunili i naslov i sve tri alternative, pa
**osam postignuća na jedan korak od kraja nije bilo nigdje**. Rangiranje je
round-robin po domenu preko svih šest mjesta, ne samo prve tri.

#### Šta savjetnik namjerno NE radi

- **Nema zbirnog skora.** Mockup crta „Weekly Completion Score 72/100"; jedan
  broj preko pet nevezanih domena morao bi izmisliti i težine i imenilac.
- **Nema tabele AR pragova po skali.** Modelovan je **samo 150 za T4**, i to kao
  cilj a ne kao kapija. Ostali pragovi nisu u API-ju, nisu u katalogu, i tabela
  napisana po sjećanju bila bi prvi izmišljeni broj u alatu.
- **Ne imenuje izvor predmeta.** Odakle dolazi koji ascended nakit je stvarno
  znanje, ali nije u API-ju ni u katalogu — ide u kurirano tijelo pravila ili
  nigdje.
- **LLM ne odlučuje.** Može prepisati objašnjenje u ljudskiju rečenicu, nikad ne
  bira preporuku.

#### API i alati

| | |
|---|---|
| `GET /api/v1/gw2/dashboard` | kartice + savjeti + istorija; `?minutes=`, `?goal=`, `?avoid[]=` |
| `GET /api/v1/gw2/masteries` | sve trake po regiji, cijene nivoa, šta tačke dosežu |
| `GET /api/v1/gw2/plan?item_id=&quantity=` | stablo izrade + spisak za nabavku |
| `GET /api/v1/gw2/items?q=` | pretraga 74.265 predmeta, trigram |
| `GET /api/v1/gw2/tonight?minutes=` | plan sesije, prioriteti, raspored |
| `GET /api/v1/gw2/content` | rajdovi, bosovi, tamnice — prozor i „ikad“ |
| `GET /api/v1/gw2/public/recipe/{id}` | **bez ključa** — stablo + u šta ulazi |
| `GET /api/v1/gw2/public/masteries` | **bez ključa** — 40 traka, cijene nivoa |
| `GET /api/v1/gw2/public/craftable?page=` | **bez ključa** — indeks, 131 stranica |
| `php artisan gw2:snapshot` | ispiše normalizovano stanje |
| `php artisan gw2:advise --minutes=30 --avoid=vault` | ispiše savjete |

Keš je na sat, a ključ nosi `observed_at` — nova sinhronizacija ga poništava tako
što upiše drugi ključ, ne tako što se neko sjeti da ga obriše. Filtrirani upiti
se **ne** keširaju: namjera je pitanje koje je igrač tek postavio.

Deset pravila je zasijano (`Gw2RuleSeeder`, idempotentno po `key`, pa re-seed ne
gazi uredničke izmjene). Na testnom nalogu 22 kandidata → 6 prikazanih kroz pet
domena.

#### Testovi

`tests/Feature/Gw2AdvisorTest.php` — deset testova, fiksture prepisane sa živog
naloga. Dva od njih su prvo bila napisana **pogrešno**: prolazila su i kad se
popravka ukloni, jer ih je štitila nepovezana granica (kapa od 2 po cilju,
odnosno fixture sa manje kandidata nego mjesta). Prepisani su i onda dokazani
lomljenjem popravke.

### Masteries — dvije neizrečene stvari o API-ju

Obje su tihe kad su pogrešne: preimenovana regija ili promijenjeno značenje
`level`-a prepolovile bi nečiji napredak bez ijedne greške igdje. Obje su
**izvedene aritmetikom**, ne pročitane.

#### 1. Dva različita imena za istu regiju

`/v2/masteries` kaže `Maguuma`. `/v2/account/mastery/points` za istu regiju kaže
`Heart of Thorns`. **Ništa u odgovorima ih ne povezuje.**

| Katalog | Nalog |
|---|---|
| `Tyria` | Central Tyria |
| `Maguuma` | Heart of Thorns |
| `Desert` | Path of Fire |
| `Tundra` | Icebrood Saga |
| `Jade` | End of Dragons |
| `Sky` | Secrets of the Obscure |
| `Wild` | Janthir Wilds |
| `Magic` | **nema para** |

`Magic` (Castoran Survivalist, Wild Castoran Magic, Skimmer Adaptation, Rift
Amplification) nema odgovarajuću regiju u endpointu za tačke. Ostaje nemapiran i
prikazuje se odvojeno — pogađanje bi upisalo tačke pod pogrešnu ekspanziju.

#### 2. `level` broji od nule

Pročitano kao „broj završenih nivoa" dalo je 10, 6, 3 i 0 potrošenih tačaka
protiv četiri regije koje sam nalog prijavljuje kao **24, 11, 8 i 1**.

Pročitano kao **indeks od nule** — dakle `level + 1` plaćenih nivoa — daje
24, 11, 8 i 1. Četiri nezavisna zbira, svi tačni.

Posljedica: traka prijavljena sa `level: 0` ima **prvi nivo plaćen**, ne nijedan.
Traka bez ijednog plaćenog nivoa **uopšte nije u odgovoru**.

`Gw2MasteryArithmeticTest` je ta ravnoteža, pa preimenovanje regije ili izmjena
značenja `level`-a obori test umjesto da tiho prepolovi traku napretka.

#### Zbog čega je ovo bitno: imenilac postoji

Mockup crta „Heart of Thorns 73% · 186 / 254 Mastery Points". Prvo sam taj broj
otpisao kao neizračunljiv. Nije: `/v2/masteries` nosi `point_cost` na **svakom**
nivou, pa je imenilac zbir nad katalogom, a ne broj koji je neko izabrao.

Na testnom nalogu: Heart of Thorns 17% (24/144), Path of Fire 7% (8/110),
Central Tyria 22% (11/49), Icebrood Saga 2% (1/63).

#### Preporuka po nivou, ne po traci

Cijene rastu strmo — Itzel Lore ide 1, 2, 3, 5, 8, 12. Zato „imaš 16
nepotrošenih tačaka" nije savjet nego činjenica; savjet je „sljedeći nivo
Glidinga košta 3". Šesnaest tačaka ili kupi četiri jeftina nivoa ili većinu
jednog skupog, i samo cijena nivoa kaže koji.

Dva pravila **dijele posao** kroz činjenicu `mastery.affordable_tiers`: kad nešto
jeste dostupno, pali se pravilo koje imenuje nivo i cijenu; kad tačke ne dosežu
ništa, ostaje ono neodređenije, jer je ono jedino tačno.

**Naučeno usput: univerzalna napomena nije blokada.** Prvo sam tom pravilu dao
blokadu „nivo traži i iskustvo, ne samo tačke". Tačno — i tačno za svaki nivo na
svakoj traci uvijek. Kao blokada to nije informacija nego disclaimer, i koštalo
je pravilo 30% boda, pa se nikad nije pojavilo. Napomena koja važi za sve ide u
rečenicu, ne u rangiranje.

#### Seeder posjeduje pravilo dok ga čovjek ne pregleda

`firstOrCreate` je zamrznuo podrazumijevane vrijednosti na dan kad su prvi put
upisane — ispravljen prag u kodu nikad nije stigao do baze koja je red već
imala. Isti kvar zastarjelog spiska koji su imali i izvoz podataka i brisanje
naloga.

Sada: red bez `reviewed_at` se **ažurira** iz seedera, red sa `reviewed_at` se
**ne dira**. Postavljanje tog datuma je način na koji urednik kaže „ovo je sad
moje".

### Planer izrade — `RecipeTree`

Za zadati predmet vraća sve što još treba, uz oduzetu postojeću zalihu. **Sve
lokalno:** 13.198 recepata i 74.265 predmeta su već u našim tabelama, pa je plan
nekoliko indeksiranih upita. Preko API-ja ne bi ni bilo moguće — jedno ascended
rame je **90 čvorova kroz 6 nivoa**, a limit pripada cijelom sajtu.

Mjereno 28. 9. na živom nalogu: **63 ms**, 10 stavki na spisku.

#### Pravilo koje ovo čini korisnim

**Ono što imaš, ne razlaže se.** Dva Deldrimor Steel Ingota u banci znače šest
ruda koje niko ne mora kopati — i one se **uopšte ne pojavljuju** na spisku.
Planer koji sve razloži pa oduzme na dnu šalje ljude da kupe ono što im već stoji
u banci, a to je jedini kvar zbog kojeg ova funkcija i postoji.

#### Zaliha je bazen koji se troši, ne broj koji svaka grana čita

Ovo je greška koju sam uhvatio prije nego je otišla, i tiha je kad se desi.

Isti materijal stiže u plan kroz **više grana** — mithril kroz ingot, kroz ploču
i kroz ležište. Ako svaka grana oduzme istih 20 ruda iz iste banke, **svaka**
prijavi manjak 20 manji nego što jeste. Plan izgleda uvjerljivo, zbirovi su
pogrešni, a igrač to sazna za tezgom.

Rješenje: bazen ide **po referenci**. Prva grana uzme što joj treba, sljedeća
vidi šta je ostalo. `Gw2RecipeTreeTest` to čuva, i dokazano je vraćanjem
popravke (`array &$pool` → `array $pool`).

#### Ostale zamke u hodaču

| | |
|---|---|
| **Recept koji referiše sam sebe** | Graf je ArenaNetov i preslikava se kakav jeste; jedan takav red bi se širio dok se ne potroši memorija i odnio bi radnika reda. `MAX_DEPTH = 10` + skup otvorenih putanja. |
| **Recept koji pravi više komada** | Pet konca iz jednog craft-a. Zaokružuje se **naviše** — ne može se napraviti 0,8 craft-a. |
| **Više recepata za isti predmet** | 105 od 13.065, gotovo uvijek isti sastojci pod drugom disciplinom. Bira se ona koju nalog ima; inače najmanji `min_rating`. Payload kaže da je izbor napravljen. |
| **Spisak = samo listovi** | Niko ne kupuje ingot koji će napraviti od rude koju već ima. |

#### Discipline se skupljaju sa **svih** likova

Izrada je po liku, nalog nije. Ko ima Tailora i Armorsmitha može oboje, pa bi
pitanje samo lika kojeg dashboard slučajno prikazuje prijavilo zid kojeg nema.

Kad je zid stvaran — testni nalog je Tailor, a Beigarth's Shoulderguard traži
**Leatherworker 500** — stranica to kaže, umjesto da preda spisak materijala koji
tiho sugeriše suprotno.

#### Cilj imenuje igrač, ne pogađamo ga

Ascended set dolazi u stat prefiksu i težini oklopa, a **ništa u API-ju ne kaže
koji neko hoće**. Planer koji bi birao, samouvjereno bi planirao pogrešan set.
Zato i pretraga predmeta: trigram indeks (`gw2_items_name_trgm_gin`), jer se
traži **karakteristična riječ** — `name LIKE 'damask%'` ne nalazi „Bolt of
Damask", nego bi čitao svih 74.265 redova. Mjereno: **1,17 ms**.

Indeks je pravljen `CONCURRENTLY` — tabelu čita svaki dashboard koji crta opremu.

#### Cijene: `prices: null`, i to piše

Trading post cijene su živi podaci s tržišta koje **ne preslikavamo**. Mockupov
„18g 42s estimated remaining cost" bio bi broj koji niko nije izračunao. Payload
nosi `prices: null`, a stranica to kaže rečenicom. Ovo je plan materijala, ne
trošak.

### „Tonight" — sesija iz preporuka koje već važe

`SessionPlan` ne izmišlja ništa. Savjetnik je već odlučio šta vrijedi raditi i
koliko je siguran; ovo samo **poredi podskup** da stane u vrijeme koje je igrač
rekao. Planer koji bi generisao vlastite aktivnosti bio bi drugi savjetnik bez
pravila ispod sebe.

#### Minute su uređivačka procjena, i to piše u sučelju

Mockup crta raspored: 0–10 trezor, 10–20 fractal, 20–35 hero point voz. **Ništa
to ne računa** — igra ne prijavljuje trajanje ničega, a ljudi igraju različitom
brzinom.

Zato su procjene:

- **rasponi**, ne brojke („oko 10–20 min" je tvrdnja iza koje neko može stati,
  „10 min" nije)
- na **pravilu** (`gw2_rules.minutes_low` / `minutes_high`), pa se ispravljaju
  bez deploya
- **nullable**: pravilo koje niko nije procijenio **nema sat pored sebe**, a ne
  podrazumijevanih deset

Budžet se puni **donjim krajem** raspona. Prekoračiti nečiji sat je gori kvar
nego ne popuniti ga: veče sa viškom vremena je dobro veče, a plan kojem je
trebalo devedeset minuta je plan koji se nije mogao ispratiti.

Payload nosi `unaccounted` — koliko minuta ostaje neisplanirano — i to se
**prikazuje**. Plan koji popuni 24 od 30 minuta govori nešto istinito o tome
koliko zapravo znamo.

Na testnom nalogu: 30 min → 24 isplanirano, 60 min → 54.

#### Tri stanja sata, ne dva

| Stanje | Šta se crta |
|---|---|
| ima budžet i procjenu | pozicija u sesiji, npr. `10–12 min` |
| nema budžeta | **ništa** — procjena postoji, ali nema sesije u koju se stavlja (raspon se i dalje vidi kao čip) |
| nema procjene | `no estimate` |

Prva verzija je pisala „no estimate" i u srednjem slučaju, što je bilo netačno.

#### Rasporedi bosova: mašinerija da, podaci ne

`/v2/account/worldbosses` kaže **koje si ubio danas**, nikad kad sljedeći
izlazi. **Rasporeda nema nigdje u API-ju.** Vremena jesu stvarna, fiksna i
objavljena — ali su **vanjsko znanje**, a tabela prepisana po sjećanju je tačno
ono što je ovaj alat svuda drugdje odbio.

Zato: tabela `gw2_events` i Filament ekran postoje, a **tabela ide prazna**. Red
stiže do čitaoca samo ako je **i objavljen i provjeren** (`verified_at` +
`verified_source` — gdje je provjereno, da sljedeći ko posumnja ne kreće ispočetka).
Dok redova nema, panel se **uopšte ne crta**.

Pogrešno vrijeme izlaska šalje igrača na praznu mapu. Prazan panel je bolji kvar.

#### Prioriteti su mjereni

Trake sa desne strane nemaju nijedan izmišljen imenilac: AR se sabira iz nošenih
infuzija protiv jedinog izvorno potvrđenog praga (150 za T4), oprema broji
dvanaest slotova koji uopšte imaju ascended nivo, a mastery procenat je zbir nad
kataloškim `point_cost`-ovima.

### Rajdovi, bosovi, tamnice — i dan kad smo izgubili podatke

Tri endpointa naloga, isti oblik problema: `/v2/account/raids` prijavljuje
**tekuću sedmicu**, `/v2/account/worldbosses` i `/v2/account/dungeons` **tekući
dan**. Nijedan nema lifetime pregled. Pitaš igru šta je neko ikad ubio — odgovora
nema.

Zato dvije kolone, i one **znače različite stvari**:

| Kolona | Odakle | Dokle seže |
|---|---|---|
| „ove sedmice" / „danas" | iz igre, potpuno | tekući prozor |
| **„ikad"** | **naši snimci** (`gw2_progress_events`) | **od dana povezivanja, nikad ranije** |

Datum povezivanja se **ispisuje**. Bez njega bi nalog povezan juče izgledao kao
neko ko devet godina nije uradio ništa.

#### Šta se stvarno desilo 28. 9. 2026.

Sedmični reset je pao između dva čitanja. Četiri rajd susreta koja smo **već
izmjerili** — cairn, mursaat_overseer, samarog, deimos — nestala su:

- igra ih više ne prijavljuje (nova sedmica)
- kod nas su stajala samo u `gw2_account_state.raids`, koji se **prepisuje**
- `gw2_progress_events` je imao **0 redova**

Uzrok: prvo čitanje namjerno nije pisalo istoriju, uz obrazloženje da bi
proglašavanje svakog postojećeg otključanja „događajem" zatrpalo novi nalog
prošlošću koju nije proživio. **To je tačno za postignuća i pogrešno za
endpointe koji prijavljuju prozor.**

Nalog koji se poveže usred sedmice ima svoja čišćenja u prvom čitanju — i prvi
reset ih briše. Tačno gubitak zbog kojeg ovi snimci i postoje.

#### Popravka: prvo čitanje piše *baseline*

Prvo čitanje sada upisuje događaje za ta tri tipa, označene
`baseline: true` i **datirane na povezivanje, ne na čitanje**. Čitalac mora moći
razlikovati „ovo si očistio u četvrtak" od „ovo je već bilo gotovo kad si došao",
a datiranje na čitanje bi tvrdilo da je igrač sve to uradio u sekundi kad je
zalijepio ključ.

Postignuća ostaju izvan baseline-a: 364 završena postignuća su zid, ne istorija —
i, za razliku od rajdova, mogu se ponovo pročitati iz API-ja u cijelosti.

**Stari test je tvrdio suprotno i prolazio dok su se podaci gubili.** Sada opisuje
gubitak.

Ona četiri susreta su vraćena ručno, sa bilješkom u payloadu odakle su — bila su
naše provjereno opažanje, ne pretpostavka.

#### Katalog je dobio strukturu

Sva tri endpointa naloga odgovaraju **golim slugovima**: `["samarog","deimos"]`.
Kojem krilu pripadaju piše u `/v2/raids`, pa katalog sada preslikava i `raids`
(6), `dungeons` (8) i `worldbosses` (15) — 16 zahtjeva ukupno, samo struktura,
jer **API nema prikazno ime ni za jedno od njih**. Slugovi se prevode mehanički
(`vale_guardian` → `Vale Guardian`), ne iz tabele imena koju niko ne bi mogao
provjeriti.

#### Puno čitanje je sada 19 zahtjeva, ne 18

`account/dungeons` je devetnaesti. Svaki komentar koji je tvrdio osamnaest je
ispravljen — broj je činjenica o spisku, ne slogan, a ovaj repo je već dvaput
ugrizen brojkama koje su ostale u prozi nakon što se stvar promijenila.

#### Čega namjerno nema

**Nikakve tvrdnje da je igrač „spreman za rajd".** Oprema ne govori ništa o tome
zna li neko susret, a alat koji drugo zaključuje iz prvog sprema ljude da budu
izbačeni iz grupe.

### Javni dio — `/gw2/database`

Po planu je ovo **motor dolaska**: javni dio mora biti koristan **bez ključa**, a
povezivanje naloga ga personalizuje, ne otključava.

**Podjela ide po putanji, ne po stranici.** Sve pod `/gw2/database` je isto za
svakog igrača i **indeksira se**; sve pod `/gw2` je nečiji nalog i nosi
`noindex`. Tako je robots priča jedna linija umjesto procjene po ruti, i čitalac
koji dođe iz pretrage nikad ne padne na stranicu koja se njemu ne iscrta.

| | |
|---|---|
| `/gw2/database` | hub |
| `/gw2/database/crafting` | indeks, 131 stranica po 100 |
| `/gw2/database/crafting/{id}-{slug}` | **13.024 stranice** recepata |
| `/gw2/database/masteries` | 40 traka, svaki nivo i cijena |

#### Server-rendered je uslov, ne preferenca

Puzač nema `localStorage`. Ove stranice čitaju kroz **serverski fetch** sa
internim tokenom (`lib/gw2public.ts`), ne kroz autentifikovani axios klijent kao
lični dio (`lib/gw2.ts`). Provjereno na produkciji: `<h1>` s imenom predmeta,
imena materijala i **46 različitih internih linkova** u sirovom HTML-u.

Svaka stranica recepta linka na svoje materijale **i** na ono u šta predmet ulazi
(`used_in`), pa je skup **povezan graf**, ne spisak. To je za otkrivanje važnije
od same indeks stranice.

Indeks stranice **poslije prve su `noindex, follow`**: vrijednost je na
stranicama predmeta do kojih vode, a sto skoro identičnih indeksa koji se
takmiče međusobno ne pomaže nikome.

#### URL nosi id, slug je ukras

74.265 predmeta dijeli 51.604 imena, a jedno se pojavljuje **135 puta**. Ruta
koja bi hvatala po slugu pukla bi na „Fallen Adventurer's Backpack" i nigdje
drugdje — najgora vrsta greške za kasnije. 103 reda imaju **prazno ime** i ne
dobijaju stranicu.

#### Greška koja je htjela 404 u vlastitoj paginaciji

Jedan broj odlučuje tri stvari: koliko stranica indeks nudi, koliko URL-ova
sitemap navodi, i šta hub kaže čitaocu.

Građen kao `join` + `distinct()`, `paginate()` je brojao **spojene** redove prije
nego se distinct primijeni — **13.156** gdje ih je **13.024**, dakle 132 stranice
gdje ih je 131. Zadnja bi bila prazna, a indeks praznu stranicu pretvara u 404 —
i sitemap bi pokazivao na nju.

Dovoljno je 105 predmeta sa više recepata. Sada `whereExists` (broji svaki
predmet jednom **po konstrukciji**), i **sitemap zove istu metodu kao API** —
lekcija koju je ovaj repo već platio sa `sitemap-videos.xml`.

#### „U šta ovo ulazi" ima prekidač po drajveru

Produkcija je PostgreSQL i `@>` je ono što odgovara `gw2_recipes_ingredients_gin`
— **0,147 ms** naspram 9,2 ms za skan koji je zamijenio. Suite vrti na SQLite,
koji nema ni jedno ni drugo, pa tamo ide `json_each` + `json_extract`.

Ono čega **namjerno nema** je `LIKE` nad serijalizovanim JSON-om: prošao bi svaki
test u fajlu i tiho pronalazio predmet 1000 kad se traži 100.

#### `revalidate` mora biti literal

Next čita segment konfiguraciju **statičkom analizom modula**, pa
`export const revalidate = GW2_REVALIDATE` nije vrijednost koju vidi: build pada
sa „Invalid segment configuration export detected", a rute onda vraćaju **404**.
Broj se mora napisati na mjestu.

Ostatak sajta je bio netaknut — kvar je po segmentu — ali deploy ga **jeste**
isporučio i te četiri stranice su bile žive i pokvarene dok nije popravljeno.

#### Sitemap

`sitemap-gw2.xml`, 2,2 MB, 13.027 URL-ova (13.024 predmeta + 3 hub stranice),
piše se u **kataloškoj** polovini generatora — ovo se mijenja kad igra dobije
zakrpu, a ne svakih petnaest minuta.

**`sitemap.xml` se piše u sadržajnoj polovini.** Pokretanje samo `--catalogue`
napiše `sitemap-gw2.xml` ali **ne osvježi indeks koji ga imenuje**; treba i
`--content` (ili puni noćni prolaz).

### Frontend — `/gw2`

Klijentski, i to namjerno: sve na stranici je nečiji vlastiti nalog pročitan
ključem koji je samo on dao. Nema šta da se server-renderuje za pretraživač i
nema šta da se keširа između posjetilaca, pa je stranica `noindex`. **Javne,
indeksabilne stranice alata tek treba napraviti** — one su motor dolaska, ova
nije.

Četiri stanja, i treće se najlakše promaši:

| Stanje | Šta se crta |
|---|---|
| odjavljen | poziv na prijavu |
| bez veze | forma za ključ |
| **čita** | „čitamo tvoj nalog, traje pola minute" |
| spreman | dashboard |

„Čita" postoji jer **ništa na stranici ne zove ArenaNet dok neko čeka**. Čitanje
je posao u redu; tih pola minute pošteno je napisati rečenicu, a ne nacrtati
prazan dashboard koji izgleda pokvareno.

#### Šta je iz mockupa uzeto, a šta nije

Raspored je mockupov. Četiri broja nisu, jer ih ništa ne računa:

| Mockup | Šta se crta umjesto toga |
|---|---|
| „Mastery Progress 73%" | nepotrošene tačke **po regiji** — tačke su zaključane za regiju, zbir po nalogu mjeri veličinu koja ne postoji |
| „2.847 AP, 48% complete" | broj postignuća na jedan korak od kraja |
| „Fractal Level 37 · Tier 4" | nivo i AR cilj; tier se ne imenuje |
| „Tonight in GW2" (plan po minutima) | **šta je stvarno otvoreno u trezoru** — dolazi s vlastitim naslovima, ciljevima i acclaimom |

Zbirnog skora nema nigdje.

**Blokirane preporuke se crtaju, ne skrivaju.** „Infuzije ulaze samo u ascended
opremu" je rečenica koja spašava veče; samo se rangira ispod nečega što igrač
može odmah uraditi.

#### Ključ

Ide u **tijelo** zahtjeva, nikad u query string, i briše se iz stanja komponente
čim je prihvaćen. Ekran za povezivanje imenuje šta svaka dozvola kupuje, pa neko
ko ne želi dijeliti inventar može tu razmjenu napraviti svjesno i i dalje dobiti
savjetnik koji radi.

Registrovan u `lib/tools.ts` (čitaju ga i header dropdown i `/tools`), plus
`lib/mobileBar.ts` i `MoreSheet.tsx`.

#### `/gw2/masteries`

Regije sa stvarnim procentom, pa sve trake po regiji: koji nivo je sljedeći, šta
košta, i da li ga nepotrošene tačke **dosežu**. Odvojen endpoint
(`GET /api/v1/gw2/masteries`) jer je četrdeset traka sa imenima nivoa nekoliko
kilobajta koji naslovnoj ne trebaju.

Tri stvari sa mockupa 3 nisu nacrtane jer ih ništa ne računa: **„Currently
Training"** (API to ne izlaže), **„Nearby Priorities"** sa udaljenostima u
metrima (treba živa pozicija igrača) i **Weekly Completion Score**.

Traka koja se broji je **ona koja se kupuje** (`tiers_paid + 1`), ne broj
plaćenih — inače piše „tier 0 of 4" za traku koju niko nije počeo, što je
aritmetika koja curi u engleski.

#### `/gw2/goals`

Pretraga predmeta, pa plan: šta treba, šta već imaš i šta fali. Razlaganje se
crta kao stablo, a **spisak za nabavku samo listove**.

Mockup 2 je „Ascended Set Planner" sa već odabranim ciljem (Berserker's, šest
komada). Mi ga ne biramo — vidi „Cilj imenuje igrač". I nema zlatnog zbira.

Na testnom nalogu ta konkretna meta je ionako **već završena**: svih šest
komada oklopa je ascended, a ono što fali su tri nakita (Ring2, Accessory1,
Accessory2), koji se ne izrađuju receptom nego dolaze iz lovorika i valuta.

#### `/gw2/tonight`

Izbor vremena (30 min / 1 h / 2 h / bez limita), pa **vremenska osa** koraka,
ispod nje „ako imaš duže", a sa strane mjereni prioriteti. Panel sa rasporedom
događaja se crta tek kad neko unese i provjeri vremena.

Tri stvari sa mockupa 4 nisu nacrtane: **„Potential Rewards Tonight"** (ikone
nagrada koje ništa ne izvodi iz plana), **„Current Events"** dok tabela
`gw2_events` ne dobije provjerene redove, i minutne brojke kao tvrdnje — ovdje
su rasponi, i piše da su naši.

#### `/gw2/content`

Krila rajdova sa susretima, petnaest svjetskih bosova, osam tamnica. Dvije
kolone — „ove sedmice / danas" iz igre i „ikad" iz naših snimaka — i panel na
vrhu koji **objasni razliku i ispiše datum** od kog „ikad" počinje.

### Otvoreno

- ~~**Polje `access`**~~ **riješeno 28. 9.** — `access` imenuje kupljeni
  proizvod, ne otključani sadržaj; dokaz je 40 zarađenih HoT tačaka na nalogu
  kojem `access` HoT ne navodi. Rješenje je u `SnapshotReader::expansions()`:
  `access` je pod, regije sa `earned > 0` se dodaju.
- **Kuracija postignuća nije počela.** `advisor_eligible` je `false` na svih
  8.339 redova i `reviewed_at` je prazan, pa svaki savjet o postignuću nosi
  blokadu „nismo provjerili". To je tačno, ali obara postignuća na dno ranga —
  a na testnom nalogu su osam njih na jedan korak od kraja najkorisnija stvar
  koja postoji. Prvih stotinu redova treba pregledati.
- `characters?ids=all` je mjereno na nalogu sa **jednim** likom. Veličina i
  vrijeme na 15–20 likova nisu poznati.
- Dva broja sa mockupa su izmišljena — Weekly Completion Score 72/100 i
  „Confidence to complete: High". Ne smiju se iscrtati dok se ne definiše kako
  se računaju.

---

## Gdje su stari dokumenti

```bash
git log --diff-filter=D --name-only -- docs/     # šta je obrisano i kojim commitom
git show <commit>:docs/76-puni-pregled-08-2026.md
```

Vrijedni su kao **zapis odluka i datuma**, ne kao referenca o trenutnom stanju.
Za trenutno stanje postoji samo ovaj dokument.
