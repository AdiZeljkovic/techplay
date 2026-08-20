# IGDB — plan preuzimanja baze, stranice igre i sistema studija

**Status:** odobren 20.08.2026, nije još započet.
**Odluka:** IGDB podatke **kopiramo u našu bazu**, ne koristimo kao vanjski servis.

---

## 0. Prije svega — dvije stvari koje nisu tehničke

**Licenca.** IGDB API je besplatan za **nekomercijalnu** upotrebu, pod Twitch
Developer Services Agreement. Za komercijalnu se traži partnerstvo
(`partner@igdb.com`). TechPlay ima reklame, shop i affiliate. Vlasnik je s tim
upoznat i odlučio je da se baza ne preprodaje i da se IGDB navede kao izvor na
frontu. Ovdje je zapisano jednom, da ne bude nesporazuma kasnije.

**Ključevi.** Client ID i Secret su prošli kroz razgovor i **treba ih zamijeniti**
u Twitch konzoli kad uvoz prođe.

---

## 1. Šta smo izmjerili (20.08.2026)

### Njihova baza naspram naše

| | naša | IGDB | odnos |
|---|---:|---:|---|
| **igara** | 142.110 | **372.826** | ×2,6 |
| opisi | 115.325 | 323.329 | ×2,8 |
| naslovne slike | 132.491 | 313.636 | ×2,4 |
| screenshotovi | 90.894 | 288.965 | ×3,2 |
| **traileri** | 31.484 | 101.023 | ×3,2 |
| **razvojni tim / izdavač** | 32.081 | 187.779 | ×5,9 |
| **dobne oznake** | 7.716 | 79.863 | ×10,4 |
| alternativni nazivi | 28.842 | 151.524 | ×5,3 |
| službena stranica | 45.799 | 341.343 | ×7,5 |

### Šta dobijamo a nemamo uopšte

- **Franšize i serijali** — 28.894 franšiza, 50.582 serijala. Naš `series_name`
  je popunjen **nula puta**.
- **Načini igre** (280.651), **teme** (215.989), **perspektiva** (157.547).
- **Jezici** — 227.796 igara, razdvojeno zvuk / titlovi / sučelje.
- **Popularnost** — 610.372 zapisa iz pravih izvora: Steam recenzije, vršni broj
  igrača u 24h, liste želja, globalni bestseleri, Twitch odgledani sati.
  Zamjenjuje naš `hype_score`, koji sami računamo iz ničega.
- **Vrijeme za prelazak** — 9.104 igre (brzo / normalno / 100%).
- **Multiplayer** — 25.867: co-op, split-screen, broj igrača online i offline.
- **Game engine** (1.489), **likovi** (16.503), **događaji** (926),
  **lokalizacije** (47.783).
- **Kompanije** — 72.421, od toga 57.738 s razvijenim igrama, 44.295 s izdatim,
  16.345 s opisom, 17.902 s logom, 19.421 sa zemljom, 12.110 s datumom osnivanja.

### Veličina posla

| tabela | zapisa | | tabela | zapisa |
|---|---:|---|---|---:|
| games | 372.826 | | websites | 955.260 |
| screenshots | 1.691.237 | | external_games | 677.219 |
| release_dates | 579.792 | | involved_companies | 282.813 |
| artworks | 257.445 | | alternative_names | 212.477 |
| age_ratings | 184.819 | | game_videos | 147.225 |
| companies | 72.421 | | collections | 11.123 |

Ukupno oko **5,7 miliona zapisa**. Njihovo ograničenje je 4 zahtjeva u sekundi i
500 zapisa po zahtjevu — oko sat vremena čistog prometa, realno pola dana s
pisanjem u bazu.

---

## 2. Spajanje — mjereno, ne pretpostavljeno

Vlasnik je tražio spajanje **po nazivu**. Izmjereno na 400 najposjećenijih naših
naslova, goli naziv nije dovoljan:

```
jedan pogodak :  179  (44,8%)
više pogodaka :   56  (14,0%)   ← ovdje bi se pogađalo
bez pogotka   :  165  (41,2%)
```

Ali „bez pogotka" uglavnom **nisu igre kojih nema** — razlikuje se interpunkcija:

```
Persona 5: Royal          →  Persona 5 Royal
God of War: Ragnarök      →  God of War Ragnarök
Metroid Prime: Remastered →  Metroid Prime Remastered
```

