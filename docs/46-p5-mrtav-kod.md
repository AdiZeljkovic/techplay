# P5 — Mrtav kod i nespojene funkcionalnosti (10.08.2026)

**Ovo je dokument za odluku, ne izvještaj o urađenom.** Ništa nije obrisano.

Metod: izvučene su sve 259 API putanje, pa je za svaku traženo zove li je
frontend ili bot. Zatim ručna provjera svakog kandidata — jer gruba pretraga
promašuje putanje građene kroz template literale (`/friends/${akcija}/${id}`),
što je odmah dalo dva lažna pozitiva.

Podjela je namjerno u tri korpe, jer **"nema pozivaoca" ne znači isto što i
"mrtvo"**.

---

## A. Nije mrtvo — zove ih nešto izvan našeg koda

Ne dirati. Nemaju pozivaoca u repou jer ih zove tuđi sistem.

| Ruta | Ko je zove |
|---|---|
| `auth/discord/callback`, `auth/battlenet/callback`, `connected-accounts/steam/callback` | OAuth provajder preusmjerava korisnika |
| `email/verify/{id}/{hash}` | link iz e-maila |
| `chat/attachments/{message}`, `journal/moments/{moment}/image` | potpisani URL-ovi koje API vraća u payloadu (P1) |
| `webhooks/paypal` | PayPal |
| `system/health` | nadzor izvana |
| `webhooks/discord/notify` | ručni okidač za redakciju, zaključan u P3 |

---

## B. Nespojene funkcionalnosti — backend postoji, UI ne

Ovo je korpa oko koje treba tvoja odluka. Svaka stavka je **napisana, radi, i
nedostupna korisniku.**

### B1. AI savjetnik za backlog — `POST /backlog/suggest`

Najveći nalaz. Postoje **dva** endpointa za backlog:

| | zove ga frontend | naplata |
|---|---|---|
| `GET /backlog/recommendations` | ✅ `/backlog-advisor` stranica | nema |
| `POST /backlog/suggest` | ❌ nikad | **premium, 3 besplatna dnevno** |

`suggest` je AI koji bira igru po raspoloženju i raspoloživom vremenu, s
ugrađenim ograničenjem za besplatne korisnike i porukom "Upgrade to Premium".
Izgrađen, monetizovan, nikad spojen.

**Odluka:** obrisati (dogovoreno) ili spojiti.

### B2. Blokiranje korisnika — `POST /friends/block/{id}`

Društveni hub **ima karticu "Blocked"** koja izlistava blokirane. Nijedno
dugme nigdje ne blokira.

Dvije stvari koje ovo čine osjetljivim:

- U P1 sam blokiranje **popravio da stvarno radi** (prije je bilo kozmetičko —
  red u bazi koji nijedna linija koda ne čita). Ta popravka trenutno ne stiže ni
  do koga.
- **Ne postoji ruta za deblokiranje.** Ako se doda dugme za blokiranje bez toga,
  korisnik upadne u stanje iz kojeg ne može izaći.

**Odluka:** spojiti (traži i novu rutu za deblokiranje) ili obrisati zajedno s
karticom "Blocked".

### B3. Pretraga korisnika — `GET /friends/search`

Prijatelj se može dodati samo s tuđeg profila ili iz "People You May Know".
Nema načina da nekog nađeš po imenu. Endpoint za to postoji.

### B4. Lista za čitanje — `GET /me/reading`

`ReadingTracker` uredno bilježi napredak čitanja i bookmarke na svakom članku.
**Ništa ih nigdje ne prikazuje.** Podaci se prikupljaju već mjesecima i nemaju
izlaz.

### B5. WoW: sačuvana i dijeljena analiza — `GET /wow/analysis/{id}`, `POST /wow/analysis/{id}/share`

Analizator zove samo `/wow/analyze`. Čuvanje i dijeljenje rezultata su
napisani, nespojeni.

### B6. Brisanje trenutka iz dnevnika — `DELETE /journal/moments/{moment}`

Moment se može dodati, ne i obrisati pojedinačno.

### B7. `POST /subscriptions/activate`

Nadomješten s `/support/pledge`, koji checkout stvarno zove. Ostatak ranije
PayPal pretplate.

