# SEO: je li admin spojen s onim što front radi

*Revizija 18.08.2026. Sve provjereno na produkciji — svaki nalaz je izmjeren
pozivom, ne pročitan iz koda.*

Pitanje je bilo: nakon SEO rada na frontu, jesu li te stvari prepisane u admin,
je li sve povezano, radi li svaki dio, i ima li nečega bespotrebnog.

Kratak odgovor: **kičma radi, četiri stvari ne stižu nigdje, a dvije su živi
kvarovi na sajtu.**

---

## Šta radi — provjereno od baze do iscrtane stranice

| Put | Stanje |
|---|---|
| `page_seo.meta_title` → `/api/v1/page-seo/{put}` → `<title>` | **radi** — `/about` u bazi i na stranici je isti tekst |
| `page_seo.meta_description`, `og_title`, `og_description`, `og_image` | radi |
| `page_seo.canonical_url` → `<link rel=canonical>` | radi, uz fallback na `APP_URL + path` |
| Članak: `meta_title`, `meta_description`, `canonical_url`, `is_noindex` | radi — sve četiri se čitaju na stranicama članaka |
| `site_settings` → `/api/v1/settings` → naslov, opis, OG slika, Twitter kartica | radi |
| Čišćenje keša na snimanje | radi — `SiteSettingObserver` i `PageSeoObserver` brišu prave ključeve |
| `robots.txt`, `sitemap.xml`, sitemap članaka i igara | svi 200, sitemap igara 8,3 MB |

To je više nego što sam očekivao. Ono ispod nije.

---

## Kvar 1 — svaka stranica sajta objavljuje `keywords="[]"`

```html
<meta name="keywords" content="[]"/>
```

Kolona `page_seo.meta_keywords` drži **JSON niz**, a `lib/seo.ts` je tretira kao
tekst razdvojen zarezima:

```ts
const keywords = pageSeo?.meta_keywords?.split(',').map(k => k.trim())
```

Od 44 reda, **42 sadrže doslovno `[]`**, a dva imaju prave nizove
(`["gaming news 2026","video game headlines",…]`) koji bi se kroz `split(',')`
izlomili po zarezima unutar JSON-a, zajedno s navodnicima.

Meta keywords Google ionako ignoriše, pa je šteta za rangiranje nikakva — ali
svaka stranica sajta nosi vidljivo pogrešan tag, i to je prvo što izbaci svaki
audit alat.

**Uz to: admin nema polje za `meta_keywords`.** Ne može se ni popraviti kroz
panel.

## Kvar 2 — 44 SEO teksta koje niko ne prikazuje

Svih 44 redova ima popunjen `seo_text`, i to pravim HTML-om:

```html
<h2>Behind the Screen: The Visionaries of TechPlay</h2><p>At <strong>…
```

`lib/seo.ts` ima funkciju koja ga vraća:

```ts
export async function getPageSeoText(path: string): Promise<string | null>
```

**Nijedan fajl je ne zove.** Napisan je SEO tekst za 44 stranice i nijedna ga ne
iscrtava. I ovdje: **admin nema polje za `seo_text`.**

## Kvar 3 — prekidač „ne indeksiraj" ne radi ništa

`page_seo.is_noindex` postoji u bazi, postoji u admin obrascu, i uključen je na
dvije stranice.

`lib/seo.ts` **ne emituje nijednu robots direktivu.** Ni `robots`, ni `index`,
ni `noindex` — funkcija koja gradi metapodatke tu granu nema uopšte. Dvije
stranice označene kao skrivene su indeksirane.

*(Članci su druga priča — tamo `is_noindex` radi, jer stranica članka sama gradi
`robots` blok.)*

## Kvar 4 — nijedna od 21 redirekcije nije primijenjena

`next.config.ts` čita redirekcije u vrijeme builda:

```ts
const res = await fetch(`${backendBase}/redirects`, …);
if (!res.ok) return [];
```

`backendBase` je `NEXT_PUBLIC_API_URL`, dakle **javno ime** `api-beta.techplay.gg`.
Zahtjev sa servera na vlastito javno ime prolazi kroz Cloudflare, koji odgovara:

```
HTTP 403 — <title>Just a moment...</title>
```

`!res.ok` → `return []` → **nula redirekcija u svakom buildu.** Provjereno u
`routes-manifest.json`: jedina redirekcija tamo je Nextova vlastita normalizacija
kose crte.

Ista zamka je u ovoj sesiji uhvaćena **četiri puta** na različitim mjestima. Lijek
je isti: sa servera se zove `127.0.0.1` s `Host` headerom, nikad javno ime.

## Kvar 5 — meki 404 na četiri sekcije

| Putanja | Nepostojeći slug vraća |
|---|---|
| `/news/…` | **200** („Article Not Found") |
| `/reviews/…` | **200** |
| `/guides/…` | **200** |
| `/hardware/…` | **200** |
| `/games/…` | 404 — ispravno |

API ispravno vraća 404, `fetchContent` ispravno vraća `null`, stranica ispravno
zove `notFound()` — i odgovor je svejedno 200. Igre su jedine koje to rade kako
treba, jer je taj put popravljan zasebno.

Posljedica: pretraživač može indeksirati beskonačno izmišljenih URL-ova, i
svaki mu izgleda kao ispravna stranica.

---

## Bespotrebno

| Šta | Zašto |
|---|---|
| Tab **Indexing** u Settings — 6 prekidača | ništa ih ne čita; `lib/seo.ts` nema robots izlaz uopšte |
| 12 polja **Organization** | `SchemaService` tvrdo kodira `'name' => 'TechPlay'` i ne čita nijedno |
| `seo_noindex_archive` (jednina) | duplikat `seo_noindex_archives`, s drugom vrijednošću |
| 5 polja `seo_social_*` (handle-ovi) | front čita `socials.*_url`, ne handle-ove |
| `Cache::forget('site_settings.all')` u Settings stranici | ključ koji niko ne piše — moj propust |

**Nije bespotreban** SEO Manager, iako mu model jeste `Article` kao i kod
News/Reviews/Tech. To je radna lista — „koji članci nemaju meta opis" — i takva
lista ima smisla. Samo joj se iz sidebara ne vidi da gleda iste redove.

---

## Redoslijed popravki

| # | Šta | Gdje | Rizik |
|---|---|---|---|
| 1 | Redirekcije u build (127.0.0.1 + Host) | `next.config.ts` | nizak — jedna adresa |
| 2 | `keywords="[]"` s naslovnice i svih 44 | `lib/seo.ts` + polje u adminu | nizak |
| 3 | Meki 404 na četiri sekcije | stranice sekcija | srednji — dira iscrtavanje |
| 4 | `seo_text` da se negdje prikaže | odluka o dizajnu, pa onda kod | traži tvoju odluku gdje |
| 5 | `is_noindex` na stranicama: ili robots izlaz ili brisanje prekidača | `lib/seo.ts` ili admin | nizak |
| 6 | Skloniti Indexing tab dok ga niko ne čita | admin | nikakav |

Prvo dvoje su čisti dobici bez pregovora. Treće je najvažnije za indeks. Četvrto
je pitanje za tebe: `seo_text` je 44 napisana bloka i treba odlučiti **gdje na
stranici** stoje prije nego se zakuca kod.
