# P6 — Integritet podataka iz koda (10.08.2026)

Kraći paket nego što je plan procjenjivao, jer je najveći dio već zatvoren
usput: zaključavanja redova i idempotentni ključevi iz P1 i P4 pokrili su
većinu utrka koje bi ovdje bile nalaz.

---

## Strani ključevi

Od **154** definicije stranog ključa u migracijama, **144** imaju pravilo
brisanja. Preostalih 10 su lažni pozitivi linijskog greppanja — pravilo je na
sljedećoj liniji (`->cascadeOnDelete()`, `->nullOnDelete()`).

Zanimljiviji upit je bio obrnut: **koje kolone izgledaju kao strani ključ a
nemaju nikakvo ograničenje.** Iz šeme produkcijskog tipa izašlo je 18, od čega
je većina očekivana:

| Grupa | Primjeri | Zašto je u redu |
|---|---|---|
| Laravel / Spatie | `sessions.user_id`, `model_has_roles.model_id`, `failed_jobs.uuid` | tuđe tabele, tako su i zamišljene |
| Polimorfne | `faq_items.faqable_id`, `seo_metas.seoable_id`, `taggables.taggable_id` | ne mogu imati strani ključ po definiciji |
| Vanjski identifikatori | `support_tiers.paypal_plan_id`, `steam_achievements.steam_appid`, `game_companies.moby_company_id` | pokazuju na tuđe sisteme |
| Pogledi | `article_views.article_id`, `guide_views.guide_id`, `review_views.review_id` | vidi ispod |

Ostala su dva stvarna.

### 1. `comments.parent_id` — popravljeno

Brisanje komentara ostavljalo je njegove odgovore s roditeljem koji više ne
postoji. Ti odgovori postaju **nevidljivi**: lista dohvata komentare prvog nivoa
i do odgovora dolazi kroz roditelja, pa ih ništa više nikad ne učita. Ostaju u
tabeli zauvijek i i dalje se broje u dostignućima.

Dodan strani ključ s kaskadom. Odgovor bez onoga na šta odgovara nije sadržaj,
nego otpad.

Migracija prvo čisti zatečenu siročad, u pet prolaza — jer odgovor i sam može
biti roditelj.

### 2. `users.rank_id` — **namjerno nije popravljeno**

Ovdje je pokušaj popravke otkrio nešto veće.

Kolona je `NOT NULL` s tvrdo kodiranim `default(1)`. To znači:

- strani ključ **ne može** koristiti `nullOnDelete` — nema gdje upisati null,
- svaki korisnik tvrdi da je rang 1 od trenutka registracije, prije nego ga
  zaradi,
- na praznoj bazi (svjež testni ili novi instalacijski krug) rang 1 ni ne
  postoji, pa bi ograničenje odbilo svaki upis korisnika.

To zadnje je test i otkrio — fabrika korisnika je pukla čim sam dodao ključ.

Pravo pitanje nije "koje pravilo brisanja", nego **"ima li korisnik bez ijednog
XP-a uopšte rang?"**. To je proizvodna odluka, ne ograničenje koje se prikuca.

Izloženost je mala i vrijedi je znati: svako čitanje relacije je null-sigurno
(`$user->rank ? …`, `?? 'Member'`), a `XpService::checkRankUpdate` popravi
korisnika pri sljedećoj dodjeli XP-a. Korisnik koji nikad više ništa ne zaradi
ostaje bez ranga.

---

## Ispravka: tabele pogleda **imaju** retenciju

`db:sizes` je `article_views`, `guide_views` i `review_views` izlistavao pod
"bez retencije — rastu s prometom i ništa ih ne čisti".

To nije tačno. `views:clean` postoji, u rasporedu je (dnevno) i čuva sedam dana.
Popravljeno u komandi — takav ispis šalje onoga ko ga čita da traži politiku
koja već postoji.

---

## Provjeri-pa-uradi: šta je ostalo

