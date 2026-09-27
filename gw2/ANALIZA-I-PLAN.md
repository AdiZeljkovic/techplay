# GW2 Progression Advisor — analiza i plan razvoja

Odgovor na `TechPlay_GW2_Progression_Advisor_Working_Document_v1`, pisan
**27. 9. 2026.** nakon čitanja tog dokumenta, četiri mockupa i **postojećeg
TechPlay koda**.

**Obim: pun proizvod kako je u dokumentu opisan** — svih sedam stubova, svi
domeni napretka, goal planner, Tonight, Legendary. Ovaj dokument ne sužava
obim; raspoređuje ga i rješava ono što izvorni dokument nije mogao znati jer
nije imao pristup kodu ni živom API-ju.

---

## 1. Presuda

**Izvodivo, i tehnički lakše nego što dokument pretpostavlja.** Dva mjerenja
napravljena danas mijenjaju arhitekturu nabolje:

1. Živi API dozvoljava **600 zahtjeva/min**, ne 300.
2. **Devedeset posto API površine je statički podatak igre koji je isti za sve
   korisnike.** Dokument to tretira kao keš; zapravo je to vlastiti katalog
   koji se puni jednom po verziji igre.

Zajedno spuštaju cijenu jedne korisničke sinhronizacije s ~75 poziva na
**~20**, i time je pun obim postao održiv.

---

## 2. Mjerenja, ne pretpostavke

### 2.1 API s našeg servera

```
GET https://api.guildwars2.com/v2/build   → 200 za 159 ms
x-rate-limit-limit: 600
server: Quaggans
```

Dokument u sekciji 19 navodi 300/min [S3]. Zaglavlje kaže 600. **Faza 0 mora
izmjeriti stvarno ponašanje kante** (gdje stiže 429, brzina punjenja), jer o
tome ovisi raspored sinhronizacija.

### 2.2 Koliko je statičkih podataka — izmjereno

| Endpoint | ID-jeva | Poziva (200/batch) |
|---|---:|---:|
| `items` | 74.265 | 372 |
| `recipes` | 13.198 | 66 |
| `achievements` | 8.339 | 42 |
| `quests` | 586 | 3 |
| `titles` | 496 | 3 |
| `itemstats` | 191 | 1 |
| `currencies` | 79 | 1 |
| `specializations` | 81 | 1 |
| `masteries`, `professions`, `mounts/types` | ~58 | 3 |
| **ukupno** | **~97.300** | **~492** |

**~492 poziva za cijeli katalog igre — jednom.** Ne po korisniku. Ne po
sesiji. Jednom po verziji igre, a verzija se otkriva jednim jeftinim pozivom:

```
GET /v2/build → {"id": 207318}
```

To je isti obrazac kojim TechPlay već drži katalog od 333.000 igara: podatak
se dovuče, normalizuje i služi iz naše baze, a vanjski API se ne dira po
zahtjevu čitaoca.

### 2.3 Cijena jedne korisničke sinhronizacije — IZMJERENO ključem

Mjereno 27. 9. 2026. pravim ključem, svih 17 endpointa vratilo **200**:

```
account                    559 B      account/legendaryarmory       2 B
account/achievements    77.302 B      account/mounts/types         54 B
account/masteries          339 B      account/progression          48 B
account/mastery/points   1.320 B      account/raids                60 B
account/wallet           1.343 B      account/worldbosses           2 B
account/materials       42.148 B      account/dailycrafting         2 B
account/bank             1.984 B      account/wizardsvault/daily 1.189 B
account/inventory          337 B      account/wizardsvault/weekly 1.991 B
account/recipes            208 B
                                              17 poziva, ~128 KB, 8 s
characters?ids=all                             1 poziv, 19,7 KB, 7,7 s
                                       ────────────────────────────────
                                       PUNA SINHRONIZACIJA = 18 POZIVA
```

### 2.4 `characters?ids=all` vraća više nego što se očekivalo

