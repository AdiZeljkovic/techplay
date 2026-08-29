# 77 — Analiza: stabilnost, bugovi, optimizacija, dupli sistemi

**Datum:** 28.08.2026.
**Obim:** frontend, admin panel, backend, server — s naglaskom na stabilnost, bugove, lošu optimizaciju, duple sisteme koji rade isti posao, i da li je sve podešeno. Uključuje **puni inventar servera**: šta postoji, šta radi, šta se koristi, šta je mrtvo.
**Odnos prema docs/76:** tamo je sigurnost i ops (rađeno 28.08. ujutro); ovdje se ti nalazi ne ponavljaju — samo se provjerava da današnje popravke drže. Sve ostalo je novi teren.
**Pravilo:** ništa se ne mijenja; svaki nalaz nosi dokaz (fajl:linija ili izmjerena vrijednost sa servera).

| Oznaka | Značenje |
|---|---|
| 🔴 | Ruši, gubi podatke, ili aktivno kvari ponašanje korisnicima |
| 🟠 | Bug ili trošak koji se već plaća (pogrešni podaci, spor odgovor, dupli posao) |
| 🟡 | Tehnički dug, nered, mrtav kod — ne boli danas |
| 🟢 | Provjereno, u redu |

---

## SAŽETAK

Pregledano: cijeli server (procesi, cron, nginx, PostgreSQL kroz pg_stat_statements, Redis, logovi), 79 backend servisa, ~290 API ruta, scheduler s 27 zadataka, svi observeri i jobovi, 39 Filament resursa, kompletna frontend rendering mapa s tag-revalidacijom, Discord bot, 224 migracije + živa šema. Svaki 🔴/🟠 nalaz je verifikovan na kodu (fajl:linija) ili izmjeren na produkciji.

**Četiri stvari aktivno štete već sada:**
1. **Svaka objava članka okida se DVAPUT** (observer registrovan 2×) — dupla Discord objava, duple notifikacije, dupla isplata autoru. Dokazano u ledgeru (B1).
2. **Zakazano objavljivanje zaobilazi sav mehanizam objave** — bez revalidacije, keša, Discorda, notifikacija (B2). Srodno: sinoć je upis članaka bio slomljen ~7 h (kod↔šema prozor, A10) i **nijedan alarm nije zvonio**.
3. **Draft i zakazani guide-ovi su javno dostupni** na API-ju (B14).
4. **RewardLedger je pravi singleton pod Octane-om** — nagrade jednog korisnika mogu procuriti u odgovor drugom (B-servisi/C1 nalaz, potvrđeno: nema config/octane.php ni flush-a).

**Najveća neopravdana potrošnja:** sitemap (2,8 h DB vremena u 11 dana — regexp preko 300k opisa + OFFSET šetnja, A5.2), `studios.parent_id` bez indeksa (231k full skenova, A5.3), 3,9 GB IGDB staging podataka u produkcijskoj bazi i svakom backupu (A5.1), Redis sa 116 MB u swapu (A6.1).

**Dupli sistemi:** 20 ih je popisano u sekciji G — najgori su ad brojači koje prazne dva sistema (brojke kampanja klize, B3), IndexNow ×5 s dva različita ključa (B9), bot s dva paralelna news-detektora (E5), i dva deploy skripta od kojih Windows wrapper zove stari/opasni (B5).

**Šta je iznenađujuće dobro:** test suite zelen — 941/941 prolazi, 3.249 assertions (ali ga ništa ne vrti automatski — B23); nijedan slomljeni frontend→backend poziv (svaka ruta postoji); ekonomija (XP/bounty/quest) transakciono ispravna s jednom tačkom istine; revalidacioni tagovi članaka se poklapaju kraj-na-kraj; tri ranija nalaza (DM privatnost, mrtva ISR revalidacija, vlasnički profil) potvrđeno popravljena; sve jučerašnje sigurnosne popravke drže (A9); admin panel sistematski eager-loada i kešira (uz izuzetke iz C); store-integracije imaju uzorne timeoute i fail-safe ponašanje.

---

## PLAN RADA (popunjava se tokom analize)

### A. Server — puni inventar
- [x] A1. Procesi: systemd units, supervisor programi, pm2 lista, docker kontejneri — šta se vrti, pod kojim korisnikom, koliko memorije
- [x] A2. Sve tempirano: cron (svi korisnici + cron.d), systemd tajmeri, Laravel scheduler — preklapanja i dupli poslovi
- [x] A3. Nginx: svi vhostovi, keš zone, rate limiti; slaže li se config na serveru s repoom
- [x] A4. PHP/Octane: verzija, opcache, workeri, memorija po procesu, restarti
- [x] A5. PostgreSQL: baze, najveće tabele, nekorišteni i nedostajući indeksi, sekvencijalna skeniranja, autovacuum, konfiguracija
- [x] A6. Redis: memorija, politika istjecanja, ključevi po prefiksu, ima li ključeva bez TTL-a koji rastu
- [x] A7. Disk, RAM, swap, logovi (veličine i rotacija), sadržaj /var/www — ostaci, siročići
- [x] A8. Šta je instalirano a ničemu ne služi (servisi, paketi, stari runtime-ovi, mrtvi direktoriji)
- [x] A9. Drže li današnje popravke iz docs/76: SSH, backup (greška 2 očekivana), vlasništvo procesa, Redis lozinka, .env dozvole

### B. Backend (Laravel)
- [x] B1. Servisi — potpun inventar: ko koga zove, koji su mrtvi, koji se dupliraju
- [x] B2. Rute + kontroleri: mrtve rute (bez frontend potrošača), dupla logika među kontrolerima, konzistentnost ApiResponse
- [x] B3. Jobs / queue / scheduler: šta se stvarno pokreće, retry/backoff, šta se dešava kad padne
- [x] B4. Observeri + keš + revalidacija: jedan put ili više puteva za istu stvar
- [x] B5. Upiti: N+1, teški upiti, count nad velikim tabelama, paginacija *(izmjereno kroz pg_stat_statements — A5; HTTP sloj u B2)*
- [x] B6. Config/env drift: varijable koje kod čita a nisu postavljene, i postavljene koje niko ne čita
- [x] B7. Error handling: progutani izuzeci, timeouti vanjskih API-ja (Steam, PSN, Blizzard, Groq, RaiderIO, Discord)
- [x] B8. Testovi: deploy skripta ih NE vrti (composer→migrate→cache→restart→smoke check — provjereno); suite pokrenut lokalno tokom analize — rezultat u B23

### C. Admin panel (Filament)
- [x] C1. 39 resursa: N+1 u tabelama, teški count-ovi, polling
- [x] C2. Widgeti i chartovi: šta udara bazu i koliko često
- [x] C3. Dupli resursi / preklapanje s API logikom (isti posao, dva koda)
- [x] C4. Konfiguracija: šta je podešeno a mrtvo, šta je živo a nepodešeno

### D. Frontend (Next.js)
- [x] D1. Stranice: ISR mapa (revalidate po stranici), šta je force-dynamic a ne mora biti, šta je statično a ne smije biti
- [x] D2. Duple komponente / dupli sistemi (isti UI ili ista logika napisana više puta)
- [x] D3. Mrtav kod: nespojene komponente, neiskorišteni exporti, stranice bez linka
- [x] D4. API pozivi: konzistentnost (getApiUrl vs. direktni fetch), error handling, retry
- [x] D5. Bundle: teški importi u client komponentama, šta se učitava a ne koristi
- [x] D6. WebSocket / Echo: šta se pretplaćuje, curi li

### E. Discord bot
- [x] E1. Servisi: intervali, šta zovu na backendu i koliko često
- [x] E2. Stabilnost: reconnect, error handling, curenje memorije (tajmeri, listeneri)
- [x] E3. Mrtav kod i konfiguracija

### F. Baza podataka (schema)
- [x] F1. Migracije vs. stvarna šema vs. modeli — drift
- [x] F2. Indeksi definisani u kodu vs. stvarno korišteni (spoj s A5 + živi `\di`)
- [x] F3. Kolone/tabele koje ništa ne čita

### G. Presjek — dupli sistemi kroz cijeli stack
- [x] G1. Keširanje: koliko slojeva (Redis, nginx, Cloudflare, ISR, response cache) i ko koga poništava
- [x] G2. Notifikacije/alarmi: Telegram, mail, GlitchTip, healthcheck — ko šta javlja
- [x] G3. XP: web + Discord — jedna logika ili dvije
- [x] G4. Statistika/brojači: pregledi, view counters, čime se mjere i gdje se dupliraju

---

## NALAZI

### A. SERVER — puni inventar (izmjereno 28.08.2026, popodne)

#### A1. Šta se vrti — kompletan popis

**systemd (running):** nginx, postgresql@16-main, redis-server, supervisor, pm2-techplay, docker (+containerd), netdata, fail2ban, cron, ssh, unattended-upgrades, rsyslog, atd, qemu-guest-agent, polkit, multipathd + standardni systemd servisi.

**supervisor (www-data):**
| Program | Komanda | Napomena |
|---|---|---|
| techplay-octane | `octane:start --server=frankenphp --workers=8 --max-requests=500` | FrankenPHP, ~277 MB RSS |
| techplay-worker | `queue:work --sleep=3 --tries=3 --max-time=3600` | restart svakih sat — namjerno |
| reverb | `reverb:start --host=0.0.0.0 --port=8080` | WS, iza nginxa |

**pm2 (techplay):** `techplay-frontend` (next-server v16.3.0, ~230 MB) i `techplay-bot` (discord, ~100 MB). Restart brojači niski (4 / 1) — stabilno.

**docker:** glitchtip-web, glitchtip-worker, glitchtip-redis (svi Up 10 dana; `glitchtip-migrate` Exited(0) — normalan one-shot). GlitchTip koristi **host Postgres** kroz docker bridge (baza `glitchtip`, 40 MB; ufw propušta 5432 samo sa 172.16.0.0/12). Slike 1,55 GB.

**Slušaju (portovi):** 22 (svijet), 80/443 (samo CF opsezi), 8080 reverb (ufw zatvoren izvana), *:3000 next i *:8000 frankenphp (ufw zatvoren izvana), lokalno: 2019 (octane admin), 4317 (netdata otel), 5432, 6379, 8081 (nginx stub_status za netdata), 8090 (glitchtip), **8099 (Discord bot PublishListener — backend gura publish evente botu**, `discord/src/services/PublishListener.ts:41`, autentifikovano tokenom, vezano na 127.0.0.1 ✓), 19999 (netdata UI, samo localhost).

**Resursi:** RAM 7,5 GB (3,7 used / 4,9 buff-cache), swap 2 GB (257 MB u upotrebi — vidi A6), disk 23/75 GB (32%), load ~0,3 na 4 jezgra. Verzije: Ubuntu 24.04.4, PHP 8.4.24, Node 24.20, PostgreSQL 16.15, Redis 7.0.15, nginx 1.24.

#### A2. Sve što je tempirano — i tri stvari koje tu ne valjaju

**Custom ops (cron.d + tajmeri):** techplay-healthcheck (*/5 min), techplay-backup.timer (02:34, Persistent), techplay-image-cache-cap (04:40), techplay-cf-ranges (pon 03:05, obnavlja CF IP opsege za real_ip), techplay-index-usage (pon 05:00, sedmični snapshot upotrebe indeksa — pametno), certbot, sysstat, netdata-updater (cron.daily — netdata se sam nadograđuje svaku noć).

**Laravel scheduler — 27 zadataka** (`schedule:list`): FlushViewCounters */5 · PollSteamPresence */2 · articles:publish-scheduled i scheduler-heartbeat svake minute · sitemap --content */15 + puni 03:30 (dupli raspored iz docs/76 UKLONJEN ✓) · po satu: ads:sync-metrics, games:enrich-steam, forum:clear-expired-pins · dnevno: enrich-opencritic, enrich-trailers, chronicle:rebuild, users:prune-unverified, sync-steam-achievements, achievements:sync, season:conclude, campaign:founders, SendGiveawayReminders (*/6h), SendReleaseReminders, wishlist:check-releases · sedmično: releases:sync + releases:merge + games:sync-series (pon), platforms:resync (sri), profile digest (pet), snapshot-reputation · mjesečno: snapshot-reputation.

- 🟠 **A2.1 — `schedule:run` i SEO komande vrte se kao root.** Root crontab drži: Laravel scheduler (svake minute), `seo:scan-links` (ned 03:00) i `cache:forget seo_orphan_count` (04:00) — sve `php artisan` **kao root**, dok octane/worker rade kao www-data. To je tačno ona zamka zbog koje postoji `techplay-deploy.sh` (root-ovi fajlovi u www-data stablu): root-ov artisan može ostaviti root-owned cache/log fajlove i tiho slomiti aplikaciju. CLAUDE.md tvrdi „nothing runs as root any more except the pull" — scheduler radi, svake minute. Treba preseliti u www-data crontab.
- 🟠 **A2.2 — logrotate.service je u statusu FAILED** od 28.08. 00:04: `Permission denied` na `laravel-2026-08-23.log` i `worker.log` — fajlovi su tada bili root-owned (queue:work je do jutros radio kao root; supervisor otvara `worker.log`). Današnja promjena vlasništva je vjerovatno razriješila uzrok (fajlovi su sada www-data, config `/etc/logrotate.d/techplay` koristi `su www-data www-data`), ali unit stoji failed i **sutra u 00:00 se vidi da li prolazi**. Healthcheck logrotate ne prati.
- 🟡 **A2.3 — `/var/log/reverb.log` nije ni u jednom logrotate configu** (supervisor ga puni direktno; danas 32 KB, pa ne gori — ali raste bez granice).
- 🟡 **A2.4 — netdata se sam nadograđuje svake noći** (cron.daily/netdata-updater) — samonadogradnja monitoring sistema bez nadzora; ako nova verzija nešto slomi, saznaje se slučajno.

