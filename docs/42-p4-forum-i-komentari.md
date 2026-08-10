# P4 · cjelina 4 — Forum i komentari (10.08.2026)

Četvrta od devet. Sigurnosni dio ove cjeline odrađen je u P1 — privatni klanski
forumi, prekidač rješenja, vezivanje objave za temu, moderacija odgovora. Ovdje
ostaje knjigovodstvo: **ugled koji se kretao samo u jednom smjeru, i XP koji se
plaćao za pisanje umjesto za čitanje.**

---

## Dijagram stanja

```
  Thread:   created ──► open ⇄ locked
                │         │
                │         └─ pinned (staff, bez roka)
                │            self-pinned (autor, 100 bountyja, pinned_until +24h)
                │                 └─ forum:clear-expired-pins, svaki sat
                └─ deleted (samo staff)   → sada vraća −3 ugleda

  Post:     created (+5 ugleda, +20 XP) ──► edited ──► soft-deleted (−5)
                                                          └─ restored (+5, novo)

  Comment:  written ──► pending ──────► approved ──► XP (jednom, xp_awarded_at)
                    └─► approved ──┘        ▲   │
                        (odmah, ako nije    └───┘ moderator može vraćati
                         probacija ni 2+ linka)   — plaća se i dalje jednom
```

---

## Nalazi

### 1. XP se plaćao za komentar koji niko nikad ne vidi

`$shouldAwardXp = strlen($cleanContent) >= 10;` — **bez ijedne provjere statusa.**

Dva pravila drže komentar u redu za odobrenje: probacija (prva tri komentara
novog naloga) i sumnja na spam (dva ili više linkova). Oba su i dalje isplaćivala
punih 10 XP odmah. Pisati spam koji niko neće vidjeti vrijedilo je tačno koliko i
napisati nešto što ljudi čitaju.

Popravka ide u dva koraka jer je i suprotan slučaj bio pogrešan: korisnik na
probaciji koji napiše dobar komentar zaslužuje XP kad ga moderator odobri, a
nikakva kuka za to nije postojala.

- Kontroler plaća samo ako je komentar odmah `approved`.
- `CommentObserver::updated` plaća kad status pređe u `approved` — to je trenutak
  kad komentar počne postojati za druge ljude.
- Nova kolona `comments.xp_awarded_at` čuva da se plati **jednom ikad**;
  moderator koji vrti status naprijed-nazad ne isplaćuje svaki put. Zatečeni
  odobreni komentari su backfillovani da ne postanu ponovo naplativi.

### 2. Poruka o čekanju odobrenja bila je nedostižna

```php
if ($urlCount > 1) {
    $status = 'pending';            // ← postavljeno prije provjere
    if ($status === 'approved') {   // ← nikad tačno
        $message = '…(Link limit)';
    }
    $status = 'pending';            // ← suvišno
}
```

Korisnik koji objavi komentar s dva linka dobijao je **"Comment posted
successfully"**, a komentar je otišao u red za moderaciju. Redoslijed je
ispravljen; poruka se sada odlučuje prije nego se status promijeni.

### 3. Ugled se vraćao za objave, ali ne za teme

Objava: `created` +5, `deleted` −5. Simetrično.
Tema: `created` +3, `deleted` **ništa**.

Znači spam tema je ostajala isplativa na ljestvici i nakon što je moderator
ukloni. Sada `ThreadObserver::deleted` oduzima 3, obavijeno u `try/catch` kao i
ostatak nagrada — brisanje teme ne smije pasti zbog knjigovodstva.

### 4. Vraćanje obrisane objave nije vraćalo ugled

`PostObserver::restored()` je bio prazan. Brisanje uzme 5, vraćanje ne vrati
ništa — pa je objava obrisana greškom pa vraćena trajno koštala autora 5 poena.

Usput: `$post->author->decrement(...)` je bilo bez null-provjere.

### 5. Objavljivanje članka bez kategorije rušilo je snimanje

Nađeno slučajno — test je pao na `Article::factory()->create()`.

`ContentObserver::submitUrl` čita `$article->category->type`, a `category` je
nullable. Članak snimljen bez kategorije bacao je
`Attempt to read property "type" on null` — **pucanje pri objavi, zbog pinga
pretraživačima koji ne mora ni uspjeti.** Sada `?->`, s `news` kao
podrazumijevanim, jer je to mjesto gdje se nekategorisan članak i prikazuje.

---

## Provjereno pa odbačeno

- **Samo-pin** naplati 100 bountyja i postavi `pinned_until` na +24h, a
  `forum:clear-expired-pins` radi svaki sat i skida ga. Nema trajnog pina za
  jednokratnu cijenu. Staff pin nema rok i to je namjerno.
- **Dvostruko pinovanje** je odbijeno (`is_pinned` provjera prije naplate), pa
  se ne može platiti dvaput za isto.
- **Prekidač rješenja** je zatvoren u P1 (`solution_rewarded_at`).
- **Ugled za objavu** ide kroz `increment`/`decrement`, dakle atomično.
- **XP za temu i objavu** prolazi kroz dnevni cap od 100.

## Ostaje otvoreno

- **Četiri odvojena spiska osoblja** u `ForumController` plus `users.role` uz
  Spatie — prenešeno iz P1, i dalje čeka jednu shemu. Djelimično ublaženo u P2
  (panel), ali API strana je netaknuta.
- **Bounty za samo-pin se ne vraća** ako moderator odmah otkači temu. Vjerovatno
  namjerno, ali nigdje ne piše.

---

## Testovi

`tests/Feature/ForumEconomyTest.php` — 4 testa: brisanje teme vraća ugled koji
je dala, vraćanje obrisane objave vraća poene, zadržan komentar ne zarađuje ništa
dok ga moderator ne odobri, i vrtenje statusa naprijed-nazad plaća jednom.

## Deploy

**Ima migraciju** (`comments.xp_awarded_at`, s backfillom odobrenih).

```
cd /var/www/techplay && git pull
cd backend && php artisan migrate --force
php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```
