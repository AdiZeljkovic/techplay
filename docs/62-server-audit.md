# 62 — Pregled servera, 17. 08. 2026.

Sve izmjereno protiv živog servera, ne pretpostavljeno. Datum je jedini na koji se
ovaj dokument odnosi — brojke ispod su snimak, ne stanje.

---

## Najozbiljniji nalaz: origin je bio otvoren svijetu

Provjereno izvana, sa strane mreže:

```
46.224.110.57:3000  → 200, servira cijeli sajt
46.224.110.57:8000  → 200, servira cijeli API
46.224.110.57:8080  → 404 (Reverb)
```

`http://46.224.110.57:3000/games/doom` vraćao je stranicu s naslovom
„Doom (1993) | TechPlay". **Sve što je podešeno na Cloudflareu se zaobilazilo jednim
brojem porta** — WAF, DDoS zaštita, rate limiting, pravilo protiv scrapera, i nginx keš
koji smo istog dana postavili. Baza i Redis su bili vezani samo na `127.0.0.1`, što je
jedino spriječilo da ovo bude gore.

Uzrok: **firewalla nije bilo.** `ufw` neaktivan, tri iptables pravila ukupno.

**Riješeno:** `ufw` s pravilom „sve zabranjeno osim 22, 80, 443". Podignut tek nakon što
su dozvole upisane, da veza ne pukne u pola posla. Provjereno poslije — sva tri porta
odbijaju vezu, sajt i admin rade.

**Ostaje razmotriti:** 80 i 443 su i dalje otvoreni svima, pa se origin može pogoditi
slanjem `Host: techplay.gg` na IP. Industrijski standard je propustiti na te portove
samo Cloudflareove opsege. Nije urađeno jer nosi rizik: pogrešna ili zastarjela lista
opsega obara sajt, a certbot obnova ide preko porta 80. Ako se radi, treba uz to i cron
koji listu osvježava s Cloudflareovog objavljenog popisa.

---

## Realtime nije radio

`/app/{key}` je vraćao **404**. Blok koji Reverb usmjerava na 443 postoji u
`deployment/nginx.conf`, ali taj fajl u zaglavlju sam kaže da nije ono što produkcija
pokreće — i nikad nije prenesen u živi vhost. Websocket zahtjev je zato padao u
`location /`, odlazio na Octane i tamo se gubio.

Klijent to nije mogao zaobići: Cloudflare port 8080 proksira samo kao čisti HTTP (HTTPS
portovi su mu 443, 2053, 2083, 2087, 2096 i 8443), pa `lib/echo.ts` namjerno ignoriše
`REVERB_PORT` i spaja se na 443 — gdje ništa nije slušalo.

**Riješeno:** `location ~ ^/(app|apps)(/|$)` u `techplay-backend` vhostu, s
`proxy_read_timeout 3600s` da veza koja miruje ne bude prekinuta. Provjereno:

```
HTTP/1.1 101 Switching Protocols
```

---

## Prijava lozinkom i fail2ban

SSH prima lozinku i dozvoljava root prijavu njome. **Vlasnik je odlučio to zadržati**, pa
konfiguracija nije dirana.

`fail2ban` nije bio instaliran. Sada jest — 5 promašaja u 10 minuta košta sat vremena
zabrane. Prvi status nakon instalacije, bez ikakvog čekanja:

```
Total failed: 29     Currently banned: 1     Banned IP list: 176.53.159.198
```

Napad je bio u toku dok se instalirao.

---

## Log od 1,9 GB s jednom rečenicom u sebi

`storage/logs/laravel.log` bio je **1,9 GB** i ništa ga nije rotiralo. Puni ga jedno te
isto upozorenje, s punim stack traceom, između 2.000 i 5.500 puta dnevno:

```
str_getcsv(): the $escape parameter must be provided as its default value will change
```

Tri mjesta u kodu, od kojih dva rade **na svakom čitanju igre** — `pgArray()` u
`GameController` i `PostgresArray` cast, helperi koji PostgreSQL `TEXT[]` kolone
pretvaraju u PHP nizove.

