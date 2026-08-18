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

### Dashboard, drugi prolaz *(18.08.2026)*

Screenshot je otkrio tri stvari odjednom.

**Panel se iscrtavao u svijetlom modu.** Namješten je na
`defaultThemeMode(Dark)`, ali default je samo default — spremljena postavka ili
OS pobjeđuju. Dvadeset šest od trideset devet pravila u temi bilo je pod
`.dark`, dakle **dvije trećine teme se toj osobi nikad nisu ni prikazale.**
Tokeni sada dolaze u paru: oblik (radijus, pismo, gustina reda) piše se jednom i
važi u oba moda, boja čita token koji se mijenja s modom, a doslovnog bijelog ni
crnog nema izvan ta dva bloka.

**Prvi red je bio ragged** — dvije kartice i trećina prazne stranice pored njih.
Uzrok: mreža stranice bila je tri kolone, a svaki stats widget ionako sam slaže
svoje kartice, pa je mreža odlučivala samo šta biva s ostatkom. Stranica je sada
**jedna kolona** — niz punih traka, svaka jedno pitanje — a svaki widget kaže
koliko kartica ima kroz `getColumns()`.

**Dodan je Reach**, jer je dashboard znao reći koliko je članaka izašlo i ni
riječi o tome jesu li sletjeli.

| Šta pokazuje | Danas |
|---|---|
| Ukupno pregleda članaka | 133.992 kroz 625 objavljenih |
| Zarađeno ovaj mjesec | 1.677 od 16 objavljenih |
| Najbolji ovaj mjesec | 569 pregleda, imenovan i povezan na svoju izmjenu |

**Graf prometa nije moguć i neće biti bez novog bilježenja.** `article_reads`
ima 32 reda otkako su u avgustu ukinuti zapisi po posjeti, a `articles.views` je
brojač bez istorije. Nijedna tabela u bazi nema dnevni niz. Ono što brojač može
reći je oblik mjeseca, i to je ono što Reach pokazuje.

Redoslijed pitanja je sada: *čeka li me išta → objavljujemo li → je li iko
pročitao → kakav je katalog → ima li koga → šta je izašlo.*

### Dashboard, treći prolaz — od tabele do konzole *(18.08.2026)*

Drugi prolaz je odgovarao na prava pitanja i **izgledao kao spreadsheet**: pet
traka po tri identične bijele kocke, petnaest brojeva iste veličine u istom
okviru, i ništa nije govorilo koji čitati prvi. Ivica je jak signal i treba da
znači „ovo je druga stvar" — potrošena na svaki broj ne znači ništa.

Šest widgeta je postalo **jedan** (`NewsroomConsole`) s jednim keširanim upitom
umjesto jednog po kocki, plus tabela ispod.

**Četiri odluke koje čine razliku:**

| Princip | Kako izgleda |
|---|---|
| Veličina nosi rang | Dana od zadnje objave je najveći broj na stranici — jedino stanje ovdje koje se pogoršava što ga duže niko ne primijeti |
| Oblik nosi stanje | Udio ima traku (koliko kataloga pretraživači vide, koliko je sezone proteklo), niz ima liniju |
| Hairline umjesto okvira | Povezani brojevi dijele plohu, razdvojeni linijom od 6% |
| Boja je racionirana | Četiri stanja; akcent se pojavljuje **jednom**, na crti iznad vodeće plohe |

Sparkline je konačno širok koliko i panel umjesto četrdeset piksela u kartici —
SVG putanja se računa u PHP-u iz istog niza od 14 dana.

Red čekanja više nisu kartice nego traka čipova, svaki vodi na svoj ekran, i
poredani su po tome čime se prvo treba pozabaviti — neuspjeli posao ispred
drafta, jer je draft nečija odluka a neuspjeli posao nešto što se pokvarilo. Kad
nema ničega: jedna tiha rečenica umjesto reda nula.

Stil je u zasebnom `dashboard.css`, sve boje čitaju tokene definisane za oba
moda. **Doslovnog bijelog ni crnog u tom fajlu nema.**

---

## Panel na telefonu *(18.08.2026)*

Filament je responzivan i ništa ovdje nije spašavanje. Ono što ne daje je oblik
koji telefon uči čovjeka da očekuje: **traka pod palcem.** Na stolu je sidebar
ispravan; na telefonu je ladica koju moraš dozvati iz gornjeg desnog ugla —
najdalje tačke od palca.

