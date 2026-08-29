# 12 — Content System Map

## Tipovi sadržaja

| Tip | Model | Tabela | Admin Resource | Frontend |
|-----|-------|--------|----------------|---------|
| News | Article | `articles` | NewsResource | `/news` |
| Review | Review | `reviews` | ReviewResource | `/reviews` |
| Guide | Guide | `guides` | GuideResource | `/guides` |
| Tech/Hardware | Article | `articles` | TechResource | `/hardware` |
| Video | Video | `videos` | VideoResource | `/videos` |
| Forum Thread | Thread | `threads` | SimpleThreadResource | `/forum` |
| Forum Post | Post | `posts` | PostResource | `/forum` |

**Napomena:** News i Tech/Hardware koriste isti `Article` model i `articles` tabelu. Razlikuju se po kategoriji (`category_id`) ili vjerovatno po nekim atributima.

---

## Article model (news + tech/hardware)

**Ključna polja:**
- `title` — naslov
- `slug` — URL slug (auto-gen)
- `content` — HTML sadržaj (rich editor)
- `category_id` — veza na Category
- `author_id` (user_id) — autor
- `game_id` — (nullable) vezana igra (noviji FK)
- `is_hero` — featured/hero članak
- `views` — broj pregleda
- `published_at` — datum objave
- SEO polja: `meta_title`, `meta_description`, `og_image`, `og_title`, `og_description`
- `tags` — array tagova

**Status publish:**
- `published_at`: null = draft, timestamp = published, budući timestamp = scheduled

---

## Kategorije (`categories` tabela)

- Svaki content tip ima vlastite kategorije (`type` kolona)
- Kategorije mogu biti hijerarhijske (`parent_id`)
- Forum kategorije su zasebne od news/guide kategorija
- `CategoryResource` u Filament upravljanju

---

## Tagovi

- `articles` tabela ima `tags` kolonu (vjerovatno JSON array ili TEXT[])
- Frontend može filtrirati po tagovima
- UNKNOWN: da li se tagovi indeksiraju zasebno

---

## Autori

- Svaki Article/Review/Guide/Video vezan za `User` model (autor)
- Admin dodaje sadržaj — autor može biti admin user
- UNKNOWN: da li postoje "author profiles" odvojene od korisničkih profila

---

## Slike i media

- Slike se uploaduju kroz Filament admin
- `MediaService` / `ImageService` valida i sprema
- Storage: `backend/storage/` ili S3 (UNKNOWN produkcijska konfiguracija)
- URL pristup: `NEXT_PUBLIC_STORAGE_URL` prefiks
- `Media` model prati sve uploadove
- `images: { unoptimized: true }` na frontendu — Next.js ne optimizira
- Server-side optimizacija ide kroz `ImageOptimizer` (GD), koji zovu dvije ručne komande. `ImageOptimizationService` je **obrisan 29.08.2026** — nije radio od januara; Next konvertuje uploade u WebP pri serviranju.

---

## SEO polja po tipu sadržaja

| Polje | News | Review | Guide | Video | Game |
|-------|------|--------|-------|-------|------|
| meta_title | ✓ | ✓ | ✓ | ✓ | ✓ |
| meta_description | ✓ | ✓ | ✓ | ✓ | ✓ |
| og_image | ✓ | ✓ | ✓ | ✓ | ? |
| canonical | ✓ | ✓ | ✓ | ✓ | ✓ |
| JSON-LD Article | ✓ | - | ✓ | - | - |
| JSON-LD Review | - | ✓ | - | - | - |
| JSON-LD Game | - | - | - | - | ✓ |

---

## Publishing flow

```
Admin → Filament Resource Form → Save
  ↓
Model::create() ili update()
  ↓
Observer::created/updated (npr. ArticleObserver)
  ↓
CacheRevalidationService::revalidate*()
  ↓
POST → Next.js /api/revalidate?secret=TOKEN&path=/news/{slug}
  ↓
ISR cache invalidated za konkretnu stranicu
  ↓
IndexNowService → PingIndexNow job (Bing/Yandex)
  ↓
Broadcast event (ArticlePublished, ReviewPublished, itd.)
  ↓
Laravel Reverb → WebSocket → Frontend real-time update
```

---

## Scheduled publish

- `published_at` može biti budući timestamp
- `PublishScheduledArticles` artisan komanda provjera i publisha
- Komanda vjerovatno schedulovana kao cron job

---

## Homepage content logika

- `HomeController::index` aggrgira featured sadržaj
- `is_hero` flag na Article modelu markira hero sadržaj
- Trending news: `GET /news/trending` (vjerovatno po views)
- Latest reviews, guides, itd. — sortiranjem po `published_at DESC`

---

## Kako frontend prikazuje sadržaj

**News listing** (`/news`):
1. Server Component → GET `/news?page=1&category=slug`
2. ISR cache (revalidate: ~60s ili po observer triggeru)
3. Lista kartica (NewsCard komponenta)
4. Kategorija filter, paginacija

**Article detail** (`/news/[slug]`):
1. Server Component → GET `/news/{slug}`
2. ISR (revalidate: ~300s ili na update)
3. `ArticleBody` komponenta renderuje HTML
4. `components/tracking/` prati view
6. Comments sekcija (client-side, real-time)

---

## Content versioning

- `ContentVersion` model i `content_versions` tabela postoji
- `ArticleVersionObserver` postoji
- Detalji implementacije UNKNOWN — vjerovatno čuva historiju izmjena
