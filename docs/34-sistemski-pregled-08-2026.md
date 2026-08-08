# TechPlay — sistemski pregled (08.08.2026)

Pregled cijelog sistema iz šest uglova: infrastruktura i deploy, baza i skaliranje,
backend arhitektura i sigurnost, frontend isporuka, pouzdanost i tihi otkazi, te
inženjerski proces. Cilj nije popis lijepih želja nego odgovor na tri pitanja:
**šta nas može oboriti, šta nas može koštati, i šta će nas usporiti za godinu dana.**

Nalazi označeni s **[P]** su lično provjereni u kodu tokom pisanja ovog dokumenta.
Ostali dolaze iz pregleda i nose putanju do fajla da se mogu provjeriti.

SEO sadržaj je namjerno van opsega — radi se odvojeno. Tehnički SEO propusti koji
su zapravo greške u kodu su ostali unutra.

---

## Sažetak — sedam stvari prije svega ostalog

| # | Šta | Zašto sad | Trud |
|---|---|---|---|
| 1 | **Nema backupa** — a postoji skripta koja briše produkciju | Gubitak podataka je trajan, ne privremen | 4 h |
| 2 | **Cijeli prijavljeni API nema rate limit** | Jedna linija koda; sad je otvoreno sve | 5 min |
| 3 | **Vanjski pozivi bez timeouta u putanji prijave** | Cloudflare uspori → cijeli sajt padne | 1 h |
| 4 | **Cron za scheduler možda nikad nije postavljen** | Zakazani članci se ne objavljuju, a niko ne zna | 30 min |
| 5 | **Živ XP exploit** — quest se broji prije validacije | Korisnik može farmati XP tri klika | 15 min |
| 6 | **Meta description se nikad ne koristi** | Uredniku polje ne radi ni na jednom članku | 30 min |
| 7 | **Redis bez `maxmemory`**, queue i cache dijele budžet | Ili pojede RAM, ili tiho baca poslove | 1 h |

Šest od sedam su ispod jednog radnog dana ukupno.

---

## A. Šta nas može oboriti

### A1. Cijeli autentifikovani API nema rate limit **[P]**

`backend/bootstrap/app.php` nikad ne poziva `$middleware->throttleApi()`. U Laravelu 12
`api` grupa dobija throttle **samo** ako se ta metoda pozove. Nije. Pravilo koje je
napisano u `AppServiceProvider.php:68` aktivira se jedino na rutama koje eksplicitno
kažu `throttle:api` — a to je jedna grupa.

Znači, bez ikakvog ograničenja stoje: promjena lozinke, brisanje računa, slanje poruka,
kreiranje narudžbi i PayPal capture, svih 20 klanskih ruta, `rewards/{slug}/redeem`,
`support/pledge`, i PayPal webhook.

**Popravka:** jedna linija. Zatim provjeriti koji eksplicitni throttle-ovi postaju suvišni.

### A2. Nema backupa — a postoji skripta koja briše produkciju **[P]**

U cijelom repozitoriju nema nijedne skripte, crona ili rotacije koja pravi kopiju baze.
Ono što postoji ide u **suprotnom smjeru**: `deployment/server_import_db.sh:23` radi
`DROP DATABASE IF EXISTS techplay` na serveru i uvozi dump s programerovog laptopa.
Jedina zaštita je `read -p` prompt.

To znači da smrt diska nije ispad nego **trajan gubitak platforme**.

**Popravka:** noćni `pg_dump -Fc` + kopija Redis RDB, gurnuto **van servera** (S3/B2),
7 dnevnih + 4 sedmične, i mjesečna proba vraćanja u praznu bazu koja provjeri broj redova.
Backup koji nikad nije vraćen je pretpostavka, ne backup.

### A3. Vanjski pozivi bez timeouta u putanji zahtjeva

`ReCaptchaService.php:42` zove Cloudflare Turnstile bez `timeout()`. Guzzle bez timeouta
čeka **zauvijek**. Taj poziv je u `AuthController` na prijavi i registraciji.

Lanac: Turnstile uspori → svaki login zauzme jedan Octane worker na neodređeno →
32 workera se potroše za nekoliko sekundi jer botovi ionako lupaju po `/auth/login` →
**API stane** → Next SSR koji čita s njega stane → cijeli sajt 502.

Isti obrazac bez timeouta: `ConnectedAccountController.php:193` (Steam), 
`BattleNetAuthController.php:93`, `SocialAuthController.php:65`, `WebhookController.php:47,68`,
i `PayPalWebhookController.php:159` — koji je uz to **javan i bez rate limita** (vidi A1).