### Četiri odredišta i ulaz u ostalo

Biraju se po tome šta se radi **u adminu** s telefona, a to je druga lista od
one po čemu čitalac otvara sajt. **Admin je svoj sistem** i njegova traka se ne
izvodi iz frontendove. Niko ne piše recenziju od dvije hiljade riječi na
telefonu; na telefonu provjeravaš, odobravaš i postavljaš fotografiju.

| Tab | Zašto je tu |
|---|---|
| **Dashboard** | čeka li me šta, objavljujemo li |
| **Articles** | pročitaj šta je izašlo, objavi što je spremno |
| **Comments** | red moderacije, s brojem na samom tabu |
| **Media** | upload iz galerije — jedini admin posao koji telefon radi *bolje* od stola |
| **More** | otvara Filamentovu ladicu preko `$store.sidebar.open()` |

Peto dugme namjerno ne pravi drugi meni. U sidebaru je 36 stavki i one imaju
jedno mjesto.

### Ostalo što traka nosi sa sobom

- Targeti od **56px** — iznad praga od 44
- `env(safe-area-inset-bottom)` za home indicator
- Blur na donjoj **i** gornjoj traci, da okvire sadržaj kao jedna aplikacija
- `.fi-main` dobija donji padding, da sadržaj ne završi pod trakom
- Naslov stranice i akcije se slažu jedno pod drugo umjesto da se otimaju o red
- Akcent se troši na dvije stvari: crta na gornjoj ivici trake i pločica ispod
  aktivne ikone — pa je „ovdje si" najglasnije na traci
- `prefers-reduced-motion` gasi prelaz

Sve ispod **1024px**; iznad toga panel je netaknut, a traka je skriveni `<nav>`.
Stil je u `mobile.css`, boje preko istih tokena, bez ijednog doslovnog bijelog.

`RecentContent` je preveden na engleski; bio je posljednji bosanski ostatak u
panelu.

### 5. Sitnije, ali stvarno

| Nalaz | Zašto smeta |
|---|---|
| `Roles` i `Social Media` oba imaju `sort = 3` u System grupi | redoslijed je slučajan, mijenja se između deployeva |
| GTA 6 koristi `sort` 11, 12, 13 za tri stavke | brojevi nemaju značenje; grupa ih ionako drži zajedno |
| Sedam resursa ima **nula redova** | GameRating, Order, Post, Product, Report, UserSupport — svaki je stavka u sidebaru koju treba preskočiti |
| `Posts` (0) stoji uz `Threads` (7) | ~~forum koristi `Thread` + `ForumPost`; `Post` je treći model koji niko ne puni~~ **netačno, vidi ispod** |
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

### `Post` nije mrtav model — forum je prazan *(provjereno 17.08.2026)*

Ovaj dokument je dvaput tvrdio da forum radi na `Thread` + `ForumPost` i da je
`Post` treći model koji niko ne puni. **Netačno.** `ForumPost` model ne postoji;
`ForumPostObserver` posmatra baš `Post`. Forum ima dva modela, ne tri:

```
Thread  →  tema
Post    →  odgovor u temi
```

`Post` je referenciran na 18 mjesta u živom kodu — `ForumController` (8×,
uključujući `createPost`, spajanje tema, označavanje rješenja),
`PostReactionController`, `GiveawayController` (uslov za učešće),
`ReportController`, relacije na `Thread`, `User` i `Category`, observer i
policy. Put za odgovaranje je cijel:

| Sloj | Stanje |
|---|---|
| `POST /forum/threads/{slug}/posts` | postoji, `throttle:20,1` + `ban.check` |
| `ThreadClient.tsx` | zove je, plus izmjena, brisanje i označavanje rješenja |
| `/forum` i stranica teme | HTTP 200 |
| `/forum` u navigaciji | linkovan 3× s naslovne |

