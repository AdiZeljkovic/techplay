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

---

## Sadržajne ispravke, 2026-08-17

Četiri stavke koje su ostale otvorene iz prethodnih sekcija, redom.

### Članak datiran tri mjeseca unaprijed

Članak #119 (`what-does-valves-new-console-mean-for-the-market`) nosio je
`published_at = 2026-11-14`, a nastao je u siječnju i zadnji put uređen **7. 8. 2026.**

Nije bio zakazan. Zakazivanje ovdje ide preko `status = 'scheduled'`, koji komanda
`articles:publish-scheduled` prebacuje u `published` kad dođe vrijeme — pa je `published` s
datumom unaprijed uvijek greška u podacima, nikad plan. Posljedica je bila trostruka:

1. **News sitemap** je uzimao `published_at >= now()-48h` **bez gornje granice**, a "kasnije
   od prije 48 sati" je trajno istinito za budući datum. Članak je zato bio jedini i stalni
   stanovnik feeda od kolovoza nadalje. Google News odbija budući datum objave i odbija feed
   koji ga nosi — dakle **cijeli news feed je bio nevažeći koliko god je taj red postojao**.
2. Članak je bio **dostupan direktno**, ali ga **nije bilo ni na jednoj listi** — liste
   filtriraju `published_at <= now()`, detaljna ruta ne.
3. Datum objave vidljiv čitaocu bio je neistinit.

**Popravljeno:** prozor je sada omeđen s obje strane (`whereBetween`), i indeks više ne
oglašava feed koji je samo budući datum držao otvorenim. Dva testa u
`SitemapAndRobotsTest`. Datum članka vraćen na `updated_at` — jedinu činjenicu koju baza
nosi; pogađati koji je mjesec trebao biti nije popravka. Članak je sada na listi `/news`,
sedmi po redu.

**Provjereno poslije:** nijedan članak ni vodič više nije datiran u budućnost.
`sitemap-news.xml` sadrži samo `/news` i **više nije u indeksu** — ispravno, jer u zadnja
48 sata nema objava.

### "1.000.000+ igara" — 34 stranice, ne pet

`seo:fix-game-counts` je hvatao `1M+`, `one million` i `over a million`, ali **ne i oblik s
razdjelnicima**: `1,000,000`. Ispisan brojevima, ne liči na skraćenicu za koju su obrasci
pisani. Ostalo je stajati na `/impressum` ("our 1,000,000+ game database"), na `/marketing`
("data on over 1,000,000 titles" — stranica na kojoj se tvrdnja iznosi nekome od koga se
traži novac), i na `/hardware/*`, `/forum/*`, `/reviews/*`, `/cookies`, `/register`.

**Popravljeno: 34 stranice.** Katalog drži 142.110; upisano je "140.000+", zaokruženo
nadolje na deset tisuća da rečenica ostane istinita kako katalog raste. Provjereno poslije:
riječ "million" ne postoji ni u jednom polju nijednog `page_seo` zapisa.

### Tvrdnje o publici

`seo:fix-game-counts` ih je namjerno samo **prijavljivao**, uz obrazloženje da regex ne
treba odlučivati kakva je publika. To je vrijedilo dok neko ne odluči. Nova komanda
`seo:fix-audience-claims` je ta odluka, ispisana:

| Stranica | Bilo | Sada |
|---|---|---|
| `/marketing` | "reach millions of gaming enthusiasts" | "reach an audience that arrives for the hardware numbers and stays for the catalogue" |
| `/marketing` | "a highly engaged, tech-savvy audience of millions worldwide" | "a highly engaged, technical audience" |
| `/impressum` | "a trusted environment for our millions of readers worldwide" | "a trusted environment for our readers" |
| `/terms` | "a trusted advisor for millions of enthusiasts worldwide" | "a reference for people who take games and hardware seriously" |

Zamjene **ne ubacuju manji broj**. Stvaran broj zastari za mjesec dana i vraća isti problem;
publika se opisuje po tome kakva jest, a ne koliko je ima. Za oglašivača je to i korisnije —
"angažirana i tehnička" prodaje bolje od brojke koju kupac provjeri u alatu za procjenu
prometa i ne povjeruje joj.

Svaka zamjena je ispisana doslovno, a komanda odbija upis kad ne nađe tačno očekivani tekst
— ručna izmjena u admin panelu se nikad tiho ne pregazi.

### "Devet stranica bez SEO zapisa" — nalaz je bio pogrešan