**Popravka:** `Http::globalOptions(['timeout' => 10, 'connect_timeout' => 3])` kao pod,
pa fino podesiti po integraciji.

### A4. Redis bez granice memorije, s queueom i cacheom u istoj kanti

`deployment/provision.sh:62` instalira Redis i ne podešava ništa — nema `maxmemory`,
nema `maxmemory-policy`, nema odluke o AOF-u. Queue je DB 0, cache DB 1 — logički
odvojeno, ali **isti proces i isti memorijski budžet**.

Dva ishoda, oba loša:
- **Bez granice:** Redis raste dok kernel ne ubije njega, Postgres ili Octane. Svi
  poslovi u redu nestaju (nema AOF-a).
- **S `allkeys-lru`:** Redis počne izbacivati **poslove iz reda** da napravi mjesta za
  keš. Poslovi tiho nestaju, niko ne primijeti.

**Popravka:** `maxmemory` + `noeviction` na queue instanci, keš na svoju instancu s
`allkeys-lru`, i alarm na `used_memory`.

### A5. Deploy nije atomičan i nema rollback

`deployment/deploy.sh` mijenja živi direktorij u mjestu: `git pull` (14) → migracije (21)
→ Octane reload (31) → **`npm run build` na produkcijskoj mašini** (41). Build je korak
koji najčešće padne (OOM, greška tipa), a `set -e` znači da prekid ostavlja
**novi backend + novu shemu + stari frontend**, trajno.

Nema rollbacka nikakvog: nema release direktorija, nema symlinka, nema zapisanog
prethodnog commita. Oporavak je čovjek koji se ulogira i improvizuje.

Uz to: deploy ide kao `root` dok Octane radi kao `www-data`, pa `artisan *:cache`
ostavlja root-owned fajlove u `bootstrap/cache` — sljedeći upis www-data pukne s 500-kom
koja ne liči na deploy. I `stopwaitsecs=3600` u `supervisor-octane.conf:15` znači da
zaglavljen worker drži ispad **sat vremena** prije nego supervisor pošalje SIGKILL.

**Popravka:** build u CI-ju, artefakt na server, release direktorij + symlink swap,
rollback jednom komandom. `stopwaitsecs` na 30.

---

## B. Sigurnost

### B1. Dump baze s korisničkim podacima u git historiji **[P]**

`deployment/database_backup.sql`, **22,5 MB**, commit `6c66b88e`, i dalje dohvatljiv
preko `git show`. Sadrži 63 linije koje odgovaraju obrascu za lozinke i mailove.
`.gitignore` je kasnije popravljen (`deployment/*.sql`) ali to zaustavlja samo nove
commitove — blob ostaje zauvijek, u svakom klonu i forku.

**Popravka:** `git filter-repo`, force push, obavijestiti sve s pristupom, i — pošto su
bcrypt heševi sad javni onome ko je imao pristup repou — **prisilna promjena lozinki**.

### B2. Sanctum token s punim pravima putuje u URL-u prema Steamu **[P]**

`ConnectedAccountController.php:41`:
```php
$returnUrl = url('/api/v1/connected-accounts/steam/callback')
    .'?user_token='.$request->user()->createToken('steam-connect')->plainTextToken;
```
`createToken()` bez liste sposobnosti daje `['*']` — token koji može sve što može i
korisnik, s rokom od 7 dana. Ide u `openid.return_to`, dakle **na steamcommunity.com**,
u historiju pretraživača, i vraća se kao GET query — u nginx access logove.

Brisanje na kraju (`:83`) se dešava samo na uspješnoj putanji; svaki raniji `return`
ostavlja token živ sedam dana.

**Popravka:** `createToken('steam-connect', ['steam:link'], now()->addMinutes(5))`,
token u server-side state umjesto u URL, brisanje u `finally`.

### B3. Turnstile propušta kad nije podešen, i ima hardkodirani bypass

`ReCaptchaService.php:36`: ako `TURNSTILE_SECRET_KEY` nije postavljen, funkcija vraća
`success: true`. Tipfeler u `.env` tiho gasi zaštitu od botova, a jedini trag je log
koji niko ne čita.

Nezavisno, `AuthController.php:90`: bilo ko ko pošalje string `staff-bypass` kao
`recaptcha_token` preskače captchu. Uz `throttle:60,1` po IP-u i **bez ikakvog
zaključavanja po nalogu**, to je 60 pokušaja u minuti po IP-u.

### B4. Nema autorizacijskog sloja — dvije sheme rola koje se ne slažu