Nula redova znači tačno ono što piše: **niko nikad nije odgovorio.** Svih 7 tema
je napravljeno 27.01.2026, istog dana, i to su uvodne teme („Welcome to
TechPlay", „The Introduction Megathread", „The Rig Showcase"). Nula reakcija na
odgovore jer nema odgovora.

To je proizvodno pitanje, ne tehničko, i sakrivanje reda iz sidebara je ovdje
ispravan potez upravo zato: ništa se ne briše, a red se vrati sam onog dana kad
neko prvi put odgovori.

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

---

## Release Calendar, redizajn *(18.08.2026)*

### Prvo: tri kolone kojih nema

Stranica je čitala `background_image`, `details_data` i `platform_names` —
**sve tri preimenovane** u sanaciji kataloga igara, i nijedna od tada nije
postojala. Posljedica se vidjela na svakom paru: sive kocke umjesto
naslovnica, bez izdavača, bez platformi.

A podaci su bili tu cijelo vrijeme:

| | |
|---|---|
| Unosa u kalendaru | 2.461 |
| Sa `cover_url` | **2.461** |
| S izdavačem | **2.461** |
| S platformama | **2.460** |

Stranica nije prikazivala ništa tamo gdje je mogla prikazati sve. Poslije
popravke: šest naslovnica na tri para, **nijedna prazna**.

### Zatim: raspored po pravilima konzole

**Pet kartica u dvokolonskoj mreži** — s rupom gdje je peta trebala biti —
zamijenjeno je **jednom tabelom prodavnica**. Dijele istu mjeru, koliki dio
onoga što prodavnica nudi je stigao u kalendar, a udio se čita samo jedan
pored drugog:

| Prodavnica | U kalendaru | Viđeno | Udio |
|---|---|---|---|
| Steam | 1.978 | 3.162 | 63% |
| Nintendo | 230 | 311 | 74% |
| PlayStation | 88 | 116 | 76% |
| **Xbox** | **357** | **42.344** | **0,8%** |

Xbox je razlog zašto taj oblik uopšte treba: 357 od 42.344 je druga vrsta
broja od Steamovih 1.978 od 3.162, i pet odvojenih kutija je to potpuno
sakrilo.

**Tri gola broja za tri mjeseca** postala su trake u razmjeri. „1.609 · 704 ·
148" se čita kao *tri mjeseca*; nacrtano se čita kao **kraj sezone**.

Red čekanja je dobio broj u naslovu, a zastarjela sinhronizacija boju —
PlayStation nije osvježen sedmicu dana dok su ostali od jučer.

### Ostavljeno namjerno

`pending()` traje **531 ms sa samo pet upita** — dakle nije baza nego
uparivanje u PHP-u, kroz `GameMerger::candidates()` i `GameMatcher::verdict()`.
To je posao zbog kojeg stranica postoji.

Kraći keš bi to skratio, ali Livewire ponovo iscrtava poslije svake odluke —
pa bi ti se par koji si upravo riješio vratio na ekran. Tačnost je ovdje
vrednija od pola sekunde.

Stil je u `calendar.css` i nastavlja se na tokene iz `dashboard.css` —
`.tp-panel`, `.tp-huge`, `.tp-eyebrow`, `.tp-bar` i tonovi dolaze odande.
To je i bila poenta pisanja tog fajla na taj način.

---

## Cetiri ekrana za pisanje *(18.08.2026)*

Poravnaj u glavi: News, Reviews, Guides i Tech su **jedan** ekran nacrtan
cetiri puta. Sada su i u kodu jedan — `ArticleEditorFields` i `ArticleTable`,
uz `PublishTab`, `SeoFields` i `MediaPickerFields` koji su vec bili zajednicki.

### Prvo: dvije kolone koje nista ne govore

Izmjereno na zivoj bazi prije nego je ista napisano:

| kolona | News 528 | Reviews 38 | Tech 58 | Guides 4 |
|---|---|---|---|---|
| Status | **528 published** | 38 published | 55 od 58 | 4 published |
| Zvjezdica (hero) | 14 (2,7%) | 2 | **0** | — |
| Pregledi | *sakriveni* | *nema kolone* | *sakriveni* | *sakriveni* |
| Autor | *nema kolone* | *nema kolone* | *nema kolone* | ima |

Status je crtao istu zelenu znacku na **svakom** redu tri od cetiri liste.
Kolona koja nikad ne moze pomoci da nesto nadjes, treca s desna. Zvjezdica je
crtala 514 praznih obrisa **u akcentnoj crvenoj** — najsvjetlija ponovljena
oznaka na ekranu znacila je „ne".

A `views`, jedini broj koji se razlikuje po redu i odgovara na jedino pitanje
koje se postavlja starom arhivom, bio je **iskljucen po defaultu** na sve tri
liste koje su ga imale, a Reviews ga nisu imali uopste. Reviews u prosjeku
imaju **1.124** pregleda prema Newsovih 116 — to niko nije mogao vidjeti.

I: sest ljudi pise News (Dogashin 259, FrendlyKraken 105, adi 63,
XLBanana47 52, Kurlaga 45, Zdase 4) a nije bilo ni kolone ni filtera za autora.

### Pravilo

Isto koje vazi za konzolu na Dashboardu: **kolona zasluzuje sirinu time sto se
razlikuje medju redovima.** Status i hero vise nisu kolone nego oznake na
vlastitom redu, i pojave se samo kad red **nije** obican. Oboje ostaju u
filterima — tako se za njih pita namjerno, umjesto da ti se 528 puta odgovori.

Na njihovo mjesto ide ono sto je bilo sakriveno: potpis (rubrika · autor) i
pregledi, sa zbirom u podnozju — pa svaki filter odgovara na pitanje: izaberi
autora, procitaj njegov doseg.

Naslovnica se crta **16:9** umjesto kruzno. Svaki clanak ima sliku, pa je 528
puta jedna 16:9 fotografija bila obrezana u disk velicine avatara — prva stvar
u redu izgledala je kao da govori *ko*, a govorila je *sta*.

### Forma: mjesto za pisanje

Naslov je bio input od 14px pod natpisom „Article Title", iste tezine kao
permalink ispod njega. Sada:

- naslov u velicini naslova, bez natpisa;
- permalink odmah ispod, mali i mono — izveden je i cita se cesce nego sto se
  mijenja;
- standfirst dobija vlastiti red (ranije pola reda i dva reda visine, iako je
  to recenica koja mora prodati tekst na kartici i u dijeljenju);
- platno visoko 34rem, s ljepljivom trakom alata i mjerom od 42rem;
- iz sekcije tijela izbacen opis „Write your article using the rich text
  editor" — objasnjavao je traku alata nekome ko je koristi svaki dan, i to
  na svakom otvaranju.

### Popravljeno usput

**Izmjena naslova objavljenog clanka prepisivala je slug.** `afterStateUpdated`
je radio i na ekranu za izmjenu, pa je ispravka tipfelera u naslovu tiho
pomjerala **zivi URL** — svi dolazni linkovi na 404, bez ijedne rijeci na
ekranu. Vjerovatno odatle dobar dio od 21 reda u Redirects. Sada se slug pise
sam samo pri kreiranju; test to zakljucava.

**Razdjelnik u Media tabu bio je bijel na bijelom.** Crtao se inline kao
`rgba(255,255,255,0.08)` — nevidljiv svakome ko panel drzi u svijetloj temi.
Ista greska kao ona s pravilima pod `.dark`. Cijeli Media tab sada cita tokene.

**Test koji nista ne provjerava.** `InputHardeningTest` je pisao u `seo_text`,
kolonu obrisanu 18.08. — pisanje u nepostojecu kolonu ne tvrdi nista, a cita se
kao pokrivenost. Obrisan, uz objasnjenje zasto.

### Izmjereno poslije (zagrijano, tri prolaza, najbolji)

| Lista | Vrijeme | Upita | Najsporiji upit |
|---|---|---|---|
| News | 285 ms | 8 | 3,1 ms |
| Reviews | 280 ms | 8 | 5,6 ms |
| Tech | 282 ms | 8 | 4,5 ms |
| Guides | 143 ms | 4 | 1,3 ms |
| *Games (nedirano)* | 197 ms | 1 | 1,8 ms |
| *Comments (nedirano)* | 220 ms | 4 | 2,4 ms |

Baza je ~13 ms od 285; ostalo je Blade. To je isti pojas kao liste koje nisu
dirane, pa ovo nije bila izmjena brzine i ne tvrdi se da jest.

Dvije sitnice vrijedi znati: Filament racuna zbir **dvaput** (2,2 + 2,6 ms), i
opcije filtera po kategoriji ucitava dvaput. Ostavljeno — 5 ms za podnozje koje
svaki filter pretvara u odgovor.

### Provjere

`tests/Feature/ArticleDeskTest.php` — sedam testova. Svi idu kroz
`Livewire::test()` **i** `->call('loadTable')`: panel ima `deferLoading()`, pa
lista koja je samo montirana iscrta okvir i nijedan red, a tvrdnja o redovima
bi prosla ili pala iz pogresnog razloga.

---

## Revizija cetiri ekrana za pisanje *(18.08.2026)*

Prosao sam **svako polje sve cetiri forme** i uporedio ga s tabelom u koju
pise. To je provjera koje nije bilo, i naslo je nesto sto se nikako nije moglo
vidjeti s ekrana.

### Sest polja na Guides ekranu pisalo je u kolone kojih nema

| polje | sta je bilo |
|---|---|
| `steps` | **cijela sekcija Step-by-Step** — nema kolonu |
| `meta_title` | tabela ima `seo_title` |
| `meta_description` | tabela ima `seo_description` |
| `featured_image_alt` | nema kolonu |
| `featured_video_url` | nema kolonu |
| `tags` | nema kolonu |

Nijedno nije bilo u `$fillable`, pa je Laravel sve tiho odbacivao. **Forma se
iscrta, snimanje uspije, zapis se pojavi u listi.** Napises osam koraka, uz
svaki ucitas screenshot, pritisnes Create — vodic se snimi bez ijednog koraka i
bez ijedne poruke.

Sto je gore: dva od tih polja imala su svoj par u tabeli koji je stajao prazan.
`seo_title` i `seo_description` postoje na `guides` otkad je tabela napravljena
i **nikad ih niko nije ni pisao ni citao** — panel je pisao imena kolona koja
`articles` ima, a front je isao pravo na naslov i standfirst.

**Sada:** `steps` dobija `jsonb` kolonu (rad se vise ne baca), SEO tab pise
`seo_*` i `guides/[slug]` ih cita, a tags/alt/video se na tom ekranu ne nude —
jer ih tabela nema.

`tests/Feature/FormFieldsPersistTest.php` hoda kroz sva cetiri ekrana i pada
ako iko ponovo ponudi polje bez kolone. Uz to dva testa koja popune formu kao
covjek, pritisnu Create i procitaju red iz baze.

### Ostalo popravljeno

- **SEO provjera gleda i alt tekst.** 345 od 625 clanaka ima sliku bez opisa —
  jedina stvarna rupa u katalogu, a checker je o njoj sutio.
- **Reviews konacno nudi `canonical_url`.** `reviews/[slug]` ga cita oduvijek;
  taj ekran je jedini od cetiri koji ga nikad nije nudio.
- **Tech dobija istoriju verzija.** `ArticleVersionObserver` pise verzije za sve
  clanke; taj ekran ih jedini nije prikazivao.
- **Lista autora se cistila nikad.** `clearAdminDropdowns()` u vlastitom
  komentaru pise *„zovi ovo kad se korisnici ili role promijene"*, a zvao ga je
  samo `CategoryObserver`. Dodas novinara i nema ga u Author selectu ni u Author
  filteru dok ne prodje sat.

### Provjereno da radi

| | |
|---|---|
| Polja bez kolone, sva cetiri ekrana | **0** (bilo 6) |
| Zakazano objavljivanje | `articles:publish-scheduled` svake minute; nudi se samo tamo gdje ga ima ko izvrsiti |
| Auto-vezivanje igre iz naslova | radi, `ContentGameLinker` u `ArticleObserver::saving` |
| `is_noindex` | sva cetiri tipa, provjereno privremenim clankom pa obrisano |
| `canonical_url` | sva cetiri |
| Liste | News 328 ms, Reviews 295, Tech 270, Guides 143 |

### Nadjeno, nije dirano

- **`steps` se ne iscrtava na frontu.** Kolona sada postoji i rad se cuva, ali
  `GuideDetailView` ima samo mjesto za njih u JSON-LD bloku:
  `"step": [], // Could parse steps if structured`. Da bi sekcija bila
  upotrebljiva treba jos i prikaz.
- **Sest mrtvih kolona na `articles`:** `seo_title`, `seo_description`,
  `content_updated_at`, `translation_of_id`, `review_rating`, `review_pros`,
  `review_cons` — svih **0 od 625**. Prve dvije front cita kao rezervu iza
  `meta_*`, ostale ne cita niko; `review_*` je zamijenjen s `review_data`.
  `is_featured` je popunjen svuda ali svuda `false` i nista ga ne postavlja.
- **401 clanak cuva apsolutni URL slike** s `api-beta.techplay.gg` u koloni,
  223 cuva relativnu putanju. Accessor propusta oba, pa danas radi — ali ako se
  ime API domena ikad promijeni, 401 slika pukne.
- **Guides nemaju istoriju verzija** — `ArticleVersionObserver` gleda samo
  `Article`.