Provjera je pokazala nešto drugo. Šest GTA6 stranica, `/roadmap` i `/latest` imaju u kodu
**bolje naslove i opise nego što bi im se upisalo u bazu** ("GTA 6 Interactive Map — 1,000+
Locations in Vice City & Leonida"). Nedostatak zapisa im nije problem.

Pravi problem je bio drugdje, i šira klasa: **pet stranica je izgovaralo brend dvaput.**

| | Bilo | Sada |
|---|---|---|
| `/giveaways` | Giveaways - TechPlay \| TechPlay | Giveaways \| TechPlay |
| `/calendar` | Game Release Calendar - TechPlay \| TechPlay | Game Release Calendar \| TechPlay |
| `/shop` | Shop - TechPlay \| Gaming Merchandise & Gear \| TechPlay | Shop — Gaming Merchandise & Gear \| TechPlay |
| `/wow-analyzer` | … Gear Check \| TechPlay \| TechPlay | … Gear Check \| TechPlay |
| `/media-kit` | Advertise on TechPlay \| … 2026 \| TechPlay | Advertise on TechPlay — Media Kit 2026 |

Ista greška kao `/news` ranije, ali s druge strane: tamo je **fallback** bio brend, ovdje ga
je **default već sadržavao**. `/media-kit` je riješen suprotno od ostalih — tamo brend
zaslužuje mjesto u rečenici, pa je naslov označen apsolutnim i sufiks otpada.

### Ostaje na odluku vlasnika

`/media-kit` iznosi četiri konkretne brojke oglašivačima: **"20K+ engaged gamers"**,
**"CPM from $1.00"**, **"62% desktop traffic"**, **"12.4% monthly growth"**. Nijedna se ne
može potkrijepiti iz baze. Ono što baza nosi:

| | |
|---|---|
| registrovanih korisnika | 51 |
| aktivnih zadnjih 30 dana | 2 |
| objavljenih članaka | 619 |
| ukupno pregleda članaka (od početka) | 129.931 |

Brojke o prometu možda postoje u Google Analyticsu, koji odavde nije vidljiv — zato ovo nije
dirano. Ali dok se ne potvrde, to su tvrdnje prema kupcima. Standard u industriji za medijski
kit ove veličine je ne objaviti brojku koju ne možeš braniti, nego "trenutne brojke na
upit".

---

## Kategorijske stranice čitaju tekst koji im je napisan (28.08.2026)

Sedamnaest kategorijskih stranica imalo je ručno pisan SEO u `page_seo` i
predstavljalo se šablonom. `/reviews/indie-gems` u bazi drži *"Indie Game
Reviews 2026 | Best Hidden Gems & Indie Hits"*, a servirao je *"Browsing Indie
Gems reviews."* — grana je gradila naslov i opis iz sluga i nikad nije pitala
bazu.

News, reviews, hardware i forum grane sada idu kroz `generatePageMetadata`, kao
i svaka druga stranica, pa uz tekst dobijaju canonical, og:image i admin
prekidač za noindex. Generisani stringovi ostaju kao rezerva za kategoriju bez
reda.

**Zašto niko nije primijetio:** postojale su dvije SEO forme za istu stranicu.
Urednik kategorije pisao je u pet kolona na `categories` koje niko ne čita.
Detalji i šta je s njima urađeno: `docs/07-database-map.md`.

**`CategorySeoSeeder` je bio živa opasnost.** Sam je gradio putanje i pogriješio
u tri od četiri tipa — `/news/category/news-gaming` i `/reviews/category/...`
nisu adrese na ovom sajtu, a tech je slijetao na `/hardware/tech-benchmarks`
gdje se stranica servira na `/hardware/benchmarks`. Tip koji je pogodio bio je
forum, i tu je generisani naslov bezuslovno prosljeđivao u `updateOrCreate`:
jedan `db:seed` zamijenio bi *"Console & Peripheral Forums | PS5, Xbox, Switch
Discussion"* sa *"Consoles Community Forum"*. Sada uzima putanju iz
`Category::seoPagePath()` i nikad ne dira red koji postoji.

## og:image nosi svoje dimenzije (28.08.2026)

`og:image` je izlazio sam. Skraper koji ne zna oblik mora skinuti fajl prije
nego rasporedi karticu, a dio njih u međuvremenu pretpostavi kvadrat — što sliku
omjera 1.78:1 obrezuje po sredini. Backend sada mjeri i sliku po stranici i
podrazumijevanu (`SettingsController`, kroz postojeći `ImageDimensionService`),
pa par putuje uz URL. 42 od 44 reda nose svoju `og_image`, dakle to je pravilo
a ne izuzetak.

Dimenzije se mjere pri čitanju, ne čuvaju u koloni: jedna podrazumijevana slika
i 44 reda, sve iza postojećeg jednosatnog keša koji oba observera već čiste.
Članci i vodiči su dobili kolone jer ih ima 632 i imaju batch posao za punjenje;
45 mjerenja unutar keša nema.

**Otvoreno:** podrazumijevana slika je 965×541 (1.78:1), a kartice traže
1200×630 (1.91:1). Prijedlog obrezan i uvećan je pripremljen; čeka odluku jer je
to izmjena brend grafike.

## `/tools` i povezivanje studija (28.08.2026)

**`/tools` je vraćao 404**, a zaglavlje je od početka nudilo „All Tools" koji je
vodio na `/wow-analyzer` — jedan od pet alata, ne na spisak. Lista je postojala
samo unutar tog padajućeg menija. Sada je u `frontend/lib/tools.ts`, koju čitaju
i meni i nova stranica, pa alat ne može biti u meniju a da fali na stranici.
Schema: `ItemList` s imenovanih pet, ne `CollectionPage` (koji bi rekao „ova
stranica nešto skuplja" ne rekavši šta).

**Zasluge na stranici igre nisu vodile nigdje.** `publisher` i `developer` u
`VideoGame` schemi bili su goli `{ "@type": "Organization", name }` — „Rockstar
Games" na ovoj stranici i „Rockstar Games" na ostalih 47 bili su, koliko
pretraživač vidi, nepovezani nizovi. Vidljive zasluge **već** vode na
`/studios/{slug}` kad imamo red za kompaniju; sada i oznake govore isto: `@id`
po kojem se spaja i URL na kojem živi. Studio stranica emituje isti `@id` plus
`mainEntityOfPage`.

Imena bez reda o studiju ostaju u goloj formi — pokrivaju igre koje nikad nisu
spojene s IGDB-om, a izmišljen URL bi bio gori od nikakvog.

**`sameAs` nije dodan.** Ne držimo nijedan provjeren vanjski identifikator
(Wikipedia, Wikidata) za ove studije, a `sameAs` s pogođenim adresama je gora
tvrdnja nego izostavljen `sameAs`.

## Oznake na alatima i kartica za studije (28.08.2026)

**Backlog Advisor, Game Lists i The Last Disc nisu imali nijedan `ld+json`
blok.** Sada:

| Stranica | Tip |
|---|---|
| `/backlog-advisor` | `WebApplication` — isti tip koji `/wow-analyzer` već nosi, ne novi rječnik za istu vrstu stvari |
| `/lists` | `CollectionPage` + `ItemList` s **imenovanim** listama koje su na stranici |
| `/last-disc` | `WebPage` čiji je `mainEntity` pismo |
| `/last-disc/letter` | `Article`, spojen s prethodnim preko `@id` |

Na `/lists` ulaze samo liste čiji je autor stigao u odgovoru — adresa je
`/lists/{username}/{slug}`, pa lista bez autora nema gdje da pokaže.
`numberOfItems` broji ono što je zaista nabrojano, ne ono što je API vratio.

Na Last Disc **nema broja potpisa**: `interactionStatistic` bi bio tačan a
tačan broj je trenutno nula. Nema ni `datePublished` — pismo u svom tekstu ne
nosi datum, a izmišljen datum je tvrdnja koju ništa ne podupire. Autor je
zajednica, ne potpis osobe koja ne postoji.

## `/og/studio` — i greška koju je otkrio tek pogled na sliku

Stranica studija slala je društvenim mrežama `studio.logo_url`: `t_logo_med`
PNG na IGDB-ovom CDN-u, obično proziran natpis od par stotina piksela. Mreže ga
smjeste na svoju pozadinu, pa je 31.970 stranica objavljivano kao mali lebdeći
logo. Nova kartica crta ime, godinu i zemlju osnivanja, broj igara i pet omota
na 1200×630.

**`ImageResponse` ne ume da nacrta WebP.** Satori dekodira PNG, JPEG i SVG.
WebP uđe, a izađe uokviren prazan pravougaonik — okvir se nacrta, slika nikad ne
stigne. To nije rub slučaja: **129.911 od 313.776 omota u katalogu je WebP
(41%)**, jer MobyGames ne servira ništa drugo; njegov CDN prihvati `.jpg` na
istoj adresi i i dalje odgovori `image/webp`, pa nema ekstenzije za prepisati.

`/og/list` i `/og/profile` imali su istu rupu **otkad postoje**. Filter sada
ide **prije** rezanja (`lib/ogCovers.ts`), pa studio s 48 igara uzme prvih pet
*iscrtivih* umjesto prvih pet pa se nada.

**Kako je nađeno:** status je bio 200, veličina 687 KB, dimenzije tačne. Greška
se vidjela tek kad je slika otvorena.
