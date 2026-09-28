# GW2 Progression Advisor — stanje naspram originalnog dokumenta

Prva provjera **28. 9. 2026**, protiv
`TechPlay_GW2_Progression_Advisor_Working_Document_v1.docx` (28 sekcija), četiri
mockupa i `ANALIZA-I-PLAN.md`.

> **Ažurirano 29. 9. 2026.** Sve iz sekcije 8 ispod je odrađeno. Šta je tačno
> urađeno piše u sekciji 10 na dnu; tekst iznad je ostavljen kakav je bio, jer
> je to nalaz koji je odluke izazvao.

Sve tvrdnje ispod su provjerene u kodu i na produkciji, ne po sjećanju. Gdje piše
da nešto ne postoji — provjereno je grepom ili upitom nad bazom.

---

## 1. MVP spisak iz §26 — dvanaest stavki

Dokument ima izričit „V1 must-have" spisak. Ovo je stanje po stavkama:

| # | Stavka iz §26 | Stanje |
|---|---|---|
| 1 | API-key konekcija + validator dozvola | **Gotovo** — `/v2/tokeninfo` prije upisa, `missing_features` imenuje šta fali |
| 2 | Account/character selektor i sync health | **Pola** — sync health da; **selektora lika nema**, `primaryCharacter()` bira sam |
| 3 | Dashboard po domenima, bez lažnog skora | **Gotovo** — pet kartica, nigdje zbirnog skora |
| 4 | Next Best Actions s objašnjenjem i pouzdanošću | **Gotovo** — 3 + 3, `confidence`, `blockers` |
| 5 | Pinned goal framework | **Ne postoji** — nema `gw2_goals` ni `gw2_user_goals` |
| 6 | Analizator aktivne opreme / AR | **Gotovo** — AR iz nošenog seta, kroz katalog |
| 7 | Mastery trake i stanje tačaka | **Gotovo** — i više nego traženo (stvarni procenti) |
| 8 | Easy wins **ograničen na kurirana postignuća** | **Pola** — motor radi, **kuracije nema** (8.339 redova, `advisor_eligible` svugdje `false`) |
| 9 | Wizard's Vault dnevna/sedmična kartica | **Gotovo** |
| 10 | Istorija napretka od dana povezivanja | **Gotovo** — uz baseline popravku od 28. 9. |
| 11 | Uređivački deep linkovi i polja izvora | **Ne postoji** — `gw2_rules` nema `owner`, `sources`, `game_build` |
| 12 | Mehanizam ručne potvrde za nepoznato stanje | **Ne postoji** |

**Osam od dvanaest gotovo, dvije napola, dvije ne postoje.**

---

## 2. Dvije greške u onome što *jeste* napravljeno

Ovo nisu nedostajuće funkcije nego stvari koje izgledaju gotovo a nisu.

### 2.1 `goal` se prima i ignoriše

`GET /api/v1/gw2/dashboard?goal=fractals` **validira** parametar, `Intent` ga
nosi, i onda ga **niko ne koristi**. Jedino mjesto gdje se pojavljuje je provjera
da li zaobići keš:

```php
// Dashboard.php:60 — jedina upotreba u cijelom kodu
if ($intent === null || ($intent->minutes === null && $intent->avoid === [] && $intent->goal === null)) {
```

Dokument §8.2 stavlja **Goal relevance (0–35)** kao najveću pojedinačnu
komponentu boda — veću od uklanjanja blokade (0–25). Kod nje nema uopšte.

Posljedica: „Pick a goal" iz javnog obećanja proizvoda (§1) trenutno **ne radi**,
a API se ponaša kao da radi.

### 2.2 Pravila nemaju porijeklo

§24 traži: *„Every rule has owner, source(s), reviewed_at, game_build/patch
context and version."*

`gw2_rules` ima `reviewed_at` i `version`. **Nema `owner`, `sources`,
`game_build`.** Tabele `gw2_source_registry` (§18.2) nema.

Posljedica: kad se pravilo pokaže pogrešnim, nema traga ko ga je uveo, po čemu, i
za koji build igre. To je tačno onaj kvar zbog kojeg §25 navodi „Incorrect
recommendation → Trust damage in a knowledgeable MMO community".

---

## 3. Gdje sam otišao mimo dokumenta — i gdje me dokument upozorava

### 3.1 13.024 stranice recepata

