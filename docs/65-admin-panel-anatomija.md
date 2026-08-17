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

### 4. Dashboard ima dva sistema statistike na istoj stranici — *riješeno 17.08.2026*

`StatsOverview` widget (vrh stranice) pokazuje **Total Users** i
**Published Articles**.

Ispod njega, ručno napisan HTML u `dashboard.blade.php` (141 red, s vlastitim
`<style>` blokom) pokazuje četiri kartice: **Drafts, Pending, Today, Users**.

„Users" je tu dvaput, jednom u Filamentovoj kartici a jednom u ručno pisanoj —
dva različita izgleda za isti broj, jedan ispod drugog.

**Šta je sada.** `dashboard.blade.php` i `StatsOverview` su obrisani. Pet
widgeta, po redu kojim se pitanja stvarno postavljaju:

| Widget | Odgovara na | Keš |
|---|---|---|
| `NeedsAttention` | čeka li me išta? | 60 s |
| `PublishingPulse` | objavljujemo li još? | 300 s |
| `CatalogueHealth` | koliki dio kataloga je u sitemapu? | 900 s |
| `CommunityPulse` | ima li koga? | 300 s |
| `RecentContent` | šta je izašlo i kako je prošlo? | — |

Pravilo je jedno: **svaki broj mora mijenjati šta radiš sljedeće.** Zbir koji
samo raste — registrovanih korisnika, ikad objavljenih članaka — jednak je i u
najboljoj i u najgoroj sedmici, pa ide u izvještaj a ne na ekran koji se otvara
dvadeset puta dnevno. `NeedsAttention` zato prikazuje samo ono što nije nula:
red „Komentari na čekanju: 0" je prostor koji oko nauči preskakati, a onda ga
preskoči i onog dana kad piše 14.

**Dvije greške koje su preživjele prvi deploy**, obje vrijedne pamćenja:

1. Metode su se zvale `stats()`, a `StatsOverviewWidget` zove **`getStats()`**.
   Provjerio sam ih pozivajući `stats()` refleksijom — što je tačno pogrešan
   test: dokazao je da upiti vraćaju smislene brojeve i ništa o tome hoće li ih
   Filament ikad zatražiti. Widgeti su iscrtavali naslov nad praznim tijelom.
2. Sidebar je izgledao kao da je izgubio natpise. Nije — bio je skupljen, a
   `collapsedSidebarWidth('9rem')` je skupljeno stanje činio 144px širokim, tri
   širine ikonice prazne kolone. Override je uklonjen.

Stat widgeti su **lazy** (Filamentov default), pa ih render same stranice ne
vidi — sadržaj stiže drugim Livewire zahtjevom. Provjera ide preko
`Livewire::mount($klasa)`, ne preko HTML-a `/admin`.

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

### A. Preurediti navigaciju — *urađeno 17.08.2026*

Osam grupa, ravnomjerne težine. Ono što stvarno stoji u sidebaru danas
(prazni resursi su sakriveni, pa je vidljivih 36 od 42):

| Grupa | Stavke | Sakriveno dok je prazno |
|---|---|---|
| **Content Studio** | Release Calendar, News, Reviews, Guides, Tech, Media Library | — |
| **Game Database** | Games | Game Ratings |
| **GTA 6** | Characters, Vehicles, Weapons | — |
| **Community** | Users, Forum Categories, Threads, Comments | Reports, Posts |
| **Gamification** | Ranks, Achievements, Seasons, Quests, Rewards Store, Customizations, Bounty Ledger, Game Collections | — |
| **Shop & Monetization** | Giveaways, Support Tiers, Ad Campaigns | Products, Orders, User Supports |
| **SEO & Marketing** | SEO Manager, Ultimate SEO, Page SEO, Redirects, Newsletter Subscribers | — |
| **System** | Categories, Site Settings, Roles, Social Media, Analytics | — |

Tri pomjeranja nose najviše: **ekonomija je dobila svoje ime** (bila je osam od
četrnaest redova u Communityju, pa su Users i Threads stajali pored Bounty
Ledgera), Release Calendar se pridružio sadržaju umjesto da bude sam u grupi od
jedne stavke, a Giveaways je prešao u monetizaciju gdje i pripada.

`sort` vrijednosti su prenumerisane u korake od 10; stranice i resursi dijele
istu skalu jer se međusobno sortiraju.

Imena grupa nisu skraćivana na „Content" i „Monetization" kako je prvo
predloženo — postojeća imena rade, a preimenovanje bi bilo promjena koju treba
ponovo naučiti bez ičega zauzvrat.

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

### E. Sakriti prazne resurse dok se ne napune — *urađeno 17.08.2026*

Šest resursa s nula redova (ne sedam — `Review` je u međuvremenu obrisan):
Game Ratings, Orders, Posts, Products, Reports, User Supports. Svaki sada nosi:

```php
public static function shouldRegisterNavigation(): bool
{
    return static::getModel()::query()->exists();
}
```

Resurs ostaje dostupan preko URL-a i vrati se u sidebar sam s prvim zapisom.
Cijena je šest `SELECT EXISTS` upita po iscrtavanju navigacije, što je na
prometu admin panela ispod mjerljivog.

Za `Post` i dalje stoji pitanje je li model uopće u upotrebi — forum radi na
`Thread` + `ForumPost`. Sakrivanje kupuje vrijeme, ne odgovara na to.

---

## Dio 5 — Dizajn

Panel je funkcionalan i dosljedan jer je Brisk dosljedan. Prilagođavanja su
minimalna i to je dobro — ali tri stvari vrijede pažnje.

**Ručno pisani CSS na Dashboardu.** Jedini ekran koji ne izgleda kao ostatak
panela, jer jedini ima svoj `<style>`. Filamentov `Stat` widget izgleda drukčije
od `db-stat` kartice tik ispod njega.

**Ikone su se ponavljale na šest mjesta** — *riješeno 17.08.2026*. Prvo brojanje
je našlo pet parova jer je gledalo samo resurse; šesti je bio `calendar-days`,
koji su dijelili Seasons i Release Calendar (stranica, ne resurs).

| Bilo | Sada |
|---|---|
| Comments = Threads (`chat-bubble-left-right`) | Comments → `chat-bubble-oval-left-ellipsis` |
| Game Ratings = Reviews (`star`) | Game Ratings → `hand-thumb-up` |
| Giveaways = Rewards Store (`gift`) | Rewards Store → `building-storefront` |
| Page SEO = SEO Manager (`document-magnifying-glass`) | Page SEO → `document-text` |
| Quests = Reports (`flag`) | Quests → `map` |
| Seasons = Release Calendar (`calendar-days`) | Seasons → `clock` |

Provjera je sada dio pregleda: iscrtaj `$panel->getNavigation()` i prebroj ikone.
Nula ponovljenih na 36 vidljivih stavki.

**Skupljeni sidebar** je bio prisiljen na 9rem — 144px, tri širine ikonice. U
tom stanju nije izgledao presavijeno nego pokvareno, kao sidebar kojem natpisi
nisu učitani. Override je uklonjen; skupljeno je sad široko koliko i ikona, što
je jedino stanje koje se čita kao namjera.

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
