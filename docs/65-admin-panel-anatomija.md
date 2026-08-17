# 65 — Admin panel: anatomija, spajanja, dizajn

Pregled od 17. 08. 2026, nakon što su pokvarene stranice popravljene i mrtvi
resursi obrisani (`docs/60`). Ovo je drugi sloj: **šta panel jest, kako je
složen, i gdje ga ima smisla mijenjati.**

Sve brojke su iz samog panela — `Filament::getPanel('admin')` — a ne iz čitanja
fajlova. Razlika je bitna: fajl govori šta je neko napisao, panel govori šta je
stvarno sagrađeno.

---

## Dio 1 — Kako je panel podešen

```php
->spa()                          // navigacija bez punog reloada
->darkMode(true)
->defaultThemeMode(ThemeMode::Dark)
->sidebarCollapsibleOnDesktop()
->collapsedSidebarWidth('9rem')
->maxContentWidth(Width::Full)
->plugin(BriskTheme::make())
```

**Tema je Brisk** (`filafly/brisk`), ne NeoBrutalism. `CLAUDE.md` tvrdi
`caresome/filament-neobrutalism-theme` — taj paket nije instaliran. Dokumentacija
zaostaje za stvarnošću.

Font je `Instrument Sans`. Tema se uvozi jednim redom u
`resources/css/filament/admin/theme.css` i nije nigdje prilagođavana — panel
izgleda onako kako Brisk izgleda.

Uz to jedan `renderHook` koji ubacuje JavaScript da spriječi gubitak fokusa na
dugmadima rich editora. To je zakrpa za Filamentov problem i vrijedi da stoji
zapisana kao takva, jer izgleda kao slučajan kod.

---

## Dio 2 — Šta panel sadrži

**37 resursa, 5 stranica, 8 widgeta** u osam navigacionih grupa.

### Editorial Tools — 1 stavka

| Stavka | Redova | Napomena |
|---|---|---|
| Release Calendar | — | jedina stavka; nosi bedž (3) |

### Content Studio — 6 stavki

| Stavka | Redova u bazi | Polja | Kolona | Filt. | Veličina koda |
|---|---|---|---|---|---|
| News | 625 | 11 | 7 | 2 | 332 |
| Reviews | 625 | 30 | 7 | 2 | **585** |
| Guides | 4 | 14 | 6 | 1 | 348 |
| Tech | 625 | 10 | 7 | 2 | 306 |
| Media Library | 36 | 5 | 7 | 2 | 224 |
| Giveaways | 2 | **30** | 6 | 1 | **532** |

### Game Database — 2 stavke

| Stavka | Redova | Polja | Kolona |
|---|---|---|---|
| Games | **142.110** | 20 | 8 |
| Game Ratings | 0 | 4 | 5 |

### GTA 6 — 3 stavke

Characters (12), Vehicles (121), Weapons (36). Po 9–10 polja svaki, gotovo
identične strukture.

### Community — **14 stavki**

Users (52), Forum Categories (31), Threads (7), Posts (0), Comments (19),
Reports (0), Ranks (25), Achievements (67), Seasons (3), Quests (42),
Game Collections (8), Rewards Store (6), Customizations (31),
Bounty Ledger (317).

### Shop & Monetization — 5 stavki

Products (0), Orders (0), Support Tiers (3), User Supports (0), Ad Campaigns (2).

### SEO & Marketing — 5 stavki

SEO Manager (625, samo lista), Ultimate SEO (stranica, 282 reda), Page SEO (44),
Redirects (21), Newsletter Subscribers (7).

### System — 5 stavki

Categories (31), Site Settings (44), Roles (5), Social Media (stranica),
Analytics (stranica).

---

## Dio 3 — Šta je pogrešno složeno

### 1. „Community" je ostava sa 14 stavki

Grupa drži četiri različita posla pod jednim imenom:

| Zapravo je | Stavke |
|---|---|
| **Ljudi** | Users, Ranks |
| **Forum** | Forum Categories, Threads, Posts |
| **Moderacija** | Comments, Reports |
| **Ekonomija i gamifikacija** | Achievements, Seasons, Quests, Rewards Store, Customizations, Bounty Ledger, Game Collections |

Sedam od četrnaest stavki su XP/bounty ekonomija — cijela jedna oblast bez
vlastitog imena. Moderator koji traži prijave prolazi kroz sezone i trgovinu
nagrada da bi stigao do njih.

Nasuprot tome, **Editorial Tools ima jednu stavku**. Grupa s jednim članom nije
grupa, to je naslov.

### 2. News i Tech su isti ekran

Polja koja svaki nudi:

```
News:  author_id category_id content excerpt game_id is_featured_in_hero
       published_at slug status tags title
Tech:  author_id category_id content excerpt         is_featured_in_hero
       published_at slug status tags title
```

**Razlika je jedno polje** — `game_id`. A to je 332 + 306 = **638 redova koda**
za dva ekrana koji rade istu stvar nad istom tabelom, razlikujući se samo po
`whereHas('category', type = 'news' | 'tech')`.

Reviews je isti obrazac plus četiri recenzentska polja (`review_score`,
`review_data`, `item`, `catalogue_game_search`) — ali u **585 redova**.

Svaka izmjena u načinu uređivanja članka mora se napraviti tri puta. Ako se
zaboravi na jednom, dvije sekcije se počnu ponašati različito, a niko to ne vidi
dok neko ne primijeti.

### 3. Šest od osam widgeta niko nikad ne vidi

`discoverWidgets` ih sve registruje — panel ih broji osam. Ali `Dashboard`
izričito navodi svoje:

```php
getHeaderWidgets() → StatsOverview
getFooterWidgets() → MostViewedArticles
```

Ostalih šest su sagrađeni, registrovani i nevidljivi:

| Widget | Šta bi pokazivao | Redova |
|---|---|---|
| `SeoStatsWidget` | objavljeni članci, nedostajući meta, mrtvi linkovi, siroče stranice | 56 |
| `BrokenLinksWidget` | lista mrtvih linkova | 56 |
| `OrphanPagesWidget` | stranice bez dolaznih linkova | 50 |
| `AdCampaignStats` | prikazi, klikovi, procijenjeni prihod, aktivne kampanje | 59 |
| `TopPerformingAds` | najuspješnije kampanje | 71 |
| `DiscordStatsWidget` | povezani korisnici, udio XP-a s Discorda | 30 |

**322 reda napisanog i održavanog koda koji ne stiže ni do jednog ekrana.**
Ironija je da `BrokenLinksWidget` i `OrphanPagesWidget` prikazuju baš ono što
`ScanBrokenLinks` cron piše u bazu svake nedjelje — podaci se skupljaju i nikom
ne pokazuju.

### 4. Dashboard ima dva sistema statistike na istoj stranici

`StatsOverview` widget (vrh stranice) pokazuje **Total Users** i
**Published Articles**.

Ispod njega, ručno napisan HTML u `dashboard.blade.php` (141 red, s vlastitim
`<style>` blokom) pokazuje četiri kartice: **Drafts, Pending, Today, Users**.

„Users" je tu dvaput, jednom u Filamentovoj kartici a jednom u ručno pisanoj —
dva različita izgleda za isti broj, jedan ispod drugog.

### 5. Sitnije, ali stvarno

| Nalaz | Zašto smeta |
|---|---|
| `Roles` i `Social Media` oba imaju `sort = 3` u System grupi | redoslijed je slučajan, mijenja se između deployeva |
| GTA 6 koristi `sort` 11, 12, 13 za tri stavke | brojevi nemaju značenje; grupa ih ionako drži zajedno |
| Sedam resursa ima **nula redova** | GameRating, Order, Post, Product, Report, UserSupport — svaki je stavka u sidebaru koju treba preskočiti |
| `Posts` (0) stoji uz `Threads` (7) | forum koristi `Thread` + `ForumPost`; `Post` je treći model koji niko ne puni |
| Tri SEO površine se iz sidebara ne razlikuju | SEO Manager / Ultimate SEO / Page SEO — audit iz avgusta je potvrdio da nisu duplikati nego tri sloja, ali imena to ne kažu |
| `Categories` i `Forum Categories` su isti model | razlikuje ih `type`; ispravno, ali iz sidebara izgleda kao greška |

---

## Dio 4 — Prijedlog

Poredano po odnosu koristi i rizika.

### A. Preurediti navigaciju *(bez rizika, najveći efekat)*

Iz osam grupa sa 14-članom ostavom u sedam s ravnomjernom težinom:

| Grupa | Stavke |
|---|---|
| **Content** | Release Calendar, News, Reviews, Guides, Tech, Media Library |
| **Game Database** | Games, Game Ratings |
| **GTA 6** | Characters, Vehicles, Weapons |
| **Community** | Users, Forum Categories, Threads, Comments, Reports |
| **Gamification** | Ranks, Achievements, Seasons, Quests, Rewards Store, Customizations, Bounty Ledger, Game Collections |
| **Monetization** | Products, Orders, Support Tiers, User Supports, Ad Campaigns, Giveaways |
| **SEO** | SEO Manager, Ultimate SEO, Page SEO, Redirects, Newsletter |
| **System** | Categories, Site Settings, Roles, Social Media, Analytics |

