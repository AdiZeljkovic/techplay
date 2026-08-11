# 14 — Release Calendar Map

> Prepisano 2026-08-11. Prethodna verzija opisivala je `GameController::calendar`
> i kolonu `games.release_date` — ni jedno ni drugo više nije izvor kalendara.

## Svrha

`/calendar` je mjesečni pregled izlazaka: šta izlazi kojeg dana, šta je najveće,
na kojim platformama, i šta je korisnik stavio na svoju listu. Zasebna stranica
`/calendar/{slug}` je stranica jednog nadolazećeg izlaska — namjerno različita od
`/games/{slug}`, jer govori o igri koju još niko nije igrao (art, trailer, gdje
će se prodavati) umjesto o igri koju jesu (ocjene, dužina, ko je posjeduje).

---

## Izvor podataka

- **Ne zove nikoga uživo.** Nekad je na svaki cache miss zvao RAWG, pa je pad
  RAWG-a značio pad kalendara. Sada čita isključivo ono što već imamo.
- Agregator (`SyncReleases` → `MergeReleases`) povlači Steam, Xbox i eShop po
  rasporedu i spaja ih u jedan red.
- `games.match_key` je ono što razdvaja kalendarski unos od ~187k historijskih
  redova — postavlja ga samo agregator.
- `games.released` + `release_precision` (`day` / `month` / `quarter` / `year` /
  `tba`) — stranica izlaska ne izmišlja dan koji nam niko nije dao.
- `games.hype_score` (`Notability`) — koliko je izlazak *velik*, ne koliko je
  željen; nijedan store ne objavljuje broj pratilaca.

**Šta se prikazuje:** `CalendarVisibility` (`config/releases.calendar`). Prolaz
je na **bilo koje jedno** pravilo (više platformi, ozbiljan opis, screenshoti,
trailer, neko ga je već wishlistao…). Unos koji padne i dalje je u bazi,
pretraživ i ima svoju stranicu — samo ne zatrpava mjesec.

---

## Backend

**Kontroler:** `Api\V1\CalendarController`

| Metoda | Ruta | Šta radi |
|---|---|---|
| `index` | `GET /calendar?month=&platform=&genre=&sort=` | cijeli mjesec u jednom pozivu |
| `day` | `GET /calendar/day/{date}` | svi izlasci jednog dana (isti filteri) |
| `show` | `GET /calendar/{slug}` | jedan izlazak, s trgovinama i trailerima |
| `toggleReminder` | `POST /calendar/{slug}/reminder` | podsjetnik (usput wishlista) |

`/calendar/day/{date}` je registrovan **prije** `/calendar/{slug}` da datum ne
bude protumačen kao slug.

**Keš:** mjesečni redovi (`calendar.month.v1.{Y-m}`, `Cache::flexible` 300/900 s).
Keširani dio ne zna ko pita — broj wishlista, korisnikovo stanje i watchlist
dekorišu se poslije, po zahtjevu.

**Ostalo:** `CheckWishlistReleases` (dnevno) šalje obavijesti korisnicima čija
igra izlazi; `user_games.notify_on_release` je zastavica.

---

## Frontend

**Lokacija:** `frontend/app/calendar/` — `CalendarClient.tsx` (hub, klijentski,
jedan SWR poziv), `[slug]/page.tsx` (stranica izlaska, SSR).

Sekcije huba: hero (najveći izlazak mjeseca kao pozadina), "This month" traka,
filter traka (platforme + žanrovi + "Biggest first"), "Biggest in {mjesec}",
mjesec dan po dan, te desna traka (watchlist, "Biggest still to come",
platform breakdown).

Platforme se crtaju kao brend-marke (`PlatformIcon`), ne kao tekst — store
imena su preduga ("Xbox Series X|S", "Nintendo Switch 2") i četiri chipa nisu
govorila ništa što marka ne kaže. PC nosi Steamovu marku.

---

## Changelog 2026-08-11 — payload, dnevni endpoint i redizajn

**Izmjereno prije:** `GET /calendar` = **510 KB sirovo / 84 KB brotli**, najveći
odgovor na sajtu. 98% toga bio je `days`: 1.133 igre za avgust 2026, od čega
**196 u jednom danu**. Bez ikakvog keša — svaki posjetilac je gradio mjesec
iznova.

**Izmjene:**
- `days` sada nosi dvije najveće igre po danu + `total`. Ostatak dana stiže na
  zahtjev kroz novi `GET /calendar/day/{date}`. Payload **510 KB → ~33 KB (-94%)**.
- Mjesečni redovi keširani 5 min (`Cache::flexible`), korisnički dio se dekoriše
  poslije keša.
- Iz svakog reda izbačeni `tba`, `rating`, `precision` (niko ih ne čita) i
  `platform_slugs` (interno se koristi za filtere i breakdown, ne izlazi van).
- **Bug — `sort=anticipated` nije radio ništa.** Igre su se sortirale po
  veličini, pa grupisale po danu, pa opet sortirale unutar dana, pa dani po
  datumu — `/calendar` i `/calendar?sort=anticipated` vraćali su identične
  bajtove. Sada "Biggest first" sortira **dane** po njihovom najvećem izlasku.
- **Bug — sticky filter traka je bila `top-0`**, a header je fiksan i visok
  72 px, pa je traka na svakom skrolu klizila ispod njega. Sada `top-[72px]`.
- Filter traka prešla na jezik leaderboard menija; platforme s brend-markama.
- "Biggest in {mjesec}": art je sada čist (datum je stajao preko naslovnice u
  accent crvenoj i na pola njih se nije mogao pročitati), naslov i datum su
  ispod slike, platforme su ikonice, i tile nosi svoj rang 1–5 jer sekcija
  *jeste* rang lista.
