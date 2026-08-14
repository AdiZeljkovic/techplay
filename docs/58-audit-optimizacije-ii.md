# Audit optimizacije II — 14.08.2026.

Ono što prethodni prolaz nije dirao: JS bundle, Core Web Vitals mjereni pravim
observerom, keširanje na tri sloja, i baza pod skupim upitima.

---

## 1. Popravljeno: baza igara se re-renderovala na svaki posjet

`/games` je bio jedina stranica na sajtu koja je odgovarala sa
`private, no-cache, no-store, max-age=0, must-revalidate` — dok svaka druga
servira ISR pogodak. Uzrok je bio `export const dynamic = 'force-dynamic'` uz
komentar *"filters live in URL search params"*.

Ali `GameDatabaseHub` je **klijentska** komponenta: parametre čita u browseru
i podatke vuče SWR-om. Serverski render je identičan za svakog posjetioca i za
svaki filter, pa je `force-dynamic` kupovao ništa a koštao stranicu keša — i to
jednu od najvećih SEO površina na sajtu.

Sad je `revalidate = 3600`. U buildu je prešla iz `ƒ` (render po zahtjevu) u
`○` (prerenderovana). Provjereno: `x-nextjs-cache: HIT`,
`s-maxage=3600`, a filtrirani URL `/games?genres=Action` i dalje daje 33
kartice i "58.505 found", bez ijedne konzolne greške.

---

## 2. Najveći preostali dobitak nije u kodu

**Cloudflare ne kešira nijednu HTML stranicu.** Sve odreda vraćaju
`cf-cache-status: DYNAMIC`, iako Next šalje `s-maxage` i
`stale-while-revalidate`:

| Stranica | Cache-Control koji Next šalje | Cloudflare |
|---|---|---|
| `/` | `s-maxage=60, swr=31535940` | DYNAMIC |
| `/latest`, `/news` | `s-maxage=300` | DYNAMIC |
| `/calendar`, `/forum` | `s-maxage=3600` | DYNAMIC |

Cloudflare po defaultu ne kešira HTML — treba **Cache Rule** u dashboardu.
Trenutno svaki posjet putuje do origin servera iako je odgovor već spreman i
označen kao keširajući. To je promjena u panelu, ne u kodu.

Sitnica iz istog sloja: `/images/page-hero.webp` ide s `max-age=14400`, a to
je fajl iz `public/` koji se ne mijenja — može `immutable` kao i JS chunkovi.

---

## 3. Šta je zdravo (izmjereno)

### Baza i API

Skupi oblici upita, uživo:

| Upit | ms |
|---|---:|
| `games?per_page=20` | 261 |
| `games` + žanr | 319 |
| `games` + žanr + platforma + sort | 428 |
| `games?search=witcher` | 138 |
| `games?page=3000` (od 141.580) | 290 |
| `forum/search?q=game` | 137 |

Indeksi su temeljito postavljeni: GIN na `genre_names` / `platform_names` /
`tag_names`, trigram na `name`, fulltext na forum i članke, plus indeksi na
strane ključeve. Rade.

### JavaScript

Ukupno 4,5 MB chunkova, ali **teški paketi nisu u zajedničkom bundlu**:

- `pusher-js` (6,8 MB instaliran) i `laravel-echo` — učitavaju se na zahtjev
  iz `AuthContext`, i vezani su za `/social`
- `leaflet` (3,9 MB) — `Gta6LeafletMap` ide kroz `dynamic()`
- `recharts` (7,9 MB) — samo `/media-kit`

Ostaje `framer-motion`, statički u 25 fajlova uključujući Header, dakle u
zajedničkom bundlu. To je cijena animacija koje sajt stvarno koristi
(drawer, sheet, prelazi) i ne predlažem da se dira.

### Core Web Vitals

CLS **0,000** na sedam od osam mjerenih stranica. Statika ide s
`max-age=31536000, immutable` i Cloudflare je servira kao HIT.

---

## 4. Dva nalaza koja nisu preživjela provjeru

1. **`/calendar` CLS = 0,619.** Izmjereno jednom, pa **tri puta ponovljeno i
   svaki put 0,000**. Bio je hladan keš, ne struktura. Nije prijavljeno kao
   kvar jer se ne reprodukuje.
2. **"791 slika bez rezervisanog prostora."** Provjera je gledala samo `width`
   / `height` na samom `<img>`, a te slike sjede u kontejnerima fiksne visine
   koji prostor **jesu** rezervisali. Izmjereni CLS to i potvrđuje.

---

## 5. Za ponovno mjerenje poslije deploya

LCP na produkciji je bio **7,0 s na naslovnici i 14,0 s na `/latest`** — ali
mjereno **prije** nego je popravka slika iz prethodnog prolaza puštena, kad je
`/latest` bio 7,4 MB. Poslije deploya to treba izmjeriti ponovo; očekivanje je
da padne s težinom, ali dok se ne izmjeri, to je očekivanje a ne nalaz.
