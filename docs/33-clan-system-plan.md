# Clan Base System — kompletan plan

> **STATUS 08/2026: SVIH ŠEST FAZA IMPLEMENTIRANO I LIVE.**
> F1 ekonomija (99eb0b84) · F2 stranice (df0c7b14) · F3 baza (3693cb9d) ·
> F4 misije (2b608e8f) · F5 boosteri+sezona (36354b40) · F6 identitet (3b18abb1).
> Odgođeno svjesno: clan chat, Discord webhook, teme baze (art), Clan War.
>
> Master plan za nadogradnju klanova iz "ime + spisak članova" u centralni
> kolektivni metagame TechPlaya. Pisano 08/2026. Ovo je izvor istine za sve
> faze — svaka izmjena sistema ide prvo ovdje.

---

## 0. Ideja u jednoj rečenici

Članovi rade ono što već rade na TechPlayu (komentari, recenzije, liste,
kolekcija, achievementi, journal) → clan zarađuje resurse → lideri ulažu u
bazu → baza raste → svi članovi dobijaju bonuse, kozmetiku i identitet.

Sistem ne izmišlja nove aktivnosti — daje kolektivni smisao postojećima.

### Temeljne odluke (nepromjenjive, dogovorene)

1. **Clan ekonomija je odvojena od ličnog Bountyja.** Član nikad ne bira
   između svoje nagrade i klana — ista aktivnost puni oba, iz odvojenih
   budžeta.
2. **Bonusi diraju samo Clan XP i clan-side brojeve**, nikad lični XP koji
   hrani site-wide leaderboard.
3. **Skaliranje po aktivnim članovima + dnevni limiti po članu** ulaze u
   Fazu 1 — ekonomija se ne da retrofitovati.
4. **Jedna ljestvica**: Clan Level = tier baze. Nema "clan level 18" i
   "citadel level 12" kao dva broja.
5. **Sistem ne zavisi od arta.** Baza se crta proceduralno (node mapa u
   TechPlay jeziku); cinematic ilustracije po temi dolaze kasnije kao
   pozadinski sloj.

---

## 1. Ekonomija

### 1.1 Resursi

| Resurs | Priroda | Izvori | Troši se na |
|---|---|---|---|
| **Intel** 🔵 | znanje / sadržaj | recenzije, kvalitetni komentari, liste, forum rješenja, vodiči | zgrade, misije, boosteri |
| **Materials** 🟠 | aktivnost / grind | dnevni login, završene igre, achievementi, journal sesije, event učešće | zgrade (glavni trošak), boosteri |
| **Prestige** 🟣 | reputacija / historija | operacije, sezonski plasman, milestone-i, clan trofeji | uglavnom se SKUPLJA; jedini sink: Speed Up gradnje |

Prikazujemo **current** i **lifetime** za sva tri. Lifetime Prestige je
javna mjera klana (leaderboard po Prestige-u).

### 1.2 Zarada — tabela izvora (početne vrijednosti, sve u config/clan.php)

| Događaj (postojeći hook) | Resurs | Iznos |
|---|---|---|
| Recenzija objavljena (`GameRatingController::upsert`, publish tranzicija) | Intel | 15 |
| Komentar odobren, ≥120 znakova (`CommentObserver`) | Intel | 3 |
| Lista objavljena (`GameListController`, draft→publish) | Intel | 10 |
| Forum post označen kao rješenje | Intel | 10 |
| Thread s ≥5 upvote-ova | Intel | 5 |
| Dnevni streak claim (`/user/streak/claim`) | Materials | 2 |
| Igra završena (`GameCollectionController`, →completed) | Materials | 15 |
| Achievement otključan (`AchievementService::unlock`) | Materials | 5 |
| Journal sesija zabilježena (≥30 min) | Materials | 3 |
| Quest završen | Materials | 5 |
| Clan misija završena | po definiciji misije | — |
| Operacija / sezonski projekat / trofej | Prestige | po definiciji |

