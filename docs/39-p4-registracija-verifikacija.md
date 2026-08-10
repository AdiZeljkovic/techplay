# P4 · cjelina 1 — Registracija i verifikacija (10.08.2026)

Prva cjelina iz P4. Metod je bio onaj koji plan traži: proći kroz sva stanja
kroz koja nalog prolazi i tražiti ona **iz kojih se ne može izaći**.

Našla su se dva takva, i oba su zatvarala korisnike van njihovih naloga.
Uz njih, cijela Discord prijava je bila mrtva, a neverifikovane registracije su
zauvijek držale tuđe adrese.

---

## Dijagram stanja

```
                    ┌─────────────────────────────────────────┐
                    │  POST /auth/register                    │
                    │  (Turnstile, unique email + username)   │
                    └──────────────────┬──────────────────────┘
                                       ▼
                          ┌────────────────────────┐
                          │  neverifikovan nalog   │◄──── /email/resend
                          │  email_verified_at=NULL│◄──── /email/resend-public
                          └───────────┬────────────┘
                                      │  potpisan link iz maila
                                      ▼
                          ┌────────────────────────┐
   login odbija ─────────►│  verifikovan nalog     │◄──── reset lozinke
   neverifikovane         │  može se prijaviti     │      (novo)
                          └───────────┬────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    ▼                                    ▼
        ┌───────────────────────┐            ┌───────────────────────┐
        │ /user/password        │            │ /user/account         │
        │ traži trenutnu lozinku│            │ traži lozinku + tekst │
        │ gasi ostale sesije    │            │ nepovratno            │
        └───────────────────────┘            └───────────────────────┘

  Battle.net ──► radi (custom provider)
  Discord    ──► radi (driver napisan 10.08.2026)
                 spaja se s postojećim nalogom samo kad su
                 OBJE strane potvrdile istu adresu
```

---

## Mrtvi uglovi

### 1. Nije postojao nijedan način da se povrati zaboravljena lozinka — **popravljeno**

Login stranica linkuje `/forgot-password` **od početka**. Ta stranica nikad nije
napravljena (404), a backend nije imao nijedan endpoint. Tabela
`password_reset_tokens` je stajala prazna od prve migracije, a `User` je preko
`Illuminate\Foundation\Auth\User` cijelo vrijeme nosio `CanResetPassword` trait.
Nedostajale su samo rute, kontroler i dvije stranice.

Do tada: **ko zaboravi lozinku, izgubio je nalog.** Trajno.

Napravljeno:

| Dio | Šta |
|---|---|
| `POST /auth/forgot-password` | `throttle:5,10`. Uvijek isti odgovor — da li adresa ima nalog nije nešto što stranac saznaje pitanjem. |
| `POST /auth/reset-password` | `throttle:5,10`. Poslije uspjeha **briše sve tokene** — reset je način da se povrati nalog nad kojim si možda izgubio kontrolu, pa bi ostavljanje starih sesija poništilo poentu. |
| `ResetPassword::createUrlUsing` | Link vodi na frontend; Laravelov podrazumijevani gradi ga preko `url()`, što je ovdje API host — korisnik bi iz maila upao na domen koji tu stranicu nema. |
| `/forgot-password`, `/reset-password` | Stranice u postojećem `(auth)` obrascu. |

Jedan detalj koji nije očigledan: reset **ujedno verifikuje adresu**. Bez toga bi
login odbio nalog odmah nakon uspješnog reseta, što korisnik čita kao "reset nije
uspio".

### 2. Discord prijava je bila potpuno slomljena — **popravljeno 10.08.2026**

`Socialite::driver('discord')` je bacao `InvalidArgumentException — Driver
[discord] not supported`. Provjereno pokretanjem, ne čitanjem: u `laravel/socialite` nema
Discord drivera, u `composer.lock` nema nijednog `socialiteproviders` paketa, a
`AppServiceProvider::bootSocialite()` registruje **samo** `battlenet`.

Dakle je svaki poziv na `/auth/discord/redirect` i `/auth/discord/callback`
završavao kao 500. Dva dugmeta u UI-ju vode tamo: na login stranici i u
postavkama ("poveži Discord").