#### A3. Nginx — mapa je zdrava

3 vhosta: `techplay` (techplay.gg → next upstream `127.0.0.1:3000 max_fails=0` s dokumentovanim razlogom; /games/ i /studios/ kroz `proxy_cache techplay`; /api, /admin, /storage, /livewire, /sanctum, robots.txt i sitemape → backend :8000; /api/revalidate ispravno PRIJE /api), `techplay-backend` (api-beta → :8000, /broadcasting → reverb :8080, robots Disallow-all ✓), `glitchtip` (→ :8090). Plus stub_status na 8081 za netdata. Keš slika: `/var/cache/nginx/techplay` 1,8 GB s dnevnim capom (skript mjeri stvarni radni skup — dobro dokumentovano). CF real-ip opsezi se obnavljaju sedmično ✓.

- 🟡 **A3.1 — `/admin`, `/livewire`, `/sanctum` su izloženi i na techplay.gg** (pored api-beta) — dva URL ulaza u isti admin. Nije rupa (auth drži), ali je dupla površina i lako se zaboravi da postoji.

#### A4. PHP / Octane

Octane: 8 workera, max-requests 500, FrankenPHP. U redu. Dvije sitnice:
- 🟡 **A4.1 — `$HOME` prazan za octane proces** — Caddy upozorava i sprema svoj state u `backend/caddy/autosave.json` (postoji, www-data). Kozmetički; supervisor bi trebao postaviti `environment=HOME=...`.
- 🟢 Nema PHP-FPM-a u upotrebi za sajt (cron.d/php sessionclean je no-op pod systemd; php8.3-fpm logrotate config je ostatak — PHP je 8.4).

#### A5. PostgreSQL — ovdje su najveći nalazi

Baza `techplay` **5.862 MB**. Statistika se akumulira od restarta/tuninga **17.08.2026** (11 dana) — sve brojke ispod su za taj prozor.

