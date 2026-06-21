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