Napravio sam `/gw2/database/crafting/{id}-{slug}` — po jedna stranica za svaki
predmet sa receptom.

**Dokument to ne traži i dva puta upozorava na taj obrazac:**

> §20.2: *„Programmatic pages must be generated from **reviewed data**, not
> thousands of low-value API dump pages."*

> §25 (rizik): *„SEO spam — Thousands of shallow generated pages" → kontrola:
> „Only reviewed, useful public guide families."*

U odbranu: stranice **nisu** plitke — nose puno stablo materijala, discipline,
rejting, i `used_in` linkove, pa su povezan graf a ne dump. Ali su
**nepregledane** i generisane iz API-ja, što je doslovno ono što ta kontrola
zabranjuje.

**Ovo je tvoja odluka, ne moja.** Tri opcije:

1. **Ostaviti** — sadržaj je stvaran i koristan, a rizik je Googleov sud o
   „thin content" na skali.
2. **Suziti** — indeksirati samo predmete iznad praga (npr. Ascended/Exotic i
   glavni materijali ≈ nekoliko stotina), ostalo `noindex, follow` da graf
   ostane prohodan.
3. **Ostaviti uz kuraciju** — dodati `reviewed_at` na predmet, indeksirati
   pregledane.

Moja preporuka je **2**, jer jedina poštuje kontrolu iz §25 a ne baca posao.

### 3.2 Javne familije stranica iz §20.1 — nijedna nije napravljena

Dokument imenuje devet:

| Putanja iz §20.1 | Stanje |
|---|---|
| `/gw2/progression` (pillar) | ne postoji |
| `/gw2/masteries/{region-or-track}` | ne postoji — imamo jednu zbirnu, ne po traci |
| `/gw2/achievements/{slug}` | ne postoji |
| `/gw2/fractals/agony-resistance` | ne postoji |
| `/gw2/goals/first-ascended-set` | ne postoji |
| `/gw2/mounts/{mount}` | ne postoji |
| `/gw2/legendary/{item-or-family}` | ne postoji |
| `/gw2/wizards-vault` | ne postoji |
| `/gw2/level-80-what-next` | ne postoji |

Te stranice su **uređivačke** — objašnjenje + personalizacija poslije
povezivanja. To je motor dolaska koji dokument opisuje, i on **nije napravljen**.
Ono što jeste napravljeno (baza recepata) je drugačija vrsta stranice.

`/gw2/masteries` i `/gw2/goals` **postoje ali su privatne** (`noindex`) — to su
alati, ne javne stranice iz §20.1.

---

## 4. Domeni iz ontologije (§7) — pokrivenost

| Domen | Stanje |
|---|---|
| Foundation (80 lvl, oprema, build, ekspanzije) | **Gotovo** |
| Story | **Ne postoji** — `/characters/:id/quests` se ne čita |
| Masteries | **Gotovo** |
| Specializations | **Pola** — čuvamo `specializations` po modu, nigdje se ne prikazuje; hero points se ne čitaju |
| Mounts & movement | **Pola** — čitamo otključane, nema goal engine (§9.5) |
| Open world | **Gotovo** — svjetski bosovi, dnevno + „ikad" |
| Fractals | **Gotovo** — nivo, AR, deficit do T4 |
| Raids | **Gotovo** — sedmica + naša istorija, bez tvrdnje o spremnosti |
| Gear | **Gotovo** — rijetkost, slotovi, infuzije |
| Achievements | **Pola** — motor da, kuracija ne |
| Legendary | **Ne postoji** — dokument ga i stavlja u Phase 3 |
| Wizard's Vault | **Gotovo** |
| Crafting | **Gotovo** — i preko traženog (stablo recepata) |
| Collections / unlocks | **Ne postoji** |

---

## 5. Endpointi koje dokument navodi a mi ih ne čitamo

| Endpoint | Šta bi dao | Zašto još nije |
|---|---|---|
| `/characters/:id/heropoints` | koliko hero tačaka po liku — ulaz za elite spec | nije bilo potrebe do sada |
| `/characters/:id/buildtabs` | traits, skills po šablonu | nošeni build je dovoljan za AR i opremu |
| `/characters/:id/equipmenttabs` | neaktivni šabloni | §9.3 izričito traži **samo aktivni** |
| `/characters/:id/quests` | story napredak | story modul ne postoji |
| `/v2/commerce/prices` | zlatna cijena nedostajućih materijala | **namjerno** — vidi ispod |
| `/v2/account/home` (cats/nodes) | kućni instanc | nije u dokumentu kao prioritet |

