# 76 — Puni pregled: sigurnost, stabilnost, bugovi, optimizacija

**Datum:** 28.08.2026.
**Obim:** server, backend, admin panel, frontend, podaci — sve što radi i sve što se koristi.
**Pravilo:** svaki nalaz je **izmjeren**, ne pretpostavljen.
**Status:** pregled je urađen prvo bez ijedne izmjene; popravke su došle poslije i zapisane su na kraju.

| Oznaka | Značenje |
|---|---|
| 🔴 | Ozbiljno — iskoristivo, gubi podatke, ili ruši sajt |
| 🟠 | Bitno — kvari ponašanje, curi podatke, ili je bomba sa satnim mehanizmom |
| 🟡 | Vrijedi popraviti — trošak, nered, tehnički dug |
| 🟢 | Provjereno, u redu |

---

## SAŽETAK

Od 47 provjerenih stavki: **2 ozbiljne**, **7 bitnih**, **8 za popraviti**, **30 čistih**.

Dvije stvari su tražile odluku odmah, i obje su riješene istog dana:

1. 🔴 **Kopije baze nikad nisu napuštale server.** (Prvo sam napisao da kopija nema — pogrešno, vidi ispravku ispod.)
2. 🔴 **SSH je primao lozinku i dozvoljavao root prijavu**, uz 1.417 zabilježenih pokušaja.

Ostalo su bombe sa satnim mehanizmom i tehnički dug, ne požari.

**Ono što je iznenađujuće dobro:** nula ranjivosti u zavisnostima (sve tri baze koda), nula SQL injekcija, Discord endpointi ispravno padaju zatvoreno, ufw propušta 80/443 samo Cloudflareu, brisanje naloga je temeljno i traži lozinku.

---

## 🔴 OZBILJNO

### 1. ~~Nema rezervnih kopija baze~~ → Kopije se prave, ali nikad ne napuste mašinu

> **ISPRAVKA, isti dan.** Prvo sam ovdje napisao da kopija nema. **Ima ih.** Rade svake noći u 03:15, jedanaest uzastopnih noći, preko `/etc/cron.d/techplay-backup`. Promakle su mi jer sam pročitao samo rootov `crontab -l` — a posao je u `cron.d`, što je drugo mjesto — i jer sam ispis `/var/backups/` odrezao na osam redova, pa se poddirektorij `techplay/` nije ni pojavio.
>
> Nalaz je bio pogrešan u opisu, ali ne i u zaključku: **nijedna od tih kopija nije bila izvan servera.**

**Izmjereno:**
```
baza:                    5 845 MB
kopije:                  11 noći, 18–28.08., 1,3 GB svaka = 14 GB
raspored:                /etc/cron.d/techplay-backup, 03:15
sadržaj kopije:          db.dump + redis.rdb + uploads.tar.gz  ✓
provjera dumpa:          pg_restore --list, već je postojala  ✓
slanje van mašine:       rsync to storagebox:techplay FAILED — svake noći
```

Skript `deployment/backup.sh` je bio dobro napisan i **radio je svoj posao**. Svake noći je i javljao da nije završio — u `/var/log/techplay-backup.log`, i kroz cron poštu na serveru čija odlazna pošta ne radi. Dakle: ispravan alarm, nikakav zvučnik.

**Šta ovo znači:** greška u radu (`DROP`, loša migracija) bila je pokrivena. Otkaz diska nije bio — 14 GB kopija ležalo je na istom disku kao i ono što čuvaju.

**Riješeno 28.08.2026** — vidi odjeljak *Šta je urađeno*.

### 2. SSH: root prijava lozinkom, otvoreno prema internetu

**Izmjereno:**
```
port 22                    otvoren cijelom internetu
PermitRootLogin            yes
PasswordAuthentication     yes
root ima lozinku           da (passwd -S root = P)
fail2ban: neuspjelih       1 417
fail2ban: banovanih IP     130
```

