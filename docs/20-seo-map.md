# 20 — SEO Map

## SEO stack

| Komponenta | Lokacija | Svrha |
|-----------|----------|-------|
| `GlobalSeo` | `components/seo/GlobalSeo.tsx` | Dynamic meta tagovi po stranici |
| `lib/seo.ts` | Frontend lib | Helper funkcije za generisanje meta |
| `SchemaService` | Backend servis | JSON-LD structured data |
| `SeoAnalyzerService` | Backend servis | AI SEO analiza sadržaja |
| `InternalLinkService` | Backend servis | AI preporuka internih linkova |
| `HreflangService` | Backend servis | Hreflang tagovi (multi-language) |
| `IndexNowService` | Backend servis | Bing/Yandex instant indexing |
| `KeywordDensityService` | Backend servis | Keyword density analiza |
| `SeoMeta` model | Backend model | Per-entity SEO override |
| `PageSeo` model | Backend model | Per-path admin-definisan SEO |
| `SeoManagerResource` | Filament admin | SEO upravljanje |
| `GenerateSitemap` | Artisan command | XML sitemap |

---

## Meta tagovi

### Na svakoj stranici (GlobalSeo komponenta)
- `<title>` — meta title
- `<meta name="description">` — meta description
- `<meta name="robots">` — index/noindex, follow/nofollow
- `<link rel="canonical">` — canonical URL

### Open Graph (OG)
- `og:title` — naslov za social share
- `og:description` — opis za social share
- `og:image` — slika za social share
- `og:url` — kanonička URL
- `og:type` — article, website, itd.

### Twitter Cards
- `twitter:card` — summary_large_image
- `twitter:title`
- `twitter:description`
- `twitter:image`

---

## Structured Data (JSON-LD)

### Root layout (`app/layout.tsx`)
- `Organization` schema — TechPlay.gg organizacija
- `WebSite` schema — website + SearchAction (site search)

### Per-article
- `Article` ili `NewsArticle` JSON-LD
- Publisher, author, datePublished, dateModified, image

### Per-review
- `Review` JSON-LD
- reviewRating, itemReviewed (igra), author

### Per-game (potencijalno)
- `VideoGame` JSON-LD schema — UNKNOWN da li je implementirano

### SchemaService
- Backend generira JSON-LD po tipu sadržaja
- `GET /seo/articles/{article}/schemas` — vraća schemas (za admin pregled)

---

## Sitemap

- **Komanda:** `php artisan generate:sitemap`
- **Format:** XML sitemap (UNKNOWN da li submitovan na Google Search Console)
- **Što uključuje:** Vjerovatno sve news, reviews, guides, igre (crawled-slugs endpoint postoji)
- **Automatizacija:** UNKNOWN (da li je cron job)

---

## IndexNow (Instant Indexing)

- Bing i Yandex instant indexing pri objavi sadržaja
- Key fajl: `frontend/public/tp7k3m2n9x5q8r1w4y6z0a.txt`
- Trigger: observer na Article/Review/Guide/Video publish
- Jobs: `PingIndexNow`, `SubmitIndexNow` u queue
- **Napomena:** Google NE podržava IndexNow (koristi GSC API ili čeka crawl)

---

## Admin SEO upravljanje

### SeoManagerResource
- Admin može definisati per-page SEO override
- Primjena: specijalne landing stranice, kategorije

### PageSeoResource
- Per-path SEO (primjer: `/games` stranica ima poseban title/description)
- API: `GET /page-seo/{path}`
- Frontend fetchuje na server-side za svaku stranicu

---

## SEO po tipu stranice

### News članci
- Dynamic title: "{naslov} - TechPlay.gg"
- Canonical: techplay.gg/news/{slug}
- OG image: hero slika članka
- NewsArticle JSON-LD
- IndexNow ping pri publish

### Reviews
- "{igra} Review - TechPlay.gg"
- Review JSON-LD s ocjenom
- OG image: cover art igre

### Game stranice
- "{igra} — Release date, Reviews, Screenshots"
- VideoGame JSON-LD (UNKNOWN)
- Canonical: techplay.gg/games/{slug}
- High SEO potencijal (search volume za ime igre)

### Release Calendar
- "/games/calendar" — visoki potencijal za long-tail keywords
- "Igre koje izlaze u {mjesec} {godina}"
- UNKNOWN da li su generirane monthly stranice

