# 53 — Laravel Pulse: podešavanje na produkciji

**Status:** konfiguracija spremna, čeka izvršavanje na serveru (11. 08. 2026.)

---

## Šta Pulse jeste, a šta nije

Pulse je **monitoring aplikacije**, ne analitika posjeta. Ne odgovara na
„koliko ljudi je bilo na sajtu" ni „odakle dolaze" — za to postoje druge stvari.
Odgovara na pitanja koja niko drugi u ovom sistemu ne prati:

| Kartica | Odgovara na |
|---|---|
| Slow Queries | Koji SQL upit troši vrijeme, s tekstom upita i mjestom u kodu |
| Slow Requests | Koje rute su spore i koliko |
| Exceptions | Koje greške se dešavaju i koliko često, grupisano po tipu |
| Slow Jobs | Koji pozadinski poslovi traju dugo |
| Queues | Propusnost reda, koliko čeka, koliko pada |
| Cache | Koliko keš pogađa a koliko promašuje, po ključu |
| Slow Outgoing Requests | Koji vanjski API (Steam, Blizzard, PayPal) nas usporava |
| Servers | CPU, memorija, disk kroz vrijeme |
| Usage | Koji korisnici prave najviše zahtjeva, poslova, sporih upita |

Kartica **Slow Queries** je bitna zbog jedne posebne stvari: pokriva veliki dio
onoga zbog čega nam treba `pg_stat_statements`, a ne traži restart baze. Razlika
je u uglu — Pulse vidi upit iz aplikacije i zna iz koje linije koda dolazi;
`pg_stat_statements` vidi sve upite koji uđu u bazu, uključujući one iz migracija,
cronova i admin panela. Idealno oboje; Pulse je jeftiniji za uključiti.

---

## Zatečeno stanje (11. 08. 2026.)

Pulse je instaliran (`laravel/pulse ^1.4`), uključen po defaultu i **snima na
svaki zahtjev** — svi recorderi su aktivni. Podaci idu u PostgreSQL, čuvaju se
7 dana.

Dashboard postoji na `https://api-beta.techplay.gg/pulse`, zaštićen `web`
sesijom i `viewPulse` gateom koji propušta samo administratore
(`AppServiceProvider`).

Ali `diagnose:db` je pokazao **nula skenova na svim `pulse_entries` i
`pulse_aggregates` indeksima kroz devet dana** — dakle niko ga nikad nije
otvorio. Devet dana pisanja na svaki zahtjev, nula čitanja.

Tri stvari nedostaju da bi bio i koristan i jeftin.

---

## 1. Ingest kroz Redis umjesto direktno u bazu

Trenutno `PULSE_INGEST_DRIVER` nije postavljen, pa vrijedi default `storage`:
**svaki zahtjev sam upisuje svoje mjerenje u PostgreSQL, sinhrono, dok
posjetilac čeka.** To je cijena koju smo izmjerili.

S `redis` ingestom zahtjev gurne mjerenje u Redis stream i ide dalje; poseban
proces (`pulse:work`) to prazni u bazu u pozadini.

U `.env`:

```
PULSE_INGEST_DRIVER=redis
```

## 2. Dva stalna procesa

`deployment/supervisor-pulse.conf` sadrži oba:

- **`pulse:work`** — prazni Redis stream u bazu. Bez njega, uz `redis` ingest,
  ništa se nikad ne upiše i dashboard ostane prazan.
- **`pulse:check`** — snima stanje servera (CPU, memorija, disk). Ništa drugo to
  ne bilježi, pa bez njega kartica Servers ostaje prazna.

## 3. Restart pri deployu

Oba procesa drže kod u memoriji kao svaki daemon. `deployment/deploy.sh` sada
zove `php artisan pulse:restart` (nefatalno — Pulse ne smije oboriti deploy).

---

## Koraci na serveru

```bash
cd /var/www/techplay/backend
git pull

# 1. Ingest kroz Redis
echo "PULSE_INGEST_DRIVER=redis" >> .env
php artisan config:cache

# 2. Dva procesa
sudo cp deployment/supervisor-pulse.conf /etc/supervisor/conf.d/techplay-pulse.conf
sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl status | grep pulse

# 3. Da workeri pokupe novi config
sudo supervisorctl restart techplay-octane:*
```

Zatim: prijavi se na `https://api-beta.techplay.gg/admin`, pa otvori
`https://api-beta.techplay.gg/pulse`. Redoslijed je bitan — dashboard traži
sesiju, a nju pravi Filament prijava.

Podaci se pojavljuju kroz nekoliko minuta prometa. Prvi otvoreni dashboard je
ujedno i prvi put da neki od onih indeksa bude iskorišten.

---

## Ako promet naraste

Svaki recorder ima svoju stopu uzorkovanja (`PULSE_*_SAMPLE_RATE`, sada 1 =
sve). Pri današnjem prometu to nije problem. Kad postane, snižava se selektivno,
recimo:

```
PULSE_CACHE_INTERACTIONS_SAMPLE_RATE=0.1
PULSE_USER_REQUESTS_SAMPLE_RATE=0.1
```

Pulse tada množi brojke natrag, pa trendovi ostaju tačni a trošak pada.

Rok čuvanja je 7 dana (`PULSE_STORAGE_KEEP`). Duže znači veće tabele; za
uočavanje trenda sedmica je dovoljna.

---

## Veze

- `docs/52-faza2-dijagnostika.md` — odakle je nalaz došao
- `deployment/supervisor-pulse.conf` — konfiguracija oba procesa
- `deployment/deploy.sh` — `pulse:restart` korak
