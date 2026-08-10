# P4 · cjelina 8 — Chronicle i preporuke (10.08.2026)

Osma od devet. Najzdravija cjelina do sada — nema exploita, nema mrtvog ugla.
Nalazi su o **cijeni** i o **tome kad se posao baca.**

---

## Dijagram stanja

```
  user_chronicles (jedan red po korisniku, s version i built_at)

     (nema reda) ──┐
                   ├──► čitanje ──► ChronicleBuilder::build() ──► red + keš 600s
     version < N ──┘                        │
                                            └─ pukne? → nema personalizacije,
                                                        stranica se i dalje prikazuje

     stvarna izmjena (kolekcija, ocjena) ──► forget() ──► red OBRISAN
                                                            │
                                          noćni chronicle:rebuild --stale ─┘
                                          (hvata i one bez reda)
```

Ključno za razumjeti: `forget()` **ne čisti keš — briše izgrađeni red.** Sljedeće
čitanje ga gradi iznova, iz jedanaest upita, unutar zahtjeva korisnika. Zato je
važno *kad* se poziva.

---

## Nalazi

### 1. Odbijeni zahtjev je bacao izgrađeni dosije

`forget()` je bio **prva naredba** u `GameCollectionController::upsert()` —
prije provjere da igra uopšte postoji (404) i prije validacije (422).

Znači: zahtjev za nepostojeći slug briše dosije i tjera pun ponovni izračun na
sljedećem učitavanju stranice. Isto za zahtjev koji padne na validaciji.

To je čista šteta u normalnom radu, a uz to i jeftin način da se nekome uspori
kontrolna ploča: ponavljaj neispravan zahtjev i svaki put mu se dosije gradi
iznova.

Zanimljivo je da je **isti obrazac** prethodni programer već jednom uhvatio, u
`GameRatingController`:

> *"Quest progress belongs here, with the rest of the payout. It used to run as
> the first statement of this method — before validation, on every call…"*

Popravljen je jedan poziv, ne obrazac. `forget()` je sada poslije upisa.

### 2. Uklanjanje igre nije poništavalo dosije

Samo `upsert` je zvao `forget()`. Skidanje igre s police govori o ukusu isto
koliko i stavljanje, pa su uklonjene igre nastavljale usmjeravati preporuke dok
nešto drugo ne izazove ponovnu izgradnju.

### 3. Neizgradiv dosije je rušio stranicu

`chronicle:rebuild` pažljivo izoluje korisnika koji ne prolazi — komentar u toj
komandi kaže zašto:

> *"One unbuildable user used to abort the whole run, so everyone after them was
> never rebuilt — and the same user poisoned it again the next night, forever,
> silently."*

Web put nije imao ekvivalent. `build()` se zove unutar `Cache::remember`
zatvaranja, bez `try/catch`, pa je isti takav korisnik dobijao **500 na
kontrolnoj ploči i u feedu** umjesto stranice bez personalizacije.

Preporuke su ukras. Nikad ne vrijede stranice.

---

## Provjereno pa odbačeno

- **`GameRecommendationService` je dobro branjen**: `max(1e-6, array_sum(...))`,
  `max(1, peerMax)`, `isEmpty()` provjere na skupu vršnjaka. Nema dijeljenja
  nulom ni na jednom putu, uključujući korisnika bez ijedne igre.
- **`chronicle:rebuild --stale`** ispravno hvata i korisnike **bez** reda
  (`! $lastBuild`), pa obrisani dosijei ne ostaju obrisani.
- **Podizanje `ChronicleBuilder::VERSION`** ne traži migraciju ni poseban
  prolaz: `row()` gradi iznova kad je verzija starija, pri prvom čitanju.
- **`stale()` pita svaki izvor jednom** umjesto pet upita po korisniku —
  komentar u kodu kaže da je stari oblik bio sto hiljada upita na dvadeset
  hiljada korisnika. To je već popravljeno.
- **Privatnost**: `GamerDnaController` poziva `profileHidden()` (potvrđeno u P1).

## Ostaje otvoreno

- **Nema zaštite od naleta pri ponovnoj izgradnji.** `Cache::remember` nije
  `flexible`, pa poslije `forget()` više istovremenih zahtjeva gradi paralelno.
  Rizik je mali jer `forget()` izazivaju **vlastite** akcije korisnika, pa je
  paralelizam ograničen na njegove zahtjeve — ali `Cache::flexible` bi bio
  ispravniji oblik.
- **Neuspjela izgradnja se kešira kao `null` na 600 sekundi.** To je namjerno
  (ne pokušavaj iznova na svaki zahtjev), ali znači da se korisnik oporavlja tek
  nakon deset minuta ili noćnog prolaza.

---

## Testovi

`tests/Feature/ChronicleTest.php` — 4 testa: 404 i 422 ne koštaju ponovnu
izgradnju, stvarna izmjena je poništava, uklanjanje igre takođe, i neizgradiv
dosije košta preporuke a ne stranicu.

## Deploy

Nema migracija.

```
cd /var/www/techplay && git pull
cd backend && php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```
