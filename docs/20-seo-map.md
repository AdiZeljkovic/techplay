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

1. **Katalog se ne može puzati.** Stranica igre pravi **5 API poziva**, limit je 60/min po IP-u → greške iznad ~12 pregleda u minuti. Izmjereno: 5/12 padova na 15 zahtjeva u minuti nakon pauze; 63/75 punom brzinom. Izuzeće za `X-Internal-Token` postoji u kodu ali očito ne stiže iz deployanog frontenda.
2. **HTML se ne kešira na rubu** — `cf-cache-status: DYNAMIC`/`BYPASS`. Svaki dolazak ide do origina i tamo se pomnoži s pet.
3. **11 GTA6 likova vraća 404** na produkciji a rade lokalno — deployani build je stariji.
4. `/news` i `/reviews` imaju `<title>TechPlay | TechPlay</title>`; `og:image` fali na svim hub stranicama; `/calendar` i `/leaderboard` bez canonicala; `/games` i `/forum` bez `<h1>`.
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
