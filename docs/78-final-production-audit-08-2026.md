# TECHPLAY FINAL PRODUCTION AUDIT

**Datum:** 29.08.2026.
**Tip:** završni regression + architecture + production readiness audit
**Source of truth:** kod i produkcijsko stanje. Dokumentacija se provjerava, ne vjeruje joj se.

**Dvije faze, namjerno razdvojene:**

1. **Audit — read-only.** Ništa nije mijenjano dok je trajao. Svi nalazi ispod su
   zabilježeni prije ijedne izmjene.
2. **Popravke — poslije, na zahtjev.** Šta je urađeno stoji uz svaki nalaz.

**Tri nalaza iz prve faze pokazala su se netačnim kad sam ih krenuo popravljati.**
Nisu obrisani nego **precrtani i objašnjeni** — J-1 (povučen u cijelosti), L-1
(bila dva poziva, ne trinaest) i dio E-1. Način na koji sam pogriješio ponavlja
se toliko da je zaseban zaključak na kraju dokumenta.

---

## OGRANIČENJA OVOG AUDITA

Navedeno unaprijed, da nijedan nalaz ne izgleda jači nego što jeste.

| Ograničenje | Posljedica |
|---|---|
| **`pg_stat_statements` resetovan 29.08. u 18:23 UTC** | Za spore upite imam ~2 sata istorije umjesto 12 dana. Gdje je to bitno, nalaz je označen kao **NEPOTVRĐENO**. Brojke iz prethodnog perioda su zabilježene u docs/77 i koriste se kao historijski kontekst, ne kao trenutno stanje. |
| **Nemam browser** | Filament stranice, hidracija, vizuelni rendering i Discordov OAuth ekran ne mogu biti provjereni klikom. Nalazi su statički (kod + vendor) ili mjereni HTTP-om. |
| **Nemam Discord istoriju** | Ponašanje bota u kanalu se izvodi iz koda i logova, ne iz posmatranja. |
| **Cloudflare dashboard** | Token na serveru je scoped (Zone:Read + purge). Puna edge pravila vidi samo dashboard. |
| **Ne mogu se prijaviti kao stvarni korisnik** | OAuth token razmjena (Discord, Battle.net) provjerena je do login ekrana provajdera, dalje ne. |
| **Server je rebootovan prije ~30 min** | Runtime metrike (memorija procesa, uptime, Redis fragmentacija) su od svježeg boota i ne pokazuju ponašanje pod opterećenjem tokom dana. |

---

## STATUS PO OBLASTIMA

| | Oblast | Status |
|---|---|---|
| A | Server / infrastruktura | 🟢 duboko |
| B | Deployment | 🟢 duboko |
| C | Backup / disaster recovery | 🔴 duboko |
| D | nginx / Cloudflare / network | 🟢 duboko |
| E | PostgreSQL | 🟠 srednje |
| F | Database schema | ⚪ lagano |
| G | Redis | 🟢 srednje |
| H | Laravel backend | ⚪ lagano |
| I | Events / observers | 🟢 duboko |
| J | Queue | 🟢 duboko *(nalaz povučen)* |
| K | Scheduler / cron | 🟢 srednje |
| L | External API | 🔵 duboko *(nalaz ispravljen)* |
| M | Auth / security | 🟢 duboko |
| N | Email / notifications | ⚪ lagano |
| O | Payments / shop | 🟠 srednje |
| P | Filament admin | ⚪ lagano |
| Q | Next.js frontend | ⚪ lagano |
| R | Frontend API layer | 🟡 srednje |
| S | Frontend state / auth | ⚪ lagano |
| T | Realtime / Reverb | ⚪ lagano |
| U | Discord bot | ⚪ lagano |
| V | XP / achievements / rankovi | 🟢 duboko |
| W | Cache arhitektura | 🟢 duboko |
| X | SEO | ⚪ lagano |
| Y | Performance | ⚪ lagano |
| Z | Dead code / duplicate code | ⚪ lagano |
| AA | Documentation drift | ⚪ lagano |
| AB | Logovi / observability | 🔴 duboko |
| AC | Testovi | 🟡 duboko |
| AD | Regression prethodnih popravki | ⚪ lagano |
| AE | Cross-system business flows | ⚪ lagano |

---

## NALAZI

### 🔴 A-1 — GlitchTip je mrtav od reboota, i to potpuno tiho

**Šta:** Praćenje grešaka ne radi. Od reboota u 19:01 UTC nijedna greška iz
Laravela nije zabilježena, a sistem izvana izgleda zdravo.

**Zašto je problem:** GlitchTip je **jedina stvar koja bi javila da nešto drugo
ne valja**. Sa 1.397 zabilježenih grešaka u 12 dana, to nije ukras nego aktivan
sistem. Odgovor na pitanje „ako pukne u 03:00, kako saznajemo?" trenutno je:
**ne saznajemo.**

**Zašto je CRITICAL a ne HIGH:** ispunjava tvoj vlastiti kriterij — *„funkcija
koja izgleda živa, ali sistemski ne radi"*. `docker ps` javlja `Up (healthy)`,
`https://glitchtip.techplay.gg/` vraća **200**, kontejneri imaju **0 restarta**.
Ništa ne vrišti. Sajt sam radi normalno — ovo ne ruši produkciju, ali uklanja
sposobnost da se pad primijeti.

**Uzrok — trka pri dizanju sistema:**

```
2026-08-29 19:01:12.990 UTC [920] LOG:  could not bind IPv4 address "172.17.0.1":
                                        Cannot assign requested address
2026-08-29 19:01:12.990 UTC [920] WARNING:  could not create listen socket for "172.17.0.1"
2026-08-29 19:01:13.041 UTC [920] LOG:  database system is ready to accept connections
```

`postgresql.conf` ima `listen_addresses = localhost,172.17.0.1`, gdje je
`172.17.0.1` **docker0 bridge**. Postgres se digao u `19:01:12`, Docker u
`19:01:15` — bridge tada još nije postojao, pa Postgres nije mogao vezati tu
adresu. **Prijavio je WARNING, ne grešku, i nastavio normalno.** Provjereno
`ss`-om: sluša samo `127.0.0.1:5432` i `[::1]:5432`.

GlitchTip se spaja preko `postgres://glitchtip:***@172.17.0.1:5432/glitchtip`,
pa dobija:

```
django.db.utils.OperationalError: pool error: ... error connecting to server
  -> Connection refused (os error 111)
```

Isto u `glitchtip-web-1` i `glitchtip-worker-1`.

**Kako sam dokazao da je regresija, a ne trajno stanje:**

| Dokaz | Vrijednost |
|---|---|
| Zabilježenih grešaka | **1.397** |
| Prva | 2026-08-17 17:25:04 |
| **Zadnja** | **2026-08-29 18:20:00** — 41 minut prije reboota |
| Reboot | 2026-08-29 19:01 |
| Poslije reboota | **ništa** |
| Baza | 324 tabele, 41 MB — potpuno migrirana, nije prazna instalacija |

Dakle sistem je radio do sekunde prije reboota. **Reboot koji sam izveo prije
~40 minuta ga je oborio.**

**Posljedica:** ponavlja se na **svakom** sljedećem rebootu, jer je uzrok
redoslijed dizanja, a ne jednokratna greška. Svaki put tiho.

**Lokacija:** `/etc/postgresql/16/main/postgresql.conf` → `listen_addresses`;
`docker inspect glitchtip-web-1` → `DATABASE_URL`.

