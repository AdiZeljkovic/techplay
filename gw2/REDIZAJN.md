# GW2 alat — redizajn po mockupima

Pisano **28. 10. 2026.**, poslije analize četiri mockupa iz ovog foldera naspram
alata kakav je na produkciji. Analiza od 27. 9. (`ANALIZA-I-PLAN.md`, §8) i
spisak iz `STANJE-I-SLJEDECE.md` §6 i dalje važe; ovo je plan izgleda, ne
funkcija.

---

## 1. Odluke (28. 10. 2026.)

| Pitanje | Odluka |
|---|---|
| Okvir | GW2 bočni meni **ispod postojećeg headera sajta**. Čitalac ostaje na TechPlayu; header, footer, oglasi i consent rade kao svugdje. |
| Slike | **API slike + vlastite generisane.** ArenaNet umjetnost tek poslije pravnog koraka (Content Use Policy pokriva samo fizička lica). |
| Font | **Bez serifa.** GW2 dio koristi fontove sajta (Instrument Sans, IBM Plex). |
| Logo | Ne mijenja se sada. |
| Mobilni | Bočni meni postaje izvlačni meni (sheet sajta), desna kolona ide ispod sadržaja. |
| Ono što mockupi crtaju a ne crtamo | Ostaje van: zbirni skor, „Confidence to complete: High”, „ready to raid”, Currently Training, udaljenosti u metrima. Zamjene su u §4. |

---

## 2. Vizuelni jezik koji preuzimamo

- **Okvir:** lijevi meni (~240 px) s aktivnom stavkom u crvenom prelazu i crvenom
  linijom lijevo; stanje veze (nalog, zadnje čitanje) na vrhu menija, jer gornje
  trake nema.
- **Hero po stranici:** mali razmaknuti natpis („GUILD WARS 2”), veliki naslov u
  rečeničnom padežu, podnaslov; slika desno koja se pretapa u crno lijevo i dolje.
  Dok slike ne stignu — obojeni prelaz u boji domene.
- **Boja po domeni** (`lib/gw2domain.ts`) jača nego danas: obrub kartice, krug
  oko ikone, traka napretka i dugme u boji domene, ne samo rub od 2 px.
- **Zaglavlje sekcije:** ikona u krugu, naslov, sivi podnaslov, „View all →” desno.
- **Kartica preporuke:** slika na vrhu, oznaka (pouzdanost), naslov, tekst, traka
  „x / y”, red ikona predmeta, puno dugme na dnu.
- **Desna kolona rijetka:** 2–4 panela.

---

## 3. Faze

### Faza 1 — temelj ✅ 28. 10.

- `app/gw2/layout.tsx` + `components/gw2/shell/` — bočni meni, stanje veze,
  mobilni sheet.
- `Gw2Hero` umjesto `PageHero` na svih 16 GW2 stranica.
- Red od 10 linkova na dashboardu izbačen — meni ga zamjenjuje.

Komponente za faze 2+ (zaglavlje sekcije, nova kartica) prave se kad ih prva
stranica koristi, ne unaprijed.

### Faza 2 — Dashboard (mockup 1) ✅ 28. 10.

Sve ispod je urađeno; detalji u `docs/README.md` §21, „Dashboard po mockupu 1".

- Razdvajanje: **Dashboard** = pregled (5 kartica, 3 preporuke, Tonight teaser,
  Easy wins); **What should I do next?** (`/gw2/next`) = puna stranica savjeta s
  izborom cilja, vremena i „not tonight”.
- Kartice stanja po mockupu: velika ikona, broj, traka u boji domene.
- Kartica preporuke po mockupu.
- Konekcija, istorija, Vault, sezona i Today sele se s desne kolone (konekcija →
  meni i `/gw2/account`, istorija → `/gw2/account`, Vault/sezona/Today → Tonight).
- **Backend:** `action` (href + label) i `progress` (current/target) po
  preporuci, gdje pravilo to zna.

### Faza 3 — Masteries (mockup 3) ✅ 28. 10.

