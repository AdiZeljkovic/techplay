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

**Svaki kontroler koristi `ApiResponse` trait** — odgovor je uvijek
`{ success, message, data }`. Bez izuzetka.

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
| 03:20 | `users:prune-unverified` |
| 03:30 | `sitemap:generate` (puni) |
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

---

## 16. Zamke

Stvari koje se ne vide iz koda i koje su plaćene greškama. Ovo je najkorisniji
dio dokumenta.

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

### Mjerenje sa servera ne prolazi kroz Cloudflare

Javno ime vraća 403 izazov serverskim zahtjevima. Mjeri na `127.0.0.1:8000` sa
`Host` zaglavljem.

---

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

## Gdje su stari dokumenti

```bash
git log --diff-filter=D --name-only -- docs/     # šta je obrisano i kojim commitom
git show <commit>:docs/76-puni-pregled-08-2026.md
```

Vrijedni su kao **zapis odluka i datuma**, ne kao referenca o trenutnom stanju.
Za trenutno stanje postoji samo ovaj dokument.