Popravljeno u četiri koraka, jer je lanac bio prekinut na četiri mjesta:

| Šta | Bilo | Sada |
|---|---|---|
| Driver | ne postoji → 500 | `App\Services\Socialite\DiscordProvider`, pisan ovdje kao i Battle.net, bez nove zavisnosti |
| `redirect()` | vraćao **JSON**, a frontend radi `window.location.href` → korisnik vidi sirovi JSON | pravi HTTP redirect |
| `DISCORD_REDIRECT_URI` | podrazumijevano `/auth/callback/discord` — putanja koju Next.js ne poslužuje | `/api/v1/auth/discord/callback` |
| Korisničko ime | `nickname . rand(1000,9999)` jednom pa nada se | `uniqueUsername()` provjerava i pokušava ponovo; sudar je prije bio 500 usred registracije |

**Prije nego ovo proradi na produkciji treba dvoje:**

1. `DISCORD_CLIENT_SECRET` u `.env` — lokalno ga nema, provjeri ima li ga server.
2. U Discord developer portalu, redirect URI mora biti **tačno**
   `https://techplay.gg/api/v1/auth/discord/callback`. Discord odbija sve što se
   ne poklapa znak u znak.

### 3. Nalozi napravljeni preko Discorda ne mogu doći do lozinke

`SocialAuthController` je takvim nalozima upisivao `bcrypt(str()->random(16))` —
lozinku koju niko nikad nije vidio. `changePassword` traži trenutnu, pa je nisu
mogli promijeniti; reset nije postojao. Jedini ulaz im je bio Discord — koji je
cijelo to vrijeme bio slomljen.

Reset lozinke iz tačke 1 rješava i ovo — takav nalog sada može zatražiti link na
svoju adresu i prvi put dobiti lozinku koju zna.

---

## Preuzimanje naloga koje je moralo biti zatvoreno u istoj izmjeni

Registrovati driver znači učiniti callback dostupnim — pa je ovo moralo ići
zajedno, ne poslije.

`SocialAuthController` je spajao Discord identitet s postojećim TechPlay nalogom
**isključivo po podudaranju e-maila** i odmah izdavao Sanctum token. Bez ikakvog
dokaza da je ta osoba vlasnik postojećeg naloga, i bez provjere da je Discord tu
adresu uopšte verifikovao.

Discord vraća `verified: false` za adrese koje vlasnik nije potvrdio. Napadač
koji zna žrtvinu adresu stavi je na svoj Discord nalog, prijavi se na TechPlay i
dobije pun token nad tuđim nalogom.

Sada vrijedi pravilo: **obje strane moraju biti potvrdile isti sandučić.**

| Slučaj | Ishod |
|---|---|
| Discord adresa nije verifikovana | odbijeno, poruka da prvo verifikuje kod Discorda |
| Discord ne dijeli adresu uopšte | odbijeno s objašnjenjem, umjesto 500 na `NOT NULL` |
| Lokalni nalog nije verifikovan | odbijeno — "prijavi se lozinkom pa poveži iz postavki" |
| Obje verifikovane i iste | spaja i prijavljuje |
| `discord_id` se već poklapa | prijavljuje (veza je već ranije dokazana) |

Verifikacija lokalne adrese preko Discorda traži isto: ranije je bilo dovoljno
da Discord ima *bilo koju* adresu.

---

## Provjereno pa odbačeno

- **Dupli klik na verifikacioni link** — drugi poziv vraća "Email already
  verified" (200), ne grešku. Bez nuspojava.
- **Zatvoren tab poslije registracije** — nalog ostaje neverifikovan i
  `/email/resend-public` ga vraća u tok. Odgovor je konstantan, pa nije orakl.
- **Istekao verifikacioni link** — sada 403 s jasnom porukom (od P1, kad je
  dodata provjera potpisa) umjesto tihog prolaza.
