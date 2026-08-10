# P4 · cjelina 2 — Profil, XP, rankovi, questovi, sezone (10.08.2026)

Druga od devet cjelina. Ovdje nema mrtvih uglova kakvi su bili u prvoj — nema
stanja iz kojeg se ne izlazi. Nalazi su druge vrste: **ograničenja koja se daju
zaobići i brojači koji ne prestaju rasti.**

---

## Dijagram stanja

```
  akcija (komentar, članak, igra, quest, streak)
        │
        ▼
  ┌──────────────────────────────────────────────┐
  │ XpService::awardXp                           │
  │  ① sezonski množilac (1.0 kad nema sezone)   │
  │  ② cooldown 60s — samo komentari             │
  │  ③ dnevni cap 100 XP  ← ključ ističe u ponoć │
  │  ④ users.xp += iznos  (atomičan increment)   │
  │  ⑤ provjera ranga                            │
  └──────────────────┬───────────────────────────┘
                     ▼
        ┌────────────────────────────┐
        │ rang = najviši gdje         │
        │ min_xp <= xp                │
        │ obavijest SAMO na napredak  │
        └────────────────────────────┘

  QuestProgress:  0 ──► progress ──► completed_at ──► nagrada (jednom)
                            ▲              │
                            └── reset ──────┘ (daily/weekly, ne permanent)

  Sezona:  is_active + start_date <= sad <= end_date
           └─ zatvara je season:conclude noću; flaggedActive() je nalazi
              i kad joj datum prođe
```

---

## Nalazi

### 1. Ključ dnevnog capa nije nikad istjecao

`Cache::increment()` radi goli Redis `INCRBY`, a to **ne postavlja rok**. Ključ
`user:{id}:xp:{datum}` se stvarao bez isteka i ostajao zauvijek — jedan po
korisniku po danu. Uz hiljadu aktivnih korisnika to je ~365.000 trajnih ključeva
godišnje, na Redisu koji (prema `docs/34`) još nema politiku izbacivanja.

Popravka: `Cache::add($key, 0, now()->endOfDay())` prije inkrementa. `add()`
postavlja rok samo kad ključa nema, a `INCRBY` ne dira postojeći rok — pa
brojač i dalje umire u ponoć.

### 2. Dnevni cap se dao probiti paralelnim zahtjevima

Bilo je pročitaj-pa-uvećaj: dvadeset istovremenih poziva svi pročitaju isti
zbir, svi prođu provjeru, svi dobiju pun iznos. Komentari su zaštićeni
cooldownom, ali "dodana igra", "završena igra" i ocjene nisu — uz limiter od
60 zahtjeva u minuti, burst je davao višestruko više od 100 XP.

Sada se prvo inkrementira (atomično), pa se višak vraća:

```php
$afterAward = (int) Cache::increment($dailyKey, $amount);
if ($afterAward > CAP) { $actualAmount = $amount - ($afterAward - CAP); Cache::decrement(...); }
```

Zbir svih dodijeljenih iznosa ne može preći cap, bez obzira na paralelizam.

### 3. Quest se mogao završiti dvaput

`progressQuest` je imao transakciju, ali **bez zaključavanja reda**. Dva
paralelna poziva oba pročitaju isti `progress`, oba pređu prag, oba pozovu
`grantRewards` — dvostruki XP i dvostruki bounty. Dovoljno je bilo dvaput
okinuti akciju koja quest pomiče.

Unique indeks `(user_id, quest_id)` je sprječavao duplikat **reda**, ne
dvostruku isplatu.

Popravka: `firstOrCreate` pa ponovno čitanje s `lockForUpdate()` unutar iste
transakcije.

### 4. Nazadovanje u rangu javljalo se kao napredovanje

`checkRankUpdate` uzima najviši rang čiji je `min_xp <= xp` i mijenja ga kad se
razlikuje — u **oba** smjera. Kad se ljestvica prepodesi u admin panelu,
korisnik može pasti na niži rang i dobiti `RankUpNotification` s čestitkom.