**Clan XP** = zarađeni Intel + Materials (1:1) + Prestige × 5. Level krivulja
u `ClanLevelService` (ista filozofija kao `LevelService` — tabela pragova).

### 1.3 Limiti i anti-abuse

- **Dnevni limit po članu**: Intel 30/dan, Materials 40/dan (config).
  Provjerava se sumom ledgera za danas prije upisa.
- **Aktivan član** = bilo koja zarada u zadnjih 14 dana. Sve što skalira,
  skalira po aktivnima, ne po rosteru.
- **Join cooldown**: doprinos se broji od datuma pristupa; napuštanjem se
  ništa ne prenosi. Ponovni join istom klanu < 48 h ne resetuje ništa,
  join drugom klanu moguć odmah ali misije u toku ne primaju doprinos
  novog člana (spriječen clan-hopping za nagrade).
- **Kvalitetni prag**: komentar mora biti `approved` + minimalna dužina;
  recenzija mora biti objavljena (ne draft) s tekstom — iste definicije
  kao XP/achievementi, nema novih pravila.
- **Vault kapacitet**: maksimalne zalihe resursa po levelu Vaulta —
  sprječava beskonačno gomilanje i daje razlog za trošenje.

### 1.4 Skaliranje misija

```
target = ceil(base × max(1, (active / 10) ^ 0.8))
```

- 10 aktivnih = bazni target (npr. 30 aktivnosti)
- 50 aktivnih = ~3.6× target (108), ne 5× (150) — diminishing returns
- Leaderboard kategorije po aktivnima: **Small ≤ 15 · Medium 16–50 ·
  Large 50+**, plus **Overall Prestige** (svi zajedno).

---

## 2. Clan Level / tier

| Level | Tier | Naziv |
|---|---|---|
| 1–4 | 1 | **Outpost** |
| 5–9 | 2 | **Base** |
| 10–14 | 3 | **Stronghold** |
| 15–19 | 4 | **Citadel** |
| 20+ | 5 | **Nexus** |

Level raste iz Clan XP (automatski, ne kupuje se). Tier otključava zgrade i
gornje granice (Command Center level ≤ tier × 2, itd.). Naziv tiera je dio
identiteta ("ALPHA LEGION BASE · CITADEL LEVEL 12").

---

## 3. Zgrade (8)

Svaka zgrada: level 0–10. Level 0 = neizgrađena. Nadogradnja = projekat
(sekcija 4). Cijena raste `cost = base × level^1.6`, trajanje gradnje
`level × 6h` (skraćivo Prestige-om).

### 3.1 Command Center — srce baze
- **Gate za sve**: max članova (`20 + 10 × level`), officer slotovi
  (`1 + floor(level/2)`), broj aktivnih projekata (1; 2 na L5; 3 na L8),
  broj aktivnih misija, dostupnost ostalih zgrada
  (Archive traži CC3, Workshop CC4, Comms Hub CC5).
- Ne daje direktan bonus — otključava sistem.

### 3.2 Mission Control — misije
- L1: 1 sedmična misija · L3: operacije · L5: izbor 1 od 3 ponuđene ·
  L7: sezonske misije · L10: 3 paralelne misije + custom parametri.

### 3.3 Training Grounds — progres članova
- +2% Clan XP po levelu iz achievementa (max +20%), sedmični clan
  challenge bonus, veći limit squad misija.
- **Nikad lični XP** — samo clan-side.