### Forum threadovi
- Thread title kao SEO title
- ThreadCreated event — vjerovatno IndexNow ping

---

## Broken link tracking

- `BrokenLink` model, `broken_links` tabela
- `ScanBrokenLinks` artisan komanda
- Skener unutarnjih linkova koji vraćaju 404

---

## AI SEO alati (za admina)

- `POST /seo/suggest-links` — AI prijedlog internih linkova (auth:sanctum)
- `GET /seo/orphan-pages` — stranice bez dolaznih internih linkova
- `GET /seo/articles/{article}/inbound-links` — dolazni linkovi na članak

---

## Što je dobro

- IndexNow implementiran — Bing/Yandex instant indexing
- Structured data za articles i reviews
- Per-page SEO override kroz admin
- AI-powered link building prijedlozi
- Sitemap generator postoji
- Broken link scanner

## Što nedostaje

- **Google Search Console API** integracija za Google (IndexNow ne pokriva Google)
- **Game stranice JSON-LD** — `VideoGame` schema vjerovatno nije implementirana
- **Hreflang** za internacionalizaciju (servis postoji ali UNKNOWN implementacija)
- **Monthly calendar pages** kao ISR stranice (veliki SEO potencijal)
- **Image alt text** — AltTextService postoji (AI-generated), ali integracija UNKNOWN
- **Sitemaps automatski rebuild** — komanda postoji, ali cron scheduling UNKNOWN
- **Breadcrumbs JSON-LD** — UNKNOWN

---

## Audit 2026-08-17 — sitemap, robots i puzanje

Izmjereno protiv produkcije, ne pretpostavljeno.

### Nađeno i popravljeno

| Težina | Nalaz |
|---|---|
| **Kritično** | `robots.txt` je prijavljivao `Sitemap: https://api-beta.techplay.gg/sitemap.xml` — **API host**. Crawler slijedi to, stiže na drugi hostname čiji index pokazuje nazad na techplay.gg, a sitemap koji navodi URL-ove s tuđeg hosta se odbija osim ako su oba verifikovana kao jedno svojstvo. Uzrok: `env('FRONTEND_URL', config('app.url'))` — kad varijabla nije postavljena, padne na API URL. Jedan fallback je vjerovatno koštao cijeli sitemap od 166.000 URL-ova. |
| Visoko | `sitemap-categories.xml` slao je na `/tech/benchmarks`, `/tech/guides`, `/tech/reviews`, `/tech/news`. Sekcija je prešla na `/hardware`; sva četiri vraćaju **404**. Sada čita ispravne putanje. |
| Visoko | `robots.txt` je imao `Allow: /tech/` za Googlebot-News — upućivao je News crawler na mrtve putanje. |
| Srednje | **Dvije sitemape.** `frontend/app/sitemap.ts` se gradi i servira (lokalno provjereno, 2.300 bajta, 40-ak URL-ova), a na produkciji ga nginx presreće u korist backendove. Da se to pravilo ikad promijeni, sitemap tiho pada sa 166.000 na 40 URL-ova. Mrtva datoteka **obrisana** — 404 je barem vidljiv, tiho pogrešan sitemap nije. |

**Vlastita greška uhvaćena prije commita:** prvi popravak je koristio `config('app.frontend_url')` cijeli, a ta vrijednost je **lista razdvojena zarezima** (CORS treba svaki origin) — proizvodilo je `http://a,http://b,http://c/sitemap.xml`. Sada se uzima prvi unos.

Čuva `tests/Feature/SitemapAndRobotsTest.php` — 5 testova nad hostom sitemapa, zarezima u
`FRONTEND_URL`, pohranjenom `Sitemap:` linijom, `/tech/` putanjama i hostom djece indeksa.

### Provjereno i čisto

- **Tombstones:** 60.975 obrisanih igara, **nijedna** nije ostala u sitemapu.
- **Pravilo ulaska:** `Game::whereNotNull('description')` — 114.789 od 141.580; tanke igre bez opisa su ispravno vani.
- **Facete:** 14 žanrova + 333 platforme + 217 tagova + 80 godina = 644 stranice. Nema eksplozije faceta.
- **Strukturirani podaci:** članci nose `NewsArticle`/`Article` + `BreadcrumbList` + `Person` + `Organization` + `SpeakableSpecification`; žanr/platforma/godina nose `CollectionPage` + `BreadcrumbList`.
- **Core Web Vitals:** LCP 0,24–0,82 s, CLS 0,000, TTFB 0,07–0,69 s (mobilni viewport, bez usporavanja mreže — donja granica, ne terenski podatak).

