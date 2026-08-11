# P8 — Tajne i zavisnosti (10.08.2026)

---

## Ranjivosti: 37 prijavljenih, 0 preostalih

| Gdje | Prijavljeno | Poslije |
|---|---|---|
| `composer audit` | 18 na 4 paketa | **0** |
| `npm audit` (frontend) | 11 | **0** |
| `npm audit` (bot) | 8 | **0** |

Ali broj nije rizik, pa je svaka ocijenjena prije zakrpe.

### PHP — nijedna nije bila dohvatljiva

| Paket | Šta je prijavljeno | Zašto nije prolazilo |
|---|---|---|
| `guzzlehttp/guzzle` (8) | kolačići, proxy, redirect, CRLF u start-liniji | Ne koristimo cookie jar ni proxy za odlazne pozive. CRLF traži korisnički unos zalijepljen u URL — svi naši pozivi ga prosljeđuju kao **parametar**, koji Guzzle enkodira |
| `league/commonmark` (6) | DoS na podmetnutom Markdownu | Stiže kroz Laravel, koristi se samo za markdown mailove. Nigdje se ne parsira ono što je posjetilac napisao |
| `guzzlehttp/psr7` (2) | zbunjivanje hosta | isto kao guzzle |
| `phpseclib` (1) | SSRF kroz X.509 | Stiže kroz Socialite. Naša tri provajdera (Discord, Battle.net, Steam OpenID) taj put ne diraju |

Zakrpljene ipak — sve četiri su bile sitni skokovi verzije, a "nije dohvatljivo
danas" nije isto što i "neće biti sutra".

### Frontend — jedna jeste

`axios` i `dompurify` su naši direktno; `dompurify` je ono što čisti forumski
sadržaj u browseru. Obje riješene običnim `npm audit fix`.

Next je tražio 16.1.1 → 16.3.0 i tu je vrijedilo provjeriti umjesto
pretpostaviti. Od dvije prijave:

- **Image Optimizer DoS** — ne važi, `images: { unoptimized: true }`,
- **RSC deserialization DoS** — **važi**, jer kontakt forma je Server Action.

Provjereno tipovima i punim produkcijskim buildom. Pin koji projekat koristi
(tačna verzija, bez `^`) vraćen nakon što ga je npm prepisao u caret.

Preostalih 8 na frontendu bile su razvojne (babel, eslint lanac) — ne idu
korisniku, ali su ionako riješene.

---

## Tajne: šta je bilo izloženo

**Repo je javan.** `"private": false` — provjereno neautentifikovanim pozivom
GitHub API-ja.

### Šta nije bilo izloženo

`.env` **nikad nije bio commitan**, ni u jednoj tački istorije. Nema izloženih
ključeva — ni PayPal, ni Discord, ni Blizzard, ni mail. To je najgori scenario
koji se nije desio.

Skeniranje praćenih fajlova na obrasce (`sk_live`, `AKIA…`, `BEGIN PRIVATE KEY`,
Slack tokeni) — čisto.

### Šta jeste

`deployment/database_backup.sql`, 22,5 MB, dodan januara 2026. Obrisan iz radnog
stabla i pokriven `.gitignore`-om, **ali je ostao u istoriji** — dakle dohvatljiv
svakome ko klonira javni repo.

Sadržaj: `users`, `orders`, `newsletter_subscribers`, `personal_access_tokens`,
`password_reset_tokens`.

Provjera domena adresa (bez ispisivanja samih adresa) pokazala je da je to
zaista stara testna baza:

| Domen | Broj |
|---|---|
| `@techplay.gg` | 7 |
| `@techplay.com` | 3 |
| `@outlook.com` | 2 |
| `@luminor.solutions`, `@example.com`, `@admin.com` | po 1 |

Nema podataka zajednice. **Ali sedam `@techplay.gg` naloga su redakcijski**, i
njihovi bcrypt hashevi su stajali javno mjesecima. Bcrypt je spor pa nisu odmah
upotrebljivi, ali su nalozi s pristupom panelu — pa se tretiraju kao
kompromitovani.

Tokeni su manje bitni: Sanctum ih čuva hashirane, kao i tokene za reset lozinke,
koji su odavno istekli.

---

## Postupak čišćenja istorije — izveden 10.08.2026

Zabilježeno kako je urađeno, jer plan traži pisani postupak, a i zato što se
može zatrebati opet.

```bash
# 1. Sve necommitano prvo spremiti — filter-repo traži čisto stablo
git add -A && git commit

# 2. Rezervna grana. Origin je i dalje netaknut u ovom trenutku.
git branch backup-prije-prepisa-10-08

# 3. Alat
python -m pip install git-filter-repo

# 4. Prepis
python -m git_filter_repo --invert-paths \
  --path deployment/database_backup.sql \
  --path backend/database/add_interviews_category.sql --force

# 5. filter-repo namjerno uklanja remote — vratiti ga
git remote add origin https://github.com/AdiZeljkovic/techplay.git

# 6. Provjera prije guranja
git log --all --oneline -- deployment/database_backup.sql   # mora biti prazno

# 7. Force push
git push --force origin main
```

**Na serveru, poslije guranja** — obični `git pull` ne radi jer su svi SHA-i
novi:

```bash
cd /var/www/techplay
git fetch --all
git reset --hard origin/main
```

### Rezultat

| | Prije | Poslije |
|---|---|---|
| Dump u istoriji | da | ne |
| Veličina paketa | 231,9 MB | **129,0 MB** |
| Commitovi | 1631 | 1631, svi sačuvani |

Ušteda je veća od same veličine dumpa jer je repack usput izbacio i ostale
nedostižne objekte.

---

## Šta prepis ne rješava

Vrijedi zapisati da se ne bi mislilo da je stvar zatvorena:

- **Ne poništava objavu.** Ko je klonirao ili forkovao repo prije 10.08. ima
  staru istoriju.
- **GitHub keš.** Stari commitovi znaju ostati dohvatljivi po SHA-u još neko
  vrijeme; za potpuno brisanje traži se zahtjev GitHub podršci.
- Zato **promjena lozinki za sedam redakcijskih naloga ostaje obavezna**, i to je
  jedina preostala stavka iz P8.

## Zaostalo, van P8 opsega

- **Dokumentacija ranjivosti je javna.** `docs/36`–`docs/47` opisuju kako je sajt
  bio ranjiv, s primjerima. Sve popravke su deployane, pa to više nije mapa za
  napad — ali je odluka vrijedna svjesnosti, jer je repo javan.
- `deployment/techplay_backup.sql` (653 MB) postoji lokalno, **nikad nije bio u
  gitu**, i nije diran.