- **Battle.net** — driver se razrješava, tok radi.
- **`/auth/refresh`** rotira token bez ponovne provjere verifikacije, ali od P1
  registracija više ne izdaje token prije verifikacije, pa nema šta rotirati.

## Ostaje otvoreno u ovoj cjelini

- ~~Neverifikovani nalozi se nikad ne čiste.~~ **Riješeno** — vidi ispod.
- **Povezivanje Discorda iz postavki radi samo ako se adrese poklapaju.**
  Callback je stateless i ne zna ko je kliknuo, pa se oslanja na `discord_id`
  ili adresu. Ako se korisnikova TechPlay adresa razlikuje od Discord adrese,
  klik na "poveži" napravi **novi nalog** umjesto da poveže postojeći. Pravo
  rješenje je potpisan `state` koji nosi identitet korisnika kroz OAuth krug.
- **Promjena e-maila ne traži ponovnu verifikaciju.** `updateProfile` prima novi
  e-mail i ne resetuje `email_verified_at`.
- **Enumeracija pri registraciji** — ostavljena namjerno, obrazloženo u
  `docs/38-p3-ulazna-sigurnost.md`.

---

## Neverifikovane registracije se sada čiste

Nalog koji nikad nije potvrđen ne može se prijaviti — ali `unique:users,email` i
`unique:users,username` i dalje važe za njega. Zalutala registracija, pogrešno
otkucana adresa ili neko ko registruje adresu koja nije njegova time **trajno
vade tu adresu i to ime iz opticaja**, a pravom vlasniku se kaže da je već
zauzeto.

Nova komanda `php artisan users:prune-unverified`, u rasporedu svakog dana u
03:20.

Namjerno plašljiva. Odbija dirati nalog koji je **išta** radio, jer
"neverifikovan" je stanje u kojem neki stari nalozi mogu biti iz razloga koji
prethode uvođenju obavezne verifikacije — a posao za čišćenje koji obriše
istoriju stvarne osobe gori je od problema koji rješava.

Briše samo ako je sve tačno:

- `email_verified_at IS NULL`
- starije od 30 dana (`--days` mijenja, minimum 7)
- `xp <= 0` i `bounty_balance <= 0`
- nema nijedne objave, teme, komentara, narudžbe ni igre u kolekciji
- nema povezan `discord_id`

`--dry-run` ispisuje prvih 25 s maskiranim adresama (`k**********@yahoo.com`) —
dovoljno da se prepozna obrazac, ne dovoljno da terminal postane mailing lista.

Na lokalnoj bazi suho pokretanje nalazi tri takva naloga iz februara.

**Što ovo ne radi:** ne šalje podsjetnik prije brisanja. Registracija stara 30
dana koja nikad nije otvorila mail vjerovatno je i napuštena, ali podsjetnik na
7. dan bi vratio dio stvarnih ljudi. To je sljedeći korak ako se pokaže da se
briše previše.

---

## Testovi

- `PasswordResetTest` (5) — link stiže, nepoznata adresa dobija isti odgovor kao
  poznata, reset mijenja lozinku **i gasi svaku drugu sesiju**, reset verifikuje
  adresu, izmišljen token se odbija.
- `DiscordSignInTest` (5) — driver je registrovan; neverifikovana Discord adresa
  ne može preuzeti tuđi nalog; verifikovana Discord adresa ne može preuzeti
  neverifikovan lokalni nalog; kad su obje verifikovane, spaja i prijavljuje;
  Discord bez adrese se odbija umjesto da pukne.
- `PruneUnverifiedUsersTest` (5) — briše staru napuštenu registraciju, ne dira
  svježu, ne dira verifikovanu, i **ne dira neverifikovanu koja ima aktivnost**.

**395/395 prolazi.**

## Deploy

Nema migracija (`password_reset_tokens` postoji od početka). Frontend treba
build jer su dvije nove stranice.

```
cd /var/www/techplay && git pull
cd backend && php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
cd .. && bash deployment/deploy_frontend.sh
```

Poslije deploya vrijedi poslati sebi jedan reset link i proći kroz njega — to je
jedini dio koji zavisi od toga da mail stvarno izlazi sa servera.