U 81 API kontroleru nema nijednog `authorize()`, `Gate::` ni `->can()`. Četiri postojeće
policy klase koristi samo Filament. Svaka provjera prava je ručno pisana, protiv **dvije
paralelne sheme** (Spatie role i `users.role` kolona), i one se razlikuju po endpointu:

- `ForumController.php:273` (kreiranje teme) dozvoljava `editor`
- `ForumController.php:616` (pin/lock) **ne** dozvoljava editora
- `ForumController.php:788` (izmjena posta) ne dozvoljava ni Editor-in-Chief

To nisu namjerne razlike nego posljedica kopiranja bloka. Svaki novi endpoint naslijedi
onu verziju koja je zadnja zalijepljena.

### B5. Živi kredencijali u praćenim fajlovima

- `deployment/local_export_db.ps1:34` — `$env:PGPASSWORD = "Hanan123!"`
- `deployment/provision.sh:12` — `RUBBER_STAMP_DB_PASS="StrongPass!"` s komentarom
  „promijeni u produkciji". Ništa to ne provjerava.
- `backend/.env.example:79-81` — Reverb app secret kao `techplay-reverb-secret`, i README
  kaže da se `.env.example` samo kopira.
- `backend/.env.example:16` — pravi produkcijski IndexNow ključ.

Tajne žive **samo** kao ručno uređeni `.env` na serveru: neverzionisani, nebackupovani.
Ako mašina umre, izgubili smo i podatke i tajne.

---

## C. Skaliranje — šta puca i kojim redom

### C1. Brojač pregleda članka piše u bazu na svaki pregled

`NewsController.php:61` radi `Article::where('slug',$slug)->increment('views')` **prije**
provjere keša, dakle i kad je odgovor keširan. Forum i igre to rade ispravno preko Redisa
(`ForumController.php:220`, `GameController.php:174`) i prazne se poslom
`FlushViewCounters`. Članci su ispali iz te promjene.

Na 100 zahtjeva u sekundi na jedan viralni članak to je 100 UPDATE-ova u sekundi na
**jedan red**: serijalizacija na row locku, ~100 mrtvih tupleova u sekundi, autovacuum
trajno u zaostatku. To je naša najprometnija ruta.

**Popravka:** dvije linije — `Redis::incr("views:article:{id}")`; posao za pražnjenje
već zna taj obrazac.

### C2. Leaderboard „tvoja pozicija" radi pune agregacije po zahtjevu

`LeaderboardController.php:81` — `viewer()` je **izvan** `Cache::remember`. Svaki poziv
radi `GROUP BY user_id` nad `user_games`/`game_ratings`/`user_achievements` spojeno na
cijelu tabelu `users`, plus još dva `COUNT`-a.

Uz to: `PUBLIC_ONLY` (`:29`) je `COALESCE(users.profile_visibility,'public') = 'public'`
— funkcija nad kolonom, pa indeks napravljen baš za to **nikad ne može biti korišten**.
A `users.xp` i `users.forum_reputation` **nemaju indeks** ni u jednoj od 205 migracija.

### C3. Cache stampede — nigdje nema zaključavanja

Nijedan `Cache::remember` u projektu nema lock ni `flexible()`. Najgori:
`games.hub.facets` (`GameHubController.php:49`) iza kojeg stoji `unnest()` + `GROUP BY`
nad 140k redova, i `forum.stats` (`ForumController.php:100`) s **TTL od 30 sekundi** koji
sadrži tri `COUNT(*)`-a nad cijelim tabelama.

Kad takav ključ istekne pod opterećenjem, **svi zahtjevi istovremeno** računaju isto.

**Popravka:** Laravel 12 ima `Cache::flexible($key, [$fresh, $stale], $cb)`. To samo po
sebi rješava svih pet najgorih ključeva.

### C4. Lista igara ne može koristiti indeks

`GameController.php:96` stavlja `orderByRaw` s izrazom nad nizom kao **vodeći** ključ
sortiranja, pa nijedan od tri napravljena hub indeksa nije upotrebljiv — Postgres mora
materijalizovati i sortirati cijeli skup. Bez filtera to je 140k redova po promašaju keša.
Uz to `paginate()` radi `COUNT(*)` nad istim predikatom, a keš ključ je `md5()` slobodnog
teksta pretrage — neograničena kardinalnost, pa crawler s `?search=` varijantama ima
100% promašaja.

### C5. Perzistentne konekcije uključene, bez connect timeouta