Jedan poziv vraća **trenutno nošenu opremu, torbe, specijalizacije, vještine,
recepte i zanate**:

```
name, race, gender, flags, profession, level, guild, age, created, deaths,
crafting, backstory, wvw_abilities, equipment, recipes, training, bags,
equipment_pvp, specializations, skills
```

Komad opreme nosi sve što AR modul treba:

```json
{"id":103785,"slot":"Coat","upgrades":[74978],"skin":6,
 "stats":{"id":161,"attributes":{"Power":141,"Precision":101,"CritDamage":101}},
 "binding":"Account","dyes":[19,19,19,null]}
```

**Ključno:** `equipment` nema polje `tabs` — to je **aktivna** oprema, tačno
ono što dokument traži za AR izračun („do not sum inactive template gear").
`equipment_tabs` i `build_tabs` **nisu potrebni** za AR ni za build prikaz;
trebaju samo ako se ikad budu prikazivali neaktivni šabloni.

### 2.5 `training` je prazan — potvrđeno uživo

```
training: niz od 0
```

Dokument to navodi kao [S11] i **tačno je**. Elite specijalizacija se smije
zaključiti samo iz `specializations` (šta je slotirano), nikad kao „potpuno
istrenirana". Ovo je prvi primjer pravila „FACT vs INFERENCE" koje alat mora
poštovati.

### 2.6 Stvarni limit — izmjeren, nije onakav kakav dokument opisuje

| Test | Rezultat |
|---|---|
| 400 zahtjeva, 20 paralelno | **7,5 s, svih 400 → 200** |
| 1000 zahtjeva, 40 paralelno | 27,4 s, **500 → 200, 500 → 429** |
| pauza 30 s, pa 200 zahtjeva | **svih 200 → 200** |

Kanta je **~500–600**, što se slaže sa zaglavljem `x-rate-limit-limit: 600`,
a oporavak je **potpun za 30 sekundi**. Dokumentovanih „5 zahtjeva/s" nema —
prošlo je ~53/s dok kanta traje.

**Za plan to znači:**

- **429 je meko stanje, ne kazna.** Posao ga tretira kao „pokušaj kasnije".
- Cijeli katalog igre (~492 poziva) stane u **jedan rafal**.
- Pri 18 poziva po sinhronizaciji: **~30 punih sinhronizacija po rafalu**,
  i oko **16/min održivo**.
- Limit **nije usko grlo** na TechPlayevoj skali. Globalni brojač ipak
  ostaje — ne da spriječi zid, nego da pozadinski poslovi ne pojedu budžet
  korisniku koji upravo čeka.

### 2.7 Jedna zamka nađena u samom odgovoru

Testni nalog ima `access`:

```
GuildWars2, PlayForFree, PathOfFire, EndOfDragons, SecretsOfTheObscure, JanthirWilds
```

**`HeartOfThorns` nije naveden**, iako nalog ima PoF. Detekcija vlasništva
nad ekspanzijama se **ne smije** raditi prostim `in_array`. Prije nego se
ijedna preporuka veže za ekspanziju, treba utvrditi tačna pravila tog polja —
inače alat sakrije HoT masterije nekome ko im ima pristup.

---

## 3. Šta već postoji u TechPlayu

### 3.1 `ConnectedAccount` — GW2 je šesti provider, ne nova infrastruktura

Model je u upotrebi za 34 naloga kroz Steam, Xbox, PlayStation, GOG i Epic:

```php
'provider', 'provider_user_id', 'display_name',
'access_token',   // Crypt::encryptString kroz mutator
'scopes',         // array cast → GW2 permissions
'sync_status', 'sync_error', 'last_synced_at', 'metadata'
protected $hidden = ['access_token', 'refresh_token'];
```

**Sekcija 6.2 izvornog dokumenta je time skoro cijela ispunjena:** ključ je
šifrovan u bazi, skriven iz serijalizacije, ima stanje sinhronizacije i
poruku greške. Treba dodati samo prikaz maskiranog sufiksa i „Disconnect".

### 3.2 Redovi, radnici, keš

- Dva reda (`default`, `live`), supervisor u `deployment/supervisor-worker.conf`
- Redis kao keš i red
- Obrazac posla sa samoponavljanjem: `SyncSteamAchievements` drži budžet od 75
  sekundi i predaje ostatak sebi — **tačno obrazac koji GW2 sinhronizacija
  treba**
- `CacheService` s registrom ključeva i `forgetListings()`

### 3.3 WoW Analyzer — presedan i upozorenje

`/wow-analyzer` postoji (`BlizzardService`, `BlizzardDataTransformerV2`,
`RaiderIOService`, `GroqService`, rute pod `throttle:60,1`). Iz zabilješki o
frontu: **komponente su „nespojene a ne mrtve"** — napisane pa ostavljene
nepovezane.

Zato plan ispod ima **kapije po modulu**: modul nije gotov dok nije povezan,
vidljiv i mjeren.

---

## 4. Arhitektura

### 4.1 Tri sloja podataka, tri različita životna vijeka

```
KATALOG IGRE          jednom po game build      naše tabele, dijeli se svima
  items, achievements, recipes, masteries, specializations, itemstats…

STANJE NALOGA         po korisniku, u redu      snapshot + diff
  account/*, characters/*

CIJENE                2–10 min                  Redis, s vremenskom oznakom
  commerce/prices
```

Presudno pravilo: **nijedan zahtjev čitaoca ne smije pokrenuti poziv prema
ArenaNetu.** Stranica se crta iz naše baze. Sinhronizacija je posao u redu.
To je ista lekcija koju je sajt platio na stranicama igara.

### 4.2 Globalni brojač poziva

Limit je po IP-u, a mi proksiramo — dakle **jedan budžet za cijeli TechPlay**.

- Token bucket u Redisu (`gw2:bucket`), popunjavanje po izmjerenoj stopi
- Svaki poziv prema ArenaNetu traži token; nema tokena → posao se odgađa, ne
  ruši
- Rezervisan dio budžeta za **interaktivne** sinhronizacije (korisnik je
  upravo povezao ključ) da pozadinski poslovi ne pojedu sve
- Katalog igre se puni noću, kad budžet nije potreban nikome

### 4.3 Sinhronizacija u dva nivoa

| Nivo | Kad | Šta | Cijena |
|---|---|---|---|
| **Brza** | otvaranje dashboarda, ručno | wizardsvault, raids, worldbosses, account | ~5 poziva |
| **Puna** | povezivanje ključa, pa noću | sve | ~18 poziva |

Brza pokriva ono što se mijenja dnevno; puna ono što se mijenja rijetko.

### 4.4 Otpornost

Dokument [S3] navodi povremene lažne „Invalid key" odgovore. Nalog se
**ne označava pokvarenim prije praga** — ponovni pokušaji s odmakom, pa tek
onda `sync_status = 'error'`. Zadnji dobar snapshot se servira uvijek, s
oznakom kad je uzet.

---

## 5. Model podataka

Uz TechPlay konvencije (PostgreSQL, `_json` kolone kao `jsonb`, migracije s
opisnim imenima).

```
gw2_catalog_items        (id, name, rarity, level, type, details_jsonb, build_id)
gw2_catalog_achievements (id, name, requirement, tiers_jsonb, flags, rewards_jsonb, build_id)
gw2_catalog_recipes      (id, output_item_id, ingredients_jsonb, disciplines, build_id)
gw2_catalog_masteries    (id, region, levels_jsonb, build_id)
gw2_catalog_meta         (key, build_id, refreshed_at)      -- jedan red po endpointu

gw2_accounts             (user_id, connected_account_id, arena_account_id,
                          world, access_jsonb, fractal_level, last_full_sync_at)
gw2_characters           (gw2_account_id, name, profession, level, age,
                          equipment_jsonb, build_jsonb, observed_at)
gw2_account_state        (gw2_account_id, masteries_jsonb, achievements_jsonb,
                          wallet_jsonb, unlocks_jsonb, progression_jsonb, observed_at)
gw2_item_ledger          (gw2_account_id, item_id, quantity, location_type,
                          location_ref, stats_id, observed_at)
gw2_progress_events      (gw2_account_id, type, payload_jsonb, occurred_at)

gw2_goals                (slug, version, domain, title, requirements_jsonb,
                          completion_rule_jsonb, status, reviewed_at, build_id)
gw2_user_goals           (user_id, goal_slug, character_id, priority, pinned_at,
                          completed_at, overrides_jsonb)
gw2_rules                (slug, version, trigger_jsonb, prerequisites_jsonb,
                          scoring_jsonb, output_jsonb, reviewed_at, build_id, enabled)
gw2_recommendations      (user_id, rule_slug, score, confidence, evidence_jsonb,
                          generated_at, dismissed_at, acted_at)
gw2_sources              (id, url, kind, reviewed_at, owner, notes)
```

Dvije stvari koje dokument traži a lako se ispuste:

- **`build_id` na svemu kuriranom.** Kad igra dobije patch, zna se šta je
  pregledano prije njega.
- **`gw2_progress_events`** se izvodi iz razlike snapshotova. To je „Progress
  delta" iz sekcije 17 i jedina stvar koja gradi **istoriju koju API nema** —
  raid clears su samo od zadnjeg reseta, pa je naš snapshot jedini zapis.

---

## 6. Mehanizam preporuka

Iz sekcije 8, konkretizovano.

```
1  normalizuj      → AccountState, CharacterState, GoalState iz naših tabela
2  filtriraj       → otpadaju pravila čiji tvrdi preduslovi nisu ispunjeni
3  namjera         → izabrani cilj, tip sadržaja, vrijeme, avoid-lista
4  blokade         → šta stoji na putu i šta ga otključava
5  bodovanje       → ograničena funkcija, težine u konfiguraciji
6  pouzdanost      → Confirmed / High / Medium / Needs confirmation / hide
7  dedupliciraj    → jedna aktivnost često gura više ciljeva
8  vrati           → 3 glavne + 3 alternative, ne više
```

**Pravila su podaci, ne kod.** Žive u `gw2_rules`, imaju verziju i
`reviewed_at`. Mehanizam je u Laravelu; Next.js crta objekte i ne zna ništa o
progresiji. Time isti mehanizam kasnije služi i aplikaciji i Discord botu.

**LLM ne odlučuje.** Može prepisati objašnjenje u ljudskiju rečenicu — nikad
ne bira preporuku. (`GroqService` već postoji ako to zatreba.)

---

## 7. Moduli i redoslijed

Pun obim, raspoređen tako da svaki korak ima nešto vidljivo i mjerljivo.

### Faza 0 — temelj (bez UI-a)

Mjerenja su **odrađena 27. 9.** (sekcija 2). Ostaje izgradnja:

- ~~Testni ključ, `/v2/tokeninfo`, matrica dozvola~~ ✅
- ~~Cijena pune sinhronizacije~~ ✅ **18 poziva**
- ~~Stvarni rate limit~~ ✅ **kanta ~600, oporavak 30 s**
- Katalog igre: puniti, pratiti `build_id`, noćno osvježavanje
- `ConnectedAccount` provider `gw2` + UI za povezivanje i odspajanje
- Token bucket u Redisu
- **Razjasniti polje `access`** (sekcija 2.7) prije bilo kakve logike o
  ekspanzijama

**Kapija:** katalog napunjen, ključ povezan, snapshot snimljen, budžet poštovan.

### Faza 1 — Dashboard (mockup 1)

Stanje naloga po domenima, bez zbirnog skora. Kartice: mastery, fractal level,
AR, ascended, achievements. Prvi mehanizam preporuka s 10–15 pravila.
Wizard's Vault kartica. „Progress delta" od druge sinhronizacije.

### Faza 2 — Masteries & Easy Wins (mockup 3)

Regije, tačke, kurirani izvori mastery tačaka s trakom težine. Easy wins iz
`current/max` uz denylist za zastarjele i skrivene.

### Faza 3 — Goal planner: Ascended set (mockup 2)

Jedinstveni item ledger kroz materijale, banku, zajedničku i torbe likova.
Nedostajući slotovi, cijene s TP-a s vremenskom oznakom, **odvojeno** prikazan
zlatni i vezani/vremenski ograničen trošak.

### Faza 4 — Tonight (mockup 4)

Sesije 30/60/120 sastavljene **iz već važećih preporuka**, ne novih. Rasporedi
svjetskih bosova iz objavljenog rasporeda, označeni kao „zakazano".

### Faza 5 — Fractals, Raids, Story, Legendary

Redom po dokumentu. Raid: nikad „spreman za raid" iz opreme — samo „osnovna
oprema zadovoljena", uz istoriju koju gradimo od dana povezivanja.

### Faza 6 — Javne stranice i SEO

Familije stranica iz sekcije 20. **Javni dio mora biti koristan bez ključa**;
povezivanje naloga ga personalizuje. To je motor dolaska, ne dashboard.

---

## 8. Dvije stvari na mockupima koje treba odlučiti

Mockupi su odlični i raspored se prihvata. Ali na dva mjesta **crtaju ono što
izvorni dokument izričito zabranjuje**:

**„Weekly Completion Score 72/100"** (mockup 3) i **„Confidence to complete:
High"** (mockup 2). Sekcija 11.1 kaže doslovno: *„Do not use a single 82%
readiness score in V1. It looks precise but hides assumptions."*

**„0–10 min / 10–20 min…"** u Tonight planu (mockup 4). Sekcija 10 kaže *„no
fabricated time estimate for highly variable tasks"*.

Nije stvar ukusa nego premise proizvoda — razlike između činjenice, zaključka i
preporuke. Predlažem: skor izbaciti ili mu dati vidljivu metodologiju,
minutažu zamijeniti opsezima („15–30 min"). **Odluka je tvoja, samo neka bude
svjesna.**

---

## 9. Šta ovo traži da bi opstalo

Pun obim znači **stalno uređivačko održavanje**: kurirana pravila, mastery
izvori, akvizicijski grafovi, provjera nakon svakog patcha. `reviewed_at` i
`build_id` postoje da se vidi šta je zastarjelo, ali neko to mora gledati.

Uz trenutni ritam od 3–6 članaka sedmično, ovo je **druga redakcijska obaveza**,
ne sporedni posao. Vrijedi to znati unaprijed i planirati ko je drži.

---

## 10. Šta treba prije prvog reda koda

1. ~~Testni GW2 nalog i API ključ~~ ✅ dobijen i iskorišten 27. 9.
2. **Odluka o ona dva broja na mockupima** (sekcija 8).
3. Potvrda da idemo na `/gw2/*` kao putanju i `gw2` kao provider.
4. **Nalog s više likova za drugo mjerenje.** Testni nalog ima **jednog**
   lika, pa je `characters?ids=all` mjeren na jednom. Oblik odgovora je
   potvrđen, ali ne i veličina pri 15–20 likova — a 19,7 KB i 7,7 s za jednog
   nagovještava da to može biti najskuplji poziv u cijeloj sinhronizaciji.

### Napomena o ključu

Ključ korišten za ova mjerenja **nije zapisan** ni u jedan fajl, commit ni
zabilješku — korišten je samo u komandama ove sesije. Za razvoj treba
namjenski ključ, a ovaj vrijedi opozvati na
`account.arena.net → Applications` kad mjerenja više ne trebaju.

Nakon Faze 0 slijedi ono što izvorni dokument traži kao sljedeći artefakt:
matrica polja API-ja i prvih 20–30 pravila s tačnim shemama okidača,
preduslova i izlaza.