Sada se poredi prag starog i novog ranga; rang se i dalje ispravlja u oba
smjera, ali se obavještenje šalje samo kad je stvarno napredak.

### 5. Sezona se nije završavala na svoj datum

`Season::active()` je gledala samo `is_active`. Zastavicu gasi noćni
`season:conclude`, pa je sezona s prošlim `end_date` ostajala aktivna do tog
pokretanja — a ako scheduler stoji (što se u ovom repou već dešavalo), i
neograničeno. Sve to vrijeme množilac je i dalje množio.

Sada `active()` čita i datume. Uveden je `flaggedActive()` za `ConcludeSeason`,
koji mora naći baš onu sezonu kojoj je datum prošao — inače bi popravka
zaključala nagrade umjesto da ih dodijeli.

### 6. XP i bounty više nisu mass-assignable

`xp`, `bounty_balance` i `forum_reputation` bili su u `User::$fillable`. P1 je
potvrdio da danas nijedan kontroler to ne iskorištava — ali cijela ekonomija je
bila jedan nepažljiv `$user->update($validated)` daleko od besplatne, a ta
linija se lako napiše slučajno.

Sve što ih pomiče ide kroz `XpService`, `BountyService` ili eksplicitan
`increment()`, i nijedno od toga ne koristi mass assignment. Fabrike nisu
pogođene — Laravel ih pravi `unguarded`.

Jedini stvarni pisač bio je `SyncUserXP`, prebačen na `forceFill`.

---

## Provjereno pa odbačeno

- **Sezonski množilac ide prije capa**, pa dvostruka sezona ne diže strop nego
  se do njega stiže brže. To je namjerno i tako i piše u docblocku.
- **`users.xp` se uvećava atomičnim SQL `increment`om** — nema utrke na samoj
  koloni.
- **Cooldown za komentare** ima rok (`Cache::put` sa sekundama) — samo cap nije
  imao.
- **Questovi bez sezone rade i kad sezone nema**, a sezonski tiho stanu:
  `where('season_id', null)` ne pogađa nijedan red. Nema mrtvog stanja.
- **`Season::multipliers()`** vraća 1.0 kad sezone nema — nema dijeljenja s
  nulom ni gašenja ekonomije.
- **Reset questa** vrijedi za daily/weekly, `permanent` se ne resetuje.

## Ostaje otvoreno

- **Dvije sezone označene kao aktivne** nisu spriječene ničim; `active()` uzme
  onu s manjim id-em. Vrijedi parcijalni unique indeks na `is_active = true`.
- **`SnapshotReputation`** piše istoriju iz `users.xp`, a `SyncUserXP` je
  preračunava iz aktivnosti. Dva izvora istine za isti broj — nije nađen
  konkretan razlaz, ali vrijedi ih spojiti prije nego se pojavi.

---

## Testovi

`tests/Feature/ProgressionEconomyTest.php` — 6 testova: cap drži pod naletom i
brojač **ne preživi dan**, XP nije mass-assignable, quest plaća jednom iako
okidač pukne triput, sezona prestaje množiti kad joj datum prođe (a
`flaggedActive()` je i dalje nalazi), pad u rangu se ne javlja kao napredak, a
uspon se javlja.

**401/401 prolazi.**

## Deploy

Nema migracija.

```
cd /var/www/techplay && git pull
cd backend && php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```

Napomena: **zatečeni ključevi `user:*:xp:*` u Redisu i dalje nemaju rok** —
popravka vrijedi za nove. Ako ih želiš počistiti odjednom:

```bash
redis-cli --scan --pattern 'techplay_cache:user:*:xp:*' | xargs -r redis-cli del
```

Provjeri prefiks (`CACHE_PREFIX`) prije pokretanja i pokreni prvo samo `--scan`
da vidiš koliko ih je.