Automatski prolaz kroz kontrolere i servise tražio je metode koje provjeravaju
(`exists()`/`count()`) pa upisuju, **bez** transakcije, brave ili
`firstOrCreate`. Ostalo ih je osam:

| Metoda | Status |
|---|---|
| `ClanController::store/leave/apply`, `ClanBaseService::startProject` | klanovi se rade posebno, po dogovoru |
| `CommentController::store` | zaštićen `unique` indeksom i provjerom duplikata; utrka daje 500, ne duple podatke |
| `JournalController::addMoment` | nema jedinstvenosti koju bi utrka prekršila |
| `ReportController::store` | duplikat prijave, bezopasno |
| `FriendController::block` | **popravljeno, vidi ispod** |

### `block()` je prepisivao tuđu blokadu

Ovo je bilo zapisano u P1 kao sitnica (H7) jer blokiranje tada nije radilo. Sada
radi i ima dugme, pa je postalo stvarno.

Stara implementacija je tražila red između dvoje ljudi **u bilo kojem smjeru** i
prepisivala ga sa sobom kao pošiljaocem. Dakle:

> B blokira A. Zatim A blokira B → A-ova blokada **prepiše B-ovu**. B ostaje
> nezaštićen, a da ništa nije uradio.

Sada je blokada vlastiti usmjereni zapis na paru (ja → oni), a tuđa se ne dira.
Uz to briše prijateljstvo u oba smjera — `friendIds()` čita prihvaćene redove
obostrano, pa bi blokada koja upiše samo svoj red ostavila dvoje i dalje
prijateljima.

Dva nova testa: blokada unazad ne briše njihovu, i blokiranje zaista prekida
prijateljstvo upisano u suprotnom smjeru.

---

## Provjere na produkciji — `php artisan diagnose:orphans`

Ovo P6 ne može provjeriti iz koda. Umjesto sedam upita za ručno lijepljenje,
postoji komanda koja ih pokrene sve i ispiše tabelu. Samo čita, ništa ne mijenja.

```
php artisan diagnose:orphans
```

Pokrenuti je **prije `migrate`** — prva provjera kaže koliko odgovora migracija
sprema da obriše.

Upiti koje izvršava, ako ih treba pokrenuti ručno:

```sql
-- 1. Odgovori bez roditelja (migracija ih briše; ovo je provjera prije nje)
select count(*) from comments
 where parent_id is not null and parent_id not in (select id from comments);

-- 2. Korisnici na nepostojećem rangu (nema ograničenja, vidi gore)
select count(*) from users
 where rank_id is not null and rank_id not in (select id from ranks);

-- 3. Pogledi na obrisan sadržaj (starije od 7 dana ionako odnese views:clean)
select 'article' t, count(*) from article_views where article_id not in (select id from articles)
union all select 'guide', count(*) from guide_views where guide_id not in (select id from guides)
union all select 'review', count(*) from review_views where review_id not in (select id from reviews);

-- 4. Ocjene bez igre — game_id je nullable, slug je pravi ključ
select count(*) from game_ratings where game_id is null;

-- 5. Dvije sezone označene kao aktivne (nema parcijalnog unique indeksa)
select count(*) from seasons where is_active = true;

-- 6. Isplate koje su se ponovile prije nego je uveden ključ (P4)
select user_id, reason, count(*) from bounty_transactions
 where reason like 'Game completed:%' or reason like 'Game review written:%'
 group by user_id, reason having count(*) > 1 order by count(*) desc limit 20;

-- 7. Narudžbe s mješovitim rječnikom statusa (migracija ih spaja)
select status, count(*) from orders group by status;
```

---

## Testovi

Prošireni `BlockingTest` — 5 testova, uključujući dva nova za prepisivanje tuđe
blokade i prekid prijateljstva.

## Deploy

**Ima migraciju** koja briše podatke (siročad odgovore). Pokrenuti upit 1 iz
Faze 2 prije migracije da se vidi koliko ih je.

```
cd /var/www/techplay && git pull
cd backend && php artisan migrate --force
php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
cd .. && bash deployment/deploy_frontend.sh
```