### Ostaje otvoreno

1. ~~**Katalog se ne može puzati.**~~ **Riješeno isti dan** — vidi sekciju niže. 0/75 padova.
2. ~~**HTML se ne kešira na rubu.**~~ **Za `/games/*` riješeno na originu** (nginx), za ostatak
   HTML-a čeka Cloudflare pravilo — vidi niže.
3. **11 GTA6 likova vraća 404** na produkciji a rade lokalno — deployani build je stariji.
4. ~~`/news` i `/reviews` imaju `<title>TechPlay | TechPlay</title>`~~ **riješeno**; ostaje:
   `og:image` fali na svim hub stranicama; `/calendar` i `/leaderboard` bez canonicala;
   `/games` i `/forum` bez `<h1>`.
5. **Google News:** tehnika je spremna, ritam nije — 1 članak u 30 dana, a jedini u news sitemapu datiran je 14. 11. 2026, u budućnosti.

### Zašto popravka sitemapa nije radila — 17. 08. 2026

Kod je bio ispravan, deployan, proces restartovan, OPcache isključen, svi Laravel kešovi
očišćeni — a sajt je i dalje servirao `/tech/` putanje. Sat vremena traženja, pa nalaz:

**`sitemap:generate` piše statične XML fajlove u `public/`, a FrankenPHP servira svaki
stvarni fajl iz `public/` prije nego što PHP uopšte bude pozvan.** Rute u `web.php` za te
putanje na produkciji **nikad se ne izvršavaju**.

Redoslijed eliminacije, da se ne ponavlja:

| Sumnja | Provjera | Ishod |
|---|---|---|
| Kod nije deployan | `grep` po fajlu na serveru | fajl ima novu verziju |
| OPcache drži stari bytecode | `php -i \| grep opcache` | OPcache potpuno **isključen** |
| Proces radi iz drugog direktorija | `grep directory /etc/supervisor/conf.d/*octane*` | ispravan put |
| Laravel keš (config/route) | `optimize:clear` + restart | bez promjene |
| Druga kopija klase | `find` + `autoload_classmap.php` | jedna klasa, jedan put |
| **CLI vs HTTP** | isti kontroler kroz `tinker` | **CLI daje `/hardware/`, HTTP `/tech/`** |
| Statični fajl u `public/` | `ls public/sitemap*.xml` | **15 fajlova, pisani u ponoć** |

Zaključna provjera je bila ključna: pokrenuti **isti kod kroz CLI** i uporediti sa serviranim
odgovorom. Kad se ta dva razlikuju, uzrok nije u kodu ni u kešu — nego u tome što se kod ne
izvršava.

**Statičko generisanje ostaje** i to je ispravno na ovoj skali: fajlovi kataloga su po ~8 MB,
166.000 URL-ova ukupno; sastavljati to na svaki zahtjev znači upit nad 50.000 redova svaki
put kad crawler dođe.

**Popravljeno je ono što nije standard:**

1. `GenerateSitemap` sada **briše fajlove koje više ne piše**. Zatečeno: `sitemap-videos.xml`
   od prije uklanjanja videa, i `sitemap-games-4.xml` i `-5.xml` od 109 bajta otkad se katalog
   smanjio s pet fajlova na tri. Sva tri su se i dalje servirala, a index ih nije referencirao.
2. Napomena u `routes/web.php` da su te rute **fallback**, a ne ono što sajt servira, i da
   nakon izmjene kontrolera treba pokrenuti `sitemap:generate`.
3. `/public/sitemap*.xml` u `.gitignore` — bili su neignorisani, pa bi `git add -A` unio 8 MB
   XML-a u repo, a zastarjela kopija bi se deployala preko svježe.

**Za deploy:** nakon svake izmjene `SitemapController`, obavezno `php artisan sitemap:generate`.

**Nastavak istog dana:** čim je pruning obrisao `sitemap-games-4/5.xml`, ruta ih je počela
servirati kao **prazan `<urlset></urlset>` sa statusom 200** — jer `games()` nije provjeravao
opseg. Crawler koji drži stari URL bio bi obaviješten, statusom 200, da je i dalje važeći.
Sada `games()` vraća **404** za stranu izvan kataloga. To je i dobar primjer kako popravka
otkrije sljedeći sloj: statični fajlovi su godinu dana skrivali da ruta nema provjeru.

