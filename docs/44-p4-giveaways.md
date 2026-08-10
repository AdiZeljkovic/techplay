# P4 · cjelina 7 — Giveaways (10.08.2026)

Sedma od devet. Zanimljiva cjelina jer je **najteži dio već bio dobro urađen**, a
propusti su bili u onome što izgleda jednostavno.

---

## Dijagram stanja

```
  Giveaway:  draft (is_public=false) ──► active ──ends_at prošao──► (ništa)
                                                                      │
                                            ručno izvlačenje u panelu ─┘
                                                     └──► winner_id / status='ended'

  Entry:     (nema) ──enter / prvi zadatak / prvi dnevni bonus──► entry
                              │
                              ├── zadatak (jednokratan) ──► +bodovi, jednom
                              ├── zadatak (ponovljiv)   ──► +bodovi, jednom dnevno
                              └── dnevni bonus          ──► streak +1, jednom dnevno

  Bodovi:    ograničeni s giveaways.max_entries_per_user
```

Strelica koja nedostaje je ona iz `ends_at prošao` u `izvučen pobjednik`. Nema
je — vidi nalaz 3.

---

## Šta je već bilo dobro

Vrijedi zapisati, jer je izvlačenje najosjetljiviji dio i neko ga je pažljivo
napisao:

- `pickWinner()` radi u transakciji s `lockForUpdate` na nagradnoj igri,
- odbija ako pobjednik već postoji,
- težinski izbor je kumulativni prolaz `O(n)`, ne `O(n × bodovi)`,
- `pickWinnersByTiers()` prati već izabrane kroz sve nivoe, pa isti korisnik ne
  može dobiti dvije nagrade,
- `giveaway_task_completions` ima unique indeks, a bodovi se dodjeljuju samo kad
  je red stvarno nastao (`wasRecentlyCreated`).

---

## Nalazi

### 1. Unique indeks nije hvatao jednokratne zadatke

Indeks je `unique(entry_id, task_id, completed_date)`. Ponovljivi zadatak upisuje
današnji datum — indeks radi. **Jednokratni upisuje `NULL`**, a Postgres NULL-ove
smatra međusobno različitim, pa indeks ne sprječava drugi red.

Ostaje samo `firstOrCreate`, a to je čitanje pa upis: dva brza klika oba ne nađu
red, oba ga naprave, oba prođu kao `wasRecentlyCreated` i oba dodaju bodove.

Popravka: `lockForUpdate` na `giveaway_entries` redu na početku transakcije. To
serijalizuje oba klika za isti unos.

### 2. `addPoints` je gubio bodove

```php
$newTotal = min($this->total_points + $points, $maxPoints);
$this->update(['total_points' => $newTotal]);
```

Pročitaj-izmijeni-upiši. Dva istovremena zadatka i jedan od njih nestane — ovaj
put na štetu korisnika, ne sistema.

Ista brava iz nalaza 1 pokriva i ovo, jer se sada čita zaključan red.

Gornja granica `max_entries_per_user` je usput bila jedino što je držalo štetu
od prvog nalaza ograničenom.

### 3. Nagradna igra kojoj prođe rok ostaje bez pobjednika i niko ne sazna

Izvlačenje je **ručna akcija u panelu**. Ne postoji ni komanda, ni raspored, ni
obavijest. `ends_at` prođe, `isActive()` postane `false`, ulazi prestanu — i
tu stane. Nagrada nedodijeljena, učesnici čekaju, a jedini način da se primijeti
je da neko sam ode pogledati.

Ovo je mrtvi ugao ove cjeline, ali rješenje nije još jedna cron komanda koju
niko ne čita. Nagradna igra se **ne smije** izvlačiti automatski — to je odluka
redakcije. Treba samo da se vidi.

Zato `GiveawayResource` sada nosi značku u navigaciji s brojem završenih igara
bez pobjednika, u `warning` boji. Isti obrazac koji `ReleaseCalendar` već
koristi za igre koje čekaju odluku.

### 4. Pobjednika je birao `mt_rand`

Mersenne Twister je predvidiv iz dovoljno posmatranog izlaza i nije namijenjen
odlukama koje nešto vrijede. Ovdje odlučuje ko dobija nagradu.

Zamijenjen s `random_int()` na oba mjesta. Nema mjerljive cijene, a razlika je
između "nasumično" i "nasumično koliko treba".

---

## Provjereno pa odbačeno

- **Dnevni bonus** je bio idempotentan po danu preko `last_visit_date`, ali kroz
  isto pročitaj-pa-piši; sada ide kroz istu bravu.
- **`forum_post` zadatak se stvarno provjerava** — traži pravu objavu nastalu
  nakon početka igre. Ostali tipovi su samoprijavljivanje na klik, i to je
  svjesna odluka, ne propust.
- **`is_public` filter** na svim ulaznim rutama zatvoren u P1.
- **Bodovi imaju gornju granicu** po korisniku (`max_entries_per_user`).
- **Nema duplih unosa** — `unique(giveaway_id, user_id)`.

## Ostaje otvoreno

- **IP ograničenje po mreži** (`max_entries_per_ip`) postaje smisleno tek od P1,
  otkad `X-Forwarded-For` više nije slobodan izbor pozivaoca. Vrijedi provjeriti
  na produkciji da nije prestrogo za korisnike iza istog NAT-a.
- **Privée tok** ima vlastitu prijavu i nije dio ove cjeline.

---

## Testovi

`tests/Feature/GiveawayIntegrityTest.php` — 4 testa: jednokratan zadatak se
broji jednom i ostavlja tačno jedan red, dnevni bonus se uzima jednom dnevno,
pobjednik se izvlači jednom, i završena igra bez pobjednika je vidljiva osoblju.

## Deploy

Nema migracija.

```
cd /var/www/techplay && git pull
cd backend && php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```

Poslije deploya vrijedi pogledati značku pored **Giveaways** u panelu — ako
pokazuje broj, to su igre koje već čekaju izvlačenje.