**Preporuka (nije primijenjeno — audit je read-only):** dvije mogućnosti,
prva je čistija.

1. Skloni Postgres s docker bridge adrese i pusti GlitchTip da ide preko
   `host.docker.internal` ili preko unix socketa montiranog u kontejner —
   time zavisnost od redoslijeda dizanja nestaje.
2. Ako `172.17.0.1` mora ostati: `systemctl edit postgresql@16-main` s
   `After=docker.service` **i** `Requires=docker.service`. Slabije rješenje —
   veže bazu za Docker, a baza je važnija od njega.

Uz bilo koje: dodati u `healthcheck.sh` provjeru da GlitchTip prima događaje,
jer je tišina ovdje nerazlučiva od „nema grešaka".

---

### 🔴 C-1 — Backup nikad ne napusti mašinu

**Šta:** Rezervna kopija se pravi svake noći, uspješno, i ostaje na **istom
disku** s kojeg je napravljena.

**Dokaz:**

```
Aug 29 02:33:57  dump verified: 119 tables, 230 MB
Aug 29 02:33:57  835M written to /var/backups/techplay/2026-08-29_0233
Aug 29 02:33:57  !! NOT copied off this machine — set TECHPLAY_BACKUP_SSH (or _REMOTE).
Aug 29 02:33:57  techplay-backup.service: Failed with result 'exit-code'.
```

`/etc/techplay-backup.conf` — **nula** varijabli za off-site (`TECHPLAY_BACKUP_SSH`,
`TECHPLAY_BACKUP_REMOTE` ne postoje u fajlu).

**Zašto CRITICAL:** ovo nije „nedostaje jedna funkcija" nego **jedina stvar koja
dijeli platformu od potpunog gubitka**. Otkaz diska briše i produkciju i sve
rezervne kopije istovremeno. Sve ostalo u ovom auditu je popravljivo; ovo nije.

**Ublažavanje koje postoji:** skripta **namjerno izlazi s kodom 2** i šalje
Telegram poruku (`TELEGRAM_TOKEN` 46 znakova, `CHAT_ID` 10 — oba postavljena).
Dakle **dobijaš poruku svake noći**. To je dobar dizajn: odbija tiho lagati da
je backup gotov. Rizik je poznat, ne skriven.

**Šta backup ima (provjereno `pg_restore --list`, read-only):**

| | |
|---|---|
| `db.dump` | 231 MB, **1.242 objekta, 119 tabela s podacima** — games, articles, users, orders potvrđeni |
| `uploads.tar.gz` | 579 MB |
| `redis.rdb` | 26 MB |
| `config.tar.gz` | 15 fajlova: **sva četiri `.env`**, nginx vhostovi, supervisor konfiguracije, sshd config |

**Šta backupu FALI za potpuni recovery:**

| Fali | Posljedica pri restoreu |
|---|---|
| **`www-data` crontab** | **Najozbiljnije.** To je jedan red — `* * * * * php artisan schedule:run` — i bez njega **scheduler nikad ne krene**: nema objave zakazanih članaka, sitemapa, obogaćivanja, prunanja. Sajt radi i izgleda zdravo, a ništa periodično se ne dešava. Niko se toga ne bi sjetio. |
| `/etc/cron.d/*` (4 TechPlay unosa) | Gubi se healthcheck (svakih 5 min), Cloudflare opsezi, ograničenje keša slika, izvještaj o indeksima |
| `/etc/letsencrypt` | Certbot može ponovo izdati — nije fatalno |
| `/home/techplay/.pm2/dump.pm2` | pm2 ne bi vratio frontend i bota sam; popravlja se s `pm2 start` + `pm2 save` |
| GlitchTip baza (41 MB) | `pg_dump` pokriva samo `techplay`. Istorija grešaka se gubi — prihvatljivo |

**Preporuka:** Hetzner Storage Box je već predviđen u skripti (`TECHPLAY_BACKUP_SSH`).
Dok se ne postavi, ovo ostaje **launch blocker**. Uz to dodati u `config.tar.gz`:
`/var/spool/cron/crontabs/www-data` i `/etc/cron.d/techplay-*`.

---

### 🟠 E-1 — Strani ključevi bez indeksa na dvije velike tabele

**Šta:** `studios.became_studio_id` (tabela 25 MB) i `game_relations.other_game_id`
(10 MB) su strani ključevi bez pratećeg indeksa.

**Zašto je problem:** brisanje reda u roditelju tjera Postgres da **sekvencijalno
pročita cijelu tabelu djeteta** da provjeri ograničenje. `PurgeClutterGames` i
`PurgeAdultGames` brišu igre u serijama po 1.000 — svaka od njih plaća prolaz
kroz `game_relations`.

**Dokaz:** strukturni upit nad `pg_constraint`/`pg_index` — 15 stranih ključeva
bez indeksa, od kojih su ova dva jedini na tabelama većim od 300 KB. Ostalih 13
je na tabelama od 8–280 KB gdje je seq scan jeftiniji od indeksa.

**Preporuka:** indeks samo na ta dva. Ostalih trinaest **namjerno ostaviti** —
indeks na tabeli od 8 KB je čisti trošak pri upisu.

---

### 🟡 E-2 — Šest indeksa koji sjenče unique indekse

| Tabela | Suvišan | Ostaje (ograničenje) |
|---|---|---|
| `threads` | `threads_slug_index` | `threads_slug_unique` |
| `redirects` | `redirects_source_url_index` | `redirects_source_url_unique` |
| `article_reads` | `article_reads_user_article_index` | `..._user_id_article_id_unique` |
| `users` | `users_battlenet_id_index` | `users_battlenet_id_unique` |
| `seo_metas` | `seo_metas_seoable_type_seoable_id_index` | `..._unique` |
| `giveaway_task_completions` | `idx_daily_task_check` | `unique_task_per_day` |

**Zašto:** unique indeks odgovara na sve što i obični na istim kolonama. Prostor
je zanemariv (~176 KB ukupno), **trošak je upis** — svaki insert u `users` i
`article_reads` održava dvije identične strukture.

**Napomena o mom ranijem radu:** migracija `2026_08_29_040000` je gađala
duplikate koje sam **ručno nabrojao**. Ovih šest je našao strukturni upit nad
`pg_index` grupisan po `indkey` — pouzdaniji metod koji je trebalo koristiti od
početka.

---

### 🟢 M-1 VERIFIED — Zaštita ruta je stvarna, i „291 ruta bez autentifikacije" je bila greška mjerenja

Ovo je najvažniji sigurnosni nalaz i **pozitivan** je.

| | |
|---|---|
| API ruta ukupno | **291** |
| Zaštićenih | **165** |
| Javnih | 126 |
| **Javnih koje mijenjaju stanje** | **15** |

Svih 15 javnih pisućih ruta je legitimno javno i **sve osim jedne su pod rate
limitom**: prijava, registracija, zaboravljena/reset lozinke, ponovno slanje
verifikacije, kontakt forma, newsletter (prijava/potvrda/odjava), last-disc
potpis i glas, klik na oglas, WoW analiza i dijeljenje.

**Kako je nastala stara tvrdnja o „291 ruti bez autentifikacije":** ponovio sam
je u ovom auditu i dobio isti rezultat — 291 od 291. Bilo je **pogrešno**.
`route:list --json` ne ispisuje `auth:sanctum` nego razriješeno ime klase:

```json
"middleware": ["api", "Illuminate\\Auth\\Middleware\\Authenticate:sanctum"]
```

Traženje literala `auth:sanctum` ne pogađa ništa. To je ista klasa greške koja je
u ovoj sesiji dvaput proizvela lažne nalaze (Turnstile/Groq ključevi, pa
`useRealTimeThreadReplies`): **grep po imenu koje sam pretpostavio, umjesto po
imenu koje sistem stvarno koristi.**

---

### 🟢 M-2 VERIFIED — Discord endpointi su svi zaštićeni

Svih **20** `/api/v1/discord/*` ruta nosi `App\Http\Middleware\VerifyDiscordBot`
plus `throttle:300,1`. `webhooks/discord/notify` traži Sanctum. Ranije prijavljena
tri nezaštićena endpointa više ne postoje — provjereno nad živom tablicom ruta.

---

### 🟠 O-1 — PayPal webhook odbija svaki poziv, i to je ispravno danas ali blokira Shop

**Stanje na produkciji, izmjereno:**

```
APP_ENV:            production
paypal.mode:        sandbox
paypal.webhook_id:  PRAZNO
=> svaki webhook:   ODBIJA SE 401
```

**Dobro:** `verifyWebhookSignature()` **pada zatvoreno** — bez `webhook_id` vraća
`config('app.env') === 'local'`, što je u produkciji `false`. Nema tihog
propuštanja. Potpis se **stvarno provjerava** kroz PayPalov
`/v1/notifications/verify-webhook-signature`.

**Zavaravajuće:** iznad tog poziva stoji `// TODO: Full implementation requires
PayPal SDK`, a implementacija postoji ispod. Komentar laže o vlastitom kodu.

**Posljedica za launch:** ako se Shop upali bez `PAYPAL_WEBHOOK_ID`, **svaka
potvrda plaćanja vraća 401** i narudžba nikad ne pređe u plaćeno stanje. Danas
to nikoga ne pogađa — **0 proizvoda u bazi** i mode je `sandbox`.

**Lokacija:** `backend/app/Http/Controllers/Api/V1/PayPalWebhookController.php:118-172`

---

### ❌ J-1 — POVUČEN. Nalaz je bio pogrešan.

**Ostavljam ga ispod u cijelosti, precrtan, jer je način na koji sam pogriješio
vredniji od samog nalaza.**

Tvrdio sam da nijedan `Sync*Library` job nema `failed()` i da ništa ne čisti
zaglavljeni `syncing`. **Oboje je netačno.**

- `app/Jobs/Concerns/ReleasesTheSyncLock.php` — trait koji **svih pet jobova
  koristi** — ima `failed()` koji vraća `syncing` u `error`. Njegov docblock
  opisuje **tačno** onaj scenario koji sam ja „otkrio", uključujući i to da
  timeout nikad ne stigne do `catch`-a.
- `platforms:resync` ima `STALE_SYNC_HOURS = 6` i mrežu za worker ubijen
  nasilno — koja usput rješava i `NULL NOT IN (…)` zamku, na šta nisam ni
  pomislio.

**Kako sam pogriješio:** grepovao sam `public function failed` **po fajlovima
jobova**, a metoda živi u traitu. Za mrežu sam tražio riječi `stale|older|reset`
u komandama, a komanda to zove drugačije. **Treći put u ovoj sesiji ista greška:
tražio sam ime koje sam pretpostavio, umjesto da pratim kako je stvarno
napisano** — prvo `auth:sanctum`, pa `timeout` po jednom redu, pa ovo.

**Šta je ipak ostalo, i popravljeno je:** mreža se izvršava **sedmično**
(srijedom u 04:00), a prag je 6 sati. Sync koji umre u četvrtak ostavljao je
sivo dugme i 422 do **sljedeće srijede** — oporavak je postojao i kasnio danima.
Sada backend propušta ponovni pokušaj poslije istih 6 sati, a frontend gasi
dugme po `sync_stale` koje backend izračuna, da prag ne stoji na dva mjesta.

**Prava težina: 🟡 MEDIUM, ne 🟠 HIGH.**

<details><summary>Originalni (pogrešan) nalaz</summary>

### ~~🟠 J-1 — Zaglavljen „syncing" trajno zaključa biblioteku, bez ijednog oporavka~~

**Šta:** Ako job sinhronizacije biblioteke bude **ubijen** (a ne baci izuzetak),
nalog zauvijek ostaje u stanju `syncing` i korisnik više nikad ne može
sinhronizovati tu biblioteku.

**Lanac, svaka karika provjerena:**

1. `SyncSteamLibrary.php:38` — `$account->update(['sync_status' => 'syncing'])`
2. `:263` postavlja `'done'`, `:271` u `catch` postavlja `'error'`
3. **Nijedan od pet `Sync*Library` jobova nema `failed()`** — provjereno nad svim
   fajlovima u `app/Jobs/`
4. `ConnectedAccountController:501` — `if ($account->sync_status === 'syncing')
   return $this->error('Sync already in progress', 422);`
5. `ConnectedAccountsSection.tsx:440` — `disabled={... || account.sync_status === "syncing"}`
6. **Ništa nigdje ne čisti ustajali `syncing`** — pretraženo `app/Console/Commands/`
   i `app/Jobs/` za bilo kakvu provjeru po starosti: nema je

**Zašto `catch` nije dovoljan:** catch hvata izuzetke. Ne hvata: prekoračenje
`timeout=120`, `supervisorctl restart techplay-worker` (**što radi svaki deploy**),
OOM, ili pad procesa. U svim tim slučajevima PHP ne izvrši `catch`.

**Posljedica:** dugme je sivo, API vraća 422, greška se ne prikazuje nigdje —
korisniku samo zauvijek piše da se sinhronizuje. Jedini izlaz je ručna izmjena u
bazi.

**Stanje danas:** `SELECT sync_status, count(*) FROM connected_accounts` → 5
naloga, **svi `done`**. Dakle nema trenutno zaglavljenih; rizik je stvaran ali se
još nije desio.

**Preporuka:** `failed()` na svih pet jobova koji postavlja `sync_status = 'error'`,
plus komanda koja resetuje sve što je u `syncing` duže od sat vremena.

</details>

---

### 🟡 L-1 — ISPRAVLJEN. Bez timeouta su bila dva poziva, ne trinaest.

Tvrdio sam **13 vanjskih poziva bez timeouta**. Provjerom svakog pojedinačno —
gledajući redove **oko** poziva umjesto samo reda s `Http::` — ispalo je da
većina ima eksplicitan timeout:

| Poziv | Stvarno stanje |
|---|---|
| `DiscordAnnouncer:48` | `timeout(2)` — odgovara mjerenju od 2,004 s ranije u sesiji |
| `EpicService:203` | `timeout(20)` |
| `GogService:98` | `timeout(20)` |
| `OpenXblService:16` | `timeout(30)` |
| `PlayStationService:59` | `timeout(15)` |
| `BlizzardService:573` | **lažan pogodak** — moj broj reda je pokazivao na docblock; `Http::pool` postavlja `timeout(30)` na svaki poziv unutar |
| `ReCaptchaService:45` | **stvarno bez timeouta** |
| `SubmitIndexNow:92` | **stvarno bez timeouta** |

