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

> **Ispravka.** Prva verzija ovog nalaza tvrdila je i da *admin nema polje za
> `meta_keywords`*. **Netačno** — polje postoji, `TagsInput::make('meta_keywords')`.
> Grep kojim sam nabrajao polja filtrirao je po tipu (`TextInput|Textarea|…`) i
> `TagsInput` nije bio na spisku. Ista greška kao i nekoliko puta prije: brojanje
> po obrascu umjesto čitanja.
>
> Ta ispravka objašnjava i uzrok bolje nego prvobitna tvrdnja: `TagsInput` piše
> **niz**, Laravel ga serijalizuje u JSON, a `lib/seo.ts` ga je čitao kao tekst.
> Nesklad je između dva ispravna kraja, ne posljedica polja koje fali.

**Riješeno 18.08.2026.** Cast `'meta_keywords' => 'array'` na modelu — pa svaki
potrošač dobija niz, ne samo onaj koji je slučajno pogledan — i `lib/seo.ts`
prihvata oba oblika i izostavlja tag kad je prazan. Provjereno na produkciji:

| Stranica | keywords tag |
|---|---|
| `/` | nema (prazno) |
| `/about` | nema (prazno) |
| `/news` | `gaming news 2026,video game headlines,industry a…` |

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
iscrtava.

> **Ispravka.** Ovdje je isto stajalo da *admin nema polje* — netačno, imao je
> `RichEditor::make('seo_text')`, i promašen je iz istog razloga kao `TagsInput`.

**Obrisano 18.08.2026, vlasnikova odluka** — i tačna: tekst nakalemljen ispod
sadržaja da nosi ključne riječi je taktika koju pretraživači odavno ne
nagrađuju, i koštala bi stranice više nego što bi donijela kad bi se počela
iscrtavati.

Otišli su: kolona na `page_seo` **i** na `categories`, polje u obrascu,
sanitizacija u observeru, dva spiska polja u komandama, funkcija i tip na
frontu. **Pisanje nije izgubljeno** — svih 90.023 znaka izvezeno je prije
brisanja u `storage/app/backups/seo-text-2026-08-18.json`, s kopijom na
`/root/`.

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

> **Ispravka, poslije provjere.** Ovaj nalaz je bio precijenjen. Sve četiri
> meke 404 stranice nose `<meta name="robots" content="noindex">`, koji Next
> ubacuje sam — provjereno na sve četiri. Pretraživač ih dakle **ne**
> indeksira; moja tvrdnja da može indeksirati beskonačno izmišljenih URL-ova
> nije stajala.
>
> Uzrok je dokumentovan u Next 16: kod **streamanog** odgovora status 200 je
> već poslan prije nego `notFound()` pukne, pa se ne može promijeniti — i baš
> zato Next dodaje `noindex`. `/games` vraća pravi 404 jer ima
> `dynamic = "force-dynamic"` i ne strima prije provjere.
>
> **Ostavljeno namjerno.** Lijek po dokumentaciji je provjera prije
> streamanja, dakle `force-dynamic` na četiri najprometnije uredničke rute —
> što ukida ISR na njima. To je stvarna cijena performansi za dobitak koji
> `noindex` već pokriva. Google mekani 404 s noindexom ionako tretira kao
> 404 i izbacuje ga.

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

## Kvar 6 — logger je bio nosiv, i obarao je zahtjeve

Nađen usput, dok se provjeravalo brisanje: `/api/v1/page-seo/{put}` i
`/api/v1/redirects` su naizmjenično vraćali **500**.

`storage/logs/telegram-dedup.log` bio je u vlasništvu **roota**, a Octane radi
kao **www-data**. Svaka greška je onda pravila dvije: originalnu, i
`file_put_contents(): Permission denied` iz handlera koji pokušava da je
zabilježi — a druga je izlazila kao 500.

Posljedica je bila tiša nego što zvuči i gora: dok je `/page-seo` vraćao 500,
`lib/seo.ts` je hvatao `!res.ok`, padao na kod-default, i **svaki naslov na
sajtu je bio fallback.** Baš ono što je jedan raniji commit već popravljao.

Vlasništvo je popravljeno, ali oblik greške je pouka: **put za uzbunu je postao
nosiv.** Sada je umotan u `WhatFailureGroupHandler`, pa pokvaren Telegram alert
košta alert i ništa više.

---

## Redoslijed popravki

| # | Šta | Stanje |
|---|---|---|
| — | `keywords="[]"` na svakoj stranici | **riješeno** — cast na modelu + tolerantno čitanje |
| — | `seo_text` | **obrisan**, uz izvoz svih 44 bloka |
| — | Logger obara zahtjeve | **riješeno** — vlasništvo + `WhatFailureGroupHandler` |
| 1 | Redirekcije u build (127.0.0.1 + Host umjesto javnog imena) | otvoreno, nizak rizik |
| 2 | Meki 404 na `/news`, `/reviews`, `/guides`, `/hardware` | otvoreno, **najvažnije za indeks** |
| 3 | `is_noindex` na stranicama: ili robots izlaz ili brisanje prekidača | otvoreno |
| 4 | Skloniti Indexing tab dok ga niko ne čita | otvoreno, nikakav rizik |

---

## Šta je ova revizija naučila o samoj sebi

Dva od šest nalaza bila su djelimično netačna, i oba iz istog razloga: **nabrajao
sam polja grepom koji filtrira po tipu.** `TagsInput` i `RichEditor` nisu bili na
spisku, pa su dva postojeća polja prijavljena kao nepostojeća.

To je isti obrazac koji je zabilježen i u `66-admin-redizajn-plan.md`: nalaz
izveden iz **brojanja** ispao je netačan, nalaz izveden iz **čitanja** je stajao.
Ovdje je razlika bila jedan `grep` bez filtera.