Urađeno; detalji u `docs/README.md` §21, „Masteries po mockupu 3". Granice
udaljenosti su izmjerene (četvrtina insighta unutar 350 jedinica od waypointa,
tri četvrtine unutar 950), mapa je iz zvaničnih pločica na spratu 1.

- Kartice ekspanzija (već imaju prave %).
- „Best mastery points for you”: insighti (mapa + najbliži waypoint + kod) i
  postignuća koja daju poen; umjesto „1–2 hours / Easy” → „blizu waypointa / malo
  hoda” (već računamo).
- **Mapa zona** iz zvaničnih pločica karte + koordinate insighta; % = sakupljeni
  insighti po mapi.
- Umjesto Currently Training → „sljedeća stepenica koju tvoji poeni kupuju”.
- Easy wins kao kartice (ikona, x/y, nagrada AP / mastery poen).

### Faza 4 — Tonight (mockup 4) ✅ 28. 10.

Urađeno; detalji u `docs/README.md` §21, „Tonight po mockupu 4". Jedna izmjena
plana ispod: nagrade **nisu** nova kolona `reward_tags` na pravilima, nego
`details.rewards` iz producera — svaki zna šta njegov korak plaća (acclaim,
AP, mastery poen, tier, slot, mount), pa nema ništa za ručno unositi. Zlato se
ne prikazuje jer ga nijedan korak ne zna.

- Plan kao vremenska linija s karticama (slika, raspon minuta, oznake nagrada,
  objašnjenje desno).
- Current events s odbrojavanjem — čim vlasnik provjeri i objavi 15 bossova.
- **Backend:** oznake nagrada na pravilima (`reward_tags`), pa tek onda
  „Potential rewards tonight” kao zbir oznaka iz plana.

### Faza 5 — stranica cilja (mockup 2) ✅ 28. 10.

Urađeno; detalji u `docs/README.md` §21, „Ascended set po mockupu 2". Dvije
izmjene plana:

- **Ruta je `/gw2/ascended`**, ne `/gw2/goals/[slug]`. Na
  `/gw2/goals/first-ascended-set` stoji vodič, a `/gw2/goals` je 301 na planer.
- **Sedmični napredak traži novi događaj.** `gw2_progress_events` nije imao
  ništa o opremi. Sync sad piše `ascended_piece` kad slot postane ascended
  između dva puna čitanja, pa grafikon počinje prazan od deploya.

Šta je napravljeno:

- **Lik, težina i statovi.** Čitaju se s lika i nude kao izbor. Težina se bira
  samo kad lik nema oklopa.
- **Komadi.** Šest komada oklopa (done / craft / owned / unavailable), plus red
  nakita i leđa.
- **Materijali iz jedne zalihe**, s tabovima Still needed / Total / Already
  yours, i cijenom s TP-a.
- **Put iz plana.** Disciplina (i na drugom liku), recepti, dnevne izrade s
  brojem dana, kupovina, ono što se ne prodaje, izrada.
- **Desno:** Why this matters (iz vodiča), Weekly progress i Related goals.

Kartice opreme za oklop vode ovamo.

### Faza 6 — ostale stranice ✅ 28. 10.

Urađeno; detalji u `docs/README.md` §21, „Faza 6".

- **Isti jezik na ostalim stranicama:** Legendary, planer, Story, Raids &
  bosses, What changed, Account, javna baza i stranica vodiča. Na javnim
  stranicama SEO nije diran.
- **`/gw2/achievements`:** zbir poena (API ga nema), grupe i kategorije iz igre,
  najbliže završetku, završeno po sedmici i titule na dohvat. Bez „48%
  complete".
- **`/gw2/fractals`:**
  - nivo i tier, AR svakog lika na 80 i Fractal Attunement;
  - relikvije, današnji i sutrašnji fractali, fractal postignuća.
- **`/gw2/guides`:** javni indeks vodiča, ulazi u sitemap.

Dvije stvari iz nove backend podrške:

- `gw2_achievements.point_cap`. Puni ga
  `gw2:catalogue --only=achievements --force` poslije deploya.
- `gw2:daily-fractals` u 00:05 UTC.

---

## 4. Šta ne crtamo i čime se mijenja