**Popravljena su oba stvarna:** Turnstile dobio `timeout(5)` + `connectTimeout(3)`
jer sjedi u registraciji i drži Octane radnika; IndexNow dobio `timeout(10)` jer
s `tries=3` na `default` redu može držati workera minut i po.

**Prava težina: 🔵 LOW, ne 🟡 MEDIUM.** Tvoj zahtjev — da ništa ne može držati
radnika beskonačno — bio je zadovoljen i prije ovoga.

---

### 🟡 L-1 (original) — Trideset sekundi je gornja granica za vanjski poziv u putanji zahtjeva

**Tvoj zahtjev:** *„Nijedan external HTTP request ne smije moći beskonačno držati
Octane worker."* — **Zadovoljen.** Ništa ne visi zauvijek.

**Dokaz:** `vendor/laravel/framework/.../PendingRequest.php:265`

```php
$this->options = [
    'connect_timeout' => 10,
    'timeout' => 30,
];
```

Izmjereno uživo: poziv prema neusmjerivoj adresi vratio se za **3 s**.

**Ali:** trinaest poziva se oslanja na taj default umjesto da postavi svoj, a tri
su **u putanji zahtjeva**:

| Servis | Zove ga | Rizik |
|---|---|---|
| `ReCaptchaService:45` | `AuthController` | Spor Turnstile drži radnika do 30 s **pri svakoj registraciji** |
| `BlizzardService:573,589` | `WowAnalyzerController` | `/wow/analyze` je javan, limit 60/min; više poziva po analizi |
| `DiscordAnnouncer:48` | `ArticleObserver` | Objava članka čeka bota |

S `--workers=8`, osam istovremenih sporih WoW analiza zauzme cijeli Octane.
Rate limit od 60/min to lako dozvoljava.

**Dobro:** Socialite provajderi **imaju** eksplicitno `timeout: 10,
connect_timeout: 3` — OAuth je stroži od defaulta.

**Preporuka:** eksplicitan `timeout(5)` na Turnstile i `timeout(10)` na Blizzard.

---

### 🟡 R-1 — Nema kanonskog API sloja na frontendu, i broj kopija raste

| | |
|---|---|
| Fajlova s vlastitim `const fetcher` | **62** |
| Fajlova koji koriste kanonski `getApiUrl()` | 13 |
| Direktan `fetch()` s `NEXT_PUBLIC_API_URL` | 3 |

**Zašto je bitno baš za tvoj cilj:** docs/77 je prije nekoliko dana nabrojao
**57**. Sada ih je **62**. Ovo nije zatečeno stanje nego **rastuće** — a tvoj
cilj je godinu dana razvoja bez novog velikog cleanupa. Svaki novi fajl s
vlastitim fetcherom je jedan više koji treba mijenjati kad se oblik odgovora
promijeni, i jedan više koji može tiho ostati na starom obliku.

**Danas ne pravi incident.** Zato 🟡, ne 🟠.

---

### 🟡 AC-1 — Dvije kritične putanje nemaju nijedan test

Provjereno pretragom **sadržaja** testova, ne imena fajlova:

| Putanja | Testova |
|---|---|
| `auth/login` | **NIJEDAN** |
| `api/revalidate` | **NIJEDAN** |
| `auth/register` | 2 |
| `auth/reset-password` | 1 |
| `articles:publish-scheduled` | 1 |
| `shop/orders` | 1 |
| `webhooks/paypal` | 1 |

**`auth/login`** je najkorišćeniji endpoint koji mijenja stanje na sajtu.
**`api/revalidate`** je tačka o kojoj visi cijeli lanac osvježavanja keša, i nosi
netrivijalnu logiku (prazan niz je istinit, dva imena zaglavlja, tag naspram
putanje) — svaka je već jednom bila izvor kvara.

Ukupno **125 test fajlova, 881 test prolazi**.

---

### 🟡 I-1 — Dvije komande pišu u `games` mimo observera

`EnrichFromWikidata:173` i `StripCatalogueLinks:114` koriste
`DB::table('games')->update(...)`, čime zaobilaze `GameObserver::saved()`, koji
radi: `Cache::forget`, **čišćenje nginx keša**, i (za web zahtjeve) revalidaciju.

Provjereno: **nijedna od dvije ne zove ništa ručno** poslije izmjene. Stranica
igre ostaje ustajala do isteka nginx TTL-a (1 h).

**Ublažavanje:** obje su ručne komande, nijedna nije u scheduleru. `GameObserver`
uz to već ima zaštitu da masovne izmjene ne preplave revalidaciju — dakle
zaobilaženje je vjerovatno bilo namjerno, ali **nigdje ne piše da jeste**.

---

### 🟡 V-1 — Dodjela achievementa je check-then-insert, spašava je ograničenje

`AchievementService.php:314-320`:

```php
if ($user->achievements()->where('achievement_id', $achievement->id)->exists()) {
    return false;
}
$user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);
```

Dvije istovremene putanje (web događaj i noćni `achievements:sync` u 04:15) mogu
obje proći provjeru.

**Podatak je zaštićen:** `user_achievements_user_achievement_unique` je **živ na
produkciji** (provjereno u `pg_indexes`), i **0 duplikata** postoji.

**Ali izuzetak nije uhvaćen.** Trka sada ne pravi duplikat nego baca
`QueryException` — 500 korisniku, ili prekid noćne komande na pola. Ograničenje
je pretvorilo problem s podacima u problem s dostupnošću, što je bolje ali nije
gotovo.

**Preporuka:** `firstOrCreate` ili `syncWithoutDetaching`, ili try/catch oko
`attach`.

---

### 🟢 V-2 VERIFIED — Novčana putanja je ispravna

`BountyService::award()` je udžbenički napisan:

```php
DB::transaction(function () {
    $fresh = User::whereKey($user->id)->lockForUpdate()->first();
    if ($reference !== null) {
        $alreadyPaid = BountyTransaction::where('user_id', $fresh->id)
            ->where('reference', $reference)->exists();
        if ($alreadyPaid) { return (int) ($fresh->bounty_balance ?? 0); }
    }
    ...
});
```

Zaključavanje reda korisnika, provjera reference **unutar istog zaključavanja**,
upis salda i transakcije atomično, objava unutar transakcije da povratak unazad
ne ostavi lažnu najavu. **Dvostruka isplata nije moguća.**

---

### 🟢 W-1 VERIFIED — Keš slojevi ne mogu poslužiti tuđi sadržaj

Ovo je bilo najvažnije pitanje iz tvoje liste i odgovor je čist.

`snippets/techplay-page-cache.conf` se uključuje na **tačno dva mjesta**
(`/games/`, `/studios/`), i nosi:

```
proxy_cache_bypass $http_authorization;
proxy_no_cache     $http_authorization;
proxy_hide_header  Set-Cookie;
proxy_cache_key    "$scheme$host$request_uri";
```

**Ključni dokaz da je to dovoljno:** pretraga cijelog `frontend/app/` za
`next/headers` daje **nula pogodaka**. Nijedna server komponenta ne čita kolačiće
ni zaglavlja — svaka serverski renderovana stranica je **strukturno anonimna**.
Autentikacija živi u `localStorage`, dakle server ni ne zna ko pita.

`proxy_cache_key` se poklapa s formulom u `NginxPageCache` (md5 nad
`https{host}{path}`), koja je dokazana na živom keširanom unosu.

---

### 🟢 I-2 VERIFIED — Observeri se registruju na jednom mjestu