`config/database.php:111` — `PDO::ATTR_PERSISTENT => true`, bez env prekidača (MySQL blok
ga ima). Pod Octaneom svaki worker ionako drži konekciju; ovo je drži i preko restarta
workera. Nema `connect_timeout`, pa kad Postgres nije dostupan svaki worker blokira do
OS TCP timeouta umjesto da brzo padne. `'pool' => ['min','max']` (`:72`) je **mrtav
config** — Laravelov PDO driver ga ignoriše, a neko će pročitati i vjerovati da postoji
pooling.

### Redoslijed pucanja

1. **~20–40 zahtjeva/s (oko 5–10k dnevnih posjetilaca):** brojač pregleda članaka (C1)
   i sinhroni revalidacijski HTTP poziv u `TrackingController.php:105`. Dijele istu
   putanju zahtjeva, pa padaju zajedno. Simptom: p99 na `/news/{slug}` s 40 ms na sekunde.
2. **~200–500 istovremenih prijavljenih:** leaderboard (C2). Svaki poziv 200–500 ms
   čistog CPU-a na primarnoj bazi. Pedeset ljudi na toj stranici zasiti bazu — a pošto
   je baza jedna, degradira **sve ostalo** u isto vrijeme.
3. **Prvi pravi špic na hladnom kešu:** stampede (C3) + nesortabilna lista (C4). To ne
   raste postepeno — radi dok odjednom ne stane, i to tačno kad ima najviše prometa.

---

## D. Tihi otkazi — stvari koje prestanu raditi bez ijedne poruke

### D1. Nema monitoringa. Nikakvog.

Pretraga po `sentry|bugsnag|datadog|newrelic|prometheus|grafana|uptimerobot` kroz cijeli
projekat: **nula pogodaka**. Ne prati se: dostupnost, stopa grešaka, dubina reda,
`failed_jobs`, memorija Redisa, slobodan disk, istek TLS certifikata.

Jedini „health check" je `SystemController.php:13` koji vraća hardkodiranu verziju i
zastavicu održavanja. Deploy se gasi na njemu (`deploy.sh:59`) — pa deploy koji ostavi
mrtav Redis, mrtav queue i mrtav Reverb prijavi **„✅ Deployment Complete"**.

Vrijeme do otkrivanja, po komponenti:

| Komponenta | Kako saznamo | Za koliko |
|---|---|---|
| Octane / Next / Postgres | Sajt je dolje | minute |
| **Queue worker** | XP i notifikacije stanu, poslovi se gomilaju | **dani** |
| **Reverb** | Chat tiho mrtav, stranica se i dalje crta | **dani–sedmice** |
| **Scheduler** | Zakazani članci se ne objavljuju | **dani** |
| **Discord bot** | Niko | **nikad** |
| **Enrichment** | Niko | **nikad** |

### D2. Cron za scheduler nije nigdje proviziran

`backend/routes/console.php` zakazuje 25+ zadataka, uključujući `articles:publish-scheduled`
**svake minute**. Sve to traži `* * * * * php artisan schedule:run`. Ta linija postoji
**samo kao proza** u `docs/21-jobs-crons-queues-map.md:63`. `provision.sh` je ne instalira,
`deploy.sh` je ne provjerava.

**Ovo treba provjeriti na serveru danas** — ako nije postavljeno, zakazani članci se
nikad ne objavljuju, sitemapi su ustajali, sezone se ne zaključuju:
```bash
crontab -l | grep schedule:run
```

### D3. Enrichment pada u tišini, po dizajnu