| Mockup | Element | Zamjena |
|---|---|---|
| 1 | „You are ready to start raiding — 100%” | „osnovna oprema zadovoljena” + istorija clearova |
| 1 | „2,847 AP · 48% complete” | zbir poena na `/gw2/achievements`, bez procenta (udio svih postignuća broji dnevna i nevidljiva) |
| 2 | „Confidence to complete: High” | da li neko na nalogu može kraftati (disciplina na ocjeni recepta, i ko je najbliži) |
| 2 | „Gold spent” u sedmičnom napretku | ništa — ništa ne bilježi na šta je zlato potrošeno |
| 3 | Weekly Completion Score 72/100 | ništa — pet domena nema zajednički imenilac |
| 3 | Currently Training | sljedeća stepenica koju unspent poeni kupuju |
| 3 | Nearby Priorities u metrima | insighti mape s kodom najbližeg waypointa |
| 4 | „0–10 min” kao činjenica | rasponi, označeni kao naša procjena |

Greške u samim mockupima (ne prepisivati): Fractal level 37 je Tier 2, ne Tier 4;
AR cilj je 150, ne 100; Itzel Lore / Exalted Lore / Pact Commander su trake, ne
poeni; „Dragon's Stand Preparation” ne postoji; Dragonstorm je Icebrood Saga, ne
SotO; svugdje „/254” — svaka regija ima svoj zbir.

---

## 5. Slike za generisanje

Pravi ih vlasnik (ChatGPT, kao mockupe). Ide u `frontend/public/images/gw2/`,
format **WebP**, imena tačno kao ispod — kod ih čita po imenu.

**Pravila za sve:** naslikana digitalna fantazija, tamno, nisko osvjetljenje,
grimizni akcenti (#DC143C). **Bez teksta, logotipa, UI-ja.** Bez prepoznatljivih
likova i rasa iz GW2 (charr, asura, sylvari, norn), bez prepoznatljivih mjesta
(Lion's Arch, Divinity's Reach…) — generička fantazija, inače je to ArenaNetovo.

### Hero — 2400 × 700 px

Motiv u desnih ~60 %, lijevih ~40 % tamno i mirno (tu ide tekst), donji rub se
gasi u #05070A.

| Fajl | Motiv |
|---|---|
| `hero-dashboard.webp` | dolina s dvorcem i vodopadima u sumrak, crveno lišće (mockup 1) |
| `hero-next.webp` | raskršće puteva, putokaz, magla |
| `hero-masteries.webp` | krošnje džungle i zarasle ruševine |
| `hero-tonight.webp` | noćni logor / grad u svjetlima |
| `hero-goals.webp` | oružarnica, oklop na stalku, sjaj kovačnice |
| `hero-legendary.webp` | oružje koje svijetli nad mističnim oltarom |
| `hero-story.webp` | otvorena knjiga i karta, grad u daljini |
| `hero-raids.webp` | mračna kapija tvrđave, baklje |
| `hero-account.webp` | silueta putnika na litici (bez rase) |
| `hero-database.webp` | biblioteka / arhiv sa svicima |
| `hero-whats-new.webp` | izlazak sunca nad dolinom („povratak”) |

### Kartice po domeni — 960 × 540 px

Motiv u sredini, tamni rubovi (preko ide tekst i prelaz).

`card-gear` (oklop), `card-fractals` (portal / kristal), `card-masteries`
(zmaj u letu nad džunglom), `card-raids` (veliki boss u sjeni),
`card-achievements` (pehar / trofeji), `card-vault` (škrinja s blagom),
`card-story` (knjiga), `card-mounts` (jahaća zvijer), `card-legendary`
(svjetleće oružje), `card-crafting` (kovačnica), `card-bosses` (div na otvorenom).

Kartice stanja na dashboardu koriste iste slike, izrezane.

### Šta dolazi iz API-ja (već dozvoljeno, ništa ne treba praviti)

Ikone predmeta i postignuća, scene mastery traka (`gw2_masteries.background`),
slike specijalizacija, ikone profesija (umjesto portreta lika — API ga nema),
pločice karte.
