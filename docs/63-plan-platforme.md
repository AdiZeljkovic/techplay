# 63 — Plan: od sajta koji radi do platforme koja izdrži

Napisano 17. 08. 2026, nakon pregleda cijelog servera i projekta. Svaka brojka
ispod je **izmjerena**, ne procijenjena; gdje nešto nije izmjereno, tako i piše.

Cilj koji je postavljen: sigurno, optimizovano, stabilno, spremno za stotine
hiljada posjeta.

---

## Dio 1 — Gdje smo zaista

### Promet nije hipotetski

nginx access log, 17. 08., prvih 12,5 sati:

| | |
|---|---|
| zahtjeva | **109.279** (≈210.000 dnevno) |
| jedinstvenih IP adresa | **10.727** |
| Googlebot | 14.760 zahtjeva |
| Ahrefs / bingbot / Semrush | 4.854 / 1.516 / 896 |
| odgovora 200 | 104.439 |
| odgovora **500** | **636** |
| odgovora **502** | **167** |

To je već platforma s prometom. Nije „hoćemo stotine hiljada" — nego „imamo
210.000 zahtjeva dnevno i 803 ih danas nije uspjelo".

Od 636 grešaka 500, njih **632 su iz sati 00 i 01** — prije jutrošnje popravke
kataloga. U 11 i 12 sati ih je četiri. Popravka je držala.

Ali 502 su druga priča: **110 od njih je na `/_next/image`**, a nginx error log
uz to nosi „upstream timed out" i **„no live upstreams"**. To znači da Node
proces povremeno prestane odgovarati.

### Izmjeren kapacitet

`ab`, na samom serveru, tako da mreža ne ulazi u rezultat:

| Putanja | Propusnost | Šta ograničava |
|---|---|---|
| keširana stranica igre (nginx HIT, TLS) | **457 zahtjeva/s** | TLS na istoj mašini; stvarna granica je viša |
| `/news` na Nextu (ISR keš) | **207 zahtjeva/s** | jedan Node proces |
| **stranica igre, bez keša, na Nextu** | **32,8 zahtjeva/s** | **jedan Node proces** |
| API `/games/hub` (Octane, 8 radnika) | **756 zahtjeva/s** | zdravo |

Prosjek trenutnog prometa je 2,4 zahtjeva u sekundi. Vrhovi su višestruko veći,
ali ni blizu 457.

**Zaključak:** dok keš pogađa, mašina ima ogromnu rezervu. Kad keš promaši,
sve prolazi kroz **jedan proces koji radi 33 stranice u sekundi** — i to je
jedina prava granica.

### Zašto jedan proces

```
pm2:  mode=fork_mode  instances=None
```

Next.js radi u **fork modu, jedna instanca**. Server ima **4 jezgra**. Tri
sjede prazna dok četvrto je usko grlo, i na njemu se istovremeno radi SSR **i**
optimizacija slika — koja je CPU-teška i koja je danas napisala 3 GB.

`pm2 restarts` je prije restarta servera stajao na **535**.

---

## Dio 2 — Šta je izmjereno kao neispravno

Poredano po tome koliko boli ako se ne uradi.

### 1. Backupa nema. Nijednog.

`deployment/backup.sh` postoji, dobro je napisan, radi `pg_dump -Fc`, snima
Redis i uploade — **i nikad nije ušao u cron.** `/var/backups/techplay` ne
postoji. Jedini dumpovi na serveru su dva ručna, od 6. i 7. avgusta, u `/root`.

Baza je 1080 MB, `storage/app` 602 MB uploada koji nisu u gitu i ne postoje
nigdje drugdje. Kvar diska danas znači gubitak svega osim koda.

Ovo je veći rizik od svega ostalog na listi zajedno.

### 2. Četiri paketa s poznatim ranjivostima

```
league/commonmark   6 upozorenja  (4 high)  — DoS kroz duboko ugniježđen XML,
                                              DoS kroz sudarajuće slugove naslova
guzzlehttp/guzzle   9 upozorenja  (1 high)  — zaobilaženje provjere hosta
guzzlehttp/psr7     2 upozorenja  (medium)  — CRLF injekcija, host confusion
phpseclib/phpseclib 1 upozorenje  (medium)
```

`league/commonmark` renderuje **korisnički markdown na forumu**. DoS ranjivost
u tom paketu nije teorijska — to je ulaz koji svako može poslati.

### 3. Jedan Node proces na četverojezgrenoj mašini

Opisano gore. Posljedica koja se već vidi u logu: 110 grešaka 502 na
optimizaciji slika i „no live upstreams".

### 4. PostgreSQL je na tvorničkim postavkama

```
shared_buffers        = 128 MB     ← default; preporuka za 7,5 GB RAM-a je ~2 GB
effective_cache_size  = 4 GB       ← preporuka ~5,5 GB
work_mem              = 4 MB
random_page_cost      = 4          ← vrijednost za rotirajuće diskove; SSD traži 1,1
max_connections       = 200
```