---

## Audit 2026-08-17, drugi dio — zašto katalog nije bio prohodan

Tri sloja, jedan iznad drugog. Svaki je sam za sebe zatvarao katalog za pretraživače, pa
popravka bilo kojeg jednog ne bi ništa promijenila.

### Sloj 1 — pet API poziva po stranici igre

Stranica je dohvaćala igru, njene screenshotove, serijal, prijedloge i povezane članke
zasebno, a `generateMetadata` je igru dohvaćala šesti put. API mjeri **60 zahtjeva u minuti
po IP-u** pozivaoca, a svaki serverski render izlazi s jedne adrese — dakle **dvanaest
pregleda igara u minuti** iscrpi budžet, a trinaesti dobije 429 koji render pretvori u 500.

Izmjereno prije: 5 od 12 stranica palo pri 15 zahtjeva u minuti, 63 od 75 punom brzinom.

Novi endpoint `GET /games/{slug}/bundle` vraća svih pet dijelova odjednom. Četiri
samostalna endpointa ostaju — imaju druge pozivaoce, a jedan od njih personalizuje za
prijavljenog čitaoca, što bundle namjerno **ne** radi da bi mogao biti keširan i dijeljen.

Čuva `tests/Feature/GameBundleTest.php` (5 testova: oblik odgovora, poklapanje s pojedinačnim
endpointom, 404 se ne umotava u uspjeh, prazni nizovi umjesto `null`, keširajuće zaglavlje).

**Poslije: 0 padova od 75.**

### Sloj 2 — `INTERNAL_API_TOKEN` koji se nije poklapao

Izuzeće od limita za vlastiti SSR proces postoji u `AppServiceProvider::bootApiRateLimiter()`
i radi. Nije radilo zato što je **`frontend/.env.local` nosio drugi token od backenda**, a
Next `.env.local` čita s **višim prioritetom** od `.env` — koji se, ironično, poklapao.

Kako je otkriveno: build je ispisivao `[seo] page-seo for "/news" answered 429` za svaku od
44 stranice. To logovanje je dodano isti dan upravo zato što je tiha zamjena bazom pisanog
SEO-a kodnim fallbackom nevidljiva — stranica se i dalje renderuje i i dalje ima naslov.

Popravljeno: token rotiran, **jedno mjesto po aplikaciji**, `INTERNAL_API_TOKEN` uklonjen iz
`.env.local`. Provjera: 70 uzastopnih poziva s tokenom → 70×200.

**Posljedica koja je čekala od 17. 08.:** tek sada svih 44 `page_seo` zapisa stvarno izlaze u
HTML. Prvo ih je blokirao Cloudflare 403 na serverskoj strani (`lib/seo.ts` je zvao javni
hostname), a onda ovaj token. Provjereno na deset stranica — sve nose naslov iz baze.

Devet stranica **nema** zapis u bazi pa idu na kod: `/giveaways`, `/roadmap`, `/latest` i šest
`/gta6*`. Nije greška, ali su bez uređenog naslova i opisa.

### Sloj 3 — `/games/*` se nije keširao nigdje

`/games/[slug]` je `export const dynamic = "force-dynamic"` **namjerno**: 114.000 slugova kao
ISR fajlovi je broj fajlova koji niko ne želi održavati, i komentar u tom fajlu to kaže —
*"Cloudflare CDN caches page responses; Next.js writes nothing to disk."*

Napravljena je samo prva polovina. `force-dynamic` tjera Next da šalje
`Cache-Control: private, no-cache, no-store`, Cloudflare ga je poslušao, i svaka od tih
stranica renderovala se iznova na svaki zahtjev. Izmjereno: `cf-cache-status: BYPASS`.

Riješeno **na originu, u nginxu** (`deployment/nginx-games-cache.conf`) — radi bez obzira na
to je li rub ikad podešen, i vidi se u `nginx -T` umjesto da živi u tuđem dashboardu.
Ograničeno tamo gdje ISR nije: 4 GB s LRU izbacivanjem, mjereno ~27 KB po keširanoj stranici
(gzip), dakle oko **150.000 unosa — cijeli katalog**.