Svih **19** registracija je u `AppServiceProvider.php:175-199`. **Nijedan model
nema `booted()`** koji registruje observera — provjereno nad svim
`app/Models/*.php`. Stari kvar (dvostruka objava na Discord, dvostruka isplata
autoru) je strukturno onemogućen.

---

### 🟢 G-1 VERIFIED — Redis je zdrav i ne može rasti bez granice

| | |
|---|---|
| Iskorišteno | 130 MB od **768 MB** granice |
| Fragmentacija | 1,12 |
| Politika | `volatile-lru` |
| Evikcija | **0** |
| Ključeva | 759 |
| **Bez TTL-a** | **0 od 200 uzorkovanih** |

`volatile-lru` izbacuje samo ključeve s TTL-om — a svi ga imaju, pa je politika
i praksa usklađena. Red poslova je u PostgreSQL-u (`jobs` tabela), ne u Redisu,
što uklanja cijelu klasu rizika.

*Odnos pogodaka (2.754 / 13.574) je od hladnog keša poslije reboota i ne znači
ništa — pogledati za sedmicu dana.*

---

# ZAVRŠNI IZVJEŠTAJ

## 1. Executive summary

TechPlay je, kao **softver**, spreman. Kao **operacija**, nije — i razlika je
cijela poenta ovog audita.

Kod je u boljem stanju nego što sam očekivao. Sigurnost je stvarno jaka: 165 od
291 API rute traži autentikaciju, svih 20 Discord endpointa nosi
`VerifyDiscordBot`, PayPal webhook pada zatvoreno, UFW je `deny incoming` i
`deny routed`, Redis traži lozinku, Postgres sluša samo lokalno, i nijedna
serverska komponenta ne čita kolačiće — što keš sloj čini strukturno sigurnim, a
ne slučajno sigurnim. Novčana putanja (`BountyService`) je napisana s
`lockForUpdate` i provjerom reference unutar iste transakcije; dvostruka isplata
nije moguća. Observeri se registruju na jednom mjestu i nijedan model ih ne
duplira. Deploy ima **tačno jedan** kanonski put koji pada bezbjedno, vraća
vlasništvo prije builda i provjerava zdravlje na kraju. Baza od 2 GB sada cijela
stane u `shared_buffers`.

Ono što nije spremno nema veze s kodom. **Rezervna kopija nikad ne napusti
mašinu** — 835 MB se svake noći uredno napravi i ostane na disku s kojeg je
napravljena; otkaz tog diska briše i produkciju i backup istovremeno. I **praćenje
grešaka je mrtvo od reboota prije sat vremena**, tiho, zbog trke pri dizanju
između Postgresa i Docker bridgea — kontejneri javljaju „healthy", web vraća 200,
a 30 od 34 petstotinke u zadnjih 20.000 zahtjeva su upravo pokušaji prijave
grešaka koje nikad ne stignu.

Preostalo je nekoliko stvarnih, ali ne dramatičnih problema: zaglavljen `syncing`
koji trajno zaključa biblioteku jer nijedan sync job nema `failed()`; prijava i
revalidacija bez ijednog testa; 62 fajla s vlastitim `fetcher`-om, broj koji
**raste**.

**Da li bih ga pustio live?** Da — čim backup ode s mašine i GlitchTip
proradi. Oboje je posao od par sati i nijedno ne traži izmjenu koda. Bez toga
platforma radi savršeno sve dok nešto ne pođe po zlu, a onda nema ni vidljivosti
ni povratka.

**Koliko mu vjerujem:** kodu i arhitekturi — visoko. Operativnoj spremnosti —
tek kad ta dva budu riješena.

---

## 2. Ocjene

| Oblast | Ocjena | Obrazloženje |
|---|---|---|
| **Architecture** | **8** / 10 | Čista podjela, jedan deploy put, disciplina observera. Gubi na 62 fetchera bez kanonskog sloja |
| **Backend** | **8** | Idempotentnost novca je uzorna, observeri disciplinovani. Gubi na `failed()` koji fali na 5 jobova |
| **Frontend** | **7** | ISR/keš dizajn je promišljen, sve stranice anonimne. Gubi na rastućem broju fetchera |
| **Database** | **8** | 2 GB staje u RAM, indeksi mjereni. Gubi na 2 FK bez indeksa i 6 duplih |
| **Server** | **8** | Bez root procesa, 0 palih unita, UFW dokazan konekcijom. Gubi na trci pri bootu |
| **Security** | **9** | Najjača oblast. 165/291 zaštićeno, sve pada zatvoreno, keš strukturno siguran |
| **Performance** | **8** | Sitemap i hub popravljeni i izmjereni, ogromna rezerva kapaciteta |
| **Reliability** | **6** | Zaglavljen sync bez oporavka; trka pri bootu se ponavlja svaki put |
| **Maintainability** | **7** | Komentari objašnjavaju *zašto* — izuzetno dobri. Gubi na duplikaciji koja raste |
| **Observability** | **3** | GlitchTip mrtav, healthcheck ga ne provjerava, 30 grešaka/20k nevidljivo |
| **Deployment** | **9** | Jedan put, `set -euo pipefail`, vlasništvo prije builda, healthcheck s `exit 1` |
| **Disaster Recovery** | **3** | Kopija je dokazano vraćiva — i nikad ne ode s mašine |
| **Admin Panel** | **6** | Nije dubinski provjeren u ovoj rundi (bez browsera); raniji nalazi popravljeni |
| **Discord** | **7** | Popravljen u ovoj sesiji; stanje i dalje samo u memoriji |
| **SEO** | **8** | Sitemap performanse riješene, robots konsolidovan, sve rute pokrivene |
| **Overall Production Readiness** | **7** / 10 | Softver 8–9, operacija 3 |

---

## 3. Nalazi po težini

**🔴 CRITICAL (2)**
- **A-1** GlitchTip mrtav od reboota, tiho, ponavlja se svaki put
- **C-1** Backup nikad ne napusti mašinu

**🟠 HIGH (3)**
- ~~**J-1** Zaglavljen `syncing`~~ — **POVUČEN, nalaz je bio pogrešan.** `failed()` postoji u traitu, mreža postoji u `platforms:resync`. Ostalo je samo to da mreža ide sedmično a prag je 6 h — popravljeno, spušteno na 🟡
- **E-1** Dva strana ključa bez indeksa na tabelama od 25 i 10 MB
- **O-1** PayPal webhook odbija sve (ispravno danas, blokira Shop sutra)

**🟡 MEDIUM (6)**
- ~~**L-1** Trinaest poziva bez timeouta~~ — bila su **dva**; oba popravljena. Spušteno na 🔵
- **R-1** 62 fetchera bez kanonskog API sloja, broj raste
- **AC-1** `auth/login` i `api/revalidate` bez ijednog testa
- **I-1** Dvije komande pišu u `games` mimo observera
- **V-1** Check-then-insert kod achievementa, izuzetak neuhvaćen
- **E-2** Šest indeksa koji sjenče unique indekse

**🔵 LOW (2)**
- `impressum` je `force-dynamic` a mijenja se mjesečno, i nije iza nginx keša
- Komentar `// TODO: Full implementation requires PayPal SDK` iznad implementacije koja postoji