**Riješeno:** parametar se prosljeđuje izričito, s vrijednošću koja je trenutni default,
pa se parsiranje ne mijenja. Bitno za PHP 8.4: tamo se default mijenja u `""`, što je
ovdje **pogrešna** vrijednost a ne samo drukčija — PostgreSQL unutar navodnika escapea
obrnutom kosom crtom.

Dodan `logrotate` (`/etc/logrotate.d/techplay`, dnevno, 7 kopija, `maxsize 100M`).
Fajl skraćen na zadnjih 5 MB.

---

## Keš optimizovanih slika: 6,5 GB u dva dana

`.next/cache/images` držao je **6,5 GB u 106.492 fajla**, a najstariji unos bio je star
**dva dana**. Dakle oko 3 GB dnevno.

Dvije stvari se ovdje sastaju. `next.config.ts` traži šest `deviceSizes` i pet
`qualities`, pa jedna naslovnica može postati trideset fajlova; `minimumCacheTTL` je
godinu dana, pa ništa ne ističe samo od sebe. A istog dana smo katalog otvorili za
puzanje — pa optimizator sada vidi 142.000 igara.

Napomena uz `CLAUDE.md`: tamo piše da je optimizacija slika isključena zbog diska.
**Nije** — `unoptimized: true` više nije u konfiguraciji.

**Riješeno:** prva verzija čišćenja brisala je po starosti, što ovdje ništa ne ograničava
— tridesetodnevni prozor pri 3 GB dnevno je opis punjenja diska, a ne granica. Zamijenjena
granicom po **veličini**: `/usr/local/bin/techplay-image-cache-cap` briše najstarije dok
direktorij ne padne ispod 4 GB, svaki sat.

(I ta skripta je imala grešku prije nego što je radila: prva verzija je zvala `du` nakon
svakog brisanja, što je kvadratno i na 106.000 fajlova nije završilo ni za deset minuta.
Sada računa veličine iz jednog prolaza — 7,5 sekundi, 35.184 fajla, 1.893 MB.)

---

## Ostalo popravljeno

| Nalaz | Stanje |
|---|---|
| Sistem 13 sedmica bez restarta, kernel `6.8.0-111`, 62 paketa čeka | nadograđen, restartovan, sada `6.8.0-137`, 0 na čekanju |
| Dva istekla certifikata (`beta.techplay.gg`, ističu 5. 4.) i živ vhost za domenu koja se **ne razrješava u DNS-u** — a taj blok je bio i **default server za 443**, pa je svaki zahtjev s nepoznatim Hostom dobijao istekli certifikat | vhost uklonjen, certifikati obrisani; `certbot renew --dry-run` prolazi |
| Tri duplirana ključa u `backend/.env` (`RAWG_API_KEY` tri puta) | uklonjeni; sve tri vrijednosti su ionako bile identične, pa promjene ponašanja nema |

---

## Zatečeno ispravno

PostgreSQL 16.14, Redis 7.0.15, PHP 8.3.29, nginx 1.24.0 — sve podržane verzije. Baza i
Redis slušaju samo na `127.0.0.1`. `unattended-upgrades` uključen. `certbot.timer`
uključen i obnova prolazi. Supervisor drži pet procesa, pm2 se sam vraća nakon restarta.
Cron ima Laravel scheduler i regeneraciju sitemapa svakih 6 sati.

Disk 13 GB od 75 (18%), RAM 2 od 7,5 GB, baza 1080 MB.

---

## Ostaje otvoreno

1. **Node 20** je LTS do 04/2026 — prelazak na 22 treba isplanirati.
2. **80/443 samo za Cloudflare** — opisano gore, uz rizik koji nosi.
3. **`swap` ne postoji.** Uz 7,5 GB RAM-a i 2 GB u upotrebi nije hitno, ali znači da
   skok u potrošnji ubija proces umjesto da uspori.
4. **`deviceSizes` i `qualities`** — pet nivoa kvaliteta je gotovo sigurno više nego što
   se koristi. Svođenje na jedan smanjilo bi stvaranje keša peterostruko, umjesto da ga
   samo brišemo.