Tri pomjeranja koja nose najviše: **ekonomija dobija svoje ime**, Release
Calendar se pridružuje sadržaju umjesto da bude sam, a Giveaways prelazi u
monetizaciju gdje i pripada.

Uz to: `sort` vrijednosti prenumerisati u korake od 10, da se novo umetanje ne
sudara.

### B. Spojiti News, Reviews i Tech u jedan resurs *(srednji rizik, najveća ušteda)*

Jedan `ArticleResource` s tri unaprijed filtrirana taba, umjesto tri klase:

```
Articles
 ├─ News      (category.type = news)
 ├─ Reviews   (category.type = reviews)   + review polja
 └─ Tech      (category.type = tech)
```

Filament to podržava kroz `getPages()` s parametrom ili kroz tabove na listi.
Recenzentska polja se prikazuju uslovno — `->visible(fn ($get) => …)` — što je
obrazac koji već koristimo drugdje.

**Ušteda: oko 900 redova od 1.223.** Važnije od redova: izmjena u uređivanju
članka radi se jednom.

Rizik je stvaran i zato ovo nije stavka A: tri postojeća ekrana rade, uređivački
tim ih koristi svaki dan, i prelazak mijenja URL-ove koje ljudi imaju u
bookmarkovima. Traži pripremu i redirect.

### C. Odlučiti o šest widgeta *(bez rizika)*

Ili ih staviti na Dashboard, ili obrisati. Trenutno stanje — sagrađeni, skriveni,
održavani — je najgore od tri mogućnosti.

Prijedlog: **SEO widgeti idu na SEO Manager stranicu** (tamo im je mjesto),
**AdCampaignStats i TopPerformingAds na Ad Campaigns**, **DiscordStats na
Dashboard**. Ništa se ne briše, sve dobija dom.

### D. Dashboard: jedan sistem statistike *(bez rizika)*

Ručno pisane kartice i `StatsOverview` rade isti posao dvaput, s „Users" u oba.
Spojiti u jedan widget sa šest brojeva — Drafts, Pending, Objavljeno danas,
Ukupno članaka, Korisnici, Komentari na čekanju — i obrisati inline `<style>`.

Dashboard tada ima: jedan red statistike, red brzih akcija, najčitanije članke.

### E. Sakriti prazne resurse dok se ne napune *(nizak rizik)*

Sedam resursa s nula redova su sedam stavki koje se svaki dan preskaču.
`shouldRegisterNavigation()` može vratiti `false` dok je tabela prazna — resurs
ostaje dostupan preko URL-a i pojavi se sam kad dobije prvi red.

Za `Post` treba prvo odgovoriti da li je model uopće u upotrebi; ako nije, ide
istim putem kao `Review`.

---

## Dio 5 — Dizajn

Panel je funkcionalan i dosljedan jer je Brisk dosljedan. Prilagođavanja su
minimalna i to je dobro — ali tri stvari vrijede pažnje.

**Ručno pisani CSS na Dashboardu.** Jedini ekran koji ne izgleda kao ostatak
panela, jer jedini ima svoj `<style>`. Filamentov `Stat` widget izgleda drukčije
od `db-stat` kartice tik ispod njega.

**Ikone su dosljedne osim na dva mjesta.** `star` se koristi i za Reviews i za
Game Ratings; `chat-bubble-left-right` i za Threads i za Comments; `flag` i za
Reports i za Quests; `gift` i za Giveaways i za Rewards Store. Četiri para
identičnih ikona u istom sidebaru — u skupljenom stanju (9rem) ikona je jedino
što se vidi.

**Skupljeni sidebar je 9rem.** To je dovoljno za ikonu i kratki tekst, ali kod 37
stavki i četiri ponovljene ikone, skupljeno stanje je teško čitati. Ili
razdvojiti ikone, ili prihvatiti da se sidebar drži otvoren.

---

## Šta ovaj dokument ne zna

- **Kako se panel zapravo koristi.** Nema mjerenja koji se ekrani otvaraju, pa je
  „Editorial Tools ima jednu stavku" nalaz o strukturi, ne o navikama. Ako se
  Release Calendar otvara deset puta dnevno, njegovo istaknuto mjesto je
  zasluženo.
- **Da li je 30 polja na Giveaways previše.** Izgleda mnogo, ali nagradna igra
  ima mnogo pravila. To bi rekao neko ko je popunio taj obrazac, ne brojanje.
- **Koliko traje uređivanje članka u praksi.** Mjereno je vrijeme učitavanja
  stranice, ne vrijeme rada.
