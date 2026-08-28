# 76 — Puni pregled: sigurnost, stabilnost, bugovi, optimizacija

**Datum:** 28.08.2026.
**Obim:** server, backend, admin panel, frontend, podaci — sve što radi i sve što se koristi.
**Pravilo:** svaki nalaz je **izmjeren**, ne pretpostavljen. Ništa nije popravljeno — ovo je snimak stanja.

| Oznaka | Značenje |
|---|---|
| 🔴 | Ozbiljno — iskoristivo, gubi podatke, ili ruši sajt |
| 🟠 | Bitno — kvari ponašanje, curi podatke, ili je bomba sa satnim mehanizmom |
| 🟡 | Vrijedi popraviti — trošak, nered, tehnički dug |
| 🟢 | Provjereno, u redu |

---

## SAŽETAK

Od 47 provjerenih stavki: **2 ozbiljne**, **7 bitnih**, **8 za popraviti**, **30 čistih**.

Dvije stvari traže odluku danas:

1. 🔴 **Nema nijedne rezervne kopije baze.** 5,8 GB, nula automatskih kopija.
2. 🔴 **SSH prima lozinku i dozvoljava root prijavu**, uz 1.417 zabilježenih pokušaja.

Ostalo su bombe sa satnim mehanizmom i tehnički dug, ne požari.

**Ono što je iznenađujuće dobro:** nula ranjivosti u zavisnostima (sve tri baze koda), nula SQL injekcija, Discord endpointi ispravno padaju zatvoreno, ufw propušta 80/443 samo Cloudflareu, brisanje naloga je temeljno i traži lozinku.

---

## 🔴 OZBILJNO

### 1. Nema rezervnih kopija baze

**Izmjereno:**
```
baza:                       5 845 MB
cron backup posao:          nema
systemd tajmer:             nema
pg_dump igdje u skriptama:  nema (samo u /root/.bash_history — ručno)
/var/backups/:              samo alternatives.tar.* (Debian, ne podaci)
storage/app/backups/:       6 jednokratnih izvoza uz pojedine migracije
```

Ono što se ne može ponovo napraviti: 54 korisnika, njihove kolekcije, forum, 630 članaka, liste, XP i reputacija. Katalog igara bi se dao ponovo izgraditi iz agregatora; ostalo ne bi.

**Šta ovo znači:** jedan `DROP`, otkaz diska, ili neuspjela migracija = sve ide.

**Napomena:** ne mogu vidjeti ima li Hetzner snapshotova sa strane servera — to treba provjeriti u Hetzner panelu. Ako ih ima, ozbiljnost pada na 🟠, ali snapshot cijelog diska nije isto što i dump baze (ne može se vratiti jedna tabela).

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