Baza od 1 GB s tabelom `games` od 329 MB i **159.154 sekvencijalnih skeniranja**
radi sa 128 MB bafera. `random_page_cost = 4` uz to govori planeru da je
nasumično čitanje četiri puta skuplje nego što na SSD-u jeste, pa bira
sekvencijalno skeniranje tamo gdje bi indeks bio brži.

Ovo je najveći odnos dobitka prema uloženom na cijeloj listi.

### 5. Redis: keš, redovi i sesije u istoj bazi

```
CACHE_STORE=redis  QUEUE_CONNECTION=redis  SESSION_DRIVER=redis
db0: 132.457 ključeva, od toga samo 2.962 s istekom
maxmemory 768 MB, politika volatile-lru
```

`volatile-lru` izbacuje **samo ključeve koji imaju istek**. Ovdje ih 129.495
nema. Kad se dođe do 768 MB, Redis počne odbijati upise — a u istoj bazi su i
redovi poslova i sesije prijavljenih korisnika. Trenutno je na 137 MB, dakle
nije hitno, ali je tempirano.

Ključevi bez isteka su gotovo sigurno brojači pregleda (`Redis::incr` bez TTL-a,
jedan po igri, katalog ima 142.110).

### 6. Ništa ne javlja kad nešto pukne

636 grešaka 500 danas je otkriveno tako što sam **ručno pročitao log**. Nema
Sentryja ni bilo kakvog praćenja grešaka, nema upozorenja na e-mail ni Discord.
Laravel Pulse postoji, ali on mjeri performanse, ne prijavljuje incidente.

Platforma s 210.000 zahtjeva dnevno ne smije saznavati za kvarove tako što neko
slučajno pogleda.

### 7. Origin se i dalje može pogoditi po IP-u

`ufw` je danas zatvorio 3000, 8000 i 8080. Ali 80 i 443 su otvoreni svima, pa
`curl --resolve techplay.gg:443:46.224.110.57` i dalje vraća stranicu —
zaobilazeći Cloudflare, njegov WAF i rate limiting.

### 8. Pulse zauzima 60% baze

```
pulse_aggregates  362 MB   pulse_entries  285 MB   →  647 MB od 1080 MB
```

1.458.552 unosa za sedam dana zadržavanja. Monitoring košta više prostora nego
cijeli katalog od 142.000 igara (329 MB).

### 9. Sitnije, ali stvarno

| Nalaz | Zašto smeta |
|---|---|
| `php8.3-fpm` radi, a nginx ga **nigdje ne poziva** (0 referenci) | mrtav servis, troši memoriju, jedna stvar više koja može puknuti |
| `worker_connections 768` | Ubuntu default; uz 4 radnika to je 3.072 veze — malo za ozbiljan promet |
| **swapa nema** | skok u potrošnji ubija proces umjesto da ga uspori |
| Node 20 | LTS do 04/2026 |
| 26 neuspjelih poslova `Pusher error: cURL error 3` | posljedica pokvarenog Reverba, popravljenog danas — treba provjeriti da prestaje |
| `qualities: [60,70,75,80,90]` × 6 `deviceSizes` | do 30 fajlova po slici; zato keš raste 3 GB dnevno |
| `games_hub_name_idx` i drugi nikad skenirani indeksi | 6,7 MB mrtvog indeksa koji se održava pri svakom upisu |

---

## Dio 3 — Šta je zatečeno ispravno

Da se zna šta se ne dira.

- **Sigurnosna zaglavlja su kompletna.** HSTS, CSP s pravim izvorima (ne
  `unsafe-eval`), `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`. Ovo je iznad prosjeka industrije.
- **npm: 0 ranjivosti.**
- Baza i Redis slušaju samo `127.0.0.1`.
- Octane radi 756 zahtjeva/s — backend nije usko grlo.
- `unattended-upgrades` i `certbot.timer` uključeni, obnova certifikata prolazi.
- Supervisor drži pet procesa, pm2 se sam vraća nakon restarta.
- Verzije su podržane: PostgreSQL 16.14, Redis 7.0.15, PHP 8.3.29, nginx 1.24.

---

## Dio 4 — Plan

Četiri faze. Redoslijed nije proizvoljan: svaka sljedeća pretpostavlja da je
prethodna gotova.

### Faza 1 — Da se ne izgubi ono što postoji  *(prvo, prije svega ostalog)*

| Šta | Kako | Rizik izvođenja |
|---|---|---|
| **Backup u cron** | `backup.sh` dnevno u 03:00, zadržavanje 7 dnevnih + 4 sedmična | nikakav |
| **Backup van servera** | `rclone` na S3/B2/Hetzner Storage Box — backup na istom disku nije backup | traži nalog kod provajdera |
| **Provjera vraćanja** | vratiti dump u praznu bazu i prebrojati redove — backup koji nije isproban nije backup | nikakav, radi se na kopiji |
| **Ranjivi paketi** | `composer update` za četiri paketa, **lokalno**, `php artisan test`, pa deploy | srednji — zato lokalno i uz testove |
| **Praćenje grešaka** | Sentry (besplatan nivo pokriva ovaj obim) na backend i frontend | nikakav |
| **Upozorenja** | prag na 5xx → Discord webhook; već postoji bot | nikakav |

