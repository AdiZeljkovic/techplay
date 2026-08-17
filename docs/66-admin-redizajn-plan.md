# Admin panel — plan potpunog redizajna

*Napisano 17.08.2026. Sve brojke su izmjerene na produkciji ili prebrojane u
kodu tog dana, ne procijenjene.*

Dokument `65-admin-panel-anatomija.md` opisuje šta panel jeste. Ovaj opisuje šta
bi trebao biti i kojim redom se tamo stiže.

---

## Dio 1 — Šta imamo, u brojkama

| | |
|---|---|
| Resursa | 37 |
| Prilagođenih stranica | 5 |
| Stavki u sidebaru | 36 vidljivih (6 skriveno dok su tabele prazne) |
| Grupa | 8 |
| Redova koda u `app/Filament` | 11.041 |
| — od toga u resursima | 7.008 |
| Relation managera | 2 |
| Dijeljenih komponenti | 2 (`SeoFields`, `MediaPickerFields`) |
| Blade pogleda | 9 |

Filament v5.6.7, Livewire v4.3.1, Laravel v12.62.

Panel radi. Nije pokvaren, nije nesiguran — 33 modela ima policy, ulazak u panel
je iza `can('view admin panel')`. Ono što mu nedostaje nije funkcija nego
**dosljednost**: 37 ekrana je pisano 37 puta, svaki po sjećanju na prethodni.

---

## Dio 2 — Nalazi

### A. Četiri uređivačka ekrana su jedan ekran napisan četiri puta

News, Reviews, Guides i Tech su **1.571 red koda**. Kostur obrasca im je isti:

```
News   Content · Publish · SEO · Media
Tech   Content · Publish · SEO · Media
Guide  Main Content · Step-by-Step · Publish · SEO · Media
Review Review Content · Game Details · Score Board · Verdict · Publish · SEO · Media
```

Osam polja dijeli svaka četiri: `title`, `slug`, `content`, `excerpt`, `status`,
`published_at`, `author_id`, `tags`. Review dodaje četiri (`review_score`,
`game_id`, `item`, `catalogue_game_search`), Guide pet (`steps`, `difficulty`,
`description`, `image`, `game_id`).

**Ti si ih namjerno razdvojio i to ostaje.** Ali razdvojenost je odluka o
navigaciji — o tome da u sidebaru stoje četiri stavke i da postoje četiri URL-a.
Nema veze s tim da li ispod stoji jedna implementacija ili četiri. Danas stoje
četiri, pa svaka izmjena u uređivanju članka mora biti napravljena četiri puta,
a treći put se zaboravi.

**Prijedlog:** apstraktna `BaseArticleResource` s dijeljenim kosturom; četiri
tanke potklase koje deklarišu samo tip kategorije i svoja dodatna polja. Četiri
stavke u sidebaru ostaju, četiri URL-a ostaju, ~1.100 redova nestaje.

### B. Postavke su na tri mjesta

44 postavke u tabeli `site_settings`, a mijenjaju se kroz tri različita ekrana:

| Ekran | Šta radi |
|---|---|
| **Site Settings** (resurs) | sirova key/value tabela — kolone `key`, `group`, `value`, `type` |
| **Ultimate SEO** (stranica, 282 reda) | piše globalne SEO postavke |
| **Social Media** (stranica, 133 reda) | piše 6 socials linkova |

Site Settings je ovdje najgori: da promijeniš ime sajta, nađeš red čiji `key`
piše `site_name` i ukucaš u tekstualno polje `value`. Tip je `text` ili
`boolean`, pa je i „maintenance_mode" tekst koji moraš pogoditi. 38 od 44
postavke su u jednoj grupi zvanoj `general` — u njoj su ulica, poštanski broj,
Bing verifikacioni kod i maintenance mode, jedno pored drugog.

**Prijedlog:** jedna stranica **Settings**, tabovi su grupe, polja su tipizirana
(toggle za boolean, textarea za kodove, grupa polja za adresu). Ultimate SEO i
Social Media postaju njeni tabovi. Sirovi key/value resurs se sklanja iz
navigacije (ostaje dostupan preko URL-a kao izlaz u nuždi).

