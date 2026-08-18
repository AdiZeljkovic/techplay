# Admin panel: brzina i stabilnost

*18.08.2026. Sve mjereno na produkciji, prije i poslije, istim postupkom.*

## Šta je bilo najsporije, i zašto

Prolaz kroz svih 38 lista pokazao je da **upiti nisu problem** — svugdje ih je
2 do 5, dakle nema N+1. Jedan ekran je odskakao:

| | Prije |
|---|---|
| `GameResource` | **362 ms**, od toga **198 ms u bazi** na samo dva upita |
| Prosjek svih 38 | 127 ms |

`EXPLAIN` je rekao ono što brojanje nije moglo: uzrok nije bio u kolonama nego
u **sortiranju**.

```
Index Scan Backward using games_rating_index ... rows=114302
Buffers: shared hit=38076
```

Lista je bila sortirana `defaultSort('rating', 'desc')`. **114.301 od 142.110
igara nema ocjenu**, a Postgres na `DESC` sortira `NULL`-ove **prve** — pa se
ekran otvarao sa sto četrnaest hiljada neocijenjenih redova, i planer je morao
proći kroz svaki da bi prvih 25 poredao po `id`-u.

To nije bila samo greška brzine. Prvi ekran kataloga pokazivao je **ono što niko
nije ocijenio**, umjesto onoga što je upravo stiglo.

## Tri izmjene na tom ekranu

| Izmjena | Efekat |
|---|---|
| `defaultSort('id', 'desc')` — redoslijed kojim agregator donosi | glavni upit **229 ms → 2 ms** |
| Upit bira samo osam kolona koje se crtaju, umjesto `select *` | ~2,2 KB po redu manje; teške kolone (`screenshots` 491 B, `box_art` 399, `description` 386) više ne izlaze iz baze |
| `selectCurrentPageOnly()` | briše `count(*)` nad 142k redova, **52 ms po učitavanju** |

Dvije najteže kolone se ionako koriste **samo kao da/ne** — „ima li opis", „ima
li screenshotova" — pa se odgovor računa u SQL-u.

**Rezultat: 362 → 133 ms, upita 2 → 1, u bazi 198 → 2 ms.**

### Jedan pokušaj koji je stvari pogoršao

Prva verzija je sužavala kolone **prije** nego što je sortiranje popravljeno, i
izraz `description <> ''` je tjerao Postgres da detoasta svaki red koji skener
dotakne: **272 ms umjesto 138.** `EXPLAIN` je to pokazao odmah. Praznih opisa
nema nijedan od 142.110, pa je `IS NOT NULL` dovoljno — i za razliku od
poređenja nikad ne mora pročitati vrijednost.

## Keširanje koje je nedostajalo

| | Prije | Poslije |
|---|---|---|
| Keširane rute | **ne** | da |
| Kompajlirani Blade pogledi | 30 | 175 |

Ovo je moj propust iz same sesije: cijelo vrijeme sam pokretao `view:clear` i
`route:clear` pri deployu, a nikad `view:cache` i `route:cache` nazad.

## Statika

Nije postojao `location /build/`, pa je kompajlirana tema — **607 KB CSS-a** —
odgovarana iz `location /`, koji proksira na Octane. Svako učitavanje admin
stranice trošilo je PHP radnika da vrati stylesheet.

Prva verzija bloka je **pogoršala** stvar: `nginx.conf` ima `gzip on` ali mu je
`gzip_types` zakomentarisan, pa komprimuje samo `text/html`. Datoteka je otišla
nekomprimovana — brže dohvatiti, deset puta više skinuti.

| | Prije | Poslije |
|---|---|---|
| Ko servira | Octane (PHP radnik) | nginx, s diska |
| Preneseno | 63 KB | **63 KB** |
| `Cache-Control` | nema | `max-age=31536000, immutable` |
| Vrijeme | — | 8–18 ms, i samo prvi put |

Vite hashira ime svakog fajla, pa se sadržaj iza datog imena ne može promijeniti
— godina i `immutable` su sigurni.

## Gdje smo sada

| Mjera | Prije | Poslije |
|---|---|---|
| Najsporiji ekran | 362 ms | ~228 ms |
| Prosjek 38 lista | 127 ms | **109 ms** |
| Ukupno u bazi kroz sve ekrane | — | **147 ms** |
| `/admin/login` preko HTTP-a | — | **30–40 ms** |
| `/api/v1/games?per_page=25` | — | **16–21 ms** |

Preostalo vrijeme je Blade iscrtavanje, ne baza — najsporiji ekrani troše 8–13 ms
u bazi, a ostatak na generisanje oko 500 KB HTML-a po listi. To je Filamentova
cijena i dalje bi tražila drukčiji pristup, ne podešavanje.

## Šta je provjereno da nije slomljeno

- 38 lista se iscrtava, nijedna ne puca
- `/admin`, API i sajt odgovaraju 200
- Healthcheck: svih osam stavki OK, uključujući **backup**, koji je konačno zelen

## Nije dirano, i zašto

**OPcache** u `/etc/php/8.3/cli/php.ini` piše `opcache.enable=0`, ali FrankenPHP
je samostalan binarni fajl od 149 MB s **ugrađenim** PHP-om — sistemski `php.ini`
se na njega ne odnosi. Odgovori od 28 ms dokazuju da tamo radi. Ta postavka utiče
samo na `php artisan` iz komandne linije.