### Faza 2 — Da izdrži  *(kapacitet)*

| Šta | Očekivano | Rizik |
|---|---|---|
| **pm2 cluster, 3 instance** | SSR sa 33 na ~100 zahtjeva/s; kraj 502 grešaka na slikama | **treba provjeriti** da on-demand revalidacija radi na svim instancama — ISR keš je na disku i dijeli se, ali to se mora izmjeriti a ne pretpostaviti |
| **PostgreSQL podešavanje** | `shared_buffers 2GB`, `effective_cache_size 5.5GB`, `work_mem 16MB`, `random_page_cost 1.1` | nizak; traži restart baze (sekunde) |
| **Redis: odvojiti keš od redova** | keš u zasebnu bazu s `allkeys-lru`, redovi i sesije ostaju zaštićeni | nizak |
| **TTL na brojače pregleda** | `Redis::incr` dobija istek; 129.000 vječnih ključeva nestaje | nizak |
| **`worker_connections` 4096** | 16.384 istovremenih veza umjesto 3.072 | nikakav |
| **Ugasiti `php8.3-fpm`** | oslobođena memorija, jedna stvar manje | nikakav — nginx ga ne zove |
| **Swap 2 GB** | skok u potrošnji usporava umjesto da ubija | nikakav |

### Faza 3 — Da bude jeftinije i čišće

| Šta | Zašto |
|---|---|
| **Svesti `qualities` na jednu vrijednost** | keš slika prestaje rasti 3 GB dnevno; brisanje postaje rezerva a ne oslonac |
| **Pulse: skratiti zadržavanje ili uzorkovati** | 647 MB od 1080 MB baze za monitoring je pogrešna razmjera |
| **Ukloniti nekorištene indekse** | mjereno kroz `pg_stat_user_indexes` nakon **punog ciklusa** (statistika se resetuje pri restartu — ne brisati na osnovu današnjeg očitanja) |
| **80/443 samo za Cloudflare** | zatvara zadnji put do origina; **uz cron** koji osvježava listu opsega, jer zastarjela lista obara sajt |
| **Node 22** | prije nego 20 izađe iz podrške |

### Faza 4 — Da se zna šta se dešava

| Šta | Zašto |
|---|---|
| **Uptime provjera izvana** | trenutno bi pad primijetio posjetilac prije nas |
| **Praćenje sporih upita** (`pg_stat_statements`) | 159.154 sekvencijalnih skeniranja na `games` — treba znati koji upit ih pravi |
| **Sedmični izvještaj** | 5xx, prosječno vrijeme odgovora, veličina baze, uspješnost backupa |

---

## Dio 5 — Odgovor na pitanje „može li stotine hiljada posjeta"

Računica na izmjerenim brojevima.

100.000 posjeta dnevno je otprilike 500.000–1.000.000 zahtjeva, dakle **6–12
zahtjeva u sekundi u prosjeku**, s vrhovima 5–10 puta većim: **60–120
zahtjeva/s**.

- Keširana putanja daje **457/s** — ima rezerve četiri do sedam puta.
- Nekeširana putanja daje **33/s** — i tu bi puklo.

Dakle odgovor je: **da, ali samo dok keš drži.** Ono što ovaj server danas ne
bi preživio nije promet — nego **promašaj keša u vrhu**: deploy koji isprazni
keš usred prometa, ili crawler koji uđe u dio kataloga koji nije keširan.

Faza 2 to rješava na dva načina: cluster diže nekeširani put sa 33 na ~100/s, a
podešena baza skraćuje vrijeme svakog od tih 100.

Nakon Faze 1 i 2 ovaj server nosi cilj. **Prvo ograničenje koje se poslije toga
pojavi biće baza** — jedna instanca, bez replike za čitanje — i to je razgovor
za trenutak kad promet naraste pet puta, ne prije.

---

## Šta ovaj dokument ne zna

Pošteno da stoji zapisano:

- **Stvaran broj posjetilaca.** Mjereni su zahtjevi i IP adrese, ne sesije.
  Google Analytics postoji, ali odavde nije čitan.
- **Ponašanje pod stvarnim vrhom.** `ab` je sintetički i radi na istoj mašini;
  pravi vrh nosi TLS pregovaranje, sporije mreže i neravnomjeran raspored.
- **Koji upit pravi 159.154 sekvencijalna skeniranja.** Bez
  `pg_stat_statements` to je nagađanje, i zato je u Fazi 4 a ne u Fazi 2.
- **Da li cluster mod razbija on-demand revalidaciju.** Teorija kaže da ne bi,
  jer je ISR keš na disku. To se mjeri prije nego što se uključi.