**Tri stavke postaju jedna.**

### C. Tri SEO površine, a jedna od njih je četvrta lista članaka

`SeoManagerResource::$model` je **`Article`** — isti redovi kao News, Reviews,
Guides i Tech, samo s drugim kolonama. To nije duplikat u lošem smislu; to je
radna lista („koji članci nemaju meta opis"), i takva lista ima smisla. Ali se
iz sidebara ne vidi da je to isto, jer se zove SEO Manager.

`PageSeo` je zaseban model za statične stranice. `Ultimate SEO` je globalna
konfiguracija i po prirodi pripada Settingsima.

**Prijedlog:** SEO Manager ostaje kao radna lista i dobija Page SEO kao svoj
drugi tab. Ultimate SEO odlazi u Settings. **Tri stavke postaju jedna.**

### D. Analytics je stranica za jedan widget

34 reda PHP-a, blade od dva reda, jedan widget (`MostViewedArticles`). Docblock
obećava „traffic, revenue, conversion"; ekran pokazuje tabelu najčitanijih
članaka.

**Prijedlog:** ili postaje prava stranica (promet po danima, izvori, konverzija
giveaway → registracija), ili se widget seli na Dashboard a stavka nestaje. Dok
nemamo podatke za prvo, drugo je iskrenije.

### E. Svaki tab u Giveaways-u je uokviren panelom koji ponavlja njegovo ime

Najveći obrazac u panelu: 532 reda, 30 polja, 6 tabova. Unutar svakog taba stoji
tačno jedna sekcija, a njen naslov prepričava tab:

| Tab | Sekcija unutra |
|---|---|
| Basic Info | Giveaway Details |
| Prize | Prize Information |
| Prize Tiers | Multiple Winners System |
| Tasks | Entry Tasks |
| Schedule | Timing |

Pet dvostrukih okvira. Korisnik klikne „Prize", pa mu ekran kaže „Prize
Information" i nacrta okvir oko toga. Okvir ne nosi nijednu informaciju, a jede
vertikalni prostor i pažnju.

**Prijedlog:** sekcija unutar taba se briše kad je jedina; sadržaj ide direktno
u tab. Sekcije ostaju samo tamo gdje ih u jednom tabu ima dvije ili više
(Basic Info ima i „Featured Image" — tu okvir radi posao).

### F. Igre su devet panela u nizu

`GameResource`: 20 polja, **9 sekcija, nijedan tab**. Description, Cover Image,
Screenshots, Trailers & Videos, Details, Critic Scores, Companies, Taxonomy —
sve jedno ispod drugog, jedan dugačak skrol.

**Prijedlog:** tri taba — *Osnovno* (opis, taksonomija, detalji), *Mediji*
(cover, screenshots, video), *Ocjene i kompanije*.

### G. Konvencije liste — izmjereno na svih 37

| Konvencija | Ima je |
|---|---|
| `ViewAction` — pregled bez uređivanja | **0 / 37** |
| Pamćenje filtera, pretrage i sortiranja | **0 / 37** |
| Prazno stanje s porukom | **0 / 37** |
| Izbor broja redova po stranici | **0 / 37** |
| Globalna pretraga (gornji search) | 4 / 37 |
| Badge s brojem u sidebaru | 2 / 37 |
| `defaultSort` | 21 / 37 |
| Naizmjenične trake u tabeli | 1 / 37 |

> **Ispravka.** Prva verzija ove tabele imala je i red „klik na red otvara zapis
> — 0 / 37". Netačno: `ListRecords` sam postavlja `recordUrl` i traži prvo
> `view` pa `edit` akciju. Klik je uvijek radio, samo je vodio pravo u obrazac
> za izmjenu, jer `view` nigdje nije postojao. Izmjereno je odsustvo poziva, a
> zaključeno odsustvo ponašanja — to nije isto.

Tri nule su ozbiljne:

**Nula ekrana za pregled.** Svako gledanje zapisa je otvaranje obrasca za
izmjenu. Za Comments i Reports — dakle za moderaciju, gdje prvo čitaš pa onda
odlučuješ — to je pogrešan potez: da bi pročitao prijavu, ulaziš u ekran koji te
može navesti da je slučajno izmijeniš.

**Nula pamćenja filtera.** Odfiltriraš komentare na čekanju, otvoriš jedan,
vratiš se — filter je nestao. Kod moderacije to znači da svaki zapis košta tri
klika viška.

**Nula praznih stanja.** Kad tabela nema redova, Filament ispiše svoje generičko
„No records found". Nigdje ne piše šta bi tu trebalo da bude ni kako se pravi
prvi zapis.

Šesnaest tabela bez `defaultSort` vraća redove onim redom kojim ih baza izruči —
što se mijenja između deployeva.

### H. Panel govori dva jezika

Svih 37 resursa je na engleskom — nula fajlova sadrži bosanski tekst. Dashboard
koji sam napravio prošle sedmice je na bosanskom („Traži pažnju",
„Objavljivanje", „Katalog igara").

To je nedosljednost koju sam ja unio i traži odluku, ne popravku napamet.

### I. Sitno, ali se vidi

- `ListTeches` — Filamentov automatski plural, ostao u imenu klase i u URL-u
- `Categories` i `Forum Categories` su isti model razdvojen kolonom `type`;
  ispravno, ali iz sidebara izgleda kao greška. Preimenovati u
  **Article Categories** / **Forum Categories**
- 62 mrtva linka imaju broj na Dashboardu i **nijedan ekran** — `broken_links`
  se u cijelom panelu spominje samo u `NeedsAttention` widgetu

---

## Dio 3 — Dizajn jezik

Panel i sajt treba da izgledaju kao jedan proizvod. Sajt već ima sistem; panel
ga treba naslijediti, ne izmisliti svoj.

### Površine, iz `frontend/app/globals.css`

```
--surface-0  #05070A   pozadina prozora
--surface-1  #0B0E14   panel, kartica, red tabele
--surface-2  #10141B   polje unosa, uzdignuta ploha
--surface-3  #161B22   hover, aktivno stanje
--line       rgba(255,255,255,0.06)   mirna ivica
--line-strong rgba(255,255,255,0.12)  ivica nečega interaktivnog
```

Četiri površine razdvojene malim koracima — to je razlog zašto sajt izgleda kao
oprema a ne kao dokument. Filamentov default je isti raspon u dva koraka, pa sve
izgleda ravnije nego što jeste.

### Boja

```
--accent   #DC143C     jedna, i troši se štedljivo
--success  #10B981     --warning #F59E0B
--danger   #EF4444     --info    #3B82F6
```

Pravilo: **akcent nije boja stanja.** Crveno u panelu smije značiti ili „ovo je
TechPlay" ili „ovo je problem", ne oboje. Zato akcent nosi samo aktivnu stavku
navigacije i primarno dugme; sve što je stanje ide u četiri semantičke boje.

### Tipografija

| Uloga | Font |
|---|---|
| Naslovi | Instrument Sans, `-0.01em` |
| Tekst i polja | IBM Plex Sans |
| **Sve što je broj** | IBM Plex Mono, `tabular-nums` |

Treći red je u admin panelu važniji nego na sajtu. Tabela pregleda, cijena i
datuma u kojoj se cifre ne poklapaju po koloni je tabela koju čitaš dvaput.

### Radijusi i gustina

```
--radius-panel 8px · --radius-card 5px · --radius-inner 3px
```

Uglovi sajta su skoro pravi i to je velik dio njegovog karaktera. Filamentov
default je otprilike duplo veći na svakom koraku.

Gustina: **red tabele 44px**, ne Filamentovih 52. Na listi igara i članaka
razlika je četiri reda više po ekranu.

---

## Dio 4 — Četiri arhetipa ekrana

Dosljednost ne dolazi iz toga da se svaki ekran lijepo isprojektuje. Dolazi iz
toga da ekrana ima malo vrsta. Predlažem četiri, i **svaki ekran u panelu mora
biti tačno jedan od njih**.

### 1. Radna lista *(31 ekran)*

Lista postoji da bi se iz nje nešto uradilo, ne da bi se gledala.

- **Najviše 6 kolona.** Prva je identitet (naslov, ime, slika+ime). Zadnja je
  stanje (badge). Između: najviše četiri, i svaka mora odgovarati na pitanje
  „koji od ovih redova da otvorim".
- **Klik na red otvara pregled**, ne izmjenu.
- **Filteri, pretraga i sortiranje se pamte** između posjeta.
- **Prazno stanje govori**: šta ovdje stoji, zašto je prazno, dugme koje pravi
  prvi zapis.
- **`defaultSort` obavezan.** Nema tabele koja se vraća nasumičnim redom.
- Redova po stranici: 25 podrazumijevano, izbor 10/25/50/100.
- Grupne akcije samo one koje stvarno rade — brisanje 100 zapisa jednim klikom
  postoji na 34 ekrana, a treba na možda pet.

### 2. Zapis *(pregled + izmjena)*

Dvije kolone, ne tabovi za sve:

```
┌──────────────────────────────┬──────────────────┐
│  glavni sadržaj              │  status          │
│  naslov, tekst, polja        │  objavljeno      │
│  koja nose posao             │  autor           │
│                              │  kategorija      │
│                              │  SEO ocjena      │
│                              │  ── akcije ──    │
└──────────────────────────────┴──────────────────┘
```

Desna traka je uvijek ista i uvijek na istom mjestu: stanje, meta podaci,
akcije. Lijevo je ono zbog čega si otvorio zapis.

**Tabovi tek kad ekran ima više od tri odvojene brige** — Review ih ima
(sadržaj, ocjene, verdikt), News nema (sadržaj i objava, to je sve; SEO i Media
staju u desnu traku).

Pregled je isti raspored, samo bez polja za unos. Moderacija radi iz pregleda.

### 3. Postavke

Jedna stranica, tabovi su grupe, polja tipizirana i grupisana po smislu. Snimanje
je eksplicitno, s porukom koja kaže šta je snimljeno.

### 4. Konzola

Dashboard i Release Calendar. Ekrani koji se gledaju a ne uređuju: brojke,
kalendar, redovi čekanja. Već su tako napravljeni.

---

## Dio 5 — Nova mapa navigacije

Spajanja iz Dijela 2, primijenjena. **36 vidljivih stavki postaje 27.**

| Grupa | Stavke | Promjena |
|---|---|---|
| **Content Studio** | Release Calendar, News, Reviews, Guides, Tech, Media Library | — |
| **Game Database** | Games | Game Ratings → relation manager na igri |
| **GTA 6** | Characters, Vehicles, Weapons | — |
| **Community** | Users, Forum Categories, Threads, Moderation | Posts → RM na temi; Comments+Reports → Moderation s tabovima |
| **Gamification** | Progression, Seasons, Store, Bounty Ledger, Collections | 8 → 5 |
| **Shop & Monetization** | Giveaways, Support Tiers, Ad Campaigns | — |
| **SEO & Marketing** | SEO Manager, Redirects, Newsletter | Ultimate SEO → Settings *(urađeno)*; Page SEO → tab |
| **System** | Settings, Article Categories, Roles, Analytics, Broken Links | Site Settings + Social Media → Settings *(urađeno)*; Analytics ostaje po odluci |

Tri spajanja u Gamificationu:

- **Progression** = Ranks + Achievements (oba su ljestvica napretka)
- **Seasons** dobija Quests kao relation manager — `Quest::season()` već postoji,
  quest bez sezone je quest koji nigdje ne važi
- **Store** = Rewards Store + Customizations. Oba modela imaju `name`, `slug`,
  `description`, `cost`, `type`, `is_active`, `sort_order` — isti katalog, dvije
  tabele. Modeli se **ne spajaju** (rizik bez koristi); spaja se samo stavka u
  navigaciji, kroz `parentItem`, koji Filament v5 podržava.

Novo: **Broken Links** — 62 zapisa koji trenutno nemaju gdje da se vide.

---

## Dio 6 — Odluke *(donesene 17.08.2026)*

**1. Jezik panela: engleski svuda.** Widgeti Dashboarda prevedeni; panel više ne
govori dva jezika. Nalaz H je zatvoren.

**2. Analytics ostaje kako jeste.** Ne dira se u ovom redizajnu. Nalaz D ostaje
zapisan za trenutak kad bude podataka za pravu stranicu.

**3. Ad Campaigns se koristi.** Ostaje pun ekran; dobija konvencije liste i novi
dizajn kao i svi ostali, bez skraćivanja.

---

## Dio 7 — Redoslijed izvođenja

Po odnosu koristi i rizika. Svaka faza je samostalna i deployabilna.

### Faza 1 — Dizajn jezik — *urađeno 17.08.2026*

Ispalo je da ovo **nije bio CSS problem.** Panel nije ličio na sajt jer paleta
nikad nije stigla do njega.

`Color::hex()` čita samo **nijansu** boje koju mu daš, pa svjetlinu i hromu
gradi iz fiksne ljestvice — a hromu poništi kad je ulaz blizu sive. Tako je
`#10141B`, najtamnija ploha sajta, izašao kao `oklch(0.3946 0 261)` na nijansi
900: ravno srednje sivo. Iz `--gray-900` se boje sekcije, sidebar i topbar,
dakle sve. Akcent je prošao isto — `#DC143C` ušao, svjetlija isprana crvena
izašla.

Prepisivanje `--color-gray-*` u temi nije pomagalo jer kompajlirana Filamentova
pravila čitaju `--gray-*` — **drugu varijablu**, koju PHP ubrizga u `<head>` iz
`->colors()`. Rampe su sada ispisane ručno; nijanse 700–950 su četiri plohe
sajta, doslovno.

Četiri semantičke boje idu na Filamentove ugrađene rampe, jer već pogađaju
sajt: Red 500 i `#EF4444` dijele svjetlinu 0.637 i nijansu 25.3; Emerald i
`#10B981` dijele 0.696 i 162.5; isto Amber i Blue. Razlikuje se samo hroma, i
tu je Filamentova ista boja u širem gamutu.

Uz to, dvije klase u temi **nisu postojale** — `fi-sidebar-item-button` (pravo
je `fi-sidebar-item-btn`) i `fi-ta-header-cell-label` (takve klase nema) — pa
pravila na njima nikad nisu ni primijenjena. Stylesheet pada tiho, i to je
razlog zašto se provjerava a ne čita.

Tema sada pokriva tabele, obrasce, dugmad, badgeve, tabove, prazna stanja i
login. Gustina reda pada s 52 na 44px.

### Faza 2 — Konvencije liste — *urađeno 17.08.2026*

Ispalo je da većina ovoga ne treba ići kroz 37 fajlova nego kroz jedan.

**`Table::configureUsing()` u `AdminPanelProvider::boot()`** postavlja
pamćenje filtera, sortiranja i pretrage, veličine stranice (10/25/50/100,
podrazumijevano 25) i prazno stanje — za svaku tabelu u panelu, uključujući one
koje još nisu napisane. Poziv teče **prije** resursove `table()` metode, pa
resurs koji hoće svoje i dalje pobjeđuje.

Trideset sedam kopija iste četiri linije je trideset sedam prilika da se jedna
zaboravi, a konvencija koja vrijedi na trideset pet ekrana nije konvencija nego
nešto što se mora provjeravati.

Prazno stanje se izvodi iz oznake modela, pa svaki ekran dobija svoju rečenicu
besplatno: *No products yet*, *No orders yet*, *No reports yet* — umjesto
Filamentovog „No records found" na sva 37.

**Po resursu je ostalo dvoje.**

`defaultSort` na preostalih 16, s kolonama provjerenim protiv žive šeme — jer
`achievements` nema `sort_order` a ni `categories` ga nema, a oboje je bila prva
pretpostavka. Redovi čekanja idu najnovije prvo, konfiguracija abecedno,
ljestvice od najniže prečke.

`ViewAction` ide **samo tamo gdje se prvo čita pa odlučuje**: komentari, prijave,
forumski odgovori i teme, narudžbe, podrške, ocjene, kolekcije. Ne ide na
članke — Filamentov pregled iscrtava isti obrazac onemogućen, a četiri taba i
rich editor u modalu su lošiji način da se pročita tekst nego objavljena
stranica. Zato sadržaj (News, Reviews, Guides, Tech, Games, Giveaways) dobija
**„View on site"**, vidljiv samo kad zapis ima slug i, gdje postoji status,
kad je objavljen. Link koji otvara 404 je gori od nikakvog — nauči te da ne
vjeruješ ni onom u redu ispod.

Time je i **klik na red** dobio smisao: `ListRecords` traži `view` pa `edit`, pa
sada moderacijski ekrani otvaraju pregled, a ostali kao i prije izmjenu.

### Faza 3 — Broken Links ekran — *urađeno 17.08.2026*

Prije ekrana je trebalo popraviti podatak.

Skener je slao `HEAD` i predstavljao se kao `TechPlay Link Checker/1.0`, pa je
**29 od 62 zapisa** bilo 403 s x.com, reddita, samsunga i netflixa — stranica
koje odbijaju bota, ne stranica kojih nema. Novi `LinkChecker` se predstavlja
kao preglednik, na 403/405/429/501 pita ponovo `GET`-om (jer je to ono što
čitalac zapravo vidi) i prati redirekcije — link koji vodi na novu adresu nije
mrtav, a do sada je računat kao takav.

Ponovna provjera svih 62:

| | |
|---|---|
| Provjereno | 62 |
| **Radi, označeno popravljenim** | **41** |
| Ostalo neispravnih | 21 |
| — od toga stvarno nestalih (404/410) | **8** |
| — odbilo provjeru | 6 |
| — nedostupno / bez odgovora | 7 |

Ekran ne počinje URL-om nego dijagnozom: *gone* (jedina prava stavka), *refused*,
*unreachable*. Svaki red ima „check again" jer status kodovi zastarijevaju — tri
od četiri 5xx zapisa provjerena tog dana odgovaraju 200 danas, skan je uhvatio
restart Octanea. Badge i kartica na Dashboardu broje samo 404/410; badge koji
piše 62 kad je osam mrtvo je badge koji naučiš ignorisati.

**Dvoje nađeno usput, van admina i nedirnuto:**

- `/videos` vraća **404**. Sekcija je navedena u `CLAUDE.md`, ali `app/videos`
  u frontendu ne postoji i ništa je ne linkuje osim jednog članka. Nije
  regresija — stranica nikad nije napravljena.
- Četiri obrisane igre (`alone-in-the-dark-2022`, `final-fantasy-1987`,
  `final-fantasy-10`, `marathon-2`) vraćaju **404 umjesto 410**, jer nemaju
  zapis u `game_tombstones` — a tabela ima 60.981 red. Znači purge ih je obrisao
  bez tombstonea. To je stavka iz plana baze igara, ne iz ovog.

### Faza 4 — Settings — *urađeno 18.08.2026*

Jedna stranica sa šest tabova umjesto tri ekrana. Site Settings (sirova
key/value tabela) izlazi iz sidebara ali ostaje na `/admin/site-settings` —
jedina je koja može dodati ključ za koji obrazac nije čuo. Ultimate SEO i
Social Media su obrisani.

**Kako se vrijednost upisuje** — jer kolona je string za sve. PHP kastuje
`false` u **prazan string**, ne u `'0'`, pa je `writeSetting()` eksplicitan.
Grupa putuje uz ključ umjesto da naslijedi default `general` iz
`SiteSetting::set()`; bez toga bi se grupa `socials` tiho preselila na prvom
snimanju.

> **Dopuna, 18.08.2026 — maintenance mode obrisan.** Bio je najopasnija
> vrijednost na ovoj stranici i ispalo je da je bio mrtav, i to na najgori
> način: middleware koji ga je čitao obrisan je nekoliko mjeseci ranije zajedno
> sa stranicom `/coming-soon`, a postavka je nadživjela oboje — i dalje se mogla
> uključiti, i dalje bi vratila `true`, i ništa je više ne bi poslušalo.
> Uključivanje bi tvrdilo da je sajt ugašen a sajt bi radio.
>
> Otišli su: postavka, prekidač na ovoj stranici, polje `maintenance_mode` iz
> `/system/status`, i dvije mrtve grane u frontendu koje su čuvale rutu koja se
> ne može dosegnuti — `AppShell` je uz njih izgubio i `usePathname()` koji je
> postojao samo zbog nje. Postavki je sada **43**.
>
> `/system/status` ostaje jer ga Discord bot zove kao provjeru živosti. Bio je
> tipovan kao `{status, version}` a polje `status` nikad nije dobijao, pa je
> dodano umjesto da laž stoji u botovom tipu.
>
> Za namjerno gašenje sajta postoje `php artisan down` i nginx — nijedan ne
> košta upit u bazu na svaki zahtjev.

**Provjera prije i poslije**, snimanje obrasca bez ijedne izmjene:

| | |
|---|---|
| Postavki prije / poslije | 44 / 44 *(danas 43 — vidi dopunu ispod)* |
| Nestalo | 0 |
| Novih | 0 |
| Promijenjenih | 0 |
| `/api/v1/system/status` | HTTP 200 |
| `techplay.gg` | HTTP 200 |
| `/robots.txt` | netaknut |

Obje grane boolean upisa dokazane na `seo_noindex_tags` (na spisku, ništa ga ne
čita, vraćen na početnu vrijednost): `true → "1"`, `false → "0"`.

**Nalaz usput: 19 od 44 postavke ne čita niko.** Dvanaest opisuju firmu za
strukturirane podatke, a `SchemaService` tvrdo kodira `'name' => 'TechPlay'` i
ne čita nijednu — dakle adresa, matični naziv, godina osnivanja i kontakt se
mogu unijeti i nigdje ne stižu. Polja ostaju jer su podaci tačni, ali tab to
kaže naglas umjesto da se pravi da rade. Spajanje tih polja na `SchemaService`
je posao od dvadesetak redova i **nije dio ovog plana** — zapisano je da se ne
izgubi.

Zatečena je i jedna prava duplikacija: `seo_noindex_archive` (vrijednost 0) i
`seo_noindex_archives` (vrijednost 1). Obrazac prikazuje množinu, jer je nju
koristio Ultimate SEO; jednina ostaje u bazi neprikazana.

### Faza 5 — Arhetip zapisa *(srednji rizik)*

Dvokolonski raspored na uređivačkim ekranima. Počinje s News kao pilotom; ako
uređivanje jednog članka bude brže, ide na ostale.

### Faza 6 — `BaseArticleResource` *(najveći rizik, najveća ušteda koda)*

Tek nakon što Faza 5 dokaže raspored. ~1.100 redova manje. Četiri stavke u
sidebaru i četiri URL-a ostaju netaknuta.

### Faza 7 — Spajanja u navigaciji *(nizak rizik)*

`parentItem` gnježđenje, Moderation ekran, relation manageri (Quests pod
Seasons, Posts pod Threads, Game Ratings pod Games).

### Faza 8 — Giveaway i Game obrasci *(nizak rizik, ograničen doseg)*

Brisanje pet dvostrukih okvira; Game iz devet panela u tri taba.

---

## Šta ovaj plan ne zna

- **Kako se panel zapravo koristi.** Nema mjerenja koji se ekrani otvaraju.
  „Analytics je stranica za jedan widget" je nalaz o strukturi; ako se otvara
  deset puta dnevno, odgovor je da ga treba proširiti, ne skloniti.
- **Da li je 30 polja na Giveaways previše.** Nagradna igra ima mnogo pravila.
  To bi rekao neko ko je popunio taj obrazac, ne brojanje polja.
- **Koliko traje uređivanje članka u praksi.** Mjereno je vrijeme učitavanja,
  ne vrijeme rada. Faza 5 se ocjenjuje tim brojem, pa ga treba izmjeriti prije
  nego što počne.