**TP cijene** su jedini od ovih koje dokument traži u MVP-u posredno (§13.2:
„Use current commerce price API for tradable deficits, with timestamp"). Nisu
napravljene i payload to **kaže naglas** (`prices: null`), ali to ostaje
nedostatak naspram §13.2 i mockupa 2.

---

## 6. Šta mockupi crtaju a nije nacrtano — i zašto

Ovo je već zapisano u `docs/README.md` §21, ovdje sažeto:

| Mockup | Element | Zašto ne |
|---|---|---|
| 1 | „Weekly Completion Score 72/100" | jedan skor preko pet nevezanih domena mora izmisliti i težine i imenilac; §7 i §11.1 oboje to zabranjuju |
| 1 | „Confidence to complete: High" uz brojku | tvrdnja bez računa iza sebe |
| 1, 4 | Plan po minutima (0–10, 10–20…) | igra ne prijavljuje trajanje ničega; sada **rasponi**, označeni kao naši (§12.1 traži baš „effort band rather than fake minute-level precision") |
| 2 | „18g 42s estimated remaining cost" | TP cijene ne preslikavamo |
| 3 | „Mastery Progress 73%" | **ispalo izračunljivo** — `point_cost` po nivou; nacrtano |
| 3 | „Currently Training" | API to ne izlaže |
| 3 | „Nearby Priorities" sa metrima | traži živu poziciju igrača |
| 4 | „Current Events" sa vremenima | rasporeda nema u API-ju; mašinerija postoji (`gw2_events` + admin), **tabela prazna dok neko ne provjeri vremena** |
| 4 | „Potential Rewards Tonight" | ništa to ne izvodi iz plana |

Sve osim „Mastery Progress" ostaje nenacrtano **namjerno**.

---

## 7. Šta je napravljeno preko dokumenta

Pošteno je navesti i ovo:

- **Katalog igre lokalno** — 96.293 reda, 14 endpointa. Dokument (§19) predviđa
  keš 6–24 h; mi imamo punu kopiju vezanu za `build_id`, što je jače.
- **Stablo recepata sa oduzimanjem zalihe** — §13.1 traži jedinstvenu knjigu
  predmeta; napravljen je i planer koji je koristi rekurzivno.
- **Pravila kao podaci sa admin ekranom** — §18.2 predviđa
  `gw2_recommendation_rules`; napravljeno plus Filament ekran za uređivanje.
- **39 testova**, svaki dokazan lomljenjem popravke.

---

## 8. Redoslijed koji predlažem

Poređano po odnosu vrijednosti i rizika, ne po redoslijedu iz dokumenta.

### Prvo — zatvoriti ono što izgleda gotovo a nije

1. **`goal` da radi.** Najveća komponenta boda po §8.2, trenutno mrtva. Traži:
   listu ciljeva (`gw2_goals`), izbor u UI-ju, i `goal_relevance` u bodovanju.
   Bez ovoga „Pick a goal" iz obećanja proizvoda ne postoji.
2. **Porijeklo pravila** — `owner`, `sources`, `game_build` na `gw2_rules`,
   plus `gw2_source_registry`. Jeftino, a §25 ga navodi kao kontrolu nad
   najvećim rizikom proizvoda.
3. **Odluka o 13k stranica** (sekcija 3.1 gore). Tvoja.

### Drugo — MVP stavke koje fale

4. **Pinned goals** (§26.5) — tek s njima postoji „retention product" iz §23
   Phase 2.
5. **Ručna potvrda nepoznatog** (§26.12, §17.3) — „Unknown must be a
   first-class state."
6. **Selektor lika** (§26.2) — sada biramo sami; veteran sa 15 likova će htjeti
   birati.
7. **Kuracija postignuća** — motor postoji, `advisor_eligible` je svugdje
   `false`. Prvih stotinu redova otključava najkorisniju stvar na nalogu.

### Treće — javni motor dolaska

8. **Uređivačke stranice iz §20.1** — počevši od `/gw2/level-80-what-next` i
   `/gw2/fractals/agony-resistance`, koje dokument izdvaja kao glavne ulaze.

### Kasnije — dokument ih i sam odgađa

9. TP cijene (§13.2), story (§16), legendary (§14, Phase 3), collections.

---

## 9. Kratak odgovor na „dokle smo"

**MVP je oko 70% — osam od dvanaest must-have stavki, dvije napola, dvije ne
postoje.** Motor preporuka, snapshot, katalog, planer i pet ekrana rade i
provjereni su na živom nalogu.

Ono što fali nije infrastruktura nego **sloj ciljeva** (pin, izbor, relevantnost
u bodovanju) i **uređivački sloj** (kuracija, porijeklo, javne stranice). To su i
dvije stvari koje dokument izdvaja kao *defensible layer* (§22):

> *„The moat is not the API call. Everyone can call the API. The defensible
> layer is a maintained progression ontology + versioned decision rules +
> personalized editorial guidance."*

Ontologija i verzionisana pravila postoje. **Kuracija i uređivačko vođenje još
ne.**


---

## 10. Šta je urađeno 29. 9. 2026.

Cijeli spisak iz sekcije 8, plus odluka o 13k stranica.

### Odluka o indeksiranju — opcija 2, uz ispravku

Mjerenje je promijenilo dio upute: **Exotic sam je 3.187 craftable predmeta**,
pa „Ascended/Exotic + materijali" daje 5.738 i jedva suzuje išta.

| Pravilo | Stranica |
|---|---|
| Ascended + Legendary | 1.904 |
| **+ materijali u ≥50 recepata** | **1.990** ← odabrano |
| + materijali u ≥20 recepata | 2.597 |
| + Exotic | 5.738 |

Prag ≥50 pogađa Glob of Ectoplasm (907 recepata), Vision Crystal (899),
Crystalline Dust (280), Mithril Ingot (174).

**Ostalo je `noindex, follow`**, i taj par je poenta: stranica van pregledanog
skupa i dalje vrijedi puzati, jer su njeni linkovi način na koji se pregledane
pronalaze. `noindex` bez `follow` bi presjekao graf.

Zastavica je **podesiva** (`gw2:pick-indexable --materials=20`) i **pregaziva
ručno** (`indexable_reviewed_at` — komanda ne dira red koji je čovjek pogledao).

### `goal` radi

Pet ciljeva u `gw2_goals`, pravilo imenuje koje unapređuje, izbor dodaje **+35**
— najveća pojedinačna komponenta po §8.2. Bonus se dodaje **prije** množitelja
pouzdanosti, da siguran relevantan nadmaši sigurnog nerelevantnog, a nesiguran
relevantan ne preskoči sigurnog.

Namjerno **nisu** dodata dva cilja koje §9 imenuje (mounts, story): nema grafa
nabavke ni detektora priče, pa bi to bio izbor koji motor ignoriše — tačno kvar
koji se ovdje popravlja.

### Porijeklo pravila

`gw2_rules` je dobio `owner`, `source_ids`, `game_build`. Registar izvora je
`gw2_sources` (§18.2), sa `checked_at` — jer izvor nije citat nego stvar koja
može zastariti, a wiki link koji niko nije otvorio od zadnje zakrpe izgleda kao
temeljitost a nije.

### Pin, lik, potvrda

| | |
|---|---|
| **Pin** (§21, §26.5) | `gw2_user_goals`; dashboard pada nazad na pin, i **pin je dio keš ključa** — inače bi se posluživao savjet od prije izbora |
| **Lik** (§26.2) | `featured_character` gazi naše rangiranje; brisanje vraća izbor nama |
| **Potvrda** (§17.3) | `gw2_confirmations`; `unsure` je pravi odgovor i pamti se, jer to je razlika između alata koji sluša i onog koji davi. Svaki odgovor nosi `source: player` |

Otvoreno pitanje je zasad jedno i dokumentovo je vlastito (§5):
`/characters/:id/training` vraća prazno uvijek, pa slotovana elite spec dokazuje
da je upotrebljiva i ne dokazuje da je trening završen.

### Kuracija postignuća

`/admin/gw2-achievements`, sa **grupnim** odobri/isključi — pregledati 8.339
redova jedan po jedan nije plan, a zanimljive odluke su isključenja i njih je
malo. Značka u navigaciji broji nepregledane.

### Javni uređivački sistem

`gw2_guides` + `/admin/gw2-guides` + jedna dinamička ruta `/gw2/[family]/[slug]`
koja opslužuje svih devet familija iz §20.1.

**`personalise_as`** je ono što ovo čini više od bloga: vodič imenuje šta čitaočev
nalog dodaje (`agony`, `masteries`, `next-steps`…), a **klijentsko ostrvo** to
dovuče. Za odjavljenog se ne crta **ništa** — ni zid za prijavu ni prazna kutija.

Dva vodiča **napisana**, ne devet zasijanih: `level-80/what-next` i
`fractals/agony-resistance`, dva koja §20.1 izdvaja kao glavne ulaze. Sedam
punjenja pod stvarnim URL-ovima bio bi tanak sadržaj koji §20.2 zabranjuje.

Provjereno kako ih puzač vidi: `<h1>`, tijelo, pet `<h2>`, `index, follow`,
kanonik.

### Usput

`/gw2/goals` → **`/gw2/planner`** (301 u tabeli preusmjerenja). „Goals" sada
znači prikačene ciljeve; dva značenja pod jednom putanjom čitaju se dobro
nedjelju dana pa koštaju popodne.

### Tri greške uhvaćene u ovoj rundi

1. **Komanda za indeksiranje upisala nula redova** dok je prijavljivala tačne
   zbirove — `array_chunk(array_keys(...))` daje komade čije su *vrijednosti*
   id-jevi, pa se id poredio sa riječju „rarity".
2. **Keš ključ je nosio build igre, ne verziju našeg payloada** — dodavanje polja
   `indexable` promijenilo je svaki payload i poništilo nijedan.
3. **Zastavica, a ne craftability, je autoritet** — 86 pregledanih materijala
   nema vlastiti recept, pa je 26 stranica bilo označeno `index` a nije bilo
   nigdje imenovano.

### Šta i dalje fali

Redom iz dokumenta, ništa od ovoga nije počelo:

- **Story modul** (§16) — `/characters/:id/quests` se ne čita
- **Legendary planer** (§14) — dokument ga i sam stavlja u Phase 3
- **TP cijene** (§13.2) — `prices: null`, i stranica to kaže
- **Mount goal engine** (§9.5) — otključanja čitamo, graf nabavke ne postoji
- **Sedam preostalih familija vodiča** — sistem postoji, tekstovi ne
- **Kuracija** — ekran postoji, prvih sto redova čeka čovjeka
- **Vremena bosova** — ekran postoji, tabela prazna dok neko ne provjeri


---

## 11. Šta je urađeno 30. 9. 2026.

Ostatak spiska sa dna sekcije 10.

### Kuracija postignuća — igra sama daje odgovor

Nije bila presuda nego **ArenaNetovi vlastiti flagovi**:

| Flag | Redova | Zašto ispada |
|---|---|---|
| `IgnoreNearlyComplete` | **744** | igra doslovno kaže „ovo nije kandidat za skoro-gotovo" |
| `Hidden` | 571 | §12.1 ga imenuje |
| `Daily` / `Weekly` / `Monthly` | 1.346 | resetuju se; „jedan korak" je sutra besmisleno |
| `Repeatable` | 94 | isto |
| `Pvp` | 893 | §6.1 i §26 oboje odgađaju PvP |
| `RequiresUnlock` | 114 | §5: ne pretvarati nevidljiv preduslov u sigurnost |
| `Permanent`, ostalo | **4.577** | odobreno |

**Nula neodlučenih** — svako postignuće ima flag koji odlučuje.

`IgnoreNearlyComplete` je **kvar, ne praznina u kuraciji**: motor ga je ignorisao
otkad postoji i preporučivao 744 postignuća koja je igra označila kao
neprikladna. Sada se primjenjuje **u čitaču**, ne samo kroz kuraciju — osvježenje
kataloga donosi nova postignuća i novo sa tim flagom mora ispasti istog časa.

**Efekat:** postignuće je skočilo sa **53,1 na 75,9** boda i ušlo u naslov.

### TP cijene — dvije kante, §13.2

27.997 predmeta kojima se trguje (od 74.265), ~140 zahtjeva, **noćno** u 03:20.
§19 predlaže 2–10 minuta; to je tačno za alat za trgovinu, ovo je planer izrade
gdje cijena od jutros odgovara na pitanje a zastarjelost je **vidljiva** jer
svaka stranica nosi vremensku oznaku.

Obje cijene se čuvaju jer odgovaraju na različita pitanja. Na jednom ascended
ramenu: **5g 94s odmah** naspram **5g 31s čekanjem**.

**Autoritet o tome šta je u kojoj kanti je sam endpoint cijena.** Predmet kojeg
u njemu nema ne može se kupiti nizašto — `Augur's Stone` je izdvojen, ne sabran.
Sabrati ga kao nulu bilo bi tačno ono što §13.2 zabranjuje.

### Story modul — §16, najopreznija sekcija dokumenta

`characters?ids=all` vraća osamnaest polja i **`quests` nije među njima**
(izmjereno), pa je story **jedan zahtjev po liku**. Na testnom nalogu 172
završena koraka.

**Dvije greške uhvaćene ovdje, obje iste vrste:**

1. **„My Story 49/313"** — katalog sabira grane **svih rasa**. Human može
   dosegnuti oko šestine. To nije konzervativna procjena nego **pogrešna**, i
   tačno je kvar koji §5 imenuje: „API gap interpreted as incomplete". Priče
   nose `races`, pa se nedosežne filtriraju → 49/137.
2. **49/137 i dalje laže** — unutar rase priča se grana po redu i biografiji, a
   API nijedno ne izlaže. Sezona koja se grana sada **nema imenilac uopšte**:
   „49 koraka viđeno". Broj koji fali je pošten; pogrešan nije.

Usput izmjereno: **`training` vraća prazan niz**, tačno kako §5 tvrdi. Zato se
elite spec **pita**, ne zaključuje.

### Mount engine — §9.5, presječen tamo gdje ga dokument presijeca

Posmatriva polovina je mehanička (deset tipova u katalogu, četiri otključana na
testnom nalogu). Polovina koja kaže **kako** je kurirani sadržaj.

Mount bez vodiča se **i dalje preporučuje**, sa poštenom blokadom „nismo napisali
kako se dobija". Sakriti tačnu činjenicu iza uredničkog zaostatka ne pomaže
nikome.

### Osam vodiča, i linija kroz sredinu

| Familija | Stranica |
|---|---|
| `progression` | kako napredovanje uopšte radi |
| `level-80` | šta poslije 80 |
| `fractals` | Agony Resistance |
| `masteries` | zašto su tačke zaključane za regiju |
| `wizards-vault` | šta plaća i zašto su sedmične važnije |
| `goals` | prvi ascended set |
| `achievements` | kako naći ono što je na korak |
| `legendary` | šta zapravo kupuješ |

**Šta namjerno nije napisano i zašto:**

- **Putanje nabavke mountova** — §9.5 ih zove kuriranim sadržajem baš zato što
  ih nema ni u jednom API-ju. „Skyscale traži kolekciju X" bilo bi izmišljanje
  znanja iz igre.
- **Walkthroughovi postignuća** — isto, osam hiljada puta.
- **Recepti legendarnih** — §14 sam odgađa kalkulator i kaže da gw2efficiency to
  radi bolje.

Te tri traže nekoga ko igra. Sistem i ekran postoje.

### Legendary panel nije napravljen

Legendary Armory na testnom nalogu je **prazan**, pa se panel ne bi mogao
provjeriti ni na čemu stvarnom. §14 ionako kaže da je diferencijator „šta te
blokira", a to traži kurirane grafove nabavke. Vodič objašnjava sistem.

### Broj poziva se promijenio treći put

18 → 19 (`account/dungeons`) → **20** na nalogu s jednim likom (story nema bulk
endpoint). Veteran sa 15 likova: **34**. Komentari su prepisani kao **izvod**, ne
kao broj — brojka koja se pomjerila tri puta u tri dana pomjerit će se opet.

### Raspored

| Kad | Šta |
|---|---|
| 03:10 | `gw2:catalogue` |
| 03:20 | `gw2:prices` |
| 03:25 | `gw2:curate-achievements` |
| 03:28 | `gw2:pick-indexable` |
| 03:30 | `gw2:sync-accounts` |

### Jedino što i dalje čeka čovjeka

**Vremena svjetskih bosova.** Rasporeda nema nigdje u API-ju; vremena su stvarna,
objavljena i **vanjska**. Tabela i `/admin/gw2-events` postoje, prazni. Red stiže
do čitaoca samo ako je i objavljen i **provjeren**, uz bilješku gdje.

Neću ih prepisati po sjećanju. Pogrešno vrijeme šalje igrača na praznu mapu.
