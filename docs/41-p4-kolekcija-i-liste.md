# P4 · cjelina 3 — Kolekcija i liste (10.08.2026)

Treća od devet. Jedan nalaz, ali je najskuplji do sada — i pouka iz njega
vrijedi više od same popravke.

---

## Dijagram stanja

```
  UserGame (jedan red po korisniku i igri)

    (nema reda) ──PUT status──► backlog ⇄ playing ⇄ completed ⇄ dropped
          ▲                        │        │         │
          └────── DELETE ──────────┴────────┴─────────┘
                                             │
                                   wishlist ─┘   is_favorite (zastavica, ne status)

  GameRating:  (nema) ──► is_draft=true ⇄ is_draft=false (objavljeno)
                                              │
                                              └─ DELETE pa ponovo

  Isplata:  ledger (bounty_transactions.reference) odlučuje je li ovo prvi put
            — ne status reda, i ne postojanje reda
```

Ključna osobina ovog dijagrama: **iz svakog stanja postoji put nazad.** To je
ispravno za korisnika i pogrešno za svaku nagradu vezanu za *dolazak* u stanje.

---

## Nalaz: nagrade su bile vezane za stanje, a u stanje se može ući više puta

Dva mjesta, isti oblik:

```php
// završena igra
if ($status === 'completed' && $previousStatus !== 'completed') {  → 50 bounty + XP + quest
// objavljena ocjena
$justPublished = ! $is_draft && ($wasRecentlyCreated || $wasDraft);  → 15 bounty + XP + quest
```

Oba čitaju **prethodno stanje reda**. Ali korisnik status može vratiti unazad:

- `completed → playing → completed` = ponovna isplata,
- `objavljeno → nacrt → objavljeno` = ponovna isplata,
- a `DELETE` pa ponovni unos zaobilazi i jedno i drugo, jer nestane red iz kojeg
  se prethodno stanje čita.

`BountyService::award` nema **nikakav dnevni cap** (za razliku od XP-a, koji ima
100/dan). Uz limiter od 60 zahtjeva u minuti to je oko 1.500 bountyja u minuti,
neograničeno — a bounty se troši na kozmetiku i nagrade iz `rewards` kataloga.

### Popravka: idempotentni ključ u knjizi, ne zastavica na redu

Prva pomisao je bila kolona `completion_rewarded_at` na `user_games` — isto
rješenje kao `solution_rewarded_at` za forumska rješenja iz P1. **Ne valja
ovdje:** taj red korisnik može obrisati, i s njim nestaje zastavica.

Jedini zapis koji preživi brisanje reda je knjiga. Zato:

| Dio | Šta |
|---|---|
| `bounty_transactions.reference` | nova kolona, `unique(user_id, reference)` |
| `BountyService::award(..., reference:)` | provjerava postojanje **pod istom bravom** kao i upis salda; ponovni poziv vrati zatečeni saldo bez isplate |
| `BountyService::alreadyAwarded()` | pitanje "je li se ovo već desilo", za pozivaoce |

Nullable je namjerno: većina isplata *jeste* ponovljiva (komentar, dnevni niz,
prihvaćeno rješenje). Postgres dozvoljava mnogo NULL-ova pod unique indeksom, pa
te ostaju netaknute.

### Ono što je test otkrio, a čitanje koda nije

Prvo sam zatvorio samo isplatu bountyja. Test je i dalje padao: stanje je
poraslo za 40 iako je u knjizi bio samo jedan red od 15.

Uzrok: **quest je napredovao pri svakom objavljivanju.** Tri kruga
nacrt→objavi na **jednoj** igri završavaju quest "ocijeni tri igre" — i onda
quest legitimno isplati svojih 40.

Komentar u kodu je već opisivao rođaka ovog problema:

> *"It used to run as the first statement of this method — before validation, on
> every call — so saving a draft, publishing it and then editing it counted as
> three reviews and completed a 120 XP quest on a single game."*

Neko je to primijetio i pomjerio poziv na pravo mjesto — ali je popravio
**gdje** se poziva, ne **koliko puta**. Isto je vrijedilo i za završavanje igre.

Zato sada cijeli blok nagrade — bounty, XP, quest, dostignuće, klanski resurs —
prolazi kroz istu kapiju:

```php
$firstCompletion = $status === 'completed'
    && $previousStatus !== 'completed'
    && ! app(BountyService::class)->alreadyAwarded($user, "game_completed:{$game->id}");
```

Pouka: kad se nagrada veže za ulazak u stanje, nije dovoljno zaključati novac.
Sve što visi o tom istom `if`-u nasljeđuje istu grešku.

---

## Provjereno pa odbačeno

- **CSV uvoz** je dobro napisan: ne isplaćuje ništa po igri (inače bi 500 redova
  bilo 500 isplata), nikad ne ruši ručno unesene podatke (`if (! $entry->exists)`
  prije statusa, sati se samo povećavaju), ograničen na 500 redova i `throttle:5,1`.
  Nema transakcije, pa prekid ostavlja djelimičan uvoz — ali ponovno pokretanje
  se stapa umjesto da duplira, pa je to prihvatljivo.
- **XP za dodanu igru** ima ključ `xp_game_added:{game_id}` s rokom od 30 dana.
  Poslije toga se dade ponoviti, ali XP ionako ide kroz dnevni cap od 100.
- **`from_backlog`** je ljepljiv — jednom zarađen ostaje i ako se status kasnije
  mijenja. To je bilo promišljeno.
- **Objavljivanje liste** (`draft → public`) daje klanske resurse pri svakom
  krugu, ali `ClanResourceService::credit` primjenjuje dnevni cap po članu, pa
  je ograničeno. Ostaje kao sitna neurednost, ne kao printer.
- **Nema mrtvih uglova** — iz svakog stanja kolekcije postoji put nazad, i to je
  ispravno.

## Ostaje otvoreno

- **Ostale isplate nemaju ključ**, jer su namjerno ponovljive (dnevni niz,
  questovi, komentari). Vrijedi ih proći kad dođu njihove cjeline i odlučiti
  koje bi trebale biti jednokratne.
- **`GameMatchingService::matchByName`** se u uvozu poziva po redu — do 500
  upita po zahtjevu. Nije tačnost, nego trošak.

---

## Testovi

`tests/Feature/CollectionRewardsTest.php` — 5 testova:

- završavanje igre plaća jednom bez obzira koliko puta status skače,
- brisanje unosa i ponovno dodavanje ne plaća opet (zato ključ nije na redu),
- druga igra i dalje plaća — ključ je po igri, ne "završavanje se plaća jednom
  ikad",
- **jedna igra ne može dogurati quest za tri igre do kraja**,
- ponovno objavljivanje ocjene ne plaća dvaput.

## Deploy

**Ima migraciju.**

```
cd /var/www/techplay && git pull
cd backend && php artisan migrate --force
php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```

Migracija samo dodaje kolonu i indeks — ne dira postojeće redove. Zatečene
isplate ostaju kakve jesu; ključ vrijedi od sada. Ako želiš znati je li se ovo
već iskorištavalo, u knjizi se vidi:

```sql
select user_id, reason, count(*) 
from bounty_transactions 
where reason like 'Game completed:%' or reason like 'Game review written:%'
group by user_id, reason having count(*) > 1 
order by count(*) desc limit 20;
```