Napomena: ovo je endpoint koji sam u P1 zatvorio (verifikacija je bila
zakomentarisana). Popravka je bila ispravna, ali je štitila rutu koju niko ne
zove — vrijedi znati pri procjeni koliko je ta rupa stvarno vrijedila.

### B8. `GET /support/mine`

Status tvoje podrške. Nigdje se ne prikazuje.

### B9. `GET /news/trending`

Bez pozivaoca. Frontend ima svoje "trending" liste iz drugih izvora.

### B10. SEO alati — 4 rute

`seo/suggest-links`, `seo/orphan-pages`, `seo/articles/{article}/inbound-links`,
`seo/articles/{article}/schemas`.

Sve četiri su staff-zaključane API rute (provjereno u P3 — autorizacija im je
ispravna) **bez ijednog sučelja**. Admin je Filament u PHP-u i zove servise
direktno, ne kroz HTTP.

---

## C. Frontend komponente koje niko ne uvozi — 17

| Grupa | Fajlovi | Napomena |
|---|---|---|
| **WoW (7)** | `DailyPlanner`, `HistoricalProgress`, `HousingReadiness`, `PreparationChecklist`, `TimelineTracker`, `WowLeaderboard`, `WowRecentAnalyses` | Poklapa se s B5 — cijeli drugi sloj WoW alata je napisan i nespojen |
| **Sidebar (2)** | `PopularGamesWidget`, `WowAnalyzerWidget` | Widgeti za bočnu traku članaka |
| **UI (4)** | `MediaImage`, `ProgressBar`, `SkeletonBlock`, `StatNumber` | Primitivi; mogu biti korisni kasnije, ali danas su mrtvi |
| **SEO (2)** | `SeoContent`, `TableOfContents` | vidi ispravku ispod |
| **Ostalo (2)** | `ads/InTextAd`, `games/GameTrailersPlayer` | |

### Ispravka nalaza iz P3

`SeoContent` je jedina komponenta koja renderuje `PageSeo.seo_text`, i **nigdje
nije uvezena**. U `docs/38` sam to opisao kao sadržaj koji izlazi na
`techplay.gg`, gdje token stoji u `localStorage` — to je bilo prejako. Polje se
danas ne renderuje nigdje.

Sanitizacija koju sam dodao ostaje ispravna: polje uređuje osoblje s
`manage content`, komponenta postoji i može biti spojena bilo kad, a sanitizacija
pri upisu je jeftinija od pamćenja da je treba dodati kasnije.

---

## Šta je provjereno i ispalo čisto

- **Nijedan model** nije bez reference.
- **Nijedna konzolna komanda** nije istovremeno van rasporeda, van koda i van
  dokumentacije.
- **Config fajlovi** se svi čitaju (`milestones` se čita kroz `config('milestones')`
  bez tačke — moj prvi obrazac ga je lažno prijavio kao mrtav; `pulse` čita paket).
- **`friends/accept` i `friends/decline`** su izgledale mrtve, a nisu — frontend
  ih gradi kroz `/friends/${accept ? "accept" : "decline"}/${id}`.

---

## Preporuka

Ako mene pitaš, po korpama:

- **B1 (AI savjetnik)** — obrisati, kako si rekao. Ako se ikad poželi, vraća se
  iz git istorije.
- **B2 (blokiranje)** — **ovo bih spojio, ne brisao.** Sigurnosna je stvar,
  backend radi od P1, i kartica "Blocked" u UI-ju je danas obećanje koje se ne
  može ispuniti. Traži i rutu za deblokiranje.
- **B4 (lista za čitanje)** — spojiti; podaci se već skupljaju, treba im samo
  stranica.
- **B3, B5, B6, B8** — tvoja odluka po vrijednosti; nisu štetni dok stoje.
- **B7, B9** — obrisati, nadomješteni su.
- **B10 (SEO alati)** — ostaviti dok se ne uradi SEO paket, koji je ionako
  odložen.
- **Korpa C** — obrisati sve osim WoW grupe i UI primitiva; WoW ide zajedno s
  odlukom o B5.

Ništa od ovoga nije urađeno. Reci šta brišem.