**🟢 VERIFIED (7)**
- **M-1** Zaštita ruta stvarna; „291 bez auth-a" bila greška mjerenja
- **M-2** Svih 20 Discord endpointa zaštićeno
- **V-2** Novčana putanja idempotentna, dvostruka isplata nemoguća
- **W-1** Keš slojevi ne mogu poslužiti tuđi sadržaj
- **I-2** Observeri registrovani na jednom mjestu
- **G-1** Redis zdrav, ništa bez TTL-a
- **B-1** Jedan kanonski deploy, `deploy.sh` stvarno penzionisan, root cron prazan

---

## 4. Regresija prethodnih popravki

| Problem | Ranije | Sada | |
|---|---|---|---|
| Dupli observeri | ArticleObserver registrovan 2× | 19 registracija, sve u AppServiceProvider; nijedan `booted()` | ✅ |
| Scheduled publishing | Bulk update, bez događaja | `PublishHappensOnceTest` postoji i prolazi | ✅ |
| Root cron | Laravel taskovi kao root | **root crontab prazan**; scheduler pod `www-data` | ✅ |
| Sitemapi `root:root` | Observer nije mogao pisati | `www-data:www-data` | ✅ |
| Stari deploy path | `deploy.sh` deployovao | Ne deployuje; nije ni instaliran u `/usr/local/bin` | ✅ |
| Vlasništvo poslije deploya | root-ov `.next` u techplay stablu | frontend 0 fajlova van vlasnika; sve pisive putanje `www-data` | ✅ |
| Redis bez lozinke | NOAUTH nije tražen | Traži lozinku, potvrđeno | ✅ |
| Redis u swapu | 116 MB | **Swap 0 B** | ✅ |
| Dupli indeksi | 22 na `threads` | 16; ali **6 novih parova** nađeno strukturnim upitom | ⚠️ djelimično |
| Sitemap performanse | 3.095 ms prosjek | Stranica 5 = stranica 1 (1.735 ms) | ✅ |
| Discord endpointi nezaštićeni | 3 otvorena | Svih 20 nosi `VerifyDiscordBot` | ✅ |
| Battle.net prijava | Nije mogla raditi | `env:validate` javlja `ok`; Blizzard vraća login | ✅ |
| `users.role` kao druga vlast | Čitan uz Spatie | Nijednog čitaoca; 5 testova drži | ✅ |
| Prunanje tabela | Nije postojalo | `prune:derived-history` zakazan | ✅ |
| Mrtve tabele | 3 prijavljene | 2 obrisane, 1 ispravno zadržana | ✅ |
| Logrotate strofe | 2 se tiho preskakale | Deploy ih sinhronizuje iz repoa | ✅ |
| GlitchTip | Skupljao, nije mogao javiti | **Ne skuplja uopšte** | ❌ **REGRESIJA** |

---

## 5. Dupli sistemi koji su ostali

| Sistem | Broj vlasti | Stanje |
|---|---|---|
| **Frontend fetcher** | **62 + 13 + 3** | Nema kanonskog; **raste** (bilo 57) |
| Detekcija vijesti u botu | 2 (Polling + Subscription) | Čeka tvoju odluku o DM-ovima |
| Notifikacije korisniku | 2 (Header polling + push) | Čeka odluku |
| PayPal obrazac | 2 (shop server-side, support client-side) | Shop je odložen |
| Modali | `ui/Dialog` + 9 ručnih | Svjesno preskočeno |
| Indeksi koji se sjenče | 6 parova | Novo nađeno |

Riješeno od prethodnog audita: slike, TEXT[] parsiranje, XP krivulja, robots meta,
API base URL, keš listinga.

---

## 6. Mrtav kod — šta se može bezbjedno ukloniti

- Šest indeksa iz E-2 (svaki ima živog blizanca s ograničenjem)
- `impressum` `force-dynamic` (zamijeniti s `revalidate`)
- Komentar `// TODO` iznad implementiranog PayPal verify-a
- 13 stranih ključeva bez indeksa **namjerno ostaviti** — tabele od 8–280 KB

Ništa veliko nije ostalo. Prethodne runde su ovo dobro počistile.

---

## 7. Top 10 produkcijskih rizika

1. **Otkaz diska briše i produkciju i backup** (C-1)
2. **Ništa ne javlja kad nešto pukne** (A-1) — 30 nevidljivih grešaka/20k zahtjeva
3. **Svaki sljedeći reboot ponovo obori GlitchTip** — uzrok je redoslijed, ne slučaj
4. ~~Zaglavljen `syncing`~~ — **povučeno**, sistem to već rješava. Zamijenjeno: mail ne radi, pa verifikacija i reset lozinke ne stižu
5. **`www-data` crontab nije u backupu** — restore bi dao sajt bez ijednog periodičnog posla
6. Shop bi pri paljenju odbijao svaku potvrdu plaćanja (O-1)
7. ~~Osam sporih WoW analiza zauzme Octane~~ — `Http::pool` već ima `timeout(30)`; ostaje samo da je 30 s dugo
8. `auth/login` bez testa — regresija u prijavi ne bi bila uhvaćena (AC-1)
9. Trka kod achievementa daje 500 umjesto tihog preskoka (V-1)
10. Mail ne radi — verifikacije, digest i reset lozinke ne mogu biti poslani

---

## 8. Top 10 performansnih rizika

Većina je već riješena; ovo je ono što ostaje.

1. Brisanje igara/studija radi seq scan zbog FK bez indeksa (E-1)
2. ~~Tri poziva na 30 s~~ — Turnstile i IndexNow popravljeni; Blizzard je već imao timeout
3. Šest suvišnih indeksa plaća se pri svakom upisu (E-2)
4. `impressum` renderuje se pri svakom zahtjevu bez keša
5. `--workers=8` na 4 jezgra — 2× overcommit; radi, ali je granica bliža nego što izgleda
6. `games` je 1.584 MB od 2.000 MB baze — svaki novi indeks na njoj je skup
7. Sortiranja `-views`, `name`, `-added` na hub-u rade Incremental Sort (~500 ms) — mjereno 0 poziva, prihvaćen kompromis
8. Enrichment komande pišu mimo observera pa keš ostaje ustajao do 1 h (I-1)
9. `queue_monitors` ima 24% mrtvih redova — jedina tabela s primjetnim bloatom
10. Frontend bundle nije mjeren u ovoj rundi — **NEPOTVRĐENO**

---

## 9. Procjena skaliranja

**Izmjereno, ne procijenjeno.**

| Metrika | Trenutno |
|---|---|
| Zahtjeva/sat | **2.551 – 5.136** (6 punih sati) |
| Prosjek | ~3.200/h → **~77.000/dan** |
| Uspješnost | 19.386 × 200 od 20.000 (**0,17% × 500**, od čega 30 su GlitchTip) |
| CPU | 4 jezgra, **load 0,28** |
| RAM | 2,4 GB od 7,5 GB; **swap 0 B** |
| Postgres | **14 konekcija od 100**; `shared_buffers` 2 GB = cijela baza |
| Redis | 130 MB od 768 MB |
| Disk | 19 GB od 75 GB (26%), inode 6% |
| Octane | 8 radnika, 376 MB ukupno |

**Promet je pretežno botovski** — AhrefsBot i SemrushBot na `/games/` stranicama
dominiraju uzorkom, što je namjerno propušteno.