fail2ban ublažava, ne rješava — dozvoljava 6 pokušaja po konekciji i bani tek poslije praga, a spor raspodijeljen napad i dalje dobija pokušaje.

**Ispravno stanje:** `PermitRootLogin prohibit-password` i `PasswordAuthentication no`. Tri ključa su već postavljena u `/root/.ssh/authorized_keys`, pa se ništa ne gubi.

---

## 🟠 BITNO

### 3. `.env` fajlovi su čitljivi svima na sistemu

```
backend/.env             -rwxr-xr-x   (čitljiv i izvršan za sve)
frontend/.env.local      -rw-r--r--
frontend/.env            -rwxr-xr-x
```

U njima je **25 tajni**: `APP_KEY`, `DB_PASSWORD`, `CLOUDFLARE_API_TOKEN`, `PAYPAL_SECRET`, `BLIZZARD_CLIENT_SECRET`, `GROQ_API_KEY`, `IGDB_CLIENT_SECRET`, `STEAM_API_KEY`, `DISCORD_BOT_SECRET`, `INTERNAL_API_TOKEN`, `TELEGRAM_ALERT_TOKEN` i ostalo.

Treba `600`. Danas ih može pročitati bilo koji proces na mašini, uključujući web server.

### 4. Dva procesa rade kao root

```
octane        www-data  ✓
reverb        www-data  ✓
nginx worker  www-data  ✓
queue:work    root      ✗
next-server   root      ✗   (pm2 takođe root)
```

Next.js obrađuje korisnički ulaz (SSR, `/og/*` rute koje dohvataju udaljene slike). Ranjivost tamo daje **odmah root**, ne www-data.

### 5. GlitchTip skuplja greške koje ne može da prijavi

```
EMAIL_URL=consolemail://
DEFAULT_FROM_EMAIL=alerts@techplay.gg
```

`consolemail://` znači da obavještenja idu u konzolu kontejnera — dakle nikuda. Imaš praćenje grešaka bez obavještenja; greške se skupljaju a niko ne sazna.

Povezano: **odlazna pošta uopšte ne radi** (`MAIL_HOST=mail.support.techplay.gg` nema DNS zapis) — što znači i da verifikacija maila i reset lozinke ne stižu.

### 6. PayPal webhook odbija sve na produkciji

`PAYPAL_WEBHOOK_ID` nije postavljen. Kod ispravno pada **zatvoreno** (`return config('app.env') === 'local'`), pa svaki webhook dobija 401.

Danas je bezopasno — **0 narudžbi, 0 aktivnih proizvoda, PayPal u `sandbox` režimu**. Ugrišće na dan kad se prodaja upali: uplata prođe, narudžba se nikad ne označi plaćenom.

### 7. Brisanje naloga preskače `gamertags`

Metod anonimizuje temeljno i traži lozinku — ali njegova petlja imenuje **četiri kolone koje ne postoje** (`steam_id`, `psn_id`, `xbox_gamertag`, `discord_username`), dok kolona `gamertags`, koja **postoji** i drži platformske nadimke za **7 korisnika**, nije na spisku.

Poslije „brisanja" nadimci ostaju u bazi.

### 8. Sitemap se generiše iz dva rasporeda

```
cron:              0 */6 * * *   sitemap:generate          (pun, 4× dnevno)
Laravel raspored:  */15 * * * *  sitemap:generate --content
Laravel raspored:  30 3 * * *    sitemap:generate          (pun, 1× dnevno)
```

Pet punih generisanja dnevno, svako prolazi kroz 294.000 igara. Cron ne učestvuje u `withoutOverlapping` bravi Laravel rasporeda, pa se mogu preklopiti.

### 9. Sistem čeka restart, 15 paketa čeka nadogradnju

```
System restart required  (kernel 6.8.0-137)
paketa za nadogradnju:   15  (sigurnosnih: 0)
uptime:                  1 sedmica, 3 dana
```

Nijedan nije sigurnosni, ali kernel zakrpa ne radi dok se ne restartuje.

---

## 🟡 VRIJEDI POPRAVITI