Sigurno za dijeljenje među posjetiocima jer prijava ovdje živi u `localStorage`: server nikad
ne zna ko pita, pa je svaki odgovor već anoniman. Provjereno — nema `Set-Cookie` ni na jednoj
`/games/` stranici; skriva se svejedno.

RSC navigacija nije pogođena: Next 16 preusmjerava klijentske navigacije na `?_rsc=<hash>`,
pa je varijanta dio URL-a i ne može se sudariti s HTML unosom.

| | prije | poslije |
|---|---|---|
| 75 stranica iz sitemapa | 8181 ms, 0/75 HIT | **3876 ms, 75/75 HIT** |
| 40 stranica, hladno → toplo | — | 3917 ms → 2001 ms |

**Nuspojava koju je trebalo pokriti:** čim postoji prefiks lokacija `^~ /games/`, nginx
odgovara na `/games` sa 301 na `/games/`. Riješeno tačnim podudaranjem `location = /games`,
koje ima prednost nad prefiksom.

**Deploy:** `deploy_frontend.sh` sada prazni taj keš nakon provjere spremnosti. Bez toga
deploy ne stiže ni do koga sat vremena — a arhiva chunkova znači da stari HTML i dalje
*radi*, što je gore od pucanja: ništa ne javi da se novi build ne servira.

### Cloudflare — pročitano kroz API, pa popravljeno

Zatečeno i riješeno istog dana:

| Nalaz | Riješeno kako |
|---|---|
| **Rate limit "Games scraper protection"** blokirao je >50 zahtjeva/10 s na `/games/*` **bez izuzeća za pretraživače**. Googlebot na 114.000 stranica ide brže od toga — pravilo je blokiralo indeksiranje kataloga. | izraz sada `... and not cf.client.bot`; to polje je istinito samo za crawlere koje Cloudflare sam verificira, pa scraper ništa ne dobija |
| Četiri cache pravila (`Home`, `News`, `Navigation`, `Settings` API) imala su `"cache": true` uz `edge_ttl: bypass_by_default` — **kontradikcija koja ne kešira ništa** | obrisana; sedam pravila svedeno na četiri |
| HTML nigdje nije bio proglašen keširanim, pa je i savršeno dobar `s-maxage=300` bio ignorisan | pravilo **HTML edge cache**, namjerno `respect_origin` — Next sam kaže šta koliko vrijedi, a stranice koje se ne smiju keširati šalju `no-store` i ostaju vani |
| `/games/*` slao `no-store` (force-dynamic), pa ga je rub poslušao | pravilo **Cache game pages**, jedino s `override_origin` (1 h) |
| `min_tls_version: 1.0` (povučen 2021.) | 1.2 |
| `always_use_https: off` | uključeno |
| `browser_cache_ttl: 14400` | poštuje zaglavlja |

Izmjereno poslije, kroz javni hostname:

| URL | prvi | drugi | treći |
|---|---|---|---|
| `/games/doom` | MISS | **HIT** | **HIT** |
| `/news` | MISS | **HIT** | **HIT** |
| `/` | MISS | **HIT** | **HIT** |
| `/games` | MISS | **HIT** | **HIT** |

Privatne putanje provjerene dvaput svaka — `/login`, `/register`, `/settings`, `/messages`,
`/friends`, `/cart`, `/shop/checkout`, `/profile/*`, `/forum/create`, `/api/revalidate` — sve
ostaju `DYNAMIC`, dakle nekeširane. TLS 1.0 se odbija, TLS 1.2 prolazi, `http://` i dalje
301 na HTTPS, sweep od 26 ruta bez ijednog pada.

**Napomena o slojevima:** `/games/*` je sada keširan **dvaput** — nginx na originu i
Cloudflare na rubu. To nije višak: nginx štiti origin i radi bez obzira na rub, rub štiti
mrežu i radi bez obzira na origin. Ali znači i da izmijenjena igra može biti zastarjela do
dva sata (1 h nginx + 1 h rub). Ako to postane problem, čisti se oboje —
`find /var/cache/nginx/techplay -type f -delete` i purge na Cloudflareu.

Skripta koja je sve primijenila, uz backup zatečenih pravila u JSON: `cf_apply.py`
(scratchpad sesije). Detalji u `deployment/cloudflare-cache-rules.md`.