| Skala | Procjena | Šta prvo pukne |
|---|---|---|
| **2×** (~154k/dan) | **Bez izmjena.** Load bi bio ~0,6, konekcije ~28 | Ništa |
| **5×** (~385k/dan) | **Vjerovatno bez izmjena.** nginx keš apsorbuje `/games/`, koji je većina prometa | Postgres konekcije (~70/100) — treba pgbouncer ili viši `max_connections` |
| **10×** (~770k/dan) | **Traži rad.** Load ~2,8 na 4 jezgra je granica | Octane radnici (8 na 4 jezgra), pa Postgres konekcije. Redis i disk su i dalje mirni |

**Ograničenje procjene:** ovo je linearna ekstrapolacija po trenutnom omjeru
keširanih i nekeširanih zahtjeva. Stvarni korisnici (za razliku od botova) traže
više nekeširanih ruta — profil, forum, kolekcija — pa bi 10× ljudskog prometa
bilo teže od 10× botovskog. **NEPOTVRĐENO bez podataka o stvarnim korisnicima.**

---

## 10. Launch blockers

### MUST FIX BEFORE LAUNCH

| | Zašto |
|---|---|
| **Backup mora otići s mašine** (C-1) | Jedini nepopravljivi rizik u cijelom auditu. Sve ostalo se može popraviti poslije incidenta; ovo ne |
| **GlitchTip mora raditi** (A-1) | Bez njega launch znači puštanje prometa na sistem koji ne može reći da nešto ne valja |

Oba su operativna, nijedno ne traži izmjenu koda, oba su posao od par sati.

### CAN FIX AFTER LAUNCH

- `failed()` na pet sync jobova + čišćenje ustajalog `syncing` (J-1)
- Indeksi na dva strana ključa (E-1)
- Eksplicitni timeouti na Turnstile i Blizzard (L-1)
- Testovi za `auth/login` i `api/revalidate` (AC-1)
- `firstOrCreate` kod achievementa (V-1)
- Brisanje šest duplih indeksa (E-2)
- `PAYPAL_WEBHOOK_ID` — **prije nego što se Shop upali**, ne prije launcha
- Konsolidacija fetchera (R-1) — ali **ne odgađati predugo**, raste

---

## 11. Presuda

# 🟠 READY WITH BLOCKERS

**Nije PRODUCTION GOLD**, i to nije formalnost. Platforma bez kopije van mašine
i bez ijednog načina da sazna da je pala ne može nositi tu ocjenu, bez obzira
koliko je kod dobar. Tražio si da tu ocjenu ne dam samo zato što si je pomenuo —
ne dajem je.

**Nije ni NOT READY.** Sam sistem je u dobrom stanju: sigurnost je jaka i
dokazana, novčana putanja idempotentna, keš strukturno siguran, deploy
jednoznačan i bezbjedan pri padu, baza stane u memoriju, a rezerva kapaciteta je
velika. Nijedan od dva blokera nije u kodu.

**Riješi ta dva i ovo je 🟢 PRODUCTION READY.** Očekivana ocjena poslije toga:
Observability 7, Disaster Recovery 8, Overall **8,5**.

---

## Dubina pokrivenosti po oblastima

Pošteno, da izvještaj ne izgleda temeljitiji nego što jeste.

| Dubina | Oblasti |
|---|---|
| **Duboko** | A server · B deployment · C backup/DR · D nginx/keš · I observeri · J queue · L external API · M sigurnost · V XP/nagrade · W keš arhitektura · AB observability · AC testovi |
| **Srednje** | E PostgreSQL *(ograničeno mojim resetom statistike)* · G Redis · K scheduler · O plaćanja · Q/R frontend · AD regresija |
| **Lagano** | F schema drift · H dupla poslovna logika · N notifikacije · S frontend state · T realtime · U Discord *(pokriveno ranije u sesiji)* · X SEO *(isto)* · Y performanse · Z mrtav kod · AA docs drift · AE poslovni tokovi |

Oblasti označene kao lagane oslanjaju se na provjere iz ranijih rundi ove sesije,
koje su bile dokazne, ali **nisu ponovo verifikovane od nule u ovom prolazu**.
Za **P (Filament admin)** nemam browser, pa je ocjena 6 data konzervativno — ne
zato što sam našao probleme, nego zato što nisam mogao provjeriti.

---

# POUKA KOJA SE PONOVILA ČETIRI PUTA

Ovo je, iskreno, najkorisniji rezultat cijelog audita.

Četiri puta sam u jednom danu proizveo nalaz koji je bio **netačan na isti
način**: tražio sam ime koje sam **pretpostavio**, umjesto da pratim kako je
stvar zaista napisana.

| # | Tvrdnja | Čime sam je „dokazao" | Stvarnost |
|---|---|---|---|
| 1 | 291 ruta bez autentifikacije | grep `auth:sanctum` | `route:list --json` piše `Illuminate\Auth\Middleware\Authenticate:sanctum`. **165 je zaštićeno.** |
| 2 | Turnstile i Groq ključevi fale | grep `services.turnstile.secret` | Kod čita `secret_key` i `api_key`. **Oba postavljena.** |
| 3 | Sync jobovi nemaju `failed()` | grep po fajlovima jobova | Metoda je u **traitu** koji svih pet koristi |
| 4 | 13 poziva bez timeouta | grep reda s `Http::` | Timeout stoji **red-dva niže**; stvarno bez njega bila su dva |

I obrnut smjer, jednako opasan: **`useRealTimeThreadReplies`** je bio na listi za
brisanje jer nije postojao fajl s tim imenom — a to je drugi izvoz iz
`useRealTimeForum.ts` koji forum stvarno uvozi. Da sam vjerovao grepu, slomio bih
forum.

**Pravilo koje iz ovoga slijedi:** za svaku tvrdnju oblika „X ne postoji" ili „X
nije podešen", dokaz ne smije biti odsustvo pogotka na ime koje sam pretpostavio.
Mora biti jedno od:

- **izvršavanje** — `route:list`, `EXPLAIN`, `config()` u tinkeru, stvarni HTTP
  zahtjev
- **mjerenje na produkciji** — `pg_stat_statements`, log, `ss`, `docker inspect`
- **čitanje same definicije** — vendor izvor, trait, konstruktor

Nalazi u ovom dokumentu koji **jesu** stajali — GlitchTip, backup, indeksi,
zaštita ruta, idempotentnost novca — svi su dobijeni na jedan od ta tri načina.
Nalazi koji su pali svi su bili grep.

---

# FAZA 2 — ŠTA JE POPRAVLJENO

Poslije audita, na zahtjev. Redoslijed je po težini nalaza.

## 🔴 A-1 GlitchTip — RIJEŠENO I DOKAZANO

**Šta je urađeno:**

1. `systemctl edit postgresql@16-main` → drop-in `after-docker.conf` s
   `After=docker.service` **i `Wants=`, ne `Requires=`**. Redoslijed, ne
   zavisnost: ako Docker ne uspije da se digne, baza svejedno mora. Docker se
   digao u istoj sekundi kao Postgres, pa je čekanje mjerljivo nula.
2. `systemctl restart postgresql@16-main` da veže bridge odmah, ne tek na
   sljedećem rebootu.
3. Restart GlitchTip kontejnera i Octanea (baza je prekinula konekcije).

**Dokaz da radi:**

```
prije:   127.0.0.1:5432   [::1]:5432
poslije: 127.0.0.1:5432   172.17.0.1:5432   [::1]:5432

LOG: listening on IPv4 address "172.17.0.1", port 5432     ← bez WARNING-a
```

GlitchTip iz kontejnera: `issues u bazi: 1397` — čita svoju bazu.

