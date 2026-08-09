# P4 · cjelina 1 — Registracija i verifikacija (10.08.2026)

Prva cjelina iz P4. Metod je bio onaj koji plan traži: proći kroz sva stanja
kroz koja nalog prolazi i tražiti ona **iz kojih se ne može izaći**.

Našla su se dva takva, i oba su zatvarala korisnike van njihovih naloga.

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
  Discord    ──► ✗ driver nije registrovan, svaki poziv 500
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

### 2. Discord prijava je potpuno slomljena — **zapisano, nije dirano**

`Socialite::driver('discord')` baca `InvalidArgumentException — Driver [discord]
not supported`. Provjereno pokretanjem, ne čitanjem: u `laravel/socialite` nema
Discord drivera, u `composer.lock` nema nijednog `socialiteproviders` paketa, a
`AppServiceProvider::bootSocialite()` registruje **samo** `battlenet`.

Dakle svaki poziv na `/auth/discord/redirect` i `/auth/discord/callback` završi
kao 500. Dva dugmeta u UI-ju vode tamo: na login stranici i u postavkama
("poveži Discord").

**Nisam dirao** jer si rekao da Discord aktiviramo kasnije. Ali vrijedi znati da
dugme trenutno vodi u grešku — ako želiš, sakrijem ga jednom linijom dok se ne
aktivira.

### 3. Nalozi napravljeni preko Discorda ne mogu doći do lozinke

`SocialAuthController` je takvim nalozima upisivao `bcrypt(str()->random(16))` —
lozinku koju niko nikad nije vidio. `changePassword` traži trenutnu, pa je nisu
mogli promijeniti; reset nije postojao. Jedini ulaz im je bio Discord, koji je
sad ionako mrtav.

Reset lozinke iz tačke 1 rješava i ovo — takav nalog sada može zatražiti link na
svoju adresu i prvi put dobiti lozinku koju zna.

---

## Nađeno, nije iskoristivo danas, **ne smije se uključiti kako jeste**

`SocialAuthController` scenario 2 (linija ~143) spaja Discord nalog s
postojećim TechPlay nalogom **isključivo po podudaranju e-maila** i odmah izdaje
Sanctum token — bez ikakvog dokaza da je ta osoba vlasnik postojećeg naloga i
**bez provjere da je Discord tu adresu verifikovao**.

Discord vraća `verified: false` za adrese koje vlasnik nije potvrdio. Napadač
koji zna žrtvinu adresu mogao bi napraviti Discord nalog s njom i prijavom na
TechPlay dobiti pun token nad tuđim nalogom.

Danas to ne prolazi samo zato što driver ne postoji. **Kad se Discord bude
aktivirao, ovo mora prvo:**

1. odbiti ako provider ne kaže da je adresa verifikovana,
2. odbiti ako lokalni nalog nije verifikovan,
3. ili, sigurnije, uopšte ne spajati automatski — tražiti da se korisnik prvo
   prijavi pa poveže nalog iz postavki.

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

- **Neverifikovani nalozi se nikad ne čiste.** Zauzimaju e-mail i korisničko ime
  zauvijek — a `unique:users,email` znači da pravi vlasnik adrese ne može da se
  registruje. Traži scheduled komandu (npr. brisanje neverifikovanih starijih od
  30 dana) i odluku koliko dugo čekati.
- **Promjena e-maila ne traži ponovnu verifikaciju.** `updateProfile` prima novi
  e-mail i ne resetuje `email_verified_at`.
- **Enumeracija pri registraciji** — ostavljena namjerno, obrazloženo u
  `docs/38-p3-ulazna-sigurnost.md`.

---

## Testovi

`tests/Feature/PasswordResetTest.php` — 5 testova: link stiže, nepoznata adresa
dobija isti odgovor kao poznata, reset mijenja lozinku **i gasi svaku drugu
sesiju**, reset verifikuje adresu, izmišljen token se odbija.

**385/385 prolazi.**

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