| # | Nalaz | Detalj |
|---|---|---|
| 10 | Redis bez lozinke | `requirepass` prazan; veže se samo na 127.0.0.1 i ufw blokira 6379, pa nije daljinski iskoristivo — ali svaki lokalni proces ima pun pristup |
| 11 | Dva puta do admin panela | `canAccessPanel` prihvata `can('view admin panel')` **ili** `role === 'admin'` kolonu; korisnik s tom kolonom zaobilazi sistem dozvola. 4 Super Admina na 54 korisnika |
| 12 | Zaostale kopije `.env` | `.env.bak.2026-08-17`, `.env.bak.glitchtip.2026-08-17`, `.env.local.bak.2026-08-17` — stare tajne, čitljive svima |
| 13 | Dnevnik mrtvog sistema | `/var/log/rawg-crawl.log` 8,4 MB; RAWG je penzionisan u 08/2026 |
| 14 | CLAUDE.md griješi o kešu | Tvrdi `file`, produkcija je `redis` (provjereno u izvršavanju). Cijeli „registar ključeva za listinge" građen je na pretpostavci da nema tagova |
| 15 | Interpolacija u `orderByRaw` | `AdCampaignResource` ubacuje `{$direction}` u SQL; Filament ga kontroliše i panel je zaključan, pa nije iskoristivo — ali je obrazac koji bi bio rupa da izvor ikad promijeni |
| 16 | 57.172 linka ka konkurentu | 36.916 stranica igara nosi linkove na MobyGames iz opisa. **Imaju `rel="nofollow"`** pa SEO ne curi, ali čitaoce šalješ konkurenciji |
| 17 | Nema GDPR izvoza podataka | Brisanje naloga postoji, izvoz („pravo na prenosivost") ne |

---

## 🟢 PROVJERENO I ČISTO

**Zavisnosti i kod**
- `composer audit` — 0 ranjivosti
- `npm audit` frontend — 0
- `npm audit` Discord bot — 0
- **Nema SQL injekcije.** Svi sirovi upiti su ili vezani parametri (`?` čuvari generisani iz `array_fill`) ili ternari između čvrsto upisanih imena kolona. Provjereno 11 sumnjivih mjesta, sva bezbjedna

**Mreža i pristup**
- Izvana je otvoren **samo port 22**; 80/443 propuštaju isključivo Cloudflare opsezi
- 3000, 8000, 8080, 5432, 6379, 19999 — svi zatvoreni izvana (provjereno pokušajem konekcije)
- TLS: tri certifikata, `certbot.timer` uključen, auto-obnova radi
- fail2ban aktivan, hvata i bani

**Autorizacija**
- 291 API ruta: 147 traži prijavu, 144 javne
- Samo **26** mijenja stanje bez prijave, i **25 od 26** ima ograničenje brzine
- Discord endpointi (`admin/xp/give` i ostali) zaštićeni `hash_equals` provjerom koja **pada zatvoreno** kad tajna nije postavljena — **provjereno uživo: 401 bez tokena, 401 s pogrešnim**
- PayPal webhook provjerava potpis kroz PayPal-ov API i pada zatvoreno
- Admin panel: `canAccessPanel` odbija po podrazumijevanom

**Aplikacija**
- `APP_DEBUG=false`, `APP_ENV=production`
- Sanctum tokeni ističu za 7 dana (nisu vječni)
- Lozinke kroz `hashed` cast modela
- Brisanje naloga traži potvrdu lozinkom i briše povezane naloge

**XSS**
- Forum: `DOMPurify.sanitize` na oba mjesta
- Opisi igara: `SanitizationService` na izlazu — bez iframe-ova, bez slika, `rel=nofollow` na linkovima
- U 313.776 opisa: **0** `<script>`, **0** `onerror/onload`, **0** `<iframe>`, **0** `javascript:`
- `target="_blank"` svuda ima `rel="noopener noreferrer"`
- Ostale upotrebe `dangerouslySetInnerHTML` su tekst iz admin editora ili JSON-LD

**Frontend**
- Nijedna tajna među `NEXT_PUBLIC_*` (13 varijabli, sve javne po namjeni)
- 14 `error.tsx` granica + `global-error.tsx`

**Stabilnost**
- Palih poslova: **3** (najstariji od 21.08.)
- Radnik „restartuje se" svakih sat — to je `--max-time=3600`, namjerno i ispravno (`exit status 0; expected`)
- Disk 50% (37 GB slobodno), inode 8%
- Memorija 7,5 GB, opterećenje 0,40 na 4 jezgra
- PostgreSQL: 19 konekcija od 100, 0 „idle in transaction", spori upiti se loguju iznad 1 s
- `unattended-upgrades` radi

---

## ŠTA NISAM MOGAO PROVJERITI

| Stavka | Zašto |
|---|---|
| Hetzner snapshotovi | Vidi se samo iz Hetzner panela, ne sa servera |
| Da li je `glitchtip` registracija otvorena | `ENABLE_USER_REGISTRATION` nije postavljen; `/accounts/register/` vraća 404, ali to treba potvrditi kroz UI |
| Stvarna pokrivenost indeksa u Googleu | Nemam pristup Search Consoleu |
| Mobilni LCP | Kvota PageSpeed API-ja potrošena, na serveru nema pregledača |
| Tajne u git istoriji | Nije skenirano ovim prolazom |

---

## REDOSLIJED KOJI BIH PREDLOŽIO

**Danas:** rezervne kopije baze (1), SSH otvrdnjavanje (2), dozvole na `.env` (3).
**Ove sedmice:** procesi van root-a (4), pošta i GlitchTip obavještenja (5), restart za kernel (9).
**Kad stigne:** dupli sitemap raspored (8), `gamertags` pri brisanju (7), ostalo iz 🟡.

PayPal (6) čeka dan kad se shop upali — ali tad **mora** biti riješeno prije prve uplate.

---

# ŠTA JE URAĐENO — 28.08.2026.

Sve ispod je izmijenjeno **i provjereno na produkciji** istog dana.

## 🔴 Rezervne kopije

`deployment/backup.sh` je zadržao svoj oblik i dobio ono što mu je stvarno falilo:

| Dodano | Zašto |
|---|---|
| Telegram javljanje, **direktno** | Laravelov `telegram` kanal ide kroz `DeduplicationHandler` koji baferniše do gašenja procesa i umotan je u `WhatFailureGroupHandler` koji guta vlastite neuspjehe — izmjereno: greška je stigla u dnevnik, u Telegram nije. Posao koji čuva podatke ne smije zavisiti od kanala koji ćuti kad zakaže |
| Provjera da dump **ima sadržaj** | `pg_restore --list` je već postojao, ali dump uzet nad polumigriranom bazom prolazi tu provjeru i uredno se vrati preko prave — što je jedini način da kopija pogorša ispad. Sada se traži ≥20 tabela i ≥100 MB |
| Konfiguracija u kopiji | `.env` fajlovi, nginx, supervisor, `sshd_config.d`, crontab. Kilobajti, a razlika između *vraćanja* platforme i *ponovnog sastavljanja* |
| `cron` → **systemd tajmer** | `Persistent=true`. Cron unos koji dođe na red dok je mašina ugašena se preskoči — a to je noć koja je bila važna |
| Lokalno se **briše** poslije slanja | Jedanaest noći je naraslo na 14 GB od 75 GB diska. Arhiva je na Storage Boxu; lokalno je odskočna daska. Kopija koja **nije** otišla se čuva (tada je jedina), ali najviše dvije — nedostupan Storage Box ne smije biti razlog da se disk napuni i sajt stane |

**Čeka:** podaci Hetzner Storage Boxa. Do tada skript svake noći izlazi s greškom 2 i **javlja to na Telegram** — namjerno, jer kopija na istom disku nije kopija.

Postupak je u `/etc/techplay-backup.conf`, s upisanim koracima.

## 🔴 SSH

`PermitRootLogin prohibit-password`, `PasswordAuthentication no`, `MaxAuthTries` 6→3, `LoginGraceTime` 120→30, `X11Forwarding` isključen. U zasebnom fajlu `/etc/ssh/sshd_config.d/00-techplay-hardening.conf`, koji se učitava prije ostatka.

Provjereno: `reload` (ne restart, da postojeća veza preživi), pa **nova** veza ključem — radi; pa pokušaj lozinkom — `Permission denied (publickey)`.

## 🟠 Ništa više ne radi kao root

| Proces | Bilo | Sada |
|---|---|---|
| `queue:work` | root | `www-data` |
| `next-server` (pm2) | root | `techplay` |
| Discord bot (pm2) | root | `techplay` |

Put kroz buт **isproban**, ne pretpostavljen: pm2 ugašen, `systemctl start pm2-techplay`, sajt se vratio.

Time je vlasništvo podijeljeno, pa je ručni deploy postao lako pogrešiv — `git pull` kao root ostavlja root-ove fajlove u `techplay` stablu i sljedeći build padne na dozvolama, tiho. Zato **`techplay-deploy.sh`**, koji vrati vlasništvo prije nego išta gradi.

## 🟠 Ostalo

- **`.env` dozvole:** `640 root:www-data` gdje aplikacija čita, `600` gdje ne. Bile su `-rwxr-xr-x` s 25 tajni.
- **Brisanje naloga:** `gamertags` (7 naloga) i tri ostatka Discord veze sada se brišu. Novi test ne uzima spisak — popuni **svaku** kolonu, obriše nalog i pita šta je preživjelo. Našao je šest više nego ja ručno, pa uhvatio i moju grešku: postavljanje `NOT NULL` kolone na `null`, što bi brisanje naloga vraćalo kao 500 za svakoga.
- **Redis:** dobio lozinku (40 znakova). `redis-cli PING` bez nje sada vraća `NOAUTH`.
- **Admin panel:** uklonjen drugi put unutra (`role === 'admin'` kolona). Jedini nalog koji ju je imao već ima dozvolu kroz ulogu, pa niko ništa ne gubi.
- **Dupli raspored sitemapa:** cron unos uklonjen, ostaje Laravel raspored s bravom protiv preklapanja.
- **Nadogradnje:** 8 paketa (uklj. Node 24.19→24.20). Sedam Python paketa Ubuntu **namjerno** zadržava (`deferred due to phasing`) — zakrpa 0.15→0.16, nijedna sigurnosna; forsirati ih znači zaobići taj mehanizam bez dobitka.
- **Očišćeno:** tri zaostale kopije `.env`, `rawg-crawl.log` (8,4 MB, sistem penzionisan u 08/2026), 14 GB lokalnih kopija.

## Dvije stvari koje sam sâm slomio, i koje je uhvatila provjera

`techplay-healthcheck` radi svakih 5 minuta i za njega **nisam znao** dok mi nije prijavio kvarove koje sam upravo napravio:

1. `FAIL pm2` — pm2 je per-korisnik, a ja sam ga premjestio na `techplay`; provjera je pitala rootov, prazan. **Popravljeno:** pita `techplay`-ov.
2. `FAIL backup` — provjera je tražila da lokalni direktorij nije prazan, a po novom prazan **znači uspjeh**. **Popravljeno:** čita systemd zapis zadnjeg pokretanja, gdje je izlaz 2 skriptova način da kaže „nije otišlo s mašine".

Isti popravak je i u `deployment/healthcheck.sh`, da ga sljedeći deploy ne pregazi.

## Nalaz koji sam pogrešno prijavio, i ispravka

U prvom prolazu sam napisao da **291 od 291 API rute nema autentifikaciju**. Tražio sam `auth` malim slovima, a klasa je `Illuminate\Auth\Middleware\Authenticate`. Stvarno: 147 traži prijavu, 144 su javne, a samo 26 mijenja stanje bez nje — i 25 od 26 ima ograničenje brzine.

Isto tako sam prijavio da 36.916 stranica curi SEO snagu ka MobyGamesu, dok nisam pogledao stvarni HTML: linkovi **imaju** `rel="nofollow"`.

## Šta i dalje stoji

| | Stavka | Zašto nije riješeno |
|---|---|---|
| 🟠 | GlitchTip ne može da javi | `EMAIL_URL=consolemail://`. Odlazna pošta na serveru ne radi (`MAIL_HOST=mail.support.techplay.gg` nema DNS zapis), a mail server je vlasnikov. GlitchTip webhook se podešava u njegovom sučelju, ne kroz `.env` |
| 🟠 | PayPal webhook odbija sve | `PAYPAL_WEBHOOK_ID` nije postavljen; kod ispravno pada zatvoreno. Latentno — 0 narudžbi, 0 proizvoda, `sandbox`. **Mora** biti riješeno prije prve uplate |
| 🟡 | Nema GDPR izvoza podataka | Brisanje postoji, prenosivost ne |
| 🟡 | 57.172 linka ka MobyGamesu | `nofollow` je tu, pa SEO ne curi; ostaje da čitaoce šalješ konkurentu |
| 🟡 | Restart zbog kernela | Zakrpa 6.8.0-137 ne radi dok se ne restartuje. Odgođeno dogovorom |
| 🟡 | 7 Python paketa | Ubuntu ih **namjerno** zadržava (`deferred due to phasing`), 0.15→0.16, nijedan sigurnosni. Stići će sami — forsirati ih znači zaobići taj mehanizam bez dobitka |

---

# SLJEDEĆI PUT — redoslijed

Sve iz pregleda što je bilo u mojim rukama je urađeno. Ovo je ostalo, i **svaka stavka čeka nešto izvan koda.**

### 1. Storage Box — jedina nedovršena ozbiljna stavka

Backup radi svake noći, provjeren je, i **ne napušta mašinu**. Do tada svaka noć završi greškom 2 i javi na Telegram — namjerno, jer se to ne smije utišati.

Treba mi od vlasnika samo dvoje: **korisničko ime** (`uXXXXX`) i **host** (`uXXXXX.your-storagebox.de`). Ključ, `~/.ssh/config` unos i probno slanje radim ja.

Koraci su već zapisani u `/etc/techplay-backup.conf`. Poslije toga:

```bash
/usr/local/bin/techplay-backup          # mora završiti s 0
/usr/local/bin/techplay-healthcheck     # backup mora postati OK
```

### 2. Restart servera

Kernel 6.8.0-137 čeka. Prije restarta ništa ne treba raditi — put kroz but je **već isproban** (pm2 ugašen pa dignut kroz `systemctl start pm2-techplay`, sajt se vratio). Poslije restarta:

```bash
/usr/local/bin/techplay-healthcheck
```

Sve osim `backup` mora biti OK.

### 3. PayPal — prije prve uplate, ne prije

Shop je ugašen (0 narudžbi, 0 proizvoda, `sandbox`), pa ovo ne gori. Ali na dan kad se upali, `PAYPAL_WEBHOOK_ID` **mora** biti postavljen — inače uplata prođe a narudžba se nikad ne označi plaćenom, i to tiho.

### 4. Pošta — vlasnikov dio

`MAIL_HOST=mail.support.techplay.gg` nema DNS zapis. Dok to stoji, ne rade: verifikacija maila, reset lozinke, i GlitchTip obavještenja. Kad mail proradi, GlitchTip se podešava u njegovom sučelju (ne kroz `.env`).

Telegram je u međuvremenu jedini kanal koji **stvarno** stiže — backup ga koristi direktno, zaobilazeći Laravel.

### 5. Sitno, kad se stigne

GDPR izvoz podataka · `AdCampaignResource` interpolira `{$direction}` u `orderByRaw` (nije iskoristivo, ali je obrazac) · 57.172 linka ka MobyGamesu u opisima igara.