**Dokaz iz stvarnog prometa, ne iz mog testa:** zadnja tri `/api/2/envelope/`
zahtjeva u nginx logu vraćaju **200** (19:36:16, 19:36:18, 19:36:22). Prije
popravke 30 od 34 petstotinke bili su baš ti zahtjevi.

**Da se ne bi ponovilo tiho:** `healthcheck.sh` dobio deveti provjeru,
`check_glitchtip()`. Namjerno **ne gleda HTTP status ni stanje kontejnera** —
oboje su javljali zdravo dok je sistem bio mrtav — nego jedino što ne može
slagati: može li proces pročitati svoju bazu. Healthcheck ide svakih 5 minuta i
šalje Telegram.

## 🔴 C-1 Backup — POLA RIJEŠENO, POLA ČEKA TEBE

**Otkriće:** ključ za Storage Box **već postoji** na serveru
(`/root/.ssh/storagebox`, napravljen 17.08.) i `.ssh/config` ima podešen host
`u634216.your-storagebox.de:23`. Fali **jedan korak**: javni ključ nije
autorizovan na Storage Boxu.

```
$ ssh storagebox
u634216@u634216.your-storagebox.de: Permission denied (publickey,password).
```

**Urađeno:**
- `TECHPLAY_BACKUP_SSH=storagebox:techplay` upisano u `/etc/techplay-backup.conf`.
  Dok ključ nije autorizovan, ishod je **identičan dosadašnjem** (izlaz 2,
  Telegram, dvije lokalne kopije) samo s tačnijom porukom. Čim ključ bude gore,
  prva sljedeća noć odlazi s mašine — bez ijedne dalje izmjene.
- Backup dopunjen onim što mu je falilo: **`www-data` crontab** (jedan red bez
  kojeg poslije restorea nikad ne krene nijedan zakazani posao), `/etc/cron.d`,
  `nginx/snippets` i `conf.d`, `logrotate.d/techplay`, systemd drop-in, i
  `pm2 dump`.

**Ostaje tebi — jedna komanda:**

```bash
ssh-copy-id -p 23 -s -i /root/.ssh/storagebox.pub u634216@u634216.your-storagebox.de
```

(`-s` je obavezan: Storage Box prima ključeve preko SFTP-a. Tražit će lozinku
Storage Boxa.) Ili zalijepi ovaj ključ kroz Hetzner Robot:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC9Gu76NZ2FAsbQgpW/9qPcwSUYZh0AiZqzn7lzC2dHQ techplay-backup
```

## Ostale popravke

| Nalaz | Urađeno |
|---|---|
| **J-1** *(povučen)* | Mreža za zaglavljen `syncing` išla je sedmično a prag joj je 6 h. Backend sada propušta ponovni pokušaj poslije istih 6 h; frontend gasi dugme po `sync_stale` koje backend izračuna, pa prag stoji **na jednom mjestu** |
| **E-1** | Indeksi na `studios.became_studio_id` i `game_relations.other_game_id` |
| **E-2** | Šest indeksa koji sjenče unique — obrisani |
| **L-1** *(ispravljen)* | Turnstile `timeout(5)`, IndexNow `timeout(10)`. Ostali su već imali svoj |
| **V-1** | `UniqueConstraintViolationException` se hvata — gubitnik trke tiho vraća `false` umjesto 500 |
| **AC-1** | `LoginContractTest` (6 testova) i `RevalidationContractTest` (8) |
| **B (novo)** | Deploy sada sinhronizuje `healthcheck.sh` i `backup.sh` iz repoa. Prije toga izmjena u repou je mogla stajati nepročitana — a tiho zastarjeli healthcheck je gori od nikakvog |
| 🔵 | `impressum` s `force-dynamic` na `revalidate = 3600` |
| 🔵 | Obrisan `// TODO` iznad implementiranog PayPal verify-a |

## Šta NIJE dirano, i zašto

- **`PAYPAL_WEBHOOK_ID`** — Shop je odložen, mode je `sandbox`, 0 proizvoda.
  Postaviti **prije nego što se Shop upali**, ne prije launcha.
- **62 fetchera (R-1)** — konsolidacija kroz 62 fajla je refaktor s rizikom
  regresije, a ništa danas nije pokvareno. Ali **raste**, i to je jedina stavka
  koja ozbiljno prijeti cilju „godinu dana bez novog cleanupa".
- **Mail** — tvoja infrastruktura.

## Ocjene poslije popravki

| Oblast | Bilo | Sada |
|---|---|---|
| Observability | 3 | **7** — GlitchTip radi i healthcheck ga čuva |
| Disaster Recovery | 3 | **6** — sadržaj kompletan, off-site čeka jedan tvoj korak (bit će 8) |
| Reliability | 6 | **8** — nalaz je bio pogrešan, sistem je bio bolji nego što sam napisao |
| **Overall** | **7** | **8** — i **8,5** čim ključ ode na Storage Box |

---

## 🟡 B-2 — Nađeno tokom popravke: deploy skripta ne može ažurirati samu sebe

Dodao sam u `techplay-deploy.sh` korak koji sinhronizuje `healthcheck.sh` i
`backup.sh` iz repoa. Poslije deploya `check_glitchtip` **nije bio** u živoj
skripti.

Uzrok: deploy se izvršava iz `/usr/local/bin/techplay-deploy.sh`, a ja sam
izmijenio `deployment/techplay-deploy.sh` u repou. **Ništa ne prenosi jedno u
drugo** — skripta ne može instalirati vlastitu novu verziju jer se u trenutku
izvršavanja već izvršava stara.

Dokaz:

```
grep -c 'healthcheck.sh:techplay-healthcheck' /usr/local/bin/techplay-deploy.sh   → 0
grep -c 'healthcheck.sh:techplay-healthcheck' /var/www/techplay/deployment/...    → 1
```

**Riješeno jednokratno** ručnim `install -m 755`, poslije čega deploy sam
sinhronizuje ostale dvije skripte — potvrđeno na sljedećem prolazu:

```
── techplay-healthcheck se promijenila ──
── techplay-backup se promijenila ──
OK    glitchtip          ← deveta provjera, radi
```

**Ostaje kao trajno svojstvo:** svaka buduća izmjena **same deploy skripte**
traži jedan ručni `install`. To je prihvatljivo — alternativa je da skripta
prepisuje sebe usred izvršavanja — ali mora biti zapisano, jer inače izgleda kao
da je deploy prošao a izmjena nije stigla. Isti oblik tišine kao logrotate i
healthcheck prije njega.

---

## Završna provjera poslije svih popravki

| | |
|---|---|
| Testovi | **895 prolazi**, 0 padova |
| Stranice | `/` 18 ms · `/games` 16 ms · `/impressum` 19 ms · API 22 ms — sve 200 |
| Procesi | reverb, octane, oba workera `RUNNING`; frontend i bot `online` |
| **GlitchTip** | **13 `envelope` zahtjeva u zadnjih 400, svi 200** |
| Laravel log | **0 grešaka** |
| Healthcheck | 9 provjera, `OK glitchtip`; `FAIL backup` je očekivan dok ključ ne ode na Storage Box |
| Indeksi | Oba nova prisutna, svih šest sjenki obrisano |

**Preostaje jedan korak, i tvoj je:** autorizovati javni ključ na Storage Boxu.
Sve ostalo je spremno i čeka ga.