- 🔴 **A5.1 — 65% baze je `igdb_raw`: 3.816 MB / 8,23M redova** (+ `igdb_game_keys` 77 MB / 373k). To NIJE mrtav sistem — 10 `Igdb*` komandi i `IgdbMatcher`/`IgdbFacts` servisi postoje (docs/75 plan) — ali je **staging sirovina koja živi u produkcijskoj bazi**: svake noći ide u dump (9 × ~57 s samo COPY igdb_raw u zadnjih 11 noći), naduvava backup i cache-hit računicu. Odluka koja se traži: preseliti u zasebnu bazu/na disk, ili prihvatiti trošak svjesno.
- 🟠 **A5.2 — sitemap je najskuplji potrošač baze: ~10.000 s (2,8 h) DB vremena u 11 dana.** Dva upita s vrha pg_stat_statements: (1) `slug, updated_at FROM games WHERE description IS NOT NULL AND length(regexp_replace(description, '<[^>]+>',...)) > 50` — **1.475 poziva × 3,7 s** — to je `Game::indexable()` scope ([Game.php:149](../backend/app/Models/Game.php#L149)) koji regexpom čisti HTML iz 300k+ opisa **pri svakom generisanju**; (2) isti podaci kroz `ORDER BY slug LIMIT ? OFFSET ?` — **21.508 poziva × 212 ms** — OFFSET šetnja kroz cijelu tabelu. Sitemap --content ide svakih 15 min. Rješenje kad dođe red: precomputed `indexable` boolean kolona + keyset paginacija.
- 🟠 **A5.3 — `studios.parent_id` nema indeks** — `SELECT ... FROM studios WHERE parent_id = ?` izveden **231.539 puta × 10 ms** (2.319 s ukupno) — to je tačno izmjerenih 230.026 seq skenova tabele (57k redova po skenu). Puca pri renderu studio stranica (podstudiji). Jedan indeks rješava trećinu svih seq skenova na serveru.
- 🟠 **A5.4 — `LOWER(name)` lookup na games = full scan 332k redova** (EXPLAIN potvrđen: Seq Scan, cost 146.667). Pozivaoci: `PresenceService::resolveGame` ([PresenceService.php:62](../backend/app/Services/PresenceService.php#L62), vrti ga PollSteamPresence svake 2 min za svakog igrača + Discord presence), `GameMatchingService` (4 mjesta), `StoreSync:314`. Volumen zasad umjeren (584 + 475 + 218 poziva × ~200 ms), ali raste sa svakim aktivnim igračem. Funkcijski indeks na `LOWER(name)` (ili normalized kolona) rješava.
- 🟠 **A5.5 — cache hit ratio 60,6%** (zdravo je >95%). Dijelom istorija rebuild-a i igdb_raw dumpova, ali s 2 GB shared_buffers na 5,9 GB baze od koje je 3,9 GB balast — A5.1 i ovo su isti problem.
- 🟡 **A5.6 — pola miliona view UPDATE-a sedmično:** `UPDATE games SET views = views + ? WHERE id = ?` — **1,59M poziva u 11 dana** (144k/dan). Bafer u Redisu + flush svakih 5 min već postoji (dobro), ali flush piše red-po-red; batch CASE/VALUES upis bi smanjio WAL. Nije hitno — 0 ms po pozivu.
- 🟡 **A5.7 — `games.suggested` upit izveden 1,3M puta u 11 dana** (118k/dan, 1 ms po pozivu — GIN indeks radi ✓). To je stvarna slika crawler long-taila na /games/*: nginx keš prima udar, ali svaki miss renderuje stranicu i puni per-igra keš (TTL 1h). Vrijedi znati da je **crawl, ne ljudi**, glavni generator backend prometa.
- 🟡 **A5.8 — jednokratni upit od 36 minuta:** `count(*) studios WHERE EXISTS (... games.developers @> ARRAY[...])` — 1 poziv, 2.179 s. `developers` TEXT[] nema GIN (genres/platforms/tags imaju). Ako se taj upit ikad ponovi (admin/analiza), opet stoji pola sata.
- 🟡 **A5.9 — dupli i mrtvi indeksi:** `articles` ima bukvalno isti indeks dvaput (`articles_is_featured_in_hero_index` + `idx_articles_featured`); `games_hub_name_idx` (23 MB) ima 0 skeniranja u OBA sedmična snapshota (17. i 24.08. — trgm indeks ga je zamijenio za pretragu); `igdb_game_keys_match_key_release_year_index` 21 MB / 0 skenova. `games` nosi **17 indeksa** — svaki sync ih sve ažurira.
- 🟢 Konekcije 19/100, autovacuum živ (games 102×, articles 541×), work_mem 16 MB, random_page_cost 1.1, log_min_duration 1s — postavke razumne. `pg_stat_statements` i `pg_trgm` instalirani. Netdata monitoring baze košta ~48k upita × 7-9 ms u 11 dana — prihvatljivo za ono što daje.

**Brojevi kataloga:** games ukupno **332.455** (s opisom 305.581, tombstones 60.981). CLAUDE.md kaže 142.110, memorija kaže ~187k — **dokumentacija kasni za katalogom koji je u međuvremenu udvostručen.**

#### A6. Redis

- 🟠 **A6.1 — Redis drži 116 MB u swapu** (`used_memory` 122 MB, RSS 29 MB, VmSwap 116 MB). Keš koji treba da štiti bazu dijelom leži na disku — latencija pri pogotku hladnih ključeva. Uzrok: memorijski pritisak (PG 2 GB + octane + next + docker) i default `vm.swappiness`. Vrijedi: swappiness na 10, ili MemorySwapMax=0 za redis unit, pa pratiti.
- 🟠 **A6.2 — hit rate keša je 30%** (181k hits / 427k misses). Struktura ključeva (census): u cache DB-u dominiraju **per-igra ključevi** — `games.suggested.v2.{id}` (TTL 1h), `game_view_{id}_{fingerprint}` (dedup pregleda), `games.articles.v1.{id}` — nad katalogom od 332k igara koje crawleri gađaju ravnomjerno, pa svaki novi ID = miss. To je očekivano ponašanje te sheme, ne kvar — ali znači da Redis za games sekciju uglavnom NE štedi bazu (štite je nginx keš i 1-ms GIN upiti).
- 🟢 maxmemory 768 MB / volatile-lru, evictions 0, db1 svi ključevi s TTL ✓. db0: view baferi (`views:game:N`), analitika, sesije/rate-limiter — 41 ključ bez TTL-a, sve legitimno (baferi se prazne flush jobom).

#### A7. Disk, logovi, /var/www

- 🟡 **A7.1 — ostaci u korijenu deploy stabla** `/var/www/techplay/`: `backups/articles-guides-20260818-1253.sql.gz` (SQL dump u deploy stablu, root-owned), `temp_html.txt`, 6 marketing PNG-ova (~8 MB), `template/`, `design/`, stari MD fajlovi (AD_SYSTEM_UPGRADE, CACHE_OPTIMIZATION, DEPLOY_STATS...). Ništa od toga nginx ne servira (provjereno u konfigu), ali ne pripada produkcijskom stablu.
- 🟡 **A7.2 — `/var/log/techplay-seo.log` je world-writable** (`-rw-rw-rw-`, root) — sitnica, ali nepotrebna.
- 🟢 Journal ograničen (200M/7d, koristi 109M), logrotate pokriva nginx/backend logove (kad prođe — vidi A2.2), pm2 logovi mali, backup lokalno se briše po dizajnu. Disk 32%.

#### A8. Instalirano a ne služi ničemu

- 🟡 `open-vm-tools` + `vgauth` enabled (VMware alati na QEMU/Hetzner mašini — mrtvo), `apport` (Ubuntu crash reporting) enabled, `motd-news`, `pollinate`. Sitno, ali je šum u enabled listi.
- 🟡 **Root PM2 God Daemon** vrti se s **nula procesa** (`/root/.pm2`, ostatak jutrošnje migracije na techplay korisnika; 60 MB RSS). `pm2 kill` kao root + obrisati `/root/.pm2`.
- 🟢 Nema PHP-FPM servisa, nema Apache-a, nema MySQL-a — čisto.

#### A9. Popravke iz docs/76 — drže li? **DA.**

| Provjera | Stanje |
|---|---|
| sshd | `permitrootlogin without-password`, `passwordauthentication no`, `maxauthtries 3` ✓ |
| .env dozvole | backend `640 root:www-data`, frontend `600` ✓ |
| Redis lozinka | `PING` bez autha → `NOAUTH` ✓ |
| Procesi | octane/worker/reverb www-data, next+bot techplay ✓ |
| Backup | radi 02:34, dump provjeren (121 tabela, 721 MB), exit 2 jer Storage Box još nema podataka — **po dizajnu**, javlja na Telegram ✓ |
| Healthcheck | 7/8 OK, backup FAIL očekivan ✓ |
| Sitemap dupli raspored | uklonjen iz crona ✓ (ali vidi A5.2 — sam sitemap je i dalje skup) |
| Kernel restart | **i dalje čeka** — sada je pending 6.8.0-138 (instaliran danas), radi 6.8.0-137. `reboot-required` aktivan |
| GlitchTip mail | **i dalje** `EMAIL_URL=consolemail://` (čeka vlasnikov mail server) — greške se skupljaju, niko ne saznaje |
| apt | 7 paketa (phased Python — namjerno zadržani) ✓ |

#### A10. Živi incident uhvaćen u logu (sinoć)

- 🔴 **A10.1 — upis članaka bio pokvaren od sinoć ~21h do jutros 06:54.** `laravel-2026-08-27.log`: `SQLSTATE[42703]: column "featured_image_width" of relation "articles" does not exist` na INSERT (14 grešaka). Migracija `2026_08_27_210000_add_image_dimensions_for_share_cards` postoji i **izvršena je tek u jutrošnjem deployu** — kod koji piše te kolone bio je živ prije nego što je migracija primijenjena. Sistemski problem: **deploy dozvoljava prozor kod↔šema** (i nikakav alarm nije zvonio — GlitchTip ne može javiti, mail ne radi). Danas: 10 grešaka u logu, sve `mail.support.techplay.gg` DNS — poznato.

### C. ADMIN PANEL (Filament) — 39 resursa + 4 stranice pregledano

**Opšta slika: panel je discipliniran.** 22 resursa ima ispravne eager loadove, GameResource je uzoran za tabelu od 332k redova (subset select, simple pagination bez count(*), trgm pretraga, GIN filter), teški agregati keširani (NewsroomConsole 60/600s, ListPulse 300s), nema pollinga u app kodu, svi admin upisi idu kroz Eloquent → observeri se okidaju (keš i ISR se čiste i poslije admin izmjena ✓), `maintenance_mode` stvarno uklonjen iz Settings ✓, AdCampaign `orderByRaw` sad steže smjer na asc/desc ✓.

- 🔴 **C1 — Prva stvarna narudžba u adminu = 500.** `OrderItemsRelationManager` koristi `Filament\Tables\Actions\*` klase kojih **nema u instaliranom Filamentu** (provjereno u vendor stablu — v5 ih je premjestio u `Filament\Actions\*`). Orders tabela ima 0 redova pa to niko još nije otvorio; na dan prve narudžbe edit stranica puca. Uz to: badge boja statusa je `match` bez defaulta koji ne pokriva `refunded` (koji PayPal webhook piše) → refundirana narudžba obara **cijelu listu** narudžbi. `OrderItemsRelationManager.php:55`, `OrderResource.php:108`.
- 🟠 **C2 — ReleaseCalendar navigation badge pokreće merge-matcher na svaku navigaciju u adminu.** `ReleaseCalendar.php:60` → `GameMerger::candidates()` → učita **2.924 igre s match_key + storeLinks** (izmjereno na produkciji) + PHP sličnost po parovima + **po jedan upit u `game_match_decisions` po paru**. Panel je SPA — badge se renderuje na svaki klik, za svakog admina. Jedina skupa stvar u panelu koja NIJE keširana.
- 🟠 **C3 — Dashboard red „čeka pregled" broji status koji niko ne piše.** `NewsroomConsole.php:73` broji `pending_review`; forme pišu `ready_for_review` (`PublishTab.php:72`, `ArticleTable.php:150`). Članak poslat na pregled **nikad se ne pojavi** u redu čekanja — upravo ono zbog čega widget postoji. Provjereno grep-om: `pending_review` postoji samo na tom jednom mjestu.
- 🟠 **C4 — Auto-slug u dvije kategorije baca TypeError.** `CategoryResource.php:104` i `ForumCategoryResource.php:86`: `function (Closure $set...)` — Filament v5 ubacuje `Set` objekat, ne `\Closure` → TypeError na blur polja Name. Slug ostaje ručno upisiv, pa nije gubitak podataka, ali je slomljena automatika (SeasonResource radi ispravno — obrazac postoji u repou).
- 🟠 **C5 — `queue_monitors` raste bez kraja: pruning upaljen u configu, ali komanda NIJE u scheduleru.** 10.502 reda / 3,5 MB danas; FlushViewCounters sam dodaje ~288/dan. `filament-jobs-monitor:prune` ne postoji u `routes/console.php`. Jedan `->daily()` red rješava.
- 🟠 **C6 — Admin izmjene korisničkog sadržaja zaobilaze SanitizationService.** Article/Guide saniraju u observeru ✓, ali za Comment, GameRating, Post, Thread sanitizacija živi **samo u API kontrolerima** — admin edit istog sadržaja ide mimo nje, a `PostResource` ga kasnije renderuje `->html()`. Nekonzistentnost pipeline-a (admin je zaključan, pa je rizik nizak — ali obrazac je rupa).
- 🟡 **C7 — SeoManager filter „category" gađa kolonu koje NEMA u produkciji.** Filter cilja legacy `articles.category`; uživo provjereno: `column "category" does not exist` — **upotreba filtera baca SQL grešku**. Mrtav filter koji izgleda živ.
- 🟡 **C8 — sitnice:** MostViewedArticles widget bez eager loada (N+1) i bez filtera na published (draftovi u listi); Giveaway tabela radi COUNT po redu za visible/modal (obrazac `->counts()` postoji odmah pored); `content_versions` snima pun sadržaj na svaki save bez ikakvog capa/pruninga (na vlastitoj UNBOUNDED listi projekta); BrokenLink bulk „check again" = do 25 sinhronih HTTP provjera u jednom Livewire requestu (do ~250 s — preko svakog timeouta); ContentVersions RM N+1 na `creator.username`; jobs-monitor u nedeklarisanoj nav grupi „Settings"; ~15 docblockova još piše „142.110 igara".

### D. FRONTEND (Next.js) — rendering, ISR, logika

**Opšta slika: zdravija nego prošli mjesec.** Tri poznata stara nalaza **potvrđeno popravljena**: DM-ovi su sada na privatnim kanalima (`echo.private('conversation.…')`, uz simetričan leave — nema curenja pretplata), mrtva ISR revalidacija je proradila (tag mapa news/reviews/guides/tech se poklapa kraj-na-kraj, endpoint prima oba imena tajne), vlasnički dio profila se renderuje (uz sign-in wall za /profile/me). Rendering mapa je uglavnom smislena; `fetchContent` disciplina (404 vs 500, retry na 5xx, bez keširanja greške) je uzorna; generateMetadata dedupe provjeren na svim parovima ✓; nema mrtvih ruta; auth/token handling kroz interceptor s 401/419 logikom ✓.

- 🟠 **D1 — Pala regeneracija naslovnice objavi PRAZNU naslovnicu.** `app/page.tsx:43-61`: na `!res.ok` ili catch vraća prazne nizove → ISR to objavi kao stvarnu stranicu (min. 60 s), a `HomeClient` nema client refetch. Tačno onaj scenarij zbog kojeg je `lib/fetchContent.ts` napisan („prazna stranica objavljena kao prava gora je od greške") — jedino ga naslovnica ne koristi.
- 🟠 **D2 — Izmjena igre ostaje nevidljiva do 1h: nginx sloj se ne čisti.** Revalidate ruta za igre čisti **samo Cloudflare** (uz komentar da je edge efektivni keš), ali između CF-a i Nexta stoji nginx `proxy_cache` s **`proxy_cache_valid 200 1h`** (provjereno u snippetu na serveru) — CF purge samo ponovo povuče iz nginxa staru kopiju. Tombstone 410 keširan 10 min (OK). Treba purge i nginx sloja (ili `proxy_cache_bypass` header koji revalidate ruta može poslati).
- 🟠 **D3 — Shop je slijep za pretraživače i dijeljenje.** `/shop/[slug]` je čisto client stranica **bez ikakvog metadata** (jedina detalj-stranica na sajtu bez OG kartice), a `/shop` referencira `og-shop.png` koji **ne postoji** u public/. Na monetizacijskoj površini.
- 🟠 **D4 — Novac: KM na ekranu, EUR u PayPal-u, a backend prima samo COD.** Shop checkout prikazuje cijene kao `KM`, PayPal provider konfigurisan `currency: EUR`, a backend `storeOrder` validira `payment_method in:cod` i **računa iznos sa servera** (frontendov `amount` se ignoriše — provjereno u `ShopController.php:40-101`). Dakle: niko ne može biti pogrešno naplaćen, ali je PayPal grana na shopu **mrtav kod koji izgleda živ**, i valuta na ekranu ne odgovara namjeri. Support tok je čist: backend potvrđuje naplaćeni iznos prema tieru uz toleranciju centa i replay zaštitu (`SupportController.php:104-114`) ✓.
- 🟠 **D5 — Kontakt forma ide kroz Cloudflare bez internog tokena.** `app/contact/actions.ts` je jedini server-side poziv koji NE koristi `serverHeaders()`/`getServerApiUrl()` (ostalih 33 mjesta koristi) — s upaljenim CF bot kontrolama poruka može tiho pasti kao „Failed to send message".
- 🟠 **D6 — Šest od sedam real-time hookova je mrtvo, a Header POLLIRA isto to.** Kompletan push sistem (privatni `user.{id}` kanal, toasti, unread brojači) postoji u `hooks/useRealTime*` — **nula importera**; Header umjesto toga pollira `/user/notifications/counts` svakih 60 s. Reverb server se plaća, a notifikacije idu pollingom. Ili spojiti ili obrisati.
- 🟡 **D7 — dupli sistemi u frontendu (konkretno):** relativno vrijeme ×4 (lib/timeAgo + 2 lokalne kopije koje se već razlikuju + date-fns + goli toLocaleDateString u 22 fajla) · SWR `fetcher` definisan ~40 puta s različitim unwrapovima (`r.data` vs `r.data.data` vs `…?.results` — recept za crash na tuđem obliku) · **XP→level matematika duplirana FE/BE i VEĆ radi različito**: Header računa level lokalno (`levelForXp(xp)`), ProfileHero koristi backendov `hero.level` · rank ljestvica preslikana u `lib/ranks.ts` · 9 ručnih modala pored `ui/Dialog` primitiva (z-index raspon 30–9998) · API base URL građen na 4 mjesta (og rute su već odlutale: 2 od 3 fallbackuju na `api.techplay.gg` koji **ne rezolvira** — provjereno DNS-om).
- 🟡 **D8 — mrtav kod:** hooks `useRealTime*` (6 kom.), `useMediaKit`, 7 WoW komponenti i dalje nespojeno (`HousingReadiness`, `PreparationChecklist`, `TimelineTracker`, `DailyPlanner`, `HistoricalProgress`, `WowLeaderboard`, `WowRecentAnalyses`) + `lib/wow-midnight-theme.ts`; **npm paketi bez ijednog importa**: `@radix-ui/react-avatar`, `class-variance-authority`, `react-scroll` (+types), `recharts` (jedini korisnik je mrtva WoW komponenta); mrtvi rewrites za `/feed` i `/rss` u next.config (filesystem rute ih pregaze — a da ikad opale, vodile bi kroz CF challenge); `getComments()` u news/[slug] definisan i nikad pozvan; `remotePatterns` još dozvoljava `media.rawg.io`, pravatar, placeholder, unsplash i mrtvi `api.techplay.gg`.
- 🟡 **D9 — ISR sitnice:** `/hardware` index sluša tag `hardware` koji **niko ne šalje** (spašava ga path purge — jedan red popravke na `['tech']`); `/impressum` je force-dynamic + no-store za spisak koji se mijenja par puta godišnje; `/reviews` index 600 s a `/reviews/page/2` 300 s (druga strana svježija od prve); games facet stranice deklarišu 86400 a efektivno je 3600 (deklaracija mrtva); GTA6 character purge je dokumentovani no-op (`revalidatePath` na dinamičkoj ruti) — izmjene lika čekaju 1h timer; tagovi `author-{slug}` i `release-{slug}` se slušaju a nikad ne šalju; komentari lažu (`revalidate = false; // 10 minutes`); 13 identičnih `error.tsx` fajlova, a sekcije koje STVARNO bacaju (studios, lists, gta6, author) nemaju nijedan; `loading.tsx` postoji samo na ISR stranicama koje odgovaraju odmah, a nema ga na najsporijim (forum, games — force-dynamic); paginacija news/reviews/guides/hardware = četverostruki copy-paste iako `lib/sectionPages.ts` već postoji; 2 stranice ručno pišu robots blok i gube `max-image-preview:large` (autor stranice — bitno za Discover); og/* rute nemaju timeout na fetch.
- 🟡 **D10 — sitne logičke:** verify-email nastavlja pollati i poslije uspjeha (komentar tvrdi suprotno); CartContext ima prozor od jednog frejma u kojem mount pregazi snimljenu korpu; pad `/auth/me` na cold-loadu tretira ulogovanog kao gosta bez retrya (redirect na /login s validnim tokenom); giveaway leaderboard pollira 30 s i kad je tab skriven (Header to ispravno radi — obrazac postoji); CookieConsentBanner piše preferences golim fetchom mimo interceptora; owner provjera profila je case-sensitive na username iz URL-a.
- 🟢 **Provjereno čisto:** localStorage svuda guarded JSON.parse; svi countdown intervali se čiste; Echo singleton sa SSR guardom i lazy importom; teški editori/mape/video iza dynamic importa (tiptap, leaflet, hls.js); SearchDropdown debounce+abort; SWR global revalidateOnFocus off; analytics proxy s allowlistom; instrumentacija GlitchTip obje strane; nema middleware fajla = nula per-request troška (CLAUDE.md ga i dalje opisuje — drift).

### E. DISCORD BOT (Professor Buffy)

**Opšta slika: temeljna higijena dobra** — ready-once start (nema duplih intervala na reconnect), global unhandledRejection/uncaughtException, svi API pozivi s 10 s timeoutom i safe defaultom (pad backenda degradira tiho, bez crash-petlji), restart ne re-postuje vijesti, rename kanala unutar Discord limita, XP kontrakt bot↔backend zdrav (limiti se sprovode na backendu kroz isti `XpService` kao web ✓).

- 🟠 **E1 — Sav promet bota ide kroz Cloudflare.** `API_URL=https://techplay.gg/api/v1` (provjereno u .env na serveru) — bot na istoj mašini kao backend zove sam sebe preko interneta i CF-a. S upaljenim CF AI bot kontrolama (26.08.) i CF edge pravilom „api/v1/news cache 1 min" u putanji dedup logike, jedno pooštravanje CF-a tiho ubija bota (poznato iz ranije: fight mode bi ga ubio). Treba interni URL (127.0.0.1:8000 s Host headerom, kao mjerenja) ili bar api-beta.
- 🟠 **E2 — Backendov globalni limit 60/min po IP-u važi i za bota i pregazi deklarisanih 300/min.** Bot se ne autentifikuje kao Sanctum korisnik niti šalje interni token → pada u kantu po IP-u (`AppServiceProvider.php:100`), a ruta-grupni `throttle:300,1` se samo slaže preko tog užeg. U aktivno veče (XP POST po korisniku/min + presence + autocomplete) sve zajedno može u 429 — a **429 na `/discord/daily` bot korisniku prijavi kao „već si iskoristio danas"** (backend legitimni „already claimed" je također 429 — nerazlučivo). `ApiService.ts:358`, `bootstrap/app.php:55`.
- 🟠 **E3 — Bot i dalje nema deploy put.** `techplay-deploy.sh` builda backend i frontend; discord/ se samo chown-uje — nikad `npm install`, build ni restart. Danas `dist/` odgovara `src/` (provjereno mtime na serveru), ali samo zato što je neko ručno buildao 24.08. Prvi zaboravljeni ručni build = bot vrti stari kod bez ikakvog znaka.
- 🟠 **E4 — Moderacija briše nevine poruke substring matchom.** `content.includes(word)` s riječima poput `spic`/`coon`/`fag` → „spicy", „tycoon", „raccoon" se brišu uz DM upozorenje; `discord.gg/` briše i linkove na VLASTITI server. Uz to, obrisana poruka svejedno dobije XP (moderacija i XP su nezavisni listeneri). `events.ts:20-34,106`.
- 🟡 **E5 — logika s manama:** presence throttle je izvrnut (isti state se ponovo šalje svakih 30 s pod šumom, a promjena statusa se ne throttluje nikad — `events.ts:148`); ako je backend nedostupan pri startu, taj feed ostaje mrtav do restarta (`lastCheckedId=0` filter — `PollingService.ts:143`); SubscriptionService je **drugi, paralelni** news-detektor (5 min, vlastiti dedup) uz PollingService (10 min + push) — i DM-blasta staru vijest ako se najnovija obriše (ID padne = „novo"); „Member of the Week" broji fiktivnih 15 XP umjesto stvarno dodijeljenog (`xp_awarded` se ignoriše — poslije dnevne kape naduvava), stanje je in-memory (restart = „No active members"), a reset sedmice ne opali ako recap kanal fali; StatusService na svaku prolaznu grešku javno pokaže **„Maintenance 🔧"** i troši 45 req/h na status liniju; overtake najave slijeću u kanal u kojem je poruka slučajno bila.
- 🟡 **E6 — mrtvo/šum:** `TriviaService` i `ChallengeService` iz CLAUDE.md **ne postoje u kodu** (drift dokumentacije); `getUserProfile` bez pozivaoca; achievements grana mrtva (backend uvijek vraća `[]`); dep `he` bez importa; `RECOMMENDATIONS.md` je predprojektni pitch; **avatar `buffy-avatar.png` ne postoji** (provjereno na serveru: 404) — thumbnail na skoro svakom embedu je slomljen; hardkodirano „332,000 games" na 2 mjesta; ServerStats radi pun `guild.members.fetch()` svakih 10 min za brojeve koje ima u kešu; komandni dispatch bez try/catch (istekla interakcija = „application did not respond"); `/subscribe` uski race na bootu; subscribe piše lokalni keš prije i bez obzira na uspjeh backenda.

### B. BACKEND (Laravel) — servisi, jobs, observeri

**Opšta slika:** ekonomija (bounty/quest/streak/XP) je transakciono ispravna s lockovima i idempotencijom ✓; store-integracije (Steam/PSN/Epic/GOG/Xbox) imaju timeoute, retry s `throw:false` i kill-switch flagove ✓; globalni HTTP floor (10 s / 3 s connect) pokriva facade pozive ✓; `env()` disciplina čista (nula poziva van config/) ✓; DM privatnost na WS potvrđeno popravljena i backend-side (privatni kanali s autorizacijom) ✓; XP kapa i cooldown žive na tačno jednom mjestu (`XpService`) i Discord ide kroz ista vrata ✓.

- 🔴 **B1 — ArticleObserver registrovan DVAPUT → svaka objava okida dupli fanout. Potvrđeno u produkcijskim podacima.** Registracija u `AppServiceProvider.php:156` **i** u `Article::booted()` (`Article.php:110`) — Laravel ne deduplira. Posljedica po objavi: dupla revalidacija, dupli sitemap-news, dupli IndexNow, **dupla notifikacija svakom trackeru/wishlisteru**, **dupla Discord objava** (bot `announce()` prvo postuje pa tek onda bilježi ID — `PollingService.ts:117-121`, nema guarda za isti ID), i **dupla isplata autoru** — `rewardAuthor()` zove BountyService **bez reference** pa dedupe ne važi. Ledger to potvrđuje: `bounty_transactions` ima „Article published: GTA 6 gameplay…" **2× po 38, u 23:51:21 i 23:51:22 (27.08.)**. Živo od 20.06. (isti commit dodao obje registracije). Popravka: obrisati jednu registraciju + dati bountyju referencu `article:{id}:published`.
- 🔴 **B2 — Zakazano objavljivanje (`articles:publish-scheduled`, svake minute) zaobilazi SVE efekte objave.** Bulk `Article::whereIn()->update()` ne okida observere → nema čišćenja keša, nema revalidacije, nema sitemapa, nema IndexNow, nema Discord objave, nema notifikacija, nema bountyja. Vlastiti fallback čita `services.revalidate.token`/`url` — **ključevi ne postoje** (postoji samo `revalidate.secret_token` — provjereno u config/services.php:162) pa se blok nikad ne izvrši; a i da se izvrši, šalje `path` purge koji je no-op. Zakazani članak stigne do čitalaca kad TTL slučajno istekne. `PublishScheduledArticles.php:28-56`.
- 🟠 **B3 — Dva sistema prazne iste ad brojače → brojevi kampanja klize.** `FlushViewCounters` (*/5 min, atomski GETDEL) **i** `ads:sync-metrics` (po satu, neatomski GET→increment→DEL) prazne iste `views:ad:*`/`clicks:ad:*` ključeve. Race: isti delta upisan dvaput, ili klikovi zauvijek izgubljeni — tačno ono zbog čega je GETDEL uveden (piše u docblocku joba). Monetizacijske brojke. Jedan od dva mora otići (redundantan je `ads:sync-metrics`).
- 🟠 **B4 — Mail-only notifikacije = tihe crne rupe dok pošta ne radi.** `GiveawayWinnerNotification`, `GiveawayReminderNotification` i `WeeklyDigestNotification` idu **samo** kroz `['mail']` → **dobitnici giveawaya ne saznaju da su dobili** (nema database zvona kao fallback); digest petkom u 16:00 uredno „radi" i ne isporuči ništa. Uz već poznato: verifikacija i reset lozinke mrtvi — a `users:prune-unverified` **briše neverifikovane poslije 30 dana**, pa je registracija bez mogućnosti verifikacije garantovan gubitak naloga. Minimalna zaštita dok pošta ne proradi: dodati `database` kanal na sva tri.
- 🟠 **B5 — Deploy i dalje ima dva puta, i stari je opasan.** `push_and_deploy.ps1:23` zove **stari `deploy.sh`** (bez vraćanja vlasništva, builda frontend kao root) umjesto `techplay-deploy.sh` — tačno ono što je jučerašnja podjela vlasništva učinila pogrešnim. Oba skripta migriraju prije restarta ✓, pa je incident od 23:51 mogao nastati samo ručnim pull+restartom mimo skripta; dodatna mina: worker se sam reciklira svakih sat (`--max-time=3600`) — **svaki `git pull` bez momentalne migracije naoruža prozor kod↔šema i bez ičijeg restarta**.
- 🟠 **B6 — Povlačenje objavljenog (`published → draft`) ostavlja stranicu živu svuda.** `ArticleObserver::saved` izlazi odmah ako status nije `published` — nema grane za unpublish: Redis ključ ostaje, listinzi ostaju, Next tag se ne čisti (a članci su `revalidate=false` — samo on-demand). Ista klasa greške kao brisanje popravljeno 19.08, jedan status lijevo. Guides identično.
- 🟠 **B7 — Blizzard pool ruši analizu umjesto da degradira.** `Http::pool` za connect-fail vraća exception objekat; kod zove `->successful()` na njemu → `\Error`, a `catch (\Exception)` ga ne hvata → 500 tačno u scenariju za koji su null-ovi dizajnirani. `BlizzardService.php:666-680`. Popravka: `instanceof Response` ili `catch (\Throwable)`.
- 🟠 **B8 — Discord/Battle.net OAuth bez timeouta na login putu.** Socialite koristi vlastiti Guzzle (default timeout 0 = čekaj zauvijek), globalni floor pokriva samo `Http` facade — zastoj discord.com/battle.net drži Octane workera beskonačno. `AppServiceProvider.php:198-212` ne prosljeđuje guzzle opcije.
- 🟠 **B9 — IndexNow postoji na PET mjesta, s dva različita ključa (uživo potvrđeno: env 22 znaka ≠ baza 34 znaka).** Job `SubmitIndexNow` (ključ iz site_settings + gate) šalje `host`=api-beta a URL-ove s techplay.gg — kombinacija koju je mrtvi `IndexNowService` (nula pozivalaca!) dokumentovano popravio, ali popravka nikad nije stigla u živi put; inline kopije u Article/Guide/Game observerima čitaju env ključ bez gatea. Povrh svega `ContentObserver` submituje na SVAKI save objavljenog članka (svaka izmjena troši kvotu), i mapira sve ne-review u `/news/` — tech članci se prijavljuju kao URL koji 404-a. Konsolidovati na job, obrisati ostala četiri.
- 🟠 **B10 — Jedan queue, jedan worker: „real-time" čeka iza batch poslova.** Svi eventi su queued broadcast (dobro — nema HTTP-a ka Reverbu u requestu), ali sve dijeli jedan `default` red i jednog workera. `EnrichSteamBatch` sam drži workera ≥37 s svake minute (25 × 1,5 s sleep, samo-lančanje), library sync 120–300 s — chat poruka ili forum reply broadcast dispečovan iza toga kasni desetine sekundi do minuta. Jeftina popravka: broadcasts + fanout na `high` queue, worker `--queue=high,default`.
- 🟠 **B11 — Library sync zaglavljen u `syncing` je zauvijek isključen iz resynca.** Nijedan od 5 `Sync*Library` jobova nema `failed()` — timeout kill (realan: jedan achievement poziv po odigranoj igri pod `$timeout=120`) ostavlja `sync_status='syncing'`, a `platforms:resync` takve **trajno preskače** (`whereNotIn('syncing',…)`). Korisnikova biblioteka prestane da se osvježava bez ikakvog znaka.
- 🟡 **B12 — media WebP pipeline tiho ugašen + dva nekompatibilna sistema varijanti.** `intervention/image` NIJE u composer.json → `ImageOptimizationService::available()` false → svaki upload preskoči konverziju, `webp_path` ostaje null zauvijek — dok paralelno postoji drugi, GD-bazirani `ImageOptimizer` s drugačijom šemom sufiksa. Jedan od dva treba biti Pipeline, drugi obrisan (ili paket instaliran).
- 🟡 **B13 — sitnice s posljedicama:** giveaway reminderi hvataju samo 2 h prozor na 6 h kadenci → **2/3 giveawaya nikad ne dobije podsjetnik**; re-publish ponavlja cijeli „prvi put objavljeno" paket (notifikacije bez dedupe, Discord, bounty — treba `first_published_at` latch); PayPal token se ne kešira (2 runde po operaciji) i `captureOrder` šalje Guzzle opcije kao TIJELO zahtjeva (radi jer PayPal ignoriše nepoznata polja); Google sitemap ping mrtav od 2023 (404); WoW analiza je sadržajno **zamrznuta na mart 2026** (deadline u prošlosti → vječno „0 days left", prošlosezonski afixi u promptu); comment toast linkuje na `/articles/{slug}` — ruta ne postoji (404); presence broadcast ide na **javni** kanal bez privacy gatea i šalje se i kad se ništa nije promijenilo (svake 2 min po igraču); guide keš ima mrtvu duplu mašineriju u `Guide::booted()` + invalidacija pokriva samo prvih 5 stranica (products i gta6 ista klasa — articles je to riješio registrom, ostali nisu migrirali); stock restore pri otkazivanju ide query-builderom → ProductObserver ne opali → keš/broadcast ne vide vraćene zalihe; 11 `igdb:*` komandi uklj. destruktivne `igdb:merge/import/revert` i `CrawlIgdbBatchJob` (dispečovan ničim) i dalje izvršivi nad kanonskim katalogom; fantomska policy mapa `News::class` (model ne postoji); pet paralelnih TEXT[] parsera (kanonski cast + 4 kopije od kojih 2 naivne pucaju na zarezu u vrijednosti); mrtvi config blokovi (openai, gemini, mobygames, rawg, giphy, recaptcha-koji-nije-turnstile); `games:enrich-wikidata` i `seo:scan-links` postoje i rade a nisu ni u scheduleru (scan-links jeste u root cronu — vidi A2.1); CLAUDE.md lista jobova zastarjela (MobyEnrichmentJob/FetchOgData/SendChatReminder ne postoje).
- 🟢 **Scheduler higijena:** svih 22 zakazane komande postoje ✓; kritični dugotrajni poslovi imaju `withoutOverlapping` ✓; sitemap split (content/catalogue s odvojenim mutexima i prune samo na punom) potvrđen ✓; queue `retry_after=1200` > najduži timeout ✓; `Queue::failing` → admin zvono ✓; FlushViewCounters GETDEL + put-back ✓.
- 🟢 **B23 — test suite: 941 prolazi, 7 preskočeno, 3.249 assertions, 0 padova** (pokrenuto lokalno tokom analize, in-memory SQLite, 24 min). Suite je stvaran i zelen — ali ga **deploy ne vrti** (provjereno u obje skripte) i ništa ga ne vrti automatski: zelenilo zavisi od discipline. Napomena uz to: dev N+1 guard ne pokriva single-model putanje (Laravel štampa lazy-load prekršaj samo pri hidraciji >1 modela), pa nalazi tipa B19 prolaze i testove i dev.

#### B-HTTP — rute, kontroleri, request path

**Zlatni negativan rezultat: nijedan slomljeni poziv.** Svaki frontend i bot poziv (axios, SWR, raw fetch, next.config, bot ApiService) mapiran je na postojeću rutu s ispravnom metodom — uključujući zamke (POST sa `_method=PUT`, provider grananja, build-time `/redirects`). Redoslijed ruta ispravan (calendar/day prije {slug} itd.), rate limiting s internim SSR izuzetkom ✓, middleware stack bez DB poziva po requestu ✓, svaki Redis touch u request pathu je try/catch ✓.

- 🔴 **B14 — Draft i zakazani guide-ovi su JAVNO dostupni.** `GuideController::index` i `::show` nemaju `where('status','published')` ni `published_at` gate (status se samo SELECT-uje — provjereno; model nema global scope). Svaki drugi čitalac guide-ova filtrira (newsroom, game articles, sitemap, author). Bilo ko može listati i čitati neobjavljene guide-ove na `/guides` i `/guides/{slug}`. `GuideController.php:35-89`.
- 🟠 **B15 — Guide keš: piše se v3, briše se v2.** Kontroler snima `guides.index.v3.*` i uredno registruje ključeve, observer briše `guides.index.v2.*` (verzija iza!) i nikad ne zove `forgetListings('guides')` — registar je write-only. Izmijenjen/obrisan guide ostaje u listingu do TTL-a. Uz to `guide.show.v3.{slug}` je ručno ispisan na tri mjesta — doslovno obrazac iz incidenta 19.08. koji je CLAUDE.md zabranio za članke, živ za guides. `GuideController.php:25` vs `GuideObserver.php:122` (potvrđeno grepom).
- 🟠 **B16 — Forum gameThreads keš miješa publike.** `forum.game_threads.{slug}` ključ NE sadrži publiku, a upit unutra filtrira `visibleTo($viewer)` — ko prvi promaši keš, fiksira vidljivost za sve na 60 s (staff request kešira privatne board-ove gostima). Susjedne metode (categories/active/unanswered) ključaju po publici upravo zbog ovoga. `ForumController.php:599-601`.
- 🟠 **B17 — Bez `Accept: application/json` API vraća 500/HTML umjesto 422/JSON.** Nije registrovan `shouldRenderJsonWhen` — ValidationException na api ruti bez headera pokuša redirect sa sesijom koje nema → „Session store not set" 500. Jedan red u bootstrap/app.php rješava.
- 🟠 **B18 — Dupli kontroleri koje je vlastiti kod već osudio:** News/Review/Tech su tri strukturno identične kopije s već vidljivim driftom (news show ukešira 20 komentara u 1 h keš — mrtva težina jer frontend komentare vuče posebno; search ima samo news; Cache-Control različit) — a `NewsroomController` u komentaru piše namjeru „jedan endpoint umjesto tri koja driftuju". **TechPlay score se računa na dva mjesta** s različitim keširanjem (GameController vs GameRatingController — stranica igre i widget mogu pokazati različit skor).
- 🟠 **B19 — request-path trošak:** `FeedController::personalized` po svakom requestu povlači 400 redova i boduje ih u PHP-u, bez keša; `ForumController::categories` učitava CIJELU threads tabelu s autorima da uzme po jedan red po boardu (raste linearno s forumom; rebuild svakih 60 s × 3 publike); N+1 kroz `CommentAuthorResource::is_staff` (roles upit po redu komentara — do 185 redova po stranici; fix: eager `user.roles`); `CalendarController` dekoriše mjesec neukeširanim GROUP BY po ~1.100 slugova po requestu.
- 🟡 **B20 — brisanje naloga ne briše avatar fajl:** avatar_url je apsolutni URL, a cleanup preskače sve što počinje s `http` → čuvar nikad ne matchuje avatare; „obrisani" nalozi ostavljaju sliku javno na disku. `AuthController.php:547,774-777`.
- 🟡 **B21 — ~28 kandidat-mrtvih ruta** (bez ijednog pronađenog potrošača): /auth/refresh (frontend sam kaže da je neupotrebljiv), /rewards + /rewards/redemptions, /support/mine, /me/reading (writeri se koriste, čitalac nikad sagrađen), /friends + /friends/activity, wow set-main/delete, conversations read/participants, users trophy-case (embedovan u profil), presence GET/POST/DELETE (samo bot POST živ), wow analysis show/share, games hub/{type}/{value} (facet stranice idu na /games?genres=), 5 × games/{slug}/podresursi (bundle ih zove kao PHP metode), articles/{slug}/views, categories/{slug}, authors/{slug}/articles, gta6 vehicles/weapons show (detail stranice ne postoje), seasons index, page-seo index, game-lists/tags, journal addMoment (UI briše momente a nikad ih ne kreira — polusagrađena stvar), forum restoreThread, last-disc/export, webhooks/discord/notify, cijela /seo/* grupa (4 rute — SeoController bez ijednog pozivaoca!). Plus mrtvi handleri bez ruta: SettingsController::grouped, DiscordAdminController::getActiveEvent (bot može STARTOVATI event a niko ga ne može pročitati), TrackingController::getCategoryPath.
- 🟡 **B22 — konzistentnost:** ApiResponse trait (pravilo iz CLAUDE.md) ne koristi **41 od 87 kontrolera** uključujući tri najveća; raw model/paginator returns na Shop/Guide/PageSeo (ista klasa rizika koja je već jednom procurila email na forumu — dokumentovano u ForumThreadCardResource); inline SMTP u request pathu (contact/newsletter — throttle ograničava, ali spor relay = 10-30 s request); RSS se gradi po requestu bez keša i s neescapovanim enclosure URL-om (`&` u URL-u = nevalidan XML); 7 × `Cache::forget("forum.thread.{slug}")` za ključ koji se nigdje ne piše (+ `news.trending` isto); CSRF except lista drži obrisanu rutu; GameRating destroy ne invalidira taste profil (upsert invalidira).

### F. BAZA PODATAKA (schema) — statička analiza + živa provjera

- 🟠 **F1 — games hub je ostao bez svojih indeksa poslije rebuild-a.** Parcijalni `games_hub_*` indeksi grade se uz `WHERE description IS NOT NULL`, a hub upit **više nema taj filter** (katalog je s ~187k opisanih narastao na 332k ukupno) — uz to je vodeći ORDER BY izraz (demote kompilacija) neindeksabilan, `released` nema pun indeks, a `rating ASC` btree ne može servirati `DESC NULLS LAST`. Svaka kombinacija filtera/sorta plaća scan+sort na 332k redova svakih 5 min keša. Danas prigušeno keširanjem (nije u top 12 DB troškova), ali je strukturno pogrešno i skalira loše. `GameController.php:200-247`, migracija `2026_08_07_000002:144-147`.
- 🟠 **F2 — naslijeđe „četiri generacije performance indeksa": dupli indeksi potvrđeni UŽIVO.** Čišćenje 18.08. sredilo je samo articles. Živo stanje: `comments` 11 indeksa (user_id ×3: `idx_comments_user`+`comments_user_id_index`+`idx_comments_user_id`; morph ×4 preklapajuća), `posts` 11 (thread ×3, author ×3, created ×2), `threads` **22 indeksa** (author ×3, category kompoziti ×4+2, slug unique+obični, pinned ×2…), `categories` 9 (parent ×2, type ×3). Na tabelama koje primaju svaki korisnički upis — čist porez na write bez read koristi. Bezbjedna drop lista se pravi iz `\di` + sedmičnih snapshotova (alat već postoji — A2).
- 🟡 **F3 — tabele bez ikakvog prunanja (danas malene, rastu zauvijek):** `personal_access_tokens` 320 (tokeni logički ističu za 7 dana, redovi nikad — `sanctum:prune-expired` nije zakazan), `notifications` 242, `player_signals` 9, `session_suggestions` 1, `content_versions` 65 (pun snapshot sadržaja na svaki save, bez capa), `failed_jobs` (nema `queue:prune-failed`), + `queue_monitors` 10.502 (C5). Ništa ne gori — ali nijedna nema put prema dolje.
- 🟡 **F4 — mrtve tabele i polumrtve kolone:** `forum_categories` (0 redova; FK davno prebačen na categories, Filament resurs već koristi Category model), `subscription_plans` (0 redova, nula referenci — PayPalPlanSeeder piše support_tiers), `queue_monitor_failure_groups` (2 reda, pisač nepostojeći u app kodu), `articles.language` (sve 'hr', indeksirana), `users.role` legacy kolona — **i dalje se piše pri registraciji i čita u AdminAlert** uprkos Spatie migraciji (dvostruki autoritet — upravo obrazac koji je docs/76 №11 čistio na admin panelu).
- 🟡 **F5 — dizajn-dug s upaljenim fitiljem:** `user_achievements` bez unique constrainta uz check-then-insert dodjelu (danas 0 duplikata — provjereno; race čeka prvi sudar nightly synca i inline granta); `game_ratings` čitanja i dalje ključana po **`game_slug` stringu** (unique je user+slug; FK `game_id` postoji i popunjen je — 0 NULL — ali ga čita samo purge; preimenovanje sluga i dalje siječe ratinge sa stranice); `comments.parent_id` FK se u SQLite testovima tiho ne kreira (cascade nikad testiran); `gta_locations.categories` je `json` kveriran s `whereJsonContains` (ista stvar koju je notifications post-mortem pretvorio u jsonb).
- 🟡 **F6 — GDPR rep:** brisanje naloga i dalje ne dira `last_disc_signatures` (ostaje **pravi e-mail** vezan uz anonimizovan nalog) ni `giveaway_entries.ip_address/user_agent`. Izvoz (novi GDPR export) pokriva više nego brisanje. Ista klasa buga kao gamertags — treći put.
- 🟡 **F7 — sitno:** `DatabaseSeeder` drži produkcijski izgledajuću admin lozinku u plaintextu u gitu (hashira se pri insertu, ali stoji u istoriji); `File::put` sitemapa nije atomski (kratki prozor okrnjenog fajla za crawler).
- 🟢 **Provjereno čisto:** rename fallout NULA (nijedna referenca na genre_names/platform_names/background_image/moby_id kroz sva tri koda) ✓; novac svuda `decimal` ✓; TEXT[] disciplina kroz `PostgresArray` cast ✓; fulltext indeksi se poklapaju s upitima ✓; slug unique svuda gdje route binding treba ✓; polimorfi s kompozitnim indeksima ✓; `migrate:fresh` redoslijed ispravan (svih 224 replayano) ✓; nedavne correctness migracije (bounty idempotencija, orders lowercase, comments orphan cleanup) zdrave ✓.
- 📄 **docs/07-database-map.md je ozbiljno zastario** — dokumentuje obrisane tabele (reviews, editorial_*), pogrešna imena kolona u ~20 tabela (friendships, messages, giveaway_entries, quests…), a ne pominje ~35 novijih tabela (cijeli profile/journal/social sloj). Tri različita broja igara u opticaju (CLAUDE.md 142k, docs/07 200k, memorija 187k) — stvarno: **332.455**.

### G. PRESJEK — dupli sistemi kroz cijeli stack

Ovo je odgovor na centralno pitanje analize: „ima li duplih sistema koji rade isti posao". Ima — evo kompletne liste, rangirane po šteti:

| # | Sistem | Kopije | Šteta danas |
|---|---|---|---|
| 1 | **Objava članka (fanout)** | ArticleObserver registrovan 2× | 🔴 Dupli bounty (dokazano u ledgeru), dupla Discord objava, duple notifikacije — svaka objava od 20.06. |
| 2 | **Ad brojači** | FlushViewCounters + ads:sync-metrics prazne iste ključeve | 🟠 Monetizacijske brojke klize (dupli upis ili izgubljeni klikovi) svaki sat |
| 3 | **IndexNow** | 5 implementacija, 2 različita ključa (uživo!) | 🟠 Glavni put šalje odbacive payloade; svaka izmjena troši kvotu; tech članci prijavljeni kao 404 URL |
| 4 | **Detekcija novih vijesti u botu** | PollingService (10 min + push) + SubscriptionService (5 min, vlastiti dedup) | 🟠 Dva stanja istine; DM blast na obrisanu vijest; propušteni stacked publishi |
| 5 | **Notifikacije korisniku (frontend)** | Header polling (60 s) + kompletan mrtvi push sistem (6 hookova) | 🟠 Reverb se plaća, notifikacije idu pollingom; mrtvi kod čeka da zbuni |
| 6 | **Deploy** | techplay-deploy.sh (novi, ispravan) + deploy.sh (stari, builda kao root) — **Windows wrapper zove stari** | 🟠 Jedan pogrešan deploy = root fajlovi u techplay stablu, tihi pad sljedećeg builda |
| 7 | **Slike (backend pipeline)** | ImageOptimizationService (mrtav — paket nije instaliran) + ImageOptimizer (GD, druga šema sufiksa) | 🟡 WebP konverzija tiho ugašena; dva nekompatibilna sistema varijanti |
| 8 | **TEXT[] parsiranje** | PostgresArray cast (kanonski) + 4 kopije (2 naivne) | 🟡 Naivne pucaju na zarezu u vrijednosti — čekaju pravi žanr s zarezom |
| 9 | **XP → level matematika** | backend LevelService + lib/level.ts + Header računa lokalno | 🟡 Drift VEĆ živ: Header vs ProfileHero mogu pokazati različit level |
| 10 | **Relativno vrijeme (frontend)** | lib/timeAgo + 2 lokalne kopije + date-fns + goli toLocaleDateString | 🟡 Već se razlikuju u ispisu |
| 11 | **SWR fetcher** | ~40 lokalnih definicija s različitim unwrapovima | 🟡 Recept za crash na tuđem obliku odgovora |
| 12 | **Modali (frontend)** | ui/Dialog + ui/Sheet + 9 ručnih overlaya | 🟡 z-index 30–9998, fokus/scroll riješeni nasumično |
| 13 | **API base URL (frontend)** | 4 mjesta | 🟡 og rute već odlutale na nepostojeći domen |
| 14 | **PayPal integracija** | shop (server-side order, COD-only) vs support (client-side order + server verifikacija) | 🟡 Dva obrasca; shop PayPal grana mrtva a izgleda živa |
| 15 | **DB indeksi** | 4 generacije „performance" migracija | 🟡 threads 22 indeksa, comments/posts po 11 — porez na svaki upis |
| 16 | **PM2 daemoni** | techplay (pravi) + root (prazan, 60 MB) | 🟡 Ostatak migracije |
| 17 | **robots meta (frontend)** | ROBOTS_INDEX helper + 2 ručne kopije | 🟡 Autor stranice gubi max-image-preview:large |
| 18 | **error.tsx** | 13 bajt-identičnih kopija; sekcije koje stvarno bacaju nemaju nijedan | 🟡 Naopaka pokrivenost |
| 19 | **Uprava keš ključeva za guides/products/gta6** | živa (observer) + mrtva (Guide::booted petlje) | 🟡 Mrtva mašinerija zbunjuje; živa pokriva samo 5 stranica |
| 20 | **users.role** | Spatie role + legacy kolona koja se i dalje piše i čita | 🟡 Isti dvostruki autoritet koji je docs/76 čistio na canAccessPanel |

**Šta je provjereno i NIJE duplo (jedna istina):** XP dodjela i limiti (XpService, Discord kroz ista vrata) ✓ · view counteri (Redis bafer → jedan flush job) ✓ · revalidacija poslije merga 18.08. (jedan servis) ✓ · sitemap raspored poslije 28.08. (split s odvojenim mutexima) ✓ · sanitizacija ima jedan servis (rupa je samo admin-edit put — C6) ✓ · keš ključevi članaka (CacheService, jedno mjesto) ✓.

#### G1. Keš slojevi — matrica invalidacije

Pet slojeva: **Cloudflare → nginx proxy_cache → Next (ISR/tagovi) → Redis (response) → per-komponenta**. Ko koga čisti pri kojoj promjeni:

| Događaj | Redis | Next tagovi | nginx | Cloudflare | Ishod |
|---|---|---|---|---|---|
| Članak: objava/izmjena kroz admin | ✓ | ✓ | n/a | n/a | ✅ radi (ali 2× — B1) |
| Članak: **zakazana objava** | ✗ | ✗ | n/a | n/a | 🔴 ništa (B2) |
| Članak: **unpublish** | ✗ | ✗ | n/a | n/a | 🟠 ostaje živ (B6) |
| Igra: izmjena/brisanje | ✓ | n/a (force-dynamic) | **✗ (1 h TTL)** | ✓ | 🟠 stale do 1 h (D2) |
| Guide/Product/GTA6 | djelimično (5 str.) | GTA6 no-op | n/a | n/a | 🟡 rupe (B13, D9) |
| Hardware index | n/a | tag `hardware` niko ne šalje (spašava path purge) | n/a | n/a | 🟡 (D9) |

#### G2. Alarmi — ko šta javi čovjeku

| Kanal | Stanje | Šta stvarno stigne |
|---|---|---|
| Telegram | ✅ radi | SAMO backup skript (direktno) + Laravel telegram kanal (s dedupom) |
| Mail | ❌ DNS ne postoji | ništa — a o njega su okačeni: verifikacija, reset lozinke, giveaway dobitnici, digest |
| GlitchTip | skuplja, ne javlja | `consolemail://` — greške se gomilaju nečitane |
| Healthcheck | ✅ 5 min | govori samo pri promjeni stanja ✓ (ne prati logrotate — A2.2) |
| Admin zvono | ✅ | pali queue failovi |
| Bot status | ⚠️ | na svaku prolaznu grešku javno pokaže „Maintenance 🔧" (E5) |

Zaključak: postoji šest sistema a **jedina pouzdana žica do čovjeka je Telegram, i na njoj visi samo backup**. Incident od 27.08. (slomljen upis članaka ~7 h) prošao je nečujno kroz svih šest.

#### G3. Brojevi kataloga — tri istine

CLAUDE.md: 142.110 · docs/07: „200.000 istorijskih" · memorija: ~187,7k · bot hardkodirano: „332,000" · **stvarno: 332.455 (305.581 s opisom)**. Dokumentaciju treba svesti na jedan izvor (ili broj maknuti iz dokumenata i čitati ga iz baze).

---

## REDOSLIJED KOJI PREDLAŽEM (ništa nije dirano — ovo je lista za odluku)

### P0 — šteti već sada, popravke su male → **SVE URAĐENO 29.08.2026** (detalji na kraju dokumenta)
| | Nalaz | Popravka | |
|---|---|---|---|
| B1 | Dupla registracija ArticleObservera (dupli bounty/Discord/notifikacije na svakoj objavi) | jedno mjesto registracije + bounty referenca `article:{id}:published` | ✅ |
| B-C1 | RewardLedger singleton pod Octane-om (cross-user curenje nagrada) | `singleton()` → `scoped()`, uz provjeru da ga Octane i queue stvarno prazne | ✅ |
| B2 | Zakazane objave bez ikakvog fanouta | update po modelu umjesto bulk; mrtvi fallback obrisan | ✅ |
| B14 | Draft/zakazani guide-ovi javni | `scopePublished()` + popravljen keš i revalidacija pri povlačenju | ✅ |
| B3 | Dva sistema prazne ad brojače (brojke kampanja klize) | `ads:sync-metrics` uklonjen iz schedulera i obrisan | ✅ |
| B4 | Dobitnici giveawaya ne saznaju da su dobili (mail-only) | `database` kanal na 3 notifikacije + popravljen ugovor payloada | ✅ |
| C1 | Prva narudžba u adminu = 500 (v5 klase + refunded match) | `Filament\Actions\*` + `default` grana + filter | ✅ |
| B5 | `push_and_deploy.ps1` zove stari deploy.sh (root build) | retarget + stari skript penzionisan + vraćene 5 zaštita frontend deploya | ✅ |

### P1 — **URAĐENO 29.08.2026** (detalji u odjeljku niže), osim restarta servera
Ostaje samo: **restart zbog kernela** (čeka 6.8.0-138) — traži dogovor oko trenutka jer nosi prekid, i **Discord/Battle.net kredencijali**, po dogovoru odgođeni za kraj.

<details><summary>Originalna P1 lista</summary>
Admin: ReleaseCalendar badge keširati (C2) · `pending_review`→`ready_for_review` (C3) · `Closure $set` TypeError (C4) · `filament-jobs-monitor:prune` u scheduler (C5). Backend: guide keš v2/v3 + forgetListings (B15) · gameThreads ključ po publici (B16) · `shouldRenderJsonWhen` (B17) · Blizzard pool `Throwable` (B7) · Socialite guzzle timeouti (B8) · broadcasts na `high` queue (B10) · `failed()` na 5 sync jobova + odglaviti `syncing` (B11). Frontend: fallback naslovnice da ne objavi prazno (D1) · nginx purge za /games pri izmjeni (D2) · kontakt forma kroz serverHeaders (D5). Server: scheduler + SEO cron van roota (A2.1) · sutra provjeriti logrotate (A2.2) · Redis swappiness (A6.1) · **restart zbog kernela — sada čeka -138** (A9). Bot: interni API URL umjesto Cloudflarea (E1) · deploy korak za bota u skripti (E3) · moderacija na word-boundary (E4) · buffy-avatar.png ili maknuti referencu (E6).

</details>

### P2 — **VEĆINOM URAĐENO 29.08.2026** (vidi odjeljak niže). Neurađeno i zašto: mrtve rute i WoW komponente — obrazloženo tamo.

<details><summary>Originalna P2 lista</summary>
IndexNow → jedan job, jedan ključ (B9) · sitemap: `indexable` kolona + keyset paginacija (A5.2) · indeks na `studios.parent_id` (A5.3) i `LOWER(games.name)` (A5.4) · odluka o `igdb_raw`: preseliti/isključiti iz dumpa/prihvatiti (A5.1+F1) · drop lista duplih indeksa iz `\di` + sedmičnih snapshotova (F2) · unpublish grana u observerima (B6) · giveaway reminder prozor (B13) · re-publish latch (B13) · čišćenje ~28 mrtvih ruta (B21) i mrtvog frontend koda (D8) · news/reviews/tech konsolidacija + TechPlay score na jedno mjesto (B18) · shop: metadata + KM/EUR odluka + mrtva PayPal grana (D3, D4) · GDPR rep: `last_disc_signatures` + avatar fajl pri brisanju (F6, B20) · media pipeline: jedan sistem slika (B12) · WoW analyzer sadržajno odmrznuti (B13).

</details>

### P3 — higijena
docs/07 prepisati (F-drift) · CLAUDE.md osvježiti (brojevi, jobs lista, middleware.ts, TriviaService/ChallengeService, ImageService) · root PM2 ugasiti (A8) · /var/www ostaci (A7.1) · open-vm-tools/vgauth/apport disable (A8) · HOME za octane (A4.1) · reverb.log u logrotate (A2.3) · netdata auto-update odluka (A2.4) · error.tsx/loading.tsx raspored (D9) · SWR fetcher + timeAgo + modali konsolidacija (D7) · ApiResponse trait dosljednost ili ukidanje pravila (B22).

---

# ŠTA JE URAĐENO — 29.08.2026 (P0)

Sve ispod je izmijenjeno, testirano lokalno (puni suite) i deployovano. Redoslijed je iz P0 liste.

### 1. Objava se više ne dešava dvaput — i plaća se jednom

`ArticleObserver` je bio registrovan na dva mjesta: u `AppServiceProvider` i u `Article::booted()`. Laravel **ne deduplira** — dodaje slušaoca po registraciji. Registracija u modelu je uklonjena; `ArticleVersionObserver`, koji je živio samo tamo, preseljen je u provider, pa sada postoji **jedno** mjesto gdje se observeri registruju (što je i pravilo iz CLAUDE.md, samo ga je ovaj model kršio).

Novac je zaštićen zasebno, jednim slojem niže: `rewardAuthor()` sada koristi `BountyService::alreadyAwarded()` s referencom `article:{id}:published` prije nego išta isplati — a referenca stoji i na samoj isplati, pa je provjera pod istim lockom kao i upis. To pokriva i drugi otvoren put koji dupla registracija nije: **re-publish**. `wasChanged('status')` je tačno i kad se članak povuče na ispravku pa vrati, pa je povlačenje plaćalo autora ponovo.

Zašto referenca a ne samo brisanje duple registracije: quest korake i notifikacije ne štiti novčani lock, pa se kapija čita **prije** svega — što je tačno ono što docblock `BountyService::alreadyAwarded()` i traži.

**Test:** `tests/Feature/PublishHappensOnceTest.php` (5 testova). Provjereno da ima zube — s vraćenom duplom registracijom pada s „Failed asserting that 2 is identical to 1". Isplate su i tada prošle, jer ih štiti referenca; to je namjerno slojevanje.

### 2. Zakazano objavljivanje ide kroz observere

`articles:publish-scheduled` je flipovao status bulk upitom (`whereIn()->update()`), koji ne okida događaje modela — pa se ništa nije desilo: bez keša, ISR-a, sitemapa, IndexNow-a, Discorda, notifikacija i isplate. Sada se objavljuje red po red kroz model. Ručna revalidacija koja je stajala umjesto observera je obrisana: čitala je `services.revalidate.token`/`url`, a jedini ključ koji postoji je `revalidate.secret_token` — oba su bila `null`, pa se blok nikad nije izvršio, tiho. Jedan članak koji odbije da se snimi sada se loguje i preskače (komanda ide svake minute; jedan loš red ne smije zaustaviti ostatak).

### 3. RewardLedger više ne curi između korisnika

`singleton()` → `scoped()`. Prije nego što sam promijenio, provjerio sam da to stvarno drži na oba mjesta gdje je bitno: Octane prazni scoped bindinge kroz `FlushTemporaryContainerInstances` na `RequestTerminated` (u vendor default configu — vlastiti `config/octane.php` ne postoji, provjereno i na serveru), a queue worker kroz `forgetScopedInstances()` iz `QueueServiceProvider`. Bez te provjere popravka bi samo izgledala ispravno.

### 4. Draft guide-ovi više nisu javni

`Guide::scopePublished()` je sada jedina definicija „šta čitalac smije vidjeti" (status + `published_at` koji nije u budućnosti), primijenjena na `index`, `show` i brojač pregleda. Uz to su popravljene dvije stvari bez kojih filter ništa ne znači:

- **Keš:** `GuideObserver` je brisao `guides.index.v2.*` dok kontroler piše `v3` — i to petljom po 5 stranica × 4 težine s praznom pretragom, što ionako ne može pogoditi filtriranu varijantu. Sada ide kroz `CacheService::articleShowKey()` i `forgetListings('guides')`, tj. kroz registar koji kontroler već popunjava.
- **Front:** revalidacija je bila zaključana iza `status === 'published'`, pa bi povučeni guide i dalje živio na techplay.gg. Sada se javlja i kad guide **izlazi** iz objave.

Mrtva mašinerija u `Guide::booted()` (brisala je `guide.show.{slug}` i `guides.index.page_N…` — ključeve koje niko ne piše) je uklonjena.

**Živa provjera prije izmjene:** sva 4 guide-a na produkciji su `published` s datumom u prošlosti, pa filter **ne skriva ništa što je danas vidljivo** — izloženost je bila latentna.

**Test:** `tests/Feature/UnpublishedGuidesStayPrivateTest.php` (7 testova, uklj. povlačenje već keširanog guide-a).

### 5. Ad brojače prazni samo jedan sistem

`ads:sync-metrics` je uklonjen iz schedulera **i obrisan**. Radio je identičan posao kao `FlushViewCounters`, samo neatomski (GET → increment → DEL kao tri koraka umjesto GETDEL) — klik koji stigne između čitanja i brisanja se gubio, a flush u istom prozoru bi se brojao dvaput. Komanda je obrisana a ne samo odvezana jer bi svako ručno pokretanje i dalje uništavalo podatke; funkcija nije izgubljena — `FlushViewCounters` je radi svakih 5 minuta.

### 6. Dobitnici giveawaya, podsjetnici i digest stižu i kad pošta ne radi

`GiveawayWinnerNotification`, `GiveawayReminderNotification` i `WeeklyDigestNotification` sada idu na `['database', 'mail']`. Payload je pisan po **stvarnom** ugovoru koji `NotificationController::present()` čita (`type/title/message/link`) — što je usput otkrilo da `GameReleaseNotification` piše `url` i `image`, ključeve koje presenter ne gleda, pa je ta notifikacija godinama stizala u zvono bez linka i bez slike. Popravljeno.

### 7. Admin narudžbe više ne pucaju

`OrderItemsRelationManager` je koristio `Filament\Tables\Actions\*` — klase koje u instaliranom Filamentu **ne postoje** (provjereno u vendor stablu: taj direktorij drži samo `HeaderActionsPosition.php`). Prebačeno na `Filament\Actions\*`. Metode `->actions()`/`->bulkActions()` su ostavljene jer u ovoj verziji postoje kao alijasi i koristi ih još 29 resursa. Badge statusa je dobio `default` granu i `refunded` (bez defaulta `match` **baca**, pa bi prva refundirana narudžba oborila cijelu listu), a `refunded` je dodan i u filter.

### 8. Deploy: jedan put, i to onaj ispravan

`push_and_deploy.ps1` je zvao stari `deploy.sh`. Sada zove `/usr/local/bin/techplay-deploy.sh`. Stari skript je penzionisan — ne deployuje više ništa, nego ispiše šta treba pokrenuti (istorija je u gitu).

**Usput otkriveno, i popravljeno:** `techplay-deploy.sh` je od jučer bio *siromašniji* od onoga što je zamijenio. Nedostajalo mu je:
- **build admin teme** (`viteTheme` čita kompajliran fajl; ništa drugo ga ne gradi) — svaka izmjena izgleda panela bi se deployovala kao stari izgled, bez ijedne greške;
- **pet zaštita iz `deploy_frontend.sh`**: arhiva chunkova (ChunkLoadError za otvorene tabove), brisanje `fetch-cache` (bez njega admin izmjene ne stižu — dva deploya 17.08. su otišla uzalud), pražnjenje nginx keša za `/games/` (**to je nalaz D2 iz ove analize** — mehanizam je postojao, samo ga dokumentovani put više nije zvao), Cloudflare purge, i provjera da svaki asset koji stranice traže zaista postoji.

Frontend pola sada delegira na `deploy_frontend.sh`, koji je dobio `run_as_owner` — build i pm2 idu kao vlasnik stabla (`techplay`), a nginx i Cloudflare token ostaju rootu. Referenca je vlasnik direktorija, isti obrazac koji taj fajl već koristi na jednom mjestu, pa ostaje tačan i ako se vlasništvo opet promijeni.

---

# ŠTA JE URAĐENO — P1 (29.08.2026)

### `env:validate` — alat koji nije mogao raditi tamo gdje treba

Odbijao je da se pokrene nad keširanom konfiguracijom, a to je jedino stanje u kojem produkcija živi. Prepisan da čita **`config()` umjesto `env()`** — sloj koji aplikacija stvarno koristi. Poslije `config:cache` `.env` više niko ne čita, pa je vrijednost koja je u fajlu a nije u kešu — nepostojeća; stara verzija to nije mogla ni vidjeti.

Provjerava i integracije, ne samo osnovu: Discord i Battle.net prijavu, Turnstile, Groq, Blizzard, Steam, PayPal (svjesno različito za sandbox i live), Telegram alarme, poštu, interni token, revalidaciju. Razlikuje **fatalno** (sajt ovako ne radi → prekida deploy) od **ugašene funkcije** (sajt radi, ta stvar ne → upozorenje koje ne blokira objavu). Dodata i provjera da `FRONTEND_URL` nije lista — jer ga `RevalidationService` čita sirovo, pa zarez pretvara adresu u host koji ne postoji.

Uvezan u `techplay-deploy.sh` **poslije** `config:cache`, namjerno. Da je postojao ovakav, Discord tajna bi bila prijavljena onog dana kad je nestala, a ne slučajno kroz log tri neuspjele prijave kasnije.

### Admin panel

- **ReleaseCalendar badge** više ne vrti merge-matcher na svaki klik. Bio je najskuplja stvar u panelu: hidrirao je 2.924 igre sa store linkovima, poredio ih u parovima i pitao bazu za svaki par — na svakoj navigaciji, za svakog urednika, jer je panel SPA. Sada je keširan 15 minuta, a **obje** akcije koje mijenjaju red (`same`/`different` kroz `remember()`, i `undo`) čiste ključ, pa TTL služi samo kao mreža.
- **Red čekanja na dashboardu** broji `ready_for_review` — status koji forme stvarno pišu. Brojao je `pending_review`, vrijednost koju nigdje u kodu niko ne postavlja, pa je jedino pitanje zbog kojeg widget postoji uvijek imalo odgovor „nula".
- **Auto-slug** u obje kategorije: `Closure $set` → `Set $set`. Filament prosljeđuje objekat, pa je tipizirani parametar bacao TypeError čim polje izgubi fokus.
- **Prunanje**: `model:prune` za `queue_monitors` (config je tražio 7 dana retencije, ali to niko nije sprovodio — 10.502 reda), `sanctum:prune-expired`, `queue:prune-failed` (30 dana). Provjereno da `model:prune` radi u konzoli bez Filament panela prije nego je zakazan.

### Backend

- **JSON za API rute uvijek** — `shouldRenderJsonWhen` na `api/*`. Bez toga je klijent bez `Accept` headera dobijao 500 „Session store not set" umjesto 422, jer je Laravel pokušavao redirect sa sesijom koje na API grupi nema.
- **Blizzard pool** više ne ruši analizu: neuspjela konekcija ostavlja izuzetak u slotu, a `->successful()` nad njim baca `Error` koji `catch (\Exception)` ne hvata. Sada `instanceof Response` + `catch (\Throwable)`, plus uklonjena neiskorištena varijabla.
- **Socialite dobio timeoute** (10 s / 3 s connect). Bio je jedini odlazni put bez njih, i to na prijavi: Guzzle po defaultu čeka zauvijek, pa bi zastoj kod Discorda držao Octane workera do restarta. Provjereno u vendoru da `buildProvider` stvarno prosljeđuje `guzzle` ključ.
- **Forum keš po publici**: `forum.game_threads.{slug}` → `.{audience}.{slug}`. Ključ nije nosio publiku a upit unutra jeste filtrirao po njoj, pa je onaj ko prvi promaši keš odlučivao šta svi vide narednu minutu.
- **Sync jobovi ne ostavljaju zaključana vrata**: novi trait `ReleasesTheSyncLock` daje svih pet `failed()` koji oslobađa `syncing` status. Uz to `platforms:resync` sada preskače `syncing` samo dok je svjež (6 h) — jer worker ubijen naprečac ne stigne ni do `failed()` — i više ne ispušta redove gdje je status `NULL` (`whereNotIn` nikad ne propušta NULL, pa bi takav nalog bio isključen zauvijek).
- **„Real-time" više ne čeka iza kataloga**: broadcast eventi idu na zaseban red `live`, koji ima **vlastiti proces** (`techplay-worker-live`). Prioritet reda na jednom workeru ne bi pomogao — tekući posao svejedno mora završiti prije sljedećeg, a `EnrichSteamBatch` drži workera većinu svake minute. Konfiguracija workera je sada u repou (`deployment/supervisor-worker.conf`) i deploy je sam usklađuje s `/etc/supervisor/`.

### Frontend

- **Naslovnica više ne objavljuje praznu stranicu.** Pad dohvata je vraćao prazne nizove, a ISR ih objavljivao kao stvarnu stranicu na najmanje 60 s, bez ikakvog klijentskog oporavka. Sada baca — a Next pri padu regeneracije **nastavlja služiti prethodnu dobru kopiju** (provjereno u dokumentaciji instalirane verzije, `how-revalidation-works.md`), pa blip backenda postaje malo ustajala naslovnica umjesto prazne.
- **Kontakt forma** ide kroz `getServerApiUrl()` + `serverHeaders()` kao i ostalih 30 server-side poziva — dakle ne kroz Cloudflare i s internim tokenom.
- **Notifikacije u zvonu** dobile ikonice za giveaway dobitak, giveaway koji ističe i izlazak igre (dotad generično zvono).

### Discord bot

- **Bot je dobio deploy korak** (`techplay-deploy.sh discord`). Dotad se `dist/` gradio samo ručno, pa je poslije svakog `git pull` mogao vrtjeti stari kod dok pm2 uredno javlja „online".
- **Moderacija na granice riječi.** `content.includes('coon')` je brisao „tycoon" i „raccoon", `'spic'` je brisao „spicy". Sada regex s `\b`, a invite linkovi ostaju fragmenti jer to i jesu. Provjereno na deset slučajeva: „RollerCoaster Tycoon" i „spicy take" prolaze, stvarne uvrede i pozivnice se i dalje hvataju. Namjerno bez gonjenja zamjene slova — filter koji juri obfuskaciju opet počne jesti obične riječi.
- **Obrisana poruka više ne nosi XP.** Moderacija i XP su dva nezavisna slušaoca istog eventa, pa je poruka koja se upravo briše zbog uvrede autoru donosila 15 poena na izlazu. XP sada pita isti predikat.
- **Bot zove backend preko petlje** (`127.0.0.1:8000` s `Host` headerom) umjesto preko javnog imena i Cloudflarea, i **šalje interni token** — čime izlazi iz globalnog limita od 60/min po IP-u, zbog kojeg je deklarisanih `throttle:300,1` na Discord rutama bilo bez značaja.
- **429 se više ne prevodi u „već si uzeo danas".** Backendov pošten „already claimed" nosi `hours_left` u tijelu; limiterov ne nosi ništa. Razlikuju se, i limiter sada daje treći odgovor („zauzet sam, pokušaj za koji trenutak") umjesto da se pretvara u „nalog nije povezan".
- **Avatar** u embedima je botova vlastita Discord slika. Hardkodirani URL je pokazivao na fajl koji ne postoji, pa je Discord tiho izostavljao thumbnail na skoro svakom embedu.

### Server

- 🔴 **Nađeno pri radu, i ozbiljnije nego što je nalaz A2.1 slutio.** Scheduler je radio kao root i ostavio trag: **184 root-owned fajla u `storage/`** i **svaki `sitemap*.xml` u `public/` kao `root:root 644`**. `ArticleObserver` pri objavi prepisuje `sitemap-news.xml` — kao `www-data`. Izmjereno: `www-data` **nije mogao pisati** po tom fajlu. U logu nema pada samo zato što od jučerašnje podjele vlasništva ništa nije objavljeno — mina je bila naoružana, ne odapeta. Vlasništvo vraćeno, a `techplay-deploy.sh` sada popravlja i `public/`.
- **Scheduler preseljen u `www-data` crontab**, root ostao bez ijedne aktivne linije (stari sadržaj u `/root/crontab.backup.2026-08-29.txt`). Provjereno da heartbeat i dalje kuca. `seo:scan-links` preseljen u Laravel scheduler; `cache:forget seo_orphan_count` obrisan — taj ključ nigdje u kodu ne postoji.
- **logrotate ponovo prolazi** (`Result=success`, izlaz 0) — bio je u `failed` od 28.08. zbog dozvola. Jedini `failed` unit ostaje `techplay-backup`, po dizajnu.
- **`vm.swappiness`** upisan trajno u `/etc/sysctl.d/`. Zatečena vrijednost je već bila 10, ali nigdje zapisana — poslije restarta bi se vratila na 60.
- **Redis NIJE restartovan** iako mu 116 MB leži u swapu: RAM-a je slobodno 3,7 GB, dakle to je trag ranijeg pritiska a ne trenutnog, i stranice se vraćaju same. Restart živog keša radi memorije koja nije oskudna se ne isplati.

---

# ŠTA JE URAĐENO — P2 (29.08.2026)

### IGDB staging obrisan — 3,9 GB, 65% baze

Odluka vlasnika: izvlačenje je završeno. Redoslijed je bio takav da izvor ne ode prije proizvoda:

1. **Provjereno da je sve sletjelo** u trajne tabele: 332.455 igara, 262.576 IGDB vanjskih ID-jeva, 57.630 studija s `igdb_id`, 566.915 linkova, 85.368 relacija, 285.850 veza igra↔studio.
2. **Arhivirano** u `/var/backups/igdb-archive/igdb-staging-2026-08-29.dump` — 490 MB, `pg_dump -Fc`, provjereno `pg_restore --list` (obje tabele s podacima, sekvencama i ograničenjima).
3. **Obrisano** migracijom `2026_08_29_050000`.
4. **Uklonjen i alat** koji bez tih tabela ne može raditi: 11 `igdb:*` komandi, `IgdbClient`/`IgdbMatcher`/`IgdbFacts`, `CrawlIgdbBatchJob` i 9 testova — **25 fajlova**. Ostavljene komande koje pucaju na nepostojećoj tabeli su gore od obrisanih, a među njima su bile i destruktivne (`igdb:merge`, `igdb:import`, `igdb:revert`) koje bi jedna pogrešno otkucana naredba pustila na kanonski katalog.
5. **Očišćeno sedam mrtvih config blokova** koje niko ne čita: `igdb`, `openai`, `gemini`, `mobygames`, `rawg`, `giphy`, `recaptcha` (taj zadnji je duplikat — `ReCaptchaService` čita `turnstile.*`).

Povratak, ako ikad zatreba: `pg_restore -d techplay <arhiva>` za podatke i `git show` ovog commita za alat.

### Mjereno prije i poslije: sitemap više ne čita svaki opis

`Game::indexable()` je vrtio regexp preko 305.581 opisa pri svakom prolazu, a sitemap sadržaja ide svakih 15 minuta — ukupno ~2,8 h DB vremena u 11 dana, više nego sve ostalo zajedno. Parcijalni indeks s **tačno tim** predikatom prebacuje posao na upis:

| | Prije | Poslije |
|---|---|---|
| Prebrojavanje indeksabilnih | 1.579 ms | **234 ms** |
| Jedna stranica sitemapa | 845 ms | **72 ms** |
| Plan | Index Scan + čitanje tabele | **Index Only Scan** |

Izraz u `Game::scopeIndexable()` i predikat indeksa moraju ostati identični — zapisano na oba mjesta, jer Postgres ih uparuje poređenjem izraza i razlika od jednog razmaka tiho isključuje indeks.

### Ostali indeksi, svaki s izmjerenim razlogom

- **`studios.parent_id`** nije imao indeks, a stranica studija traži podstudije pri svakom renderu: **234.079 poziva, 2.345 s, svaki sekvencijalni skan 57.630 redova**. Sada Index Scan.
- **`lower(games.name)`** — tako se naslov iz prodavnice spaja s katalogom (presence polling svake 2 min po igraču, i svaki uvoz biblioteke). Bio pun skan 332.455 redova; sada Index Scan, a stvarni upit (`LOWER(name) = ? OR slug = ?`) koristi BitmapOr oba indeksa.
- **`games_hub_name_idx` obrisan** — nula skenova u sva tri mjerenja (17.08., 24.08., 29.08.), građen za filter koji hub više ne šalje. Druga dva iz te porodice se koriste (58 i 2.017 skenova) i ostaju.
- **20 grupa identičnih indeksa** obrisano (`threads` je nosio 22 indeksa, `comments` i `posts` po 11). Sigurno po konstrukciji: u svakoj grupi ostaje indeks s istim kolonama. Nasljeđe četiri januarske migracije koje su dodavale iste indekse jedna preko druge; čišćenje 18.08. sredilo je samo `articles`.

### IndexNow: s pet implementacija na jednu

Tri inline kopije (Article, Guide, Game observeri) čitale su ključ iz env-a, job iz baze — **dva različita ključa**, od kojih samo jedan ima fajl koji Next servira. Uz to su `host` i `keyLocation` građeni iz API domena dok su se slali frontend URL-ovi, što protokol odbija; komentar pored linije je čak pisao „e.g. techplay.gg" a proizvodio drugo. Sada: jedan job, jedan ključ, `app.site_url`, i test koji drži ugovor. Mrtvi `IndexNowService` (nula pozivalaca, a nosio je ispravku koja nikad nije stigla u živi put) obrisan. Uklonjen i Google sitemap ping — taj endpoint je penzionisan 2023. i vraća 404. Popravljeno i mapiranje sekcije: sve što nije recenzija išlo je kao `/news/`, pa su hardware članci prijavljivani na adresu koja 404-a.

### Ispravke ponašanja

- **Povučen članak stvarno nestaje.** Observer je izlazio odmah za svaki status osim `published`, pa povlačenje nije čistilo ni keš ni listinge ni Next — a članci su `revalidate=false`, dakle bez tajmera koji bi to sam popravio. Brisanje i povlačenje sada idu kroz isto čišćenje.
- **Giveaway podsjetnici:** dvosatni prozor na šestosatnoj kadenci značio je da **dvije trećine giveawaya nikad ne dobije najavu**. Sada cijeli dan + kolona `reminder_sent_at`, pa i propušteno pokretanje sustigne umjesto da preskoči.
- **Brisanje naloga nikad nije obrisalo nijedan fajl.** Test s lažnim diskom je pao i pokazao dublji uzrok nego što je analiza tvrdila: `getOriginal()` se čita **poslije** `save()`, koji sinhronizuje originale — pa je „originalna" putanja bila `null` koji je upravo upisan. Ni avatari ni cover slike. Putanje se sada hvataju prije brisanja kolona. Isti prolaz anonimizuje i potpis na otvorenom pismu, koji drži vlastitu kopiju e-mail adrese.
- **TechPlay skor se računao dvaput i davao različite brojeve** — widget je isključivao skice ocjena, stranica igre ih je uključivala. Formula i pravilo o skicama sada su na jednom mjestu (`Support\TechplayScore`).
- **Shop:** proizvodi su bili jedine detalj-stranice bez ikakvog metadata (client komponenta ga ne može imati). Sada rade po projektnom obrascu `page.tsx` + `Client.tsx`, s OG karticom. Referenca na `og-shop.png` uklonjena — taj fajl nikad nije postojao, pa je kartica pokazivala na 404.
- **Tri npm paketa** bez ijednog importa uklonjena (`@radix-ui/react-avatar`, `class-variance-authority`, `react-scroll` + tipovi); build i tsc čisti.

### Šta NISAM uradio, i zašto

- **~28 „mrtvih" ruta ostaje.** Nginx logovi (12 dana) pokazuju nula poziva za skoro sve, ali to nije dokaz da rijetka admin akcija ne postoji, a korist od brisanja je mala. Popis ostaje u ovom dokumentu.
- **7 nespojenih WoW komponenti — obrisano na nalog vlasnika (29.08.).** `HousingReadiness`, `PreparationChecklist`, `TimelineTracker`, `DailyPlanner`, `HistoricalProgress`, `WowLeaderboard`, `WowRecentAnalyses`, plus `lib/wow-midnight-theme.ts` koji je postojao isključivo zbog njih i `recharts` koji je time ostao bez ijednog korisnika. Nula uvoza provjereno prije brisanja; `tsc` i build prolaze. U `components/wow/` ostaje 13 komponenti koje analizator stvarno koristi.

---

## NAĐENO PRI PROVJERI DEPLOYA — 29.08.2026

🔴 **Prijava kroz Discord je pokvarena na produkciji, i neko je danas pokušao.** U logu su tri neuspjela pokušaja u 21:18–21:19: `Discord OAuth failed: POST https://discord.com/api/oauth2/token resulted in a 401`. Uzrok: **`DISCORD_CLIENT_SECRET` ne postoji u `.env`.** `DISCORD_CLIENT_ID` i redirect jesu postavljeni, pa korisnik prođe kroz Discord ekran, vrati se — i tu padne. Bot ima svoj `DISCORD_BOT_SECRET` i radi normalno; ovo je druga tajna.

🟠 **Battle.net prijava isto.** `services.battlenet.client_id` i `client_secret` čitaju `BATTLENET_*`, a u `.env` postoje samo `BLIZZARD_CLIENT_ID` / `BLIZZARD_CLIENT_SECRET` (koje koristi `BlizzardService` za API i uredno rade). U praksi je to isti par kredencijala iz Blizzardovog portala, pa je popravka vjerovatno samo fallback na `BLIZZARD_*` — ali to traži potvrdu da je redirect URI registrovan za tu aplikaciju, pa nije dirano.

🟡 **`env:validate` ne može uhvatiti nijedno od ovoga u stanju u kojem produkcija živi.** Sam kaže: *„Configuration is cached, so env() reads as null and every check below would fail."* Alat napravljen tačno za ovaj problem je neupotrebljiv poslije `config:cache`, a `config:cache` je obavezan korak deploya. Treba ga zvati **prije** keširanja u `techplay-deploy.sh`, ili ga naučiti da čita `config()` umjesto `env()`.

**Ispravka mog vlastitog nalaza:** u prvom prolazu sam prijavio da fale i Turnstile i Groq ključevi. Netačno — provjeravao sam `services.turnstile.secret` i `services.groq.key`, a stvarna imena su `secret_key` i `api_key`. Oba **jesu** postavljena i rade (Turnstile 0 odbijanja u logu, Groq ključ 56 znakova). Pouka je ista kao kod „291 rute bez autentifikacije" iz docs/76: grep po imenu koje sam pretpostavio, umjesto po imenu koje kod stvarno čita.

---

# ODLUKE KOJE ČEKAJU VLASNIKA

Ništa ispod nije dirano. Sve je provjereno i spremno; nedostaje samo odluka.

## 1. Dvadeset osam ruta bez pronađenog pozivaoca

**Dokaz za svaku:** nijedan pozivalac u frontendu, Discord botu, configu ni mail templateima — plus **nula pogodaka u ~12 dana nginx logova**. Brojevi linija su iz `backend/routes/api.php` na dan 29.08.2026.

**Zašto ovo nije isto što i mrtve WoW komponente:** komponentu koju nijedan fajl ne uvozi bundler dokazano ne isporučuje. Rutu može gađati nešto što se ne vidi iz repoa — ručni `curl`, Postman kolekcija, bookmark u adminu. Dvanaest dana logova to sužava, ali ne isključuje.

### 1a. Zamijenjene — postoji ispravna alternativa *(najsigurnije za brisanje)*

| Ruta | Linija | Šta se koristi umjesto nje |
|---|---|---|
| `GET /rewards` | 526 | `/rewards/catalog` |
| `GET /users/{u}/trophy-case` | 296 | profil već nosi `trophy_case` u payloadu |
| `GET /friends` | 197 | Social Hub čita `/social` |
| `GET /friends/activity` | 327 | widgeti idu na `/me/dashboard` |
| `GET /page-seo` | 522 | `/page-seo/{path}` (523) |
| `GET /seasons` | 535 | `/seasons/active` |
| `GET /categories/{slug}` | 474 | nema opšte stranice kategorije |
| `GET /games/hub/{type}/{value}` | 614 | facet stranice idu na `/games?genres=` |
| `GET /games/{slug}/articles` | 619 | presavijeno u `/games/{slug}/bundle` |
| `GET /games/{slug}/screenshots` | 620 | isto |
| `GET /games/{slug}/videos` | 621 | isto |
| `GET /games/{slug}/series` | 624 | isto |
| `GET /games/{slug}/suggested` | 625 | isto |

Napomena uz zadnjih pet: komentar u kodu tvrdi da se „koriste drugdje" — i koriste se, ali kao **PHP metode** koje `bundle()` zove direktno. HTTP pozivaoca nema.

### 1b. Admin alat bez sučelja *(sigurno, uz jednu provjeru)*

| Ruta | Linija | Napomena |
|---|---|---|
| `POST /seo/suggest-links` | 658 | cijeli `SeoController` nema **nijednog** pozivaoca |
| `GET /seo/orphan-pages` | 659 | isto |
| `GET /seo/articles/{article}/inbound-links` | 660 | isto |
| `GET /seo/articles/{article}/schemas` | 661 | isto |
| `POST /forum/threads/{slug}/restore` | 243 | nema moderatorskog dugmeta |
| `GET /last-disc/export` | 180 | **pitanje za tebe: koristiš li ručno?** |
| `POST /webhooks/discord/notify` | 654 | **isto pitanje** |

### 1c. Polusagrađene — jedna strana postoji, druga nikad nije napravljena *(odluka je: dovršiti ili odbaciti)*

| Ruta | Linija | Šta nedostaje |
|---|---|---|
| `GET /me/reading` | 308 | writeri (bookmark, progres) rade; čitalac nikad sagrađen |
| `POST /journal/sessions/{s}/moments` | 359 | UI može **obrisati** momenat, ali ga nikad ne kreira |
| `POST /user/wow-characters/{id}/set-main` | 189 | zove se samo GET |
| `DELETE /user/wow-characters/{id}` | 190 | isto |
| `POST /conversations/{c}/participants` | 213 | nema UI za dodavanje u grupu |
| `GET /wow/analysis/{id}` | 506 | share dugme koristi `navigator.share` |
| `POST /wow/analysis/{id}/share` | 507 | isto |
| `GET /presence/{username}` | 499 | živ je samo botov `/discord/presence` |
| `POST /presence` | 282 | isto |
| `DELETE /presence` | 283 | isto |
| `GET /gta6/vehicles/{slug}` | 578 | detalj stranice ne postoje (samo za likove) |
| `GET /gta6/weapons/{slug}` | 582 | isto |
| `GET /authors/{slug}/articles` | 565 | stranica autora traži samo `/authors/{slug}` |
| `GET /support/mine` | 393 | support stranica koristi samo tiers + pledge |
| `GET /rewards/redemptions` | 363 | store nikad ne lista istoriju |
| `GET /game-lists/tags` | 530 | discover stranica ih ne traži |

### 1d. Suvišne — posao se već dešava drugdje

| Ruta | Linija | Zašto |
|---|---|---|
| `POST /conversations/{c}/read` | 211 | GET poruka već označava pročitano |
| `POST /auth/refresh` | 168 | frontend sam u komentaru piše da je neupotrebljiv iza istog guarda |
| `GET /articles/{slug}/views` | 593 | niko ne čita |

### 1e. Mrtvi handleri — bez ijedne rute

`SettingsController::grouped` · `TrackingController::getCategoryPath` · **`DiscordAdminController::getActiveEvent`** — bot **može pokrenuti** event preko `/discord/admin/event`, ali ga niko ne može pročitati nazad.

**Moja preporuka po redoslijedu:** 1a i `/seo/*` iz 1b bih brisao bez oklijevanja · za `last-disc/export` i `webhooks/discord/notify` treba tvoj odgovor · 1c ostaviti dok se ne odluči hoće li se te funkcije dovršiti · 1d je sigurno ali beznačajno.

## 2. Discord i Battle.net prijava

Obje su pokvarene na produkciji i **obje traže podatke iz portala**, ne kod:

- **Discord:** `DISCORD_CLIENT_SECRET` ne postoji u `.env`. Tri stvarna pokušaja prijave pala su 28.08. u 21:18–21:19 s `401` na Discordovoj token adresi. Treba tajna iz Discord developer portala.
- **Battle.net:** `services.battlenet.client_id/secret` čitaju `BATTLENET_*`, a u `.env` postoje samo `BLIZZARD_*` (koje rade za API). Vjerovatno je isti par kredencijala — ali treba potvrda da je redirect URI registrovan za tu aplikaciju prije nego se spoji.

`env:validate` sada oba prijavljuje kao `DOWN` pri svakom deployu, pa se ne mogu ponovo zaboraviti.

## 3. Restart servera

Kernel 6.8.0-138 čeka. Put kroz boot je već isproban ranije. Nosi kratak prekid, pa biraš trenutak.

---

## ŠTA NISAM MOGAO PROVJERITI

| Stavka | Zašto |
|---|---|
| Da li su dupli Discord postovi vidljivi u kanalu | Nemam pristup Discord istoriji; zaključak je iz koda (announce bez ID guarda) + duplog bountyja u ledgeru |
| Filament stranice u browseru | Bez browsera na serveru; nalazi su statički (vendor tree + kod) |
| Cloudflare edge pravila | Token na serveru je scoped (Zone:Read + purge); puna pravila vidi samo dashboard |
| Ko je restartovao Octane 27.08. u 23:29–23:51 | Shell history roota nije pregledana — prozor kod↔šema je dokazan logom, počinilac nije bitan |
| Da li IGDB obogaćivanje treba ponovo da se vrti | Produkt odluka — od nje zavisi sudbina 3,9 GB (docs/75) |
| PageSpeed / Search Console | Bez pristupa u ovom prolazu |