Svaka vanjska putanja hvata grešku, loguje `warning` i nastavi: `EnrichSteamBatch.php:60`,
`EnrichFromOpenCritic.php:59` (koji uz to **`break`-ne i vrati SUCCESS** — ako RapidAPI
ključ istekne, komanda „uspijeva" svaki dan zauvijek), `EnrichFromWikidata.php:57`,
`SyncSteamAchievements.php:49`.

Nigdje se ne provjerava da je enrichment nešto **proizveo**. Nema metrike „koliko igara
obogaćeno u zadnjih 7 dana", nema alarma na nulu. A chronicle čita taj izlaz — pa mrtav
enrichment tiho kvari preporuke i digest, koji se i dalje uredno prikazuju, samo pogrešni.

### D4. `retry_after` je kraći od timeouta poslova → duplo izvršavanje

`config/queue.php:71` — `retry_after: 90`. `EnrichSteamBatch.php:38` — `timeout: 300`.
Laravel vraća posao u red nakon `retry_after` bez obzira što još radi, pa se **izvršava
paralelno sam sa sobom**.

Kod `EnrichSteamBatch` to je najgore jer posao na kraju dispečuje svog nasljednika
(`:72`). Najduže trajanje jedne serije je oko 1080 sekundi — za to vrijeme red ga
isporuči na 90, 180, 270… i **svaka kopija dispečuje novi lanac**. Lanac se grana tačno
onda kad je Steam spor.

### D5. `chronicle:rebuild` — jedan korisnik zamrzne sve ostale

`RebuildChronicles.php:52` radi `User::query()->get()` (svi korisnici u memoriju) i do
**pet upita po korisniku** samo da odluči je li zastario. Petlja izgradnje nema `try/catch`
— jedan korisnik s pokvarenim redom obori komandu i **svi poslije njega se nikad ne
izgrade**. Sutra ista stvar, na istom korisniku. Zauvijek, bez ijednog alarma.

---

## E. Frontend isporuka

### E1. Slike nisu optimizovane — `/gta6` šalje oko 11 MB

`next.config.ts:99` ima `images: { unoptimized: true }`. Posljedica: `next/image` emituje
običan `<img>` **bez srcseta**, pa je svih 30 `sizes=` atributa i 6 `quality=` propova u
projektu mrtvo slovo. 72 `<Image>` i 134 sirova `<img>` serviraju originale.

- `/gta6` — šest PNG-ova od 1,2 do 2,6 MB ≈ **11 MB**
- `/forum` — `forum-hero.png` 1,6 MB, s `priority`, dakle **to je LCP**
- OG slike — sedam komada po 2,0–2,2 MB

Obrazloženje (iscrpljivanje diska zbog 900k RAWG naslovnica) vrijedilo je samo za
`media.rawg.io`. Platili su ga svi naši vlastiti PNG-ovi.

**Redoslijed popravke:** (1) Cloudflare Polish + WebP — 10 minuta, ~85% manje bajtova,
bez ijedne linije koda; (2) koristiti varijante koje backend **već pravi** — `lib/imageUrl.ts`
ih dokumentuje, a zovu ih samo dvije komponente; (3) custom loader kroz Cloudflare Image
Resizing za `/storage/*`, čime se vraća srcset bez pisanja na disk.

### E2. GA proxy blokira event loop na svaki analitički događaj **[P]**

`app/proxy/ga/[...path]/route.ts:33` **čeka** (`await`) odgovor od google-analytics.com
prije nego vrati 204. Svaki `page_view` svakog posjetioca je jedan ulazni zahtjev **i**
jedan izlazni socket na jedinom Node procesu. Nema ni liste dozvoljenih putanja.

Na špicu je to prvi sloj koji se zasiti — prije renderovanja, prije baze.

**Popravka:** maknuti `await` (ili obrisati proxy i učitavati gtag direktno).

### E3. `/games/[slug]` nije keširan ni na jednom sloju

Stranica je `force-dynamic`, a Cloudflare ne kešira `text/html` bez eksplicitnog pravila
— kojeg za frontend zonu nema. Znači svaki pregled = pun Node render + **pet poziva**
prema Octaneu (`page.tsx:318`), nijedan s `revalidate`.

### E4. Bundle: Echo i pusher na svakoj ruti, framer-motion svuda

- `context/AuthContext.tsx:7` statički uvozi `lib/echo.ts` → `laravel-echo` + `pusher-js`
  (**88 KB**) su u `<head>`-u i stranice `/cookies`. Socket otvaraju samo forum i social.
- `components/layout/Header.tsx:7` uvozi framer-motion (**164 KB**) zbog padajućeg menija.
  Header je u root layoutu. `app/template.tsx` je isti problem već riješio CSS animacijama
  i objasnio zašto.

Zajedno s `date-fns` (28 KB) to je **~280 KB sirovo / ~90 KB brotli sa svake rute**, oko
22% JS-a.

### E5. `withCredentials` vjerovatno gasi Cloudflare keš na API-ju

`lib/axios.ts:23` postavlja `withCredentials: true` globalno, a backend ima `statefulApi()`.
Svaki GET tako pokreće Laravel sesiju i odgovor nosi `Set-Cookie` — a Cloudflare **ne
kešira odgovor sa `Set-Cookie`**. Pravila keširanja za `/api/v1/home|news|settings` su
onda vjerovatno `BYPASS`.

**Provjera:** `curl -I https://api-beta.techplay.gg/api/v1/news | grep cf-cache-status`

---

## F. Duplikati — odgovor na „zašto svega ima dva"

Uzrok je jedan: **svaki talas prepravki je dodavao, a nije brisao.** Ono što drži
duplikate u životu su kompatibilnosti niz vodu — `revalidate/route.ts` prima dva imena
zaglavlja i dva imena varijable, `config/app.php:137` pada nazad preko dva ključa,
`Message` model ima spojen `fillable` iz dvije sheme. Šimovi rade, i baš zato duplikati
prežive. I baš zato novi čovjek ne može znati koja je implementacija prava.

| Par | Kanonsko | Šta još pokazuje na mrtvo | Trud |
|---|---|---|---|
| `RevalidationService` / `CacheRevalidationService` | `CacheRevalidationService` | `ArticleObserver`, `TrackingController` | M |
| `MessageController` / `ChatController` | `ChatController` | rute `api.php:181-185`, nijedan front | M |
| `sitemap.ts` (front) / `SitemapController` (back) | backend | `robots.txt` pokazuje na frontend | S |
| `useApi.ts` / `lib/axios.ts` | `lib/axios.ts` | `HomeClient.tsx` — i mijenja globalni axios | S |
| `BlizzardDataTransformer` / `V2` | V2 | ništa (mrtav, 297 linija) | S |
| `ImageService` / `ImageOptimizationService` / `ImageOptimizer` | `ImageOptimizer` | `MediaObserver` drži srednji | S |
| `react-hot-toast` / `sonner` | `react-hot-toast` | `SocialShare.tsx` | S |
| `/rss` i `/feed` | odabrati jedno | `<link rel=alternate>` i `atom:self` | S |

Pravilo za dalje, jer je ovo jedini način da se ne nagomilava: **kad nešto zamijeniš,
staro se briše u istom commitu.** Ako ne može odmah — rok i ime u komentaru, ne „kasnije".

---

## G. Proces i kvalitet

### G1. CI postoji, crven je, i ništa ne blokira **[P]**

`.github/workflows/ci.yml` postoji i pokreće `php artisan test`, `tsc --noEmit` i lint.
Trenutno stanje: **backend job pada** (2 testa), **lint job pada** (256 grešaka, izlazni
kod 1). A `push_and_deploy.ps1` gurne na `main` i **odmah** SSH-uje i deployuje — ne čeka
CI i ne provjerava ga.

Crven CI po defaultu je gori od nikakvog: nauči tim da ignoriše jedini signal koji ima.

Uz to, backend testovi rade na **SQLite**, a produkcija je PostgreSQL — pa migracija
`000007` čiji je kod doslovno `if (DB::getDriverName() === 'pgsql')` **nikad nije
izvršena nigdje osim na produkciji**.

### G2. Živ XP exploit **[P]**

`GameRatingController.php:124` zove `QuestService::progress($user, 'game_rated')` kao
**prvu naredbu**, prije `$request->validate()` i izvan `$justPublished` zaštite na `:151`.
Seedovan quest „The Critic" traži 3 ocjene i plaća 120 XP.

Znači: sačuvaj skicu (1) → objavi (2) → izmijeni (3) → quest gotov. Isti quest, ista igra.
Čak i `422` greška broji progres.

To je i uzrok pada testa `ReadingTest` — test je **u pravu**, kod nije.

### G3. Meta description se nikad ne prikazuje **[P]**

`ArticleResource` šalje `meta_description`. Frontend čita `article.seo_description`
(`app/news/[slug]/page.tsx:80`). Polje je opcionalno u tipu, pa TypeScript ne prijavi ništa.

**Svaki meta description koji urednik upiše u admin se odbacuje**, a stranica pada nazad
na `excerpt`. Kod recenzija su mrtva **oba** — `ReviewResource` šalje `meta_title` i
`meta_description`, a stranica čita `seo_title` i `seo_description`.

### G4. Nula testova na plaćanja, prijavu i prava

Pretraga po `backend/tests/**` za `auth/login`, `/orders`, `paypal`, `hasRole`: **nula
pogodaka**. Netestirano ostaje `AuthController` (630 linija, uključujući brisanje računa)
i 687 linija PayPal koda — koji je ovih dana mijenjan, bez ijednog testa koji bi držao
promjenu.

Postojećih 336 testova su dobri, ali pokrivaju zabavnu površinu (klanovi, questovi, XP),
ne opasnu.

### G5. Nema root README

U korijenu repozitorija nema `README.md`. Novi čovjek vidi šest direktorija, pet
raštrkanih `.md` fajlova i četiri PNG-a, bez ulazne tačke. `frontend/README.md` je
neizmijenjeni `create-next-app` tekst koji priča o Vercelu i ne spominje ni Laravel API,
ni `NEXT_PRIVATE_API_URL` bez kojeg SSR ne radi kako treba.

---

## H. Šta je dobro i ne treba dirati

Da se zna šta je već riješeno kako treba:

- **Novac je ispravno modelovan** — `decimal(10,2)` svuda, nigdje float.
- **PayPal webhook stvarno verifikuje potpis** i pada zatvoreno u produkciji.
- **Sirovi SQL je svuda parametrizovan** — provjereno, nema injection tačke.
- **`BountyService::award/spend`** koristi `lockForUpdate` kako treba.
- **Discord endpointi verifikuju token** s `hash_equals`.
- **`fetchContent.ts`** razlikuje „sadržaj ne postoji" od „API je pao" — to je
  promišljeno i rješava stvarnu grešku.
- **`GameMerger`** je jedina destruktivna operacija umotana u transakciju — i jedina koja
  je urađena ispravno.
- **`app/template.tsx`** je već zamijenio framer-motion CSS-om i objasnio zašto.

---

## I. Plan rada

### Faza 1 — ove sedmice (~2 dana, gasi požare)

1. Noćni backup van servera + jedna proba vraćanja **(A2)**
2. `throttleApi()` — jedna linija **(A1)**
3. Globalni HTTP timeout **(A3)**
4. Provjeriti `crontab -l | grep schedule:run` na serveru **(D2)**
5. Pomjeriti quest poziv ispod validacije **(G2)**
6. Uskladiti `seo_description` → `meta_description` na 6 mjesta **(G3)**
7. Redis `maxmemory` + `noeviction`, `LOG_STACK=daily`, logrotate **(A4)**
8. Cloudflare Polish + WebP **(E1)** — 10 minuta, najveći efekat po minuti rada

### Faza 2 — sljedeće (~1 sedmica)

9. Očistiti dump iz git historije, rotirati sve tajne iz B1 i B5
10. Steam token: ograničiti prava i rok, maknuti iz URL-a **(B2)**
11. `retry_after` > najduži timeout + `ShouldBeUnique` **(D4)**
12. Pregledi u Redis buffer + revalidacija u queue **(C1)**
13. Keširati `viewer()`, maknuti `COALESCE`, dodati dva indeksa **(C2)**
14. `Cache::flexible()` na pet vrućih ključeva **(C3)**
15. Ozeleniti CI i uključiti branch protection **(G1)**
16. Pravi `/health` koji provjerava Postgres, Redis, dubinu reda i Reverb **(D1)**
17. UptimeRobot + Sentry **(D1)**

### Faza 3 — mjesec dana

18. Release direktoriji + symlink swap + rollback, build u CI-ju **(A5)**
19. Staging mašina koja se noću vraća iz backupa — rješava i D2 i provjerava A2
20. Policies umjesto inline provjera, jedna shema rola **(B4)**
21. Testovi oko `AuthController` i PayPal putanje **(G4)**
22. Brisanje mrtve polovine svakog para iz tabele F
23. `withoutOverlapping()` i `onFailure()` na sve zakazane zadatke **(D3, D5)**

### Faza 4 — kad bude vremena

24. Frontend bundle: lazy Echo, de-framer header i kartice **(E4)**
25. ISR + edge keš za `/games/[slug]` **(E3)**
26. Root README i čišćenje dokumentacije **(G5)**
27. Generisani tipovi iz API resursa umjesto ručno pisanih
28. Retencija za tabele koje rastu bez granice (`article_views`, `notifications`,
    `player_signals`, `sessions`, `failed_jobs`)

---

## Napomena o metodi

Ovaj pregled je rađen čitanjem koda, ne mjerenjem na produkciji. Tvrdnje o tome **šta
kod radi** su provjerljive i nose putanju do fajla. Tvrdnje o tome **kad će nešto pući**
su procjene na osnovu oblika upita i topologije — treba ih potvrditi mjerenjem
(`pg_stat_statements`, `EXPLAIN ANALYZE` na vrućim upitima, load test) prije nego se na
njih potroši mnogo vremena.

Tri stvari se ne mogu provjeriti odavde i treba ih pogledati na serveru:
```bash
crontab -l | grep schedule:run                      # D2 — objavljuju li se zakazani članci
redis-cli config get maxmemory maxmemory-policy     # A4
curl -I https://api-beta.techplay.gg/api/v1/news | grep cf-cache-status   # E5
```

---

## Stanje na 08.08.2026 — šta je urađeno

Sve što slijedi je popravljeno, testirano (356/356 backend testova prolazi,
typecheck i lint zeleni) i na `main`. Dokument ostaje kakav je bio da se vidi
šta je bio nalaz; ova tabela govori šta je od toga zatvoreno.

### Zatvoreno

| Nalaz | Šta je urađeno |
|---|---|
| A1 rate limit | `throttleApi('api')` u `bootstrap/app.php` — cijeli API je pod limitom |
| A3 timeouti | `Http::globalOptions` s 10 s / 3 s kao pod za sve izlazne pozive |
| B2 Steam token | Sanctum token zamijenjen desetominutnim jednokratnim handleom u kešu |
| B3 Turnstile | Pada zatvoreno kad ključ nije podešen; `staff-bypass` je sad konfigurisana tajna, po defaultu odsutna |
| B5 kredencijali | Lozinke izvađene iz `local_export_db.ps1` i `provision.sh` |
| C1 brojač pregleda | Članci, recenzije, tech i vodiči idu kroz Redis; flush je atomičan (`GETDEL`) i vraća broj ako upis padne |
| C2 leaderboard | `viewer()` keširan po korisniku, sezona keširana, `COALESCE` maknut, dva parcijalna indeksa dodana |
| C3 stampede | `Cache::flexible` na pet najskupljih ključeva |
| C5 konekcije | Perzistentne konekcije isključene po defaultu, `connect_timeout` postavljen |
| D1 health | `/api/v1/system/health` provjerava Postgres, Redis, dubinu reda i `failed_jobs`, vraća 503; deploy gate pokazuje na njega |
| D3 tihi enrichment | OpenCritic vraća `FAILURE` umjesto lažnog uspjeha; `onFailure` hookovi na šest zakazanih zadataka |
| D4 duplo izvršavanje | `retry_after` 1200 s, `EnrichSteamBatch` je `ShouldBeUnique` |
| D5 chronicle | Preživi pokvarenog korisnika, jedan upit po izvoru umjesto pet po korisniku, streamuje |
| E2 GA proxy | Ne blokira više; samo GA collect putanje |
| E4 bundle | Echo i pusher (88 KB) van root bundlea; `/settings` se ne dohvaća dvaput |
| G1 CI | Zelen na sve tri grane; dvije stvarne greške reda hookova popravljene |
| G2 XP exploit | Quest se broji iza publish zaštite, poslije validacije |
| G3 SEO polja | `meta_*` putuju i stranica ih preferira — meta description urednika se konačno prikazuje |
| G5 onboarding | Root `README.md` napisan |
| F duplikati | Obrisani: stari sistem poruka (kontroler + 5 ruta), `BlizzardDataTransformer`, `ImageService`, `useApi.ts`, `SeoForm`, `sonner` |
| Admin panel | `/debug-gemini-test` obrisan; publish fan-out prebačen na queue (urednik više ne čeka 15–30 s); `ImageOptimizer` kroz kontejner |
| A2 backup | `deployment/backup.sh` napisan — Postgres, Redis i uploadi, provjeren `pg_restore --list`, sa slanjem van servera. **Treba mu cron linija.** |

### Ostaje — i zašto

Serversko (čeka SSH pristup):

- **A2** cron za `backup.sh`, i prva proba vraćanja
- **A4** Redis `maxmemory` + `noeviction`
- **A5** release direktoriji, symlink swap, build u CI-ju umjesto na produkciji
- **D2** provjeriti postoji li `schedule:run` u crontabu
- **E1** Cloudflare Polish + WebP — deset minuta, najveći efekat po minuti rada
- **E5** potvrditi `cf-cache-status` na API-ju

Kod, ali svjesno odgođeno:

- **B1 git historija** — čišćenje dumpa traži `filter-repo` i force push, što razbija svaki klon. Treba se dogovoriti kad, i uz to ide prisilna promjena lozinki.
- **B4 autorizacija** — Policies umjesto inline provjera i jedna shema rola je refaktor kroz 81 kontroler; nije stvar jednog popodneva.
- **C4 sortiranje liste igara** — traži materijalizovanu `is_edition` kolonu i backfill nad 140k redova.
- **E5 `withCredentials`** — dira CSRF putanju na živom sajtu bez staginga; ne bih to mijenjao naslijepo.
- **G4 testovi za plaćanja i auth** — pravi posao, i vrijedi ga uraditi prije nego se PayPal ponovo dira.
- **Dva revalidacijska servisa** — oba sad rade; spajanje je maintainability, ne ispravnost, i ima realan rizik da opet pokvari objavljivanje. Zaslužuje svoj prolaz.
- **Statični sitemap** — SEO, odgođeno po dogovoru.