### 3.4 Archive — znanje i identitet
- Clan liste slotovi (2 + level), zajednička kolekcija (Clan Library),
  Game of the Month (L2), **Clan DNA** (L3 — agregirani `GamerDnaService`
  preko članova: žanrovi, ere, arhetipovi, "Dominant archetype:
  Competitive Explorers"), clan Top 100 (L5), retrospektive (L7).

### 3.5 Communications Hub — social
- Announcements (1 + level aktivnih), clan polls (L2), event scheduling
  (L3 — koristi postojeći kalendar events koncept), voting za sljedeću
  misiju (L5), Discord webhook integracija (L7, kasnije).

### 3.6 Workshop — kozmetika
- Otključava **katalog** clan kozmetike po levelu (frame, banner, member
  badge, animirani banner, username efekt, sezonski trofej-skin) — ali
  se svaki komad i dalje **zarađuje** kroz misije/milestone, ne kupuje.
  Workshop level = šta je uopšte moguće dobiti.

### 3.7 Trophy Hall — memorija klana
- Trofeji: osvojene sezone, leaderboard plasmani, završene operacije,
  rijetki clan achievementi, founding members, best member per season,
  timeline razvoja baze. Level = broj showcase slotova + dubina timelinea.
- Podaci se **upisuju kad se dese** (sezona završi → trofej), ne izvode
  retroaktivno.

### 3.8 Vault — treasury
- Kapacitet resursa (`10k × level` po resursu), dubina vidljivog ledgera,
  broj istovremenih boostera (1; 2 na L6), historija projekata,
  per-member contribution pregled.

---

## 4. Projekti (gradnja)

- Officer+ pokreće projekat: `Build Workshop → Level 4. Potrebno: 6.000
  Materials + 2.500 Intel.`
- Resursi se **doniraju iz treasuryja** (lider prebacuje) i/ili članovi
  doniraju direktno u projekat — oba upisana u ledger s user_id.
- Kad je 100% finansiran → tajmer gradnje → završetak → zgrada level up →
  feed event + notifikacija svim članovima.
- Svaki član vidi svoj lični % doprinosa projektu (iz ledgera).
- Speed Up: preostalo vrijeme skraćuje Prestige (`750 za 24h`, config).

---

## 5. Misije

### 5.1 Tipovi

| Tip | Opis | Primjer |
|---|---|---|
| **Individual** | svi pune isti bar | "Završite 20 igara iz backloga" (13/20) |
| **Squad** | traži N različitih članova | "5 članova igra istu igru", "3 člana objave Top 10" |
| **Operation** | višefazna, sedmična/mjesečna, milestone nagrade | "RPG Month: 30 RPG igara + 10 recenzija + 80 achievementa" — 4 faze, bar po fazi |
| **Seasonal Project** | jedan po sezoni, permanentna nagrada | "Izgradite Archive Wing prije kraja Season 03" |

### 5.2 Mehanika

- **Template-i u Filamentu** (admin piše misije): naziv, opis, tip,
  criteria_type (isti rječnik kao achievementi/questovi: games_completed,
  reviews_published, comments, lists_created, achievements_unlocked,
  sessions_logged…), base target, skalira li se, trajanje, nagrade
  (Intel/Materials/Prestige/kozmetika), min Mission Control level,
  season_id.
- **Instance po klanu**: scheduler (ponedjeljak 00:00) spawn-uje sedmične
  po Mission Control levelu; target skaliran po aktivnima u TOM klanu.
- **Progres**: isti event pipeline kao zarada resursa — jedan događaj
  puni i resurse i sve aktivne misije kojima criteria_type odgovara.
- **Dnevni limit doprinosa misiji po članu** (Travian princip — jedan
  igrač ne smije sam završiti kolektivni cilj).
- Nagrada ide u treasury + Prestige + eventualna kozmetika u Workshop
  katalog klana; feed event s breakdown-om najboljih doprinosa.

---

## 6. Boosteri

Officer+ aktivira, traje ograničeno, cooldown, cijena iz treasuryja.
Jedan aktivan (Vault L6 = dva). Multiplikator se primjenjuje u
`ClanResourceService::earn()`.

| Booster | Efekat | Trajanje | Cijena |
|---|---|---|---|
| Double Contribution Hour | 2× doprinos misijama | 1 h | 500 M |
| Achievement Hunt | 2× Materials iz achievementa | 24 h | 800 M |
| Backlog Weekend | 2× Materials iz završenih igara | 48 h | 1.200 M |
| Community Rally | +25% Intel iz komentara/recenzija | 24 h | 800 I |
| Recruitment Signal | istaknut u Discoveryju | 24 h | 300 P — jedini P sink pored Speed Up |

---

## 7. Data model (migracije)

```
clans (postojeća, dodati):
  level int default 1, xp bigint default 0,
  intel / materials / prestige bigint default 0,
  intel_lifetime / materials_lifetime / prestige_lifetime bigint,
  region varchar null, language varchar null,
  playstyle varchar null (competitive|casual|mixed),
  status varchar default 'recruiting' (recruiting|invite_only|closed),
  motto varchar null, requirements text null

clan_ledger:
  clan_id, user_id null, resource, amount(+/-), reason,
  balance_after, reference (morph null: mission/project/boost), created_at
  → JEDINI izvor istine za doprinose, breakdown-e i /hr statistike

clan_buildings: clan_id, key, level, unique(clan_id, key)

clan_projects:
  clan_id, building_key, target_level,
  cost_intel/materials, funded_intel/materials,
  status (funding|building|done|cancelled),
  started_by, finishes_at, completed_at

clan_mission_templates:
  name, description, type, criteria_type, base_target, scales bool,
  duration_days, reward_intel/materials/prestige, reward_cosmetic null,
  min_mission_control, season_id null, stages json null (za operacije)

clan_missions (instance):
  clan_id, template_id, target, progress, stage, status,
  starts_at, ends_at, completed_at

clan_mission_progress: mission_id, user_id, amount, day (za dnevni limit)

clan_activities (feed): clan_id, user_id null, type, title, meta json

clan_applications: clan_id, user_id, message, status, handled_by

clan_boosts: clan_id, key, starts_at, ends_at, activated_by

clan_trophies: clan_id, type, title, description, season_id null, meta, awarded_at

clan_cosmetics: clan_id, key, unlocked_at, equipped bool
```

## 8. Servisi

- **`ClanResourceService`** — `earn(User, resource, amount, reason)`:
  resolve klan → dnevni cap → boost multiplikatori → Vault kapacitet →
  ledger + balansi + lifetime → Clan XP → feed → mission progress
  dispatch. Jedna ulazna tačka za SVE.
- **`ClanLevelService`** — XP krivulja, tier imena, gate provjere.
- **`ClanMissionService`** — spawn, skaliranje, progres, završetak,
  nagrade.
- **`ClanProjectService`** — pokretanje, finansiranje, tajmeri, završetak.
- **`ClanDnaService`** — agregacija `GamerDnaService` preko članova (keš 1h).
- Scheduler: sedmični spawn misija, istek boostera, završetak gradnje
  (`ProcessClanTimers` svakih 5 min), sezonski obračun.

## 9. Stranice

### 9.1 `/clans` — Discovery
Hero + search + filteri (region, language, playstyle, size kategorija,
recruiting) · clan kartice (emblem, tag, tier ikona, level, članovi,
Prestige, 7-dnevni activity sparkline iz ledgera) · leaderboard tabovi
(Small/Medium/Large/Overall) · Create Clan flow (postojeći, doradjen).

### 9.2 `/clans/[slug]` — javni profil (mockup 1)
- **Header**: emblem, ime+tag, motto, region, founded, članovi (X/limit +
  online preko postojećeg presence), tier+level, status; Manage/Invite/Chat
  za članove, **Apply** za posjetioce.
- **Stat strip**: Members · Prestige · Season Rank · Wins/Events ·
  Activity Score (7-dnevna zarada) · Treasury.
- **Clan Feed** (clan_activities) · **Roster** (rola, online, main game
  izveden iz journala/kolekcije, contribution iz ledgera) · **About** ·
  **Season progress panel** · **Clan Leaderboard** (top doprinosi) ·
  **Pending Applications** (officer+) · **Upcoming Events** · **Clan
  Games** (najigranije igre članova) · **Clan Achievements/Trophies** ·
  **Online Now**.

### 9.3 `/clans/[slug]/base` — baza (mockup 2, samo članovi)
- **Header**: ime, tier+level, Clan XP bar do sljedećeg levela, resursi
  sa `/hr` stopama (7-dnevni prosjek iz ledgera).
- **Node mapa baze**: proceduralna scena u TechPlay jeziku — 8 zgrada kao
  klikabilni čvorovi s level čipovima; klik otvara panel zgrade (efekti
  sada / sljedeći level / upgrade dugme). Pozadinska ilustracija po temi
  = kasniji kozmetički sloj, sistem ne čeka na nju.
- **Desna kolona**: Active Operation (bar + faze + vrijeme), Current
  Construction (funding %, donate, speed up), Active Boost (countdown),
  Quick Actions, Resource Breakdown, Active Timers.
- **Ispod**: Member Contributions (week/season/all iz ledgera), Base
  Upgrades & Bonuses (trenutne dobiti + preview sljedećeg levela),
  Recent Activity, Mission Board.

### 9.4 Manage ekrani (officer+/owner)
Aplikacije, role, postavke (motto, region, status, requirements),
projekat start, boost aktivacija, misija izbor.

## 10. Admin (Filament)
- `ClanResource` — pregled resursa/zgrada/ledgera, ručne korekcije.
- `ClanMissionTemplateResource` — pisanje misija bez koda.
- `ClanTrophyResource` — ručna dodjela trofeja (event pobjede).
- Sva ekonomska podešavanja u `config/clan.php` — bez deploya mijenja se
  `.env`/config cache, ne kod.

## 11. Šta se NE gradi (odgođeno s razlogom)
- **Clan chat kanali** — ne postoji chat infrastruktura; zaseban projekat.
- **Custom reakcije** — sitno, poslije Comms Huba.
- **Discord integracija** — L7 Comms perk, tek kad je sve stabilno.
- **Teme baze (Cyberpunk/Medieval…)** — kozmetički sloj na gotov sistem.
- **Clan War / PvP** — najveći kasniji dodatak; ovaj plan mu ostavlja
  mjesto (Prestige, trofeji, sezone) ali ga ne obećava.

## 12. Faze isporuke (svaka faza = deploy + živa vrijednost)

| Faza | Sadržaj | Vrijednost odmah |
|---|---|---|
| **F1 — Ekonomija** | migracije, ClanResourceService + hookovi, capovi, Clan XP/level, feed, aplikacije, region polja, testovi | resursi se tiho gomilaju od dana 1 — kad stranice stignu, klanovi već imaju historiju |
| **F2 — Stranice** | /clans discovery + javni profil (mockup 1), aplikacije UI, leaderboard kategorije | klanovi dobijaju lice i takmičenje |
| **F3 — Baza** | zgrade, projekti, Vault, CC gating, node mapa (mockup 2), doprinosi | loop: zaradi → uloži → izgradi |
| **F4 — Misije** | template engine, instance, skaliranje, Mission Control, operacije UI, scheduler | loop postaje kompletan |
| **F5 — Boosteri + sezona** | boosteri, sezonski projekat, season rank, obračun i trofeji na kraju sezone | dugoročni ritam |
| **F6 — Identitet** | Archive (Clan DNA, GotM, liste), Workshop kozmetika, Trophy Hall, Comms (polls, events) | razlog za ostanak i ponos |

Svaka faza: pint + puni test suite + build + deploy, po našem workflow-u.

## 13. Rizici
- **Mrtve baze**: clan od 3 neaktivna člana s praznom bazom izgleda
  depresivno → empty-states pišu šta treba uraditi, discovery gura
  aktivne klanove, "Founding" badge za mlade klanove.
- **Balans brojeva**: sve početne vrijednosti su pretpostavke → zato SVE
  u config/clan.php + ledger omogućava rebalans i retroaktivnu analizu.
- **Performanse**: earn hook na svakom komentaru → mora biti jeftin
  (jedan indexed upsert + increment; mission dispatch queued).
- **Feature creep**: ovaj dokument je granica. Novo = novi red ovdje,
  svjesna odluka, ne usputni dodatak.