Nakon normalizacije (mala slova, bez interpunkcije i naglasaka, bez „Collector's
Edition") nađe se još 27 od tih 165. **Godina izlaska razriješi 30 od 56
višestrukih** — „Alien" ima sedam zapisa od 1982. do 2023.

**Konačno, na uzorku od 400:**

| | broj | udio |
|---|---:|---:|
| pouzdano spojivo (normalizovan naziv + godina) | 194 | **48,5%** |
| nesigurno — **ne dirati automatski** | 69 | 17% |
| stvarno nema u IGDB-u | 137 | 34% |

Onih 34% su uglavnom sitni Steam naslovi (`Xeno Waster`, `Zap-Em`, `Zejturn`).
Među njima je i **naša greška u kucanju**: `Assassin's Creed Back Flag Resynced`
umjesto *Black* — igra vezana za našu recenziju.

### Redoslijed spajanja

| korak | osnova | pokriva |
|---|---|---|
| a | **Steam ID** — imamo 38.253, IGDB drži 677.219 vanjskih ID-jeva | tačno, bez pogađanja |
| b | normalizovan naziv **+ godina** | ~48% ostatka |
| c | ostalo | **ne dira se** — ostaje kako jeste |

Nesigurni slučajevi idu u red za pregled u admin panelu, ne u bazu. Bolje stara
nepotpuna igra nego tuđi podaci na pogrešnom naslovu.

### Šta se NIKAD ne prepisuje

`slug` — 114.861 naša stranica igre ima posjete, ukupno 714.041. Adrese
preživljavaju spajanje, inače je to 114 hiljada novih 404-ki.

Uz slug: `views`, naši linkovi na trgovine (**42.344 Xbox** kakve IGDB nema),
`is_editorial`, `locked_fields`. Ako urednik ručno ispravi igru, uvoz je ne
smije pregaziti.

---

## 3. Stranica igre — ponovo napisana

Sadašnja `/games/[slug]` je pisana za podatke kakve smo imali: naslov, žanr,
platforma, nekoliko slika. S IGDB podacima ona više nije premala nego **pogrešna
po sastavu** — nosila bi trailere, izdavače, dobne oznake, jezike, vrijeme za
prelazak i serijal u rasporedu koji ništa od toga nije predvidio.

Zato se piše iznova, ne dorađuje. Šta mora nositi:

- **Vrh:** naslovna, trailer kao prvi element, ocjena (naša skala boja iz
  `lib/score.ts`), datum, platforme, dobna oznaka
- **Studio i izdavač** — kao linkovi na njihove stranice, ne kao tekst
- **Vrijeme za prelazak** — tri brojke, jer je to prvo što igrač pita
- **Način igre i multiplayer** — co-op, split-screen, broj igrača
- **Serijal i franšiza** — vodoravna traka s ostalim igrama iz serijala
- **Jezici** — tabela zvuk / titlovi / sučelje
- **Slične igre**
- **Datumi po platformi i regiji**
- **Galerija** — screenshotovi i artwork odvojeno

Ostaje pravilo iz `docs/04`: `page.tsx` dohvaća, `Client.tsx` crta.

---

## 4. Studiji — isti sistem kao igre, ne dodatak

Vlasnikov zahtjev: studiji dobijaju **svoj sistem**, ravnopravan igrama, i
**svoje mjesto u navigaciji**.

**Rute**

```
/studios                    lista, s filterima (zemlja, godina osnivanja, broj igara)
/studios/[slug]             stranica studija
/studios/country/[iso]      studiji po zemlji
```

**Stranica studija nosi:** logo, zemlju, godinu osnivanja, opis, matičnu firmu i
podružnice, **sve igre koje su razvili** i **sve koje su izdali** (odvojeno), i
naše članke koji ih spominju.

**Navigacija:** `Studios` ulazi u zaglavlje, unutar `Games` padajućeg menija kao
zasebna kolona — igre i oni koji ih prave stoje jedno uz drugo.

**Uvezanost u oba smjera:** sa stranice igre na studio, sa studija na sve
njegove igre, s članka na igru i studio.

**Redoslijed je obavezan: studiji idu poslije uvoza igara.** Studio bez ijedne
naše igre je prazna stranica, pa se prave samo oni koji imaju igre u katalogu —
a to je poznato tek kad katalog bude pun. Građeni prije uvoza, gradili bi se nad
142.110 igara pa odmah ponovo nad ~327.000.

**Šta kompanije stvarno nose** (72.421 zapis): opis 16.345 (22,6%), logo 17.902
(24,7%), zemlja 19.421, godina osnivanja 12.110, matična firma 1.946. Kompanija
nosi i `developed`/`published` liste id-jeva igara, pa veza ne mora ići kroz
`involved_companies` — ali uloga (developer/publisher/porting/support) tamo
jeste, pa ide kroz nju. Logo i sajt su id-jevi u `company_logos` i
`company_websites`; oba su naknadno dodana u povlačenje.

---

## 5. Faze

| # | šta | ishod |
|---|---|---|
| 1 | Nove tabele uporedo (`igdb_*` staging) | postojeće netaknute |
| 2 | Puno povlačenje IGDB-a | ~5,7 mil. zapisa lokalno |
| 3 | **Probni prolaz na 1.000 igara** | **vlasnik pregleda prije bilo čega** |
| 4 | Spajanje postojećih 142.110 | opisi, traileri, izdavači, oznake |
| 5 | Uvoz ~185.000 novih naslova (mjereno, v. odjeljak 7) | katalog na ~327k |
| 6 | Kompanije + stranice studija + navigacija | nova SEO površina |
| 7 | Popularnost zamjenjuje `hype_score` | stvarne brojke umjesto naše procjene |
| 8 | Nova stranica igre | |
| 9 | Pripis IGDB-u na frontu | |

**Faza 3 je kapija.** Ništa ne dodiruje cijelu bazu dok vlasnik ne vidi rezultat
na hiljadu igara.

---

## 6. Rizici, i šta ih drži

| rizik | odgovor |
|---|---|
| 114.861 adresa postane 404 | slug se ne prepisuje, nikad |
| pogrešna igra dobije tuđe podatke | tri koraka spajanja; nesigurno se ne dira |
| gubimo 42.344 Xbox linka | naši `game_store_links` se ne diraju |
| uvoz pregazi urednički ispravak | `locked_fields` se poštuje |
| 212 članaka izgubi vezu na igru | `articles.game_id` se ne dira; poslije uvoza se veze provjere |
| licenca | zapisano u odjeljku 0, odluka vlasnika |

---

## 7. Nalazi iz faze 4 (20.08.2026)

### Opisi se NE zamjenjuju — mjereno i odbačeno

Pretpostavka je bila da su naši opisi trgovinski marketing a IGDB-ovi
enciklopedijski. Zamjena je napravljena, puštena na 200 najposjećenijih igara i
**vraćena**, jer je izmjereno obrnuto:

| | naši | IGDB `summary` |
|---|---|---|
| prosjek | 1.335 zn. | 415 zn. |
| od 103 zamijenjena | — | 93 postala kraća |

IGDB-ov `summary` je izdavačev blurb s trgovine („Buckle up for some epic
PlayStation camaraderie!"), naš tekst opisuje igru („Astro Bot is a 3D mascot
platformer developed exclusively for PlayStation 5, released in celebration of
PlayStation's 30th anniversary"). Mehanizam ostaje — `igdb:merge
--replace=<polje>` uz obavezan gzip zapis i `igdb:revert` — ali se na opise ne
primjenjuje.

`storyline` je zaseban slučaj: 35.335 igara (9,5%), prosjek 598 zn., ali je to
prepričan zaplet. Kandidat za odjeljak **„Priča"** na novoj stranici igre, ne za
opis.

### Oblik se piše prema frontu, ne prema IGDB-u

`GameController::show` prosljeđuje kolonu neizmijenjenu, pa oblik diktira front:

| kolona | oblik koji front čita | zamka |
|---|---|---|
| `videos` | `string[]` URL-ova | stranica pušta YouTube regex preko svakog unosa — objekat je 500, ne „nema trailera" |
| `alt_titles` | `[{title, description}]` | goli string se iscrta kao prazan red; IGDB `comment` (209.962 od 212.482) je taj `description` |
| `series_key` | **integer** (ostatak od Moby group id) | slug u njoj obara insert |
| `rating` | `decimal(3,2)`, skala 0–10 | IGDB `total_rating` je 0–100; 10.00 ne staje u kolonu |

### Faza 5 — izmjereno, brojka iz plana ispravljena

| tip | broj | uvozi se |
|---|---|---|
| 0 glavna igra | 310.933 | da |
| 1 DLC | 17.580 | ne |
| 5 mod | 9.755 | ne |
| 13 paket | 8.933 | ne |
| 11 port | 8.186 | ne — ista igra, druga platforma |
| 3 bundle | 7.110 | ne |
| 8 remake / 9 remaster / 4 samostalno proširenje | 3.319 | da |

Kandidati (0, 4, 8, 9): **314.252**. Minus 9.866 s temom `42 Erotic`, minus
30.457 bez omota, datuma i studija → **274.152 vrijedna uvoza**, od čega je
~89.000 već naše. Novih stranica: **~185.000**, ne 230.000 kao u tabeli faza.

Dvije obavezne provjere pri uvozu, obje bi inače tiho pokvarile bazu:

- **`match_key` ostaje NULL.** Ne-null znači „agregator je vlasnik" i nosi
  `GameMerger::candidates`, `Notability::rescore` i `StoreSync` usvajanje.
  185.000 redova s ključem povuklo bi cijeli uvoz u te prolaze.
- **`game_tombstones` se provjerava.** 60.981 zapisa; ništa u agregatoru ih ne
  gleda, pa bi uvoz uskrsnuo svaku namjerno obrisanu igru.

---

## 8. Mjerni alat

Skripte kojima je ovo izmjereno stoje u scratchpadu sesije:
`name-match.py` (koliko naziva pogađa jednoznačno), `match2.py` (pomaže li
godina), `match3.py` (koliko spašava normalizacija). Vrijedi ih ponoviti prije
faze 4, jer se obje baze mijenjaju.
