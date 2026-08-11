# 52 — Faza 2: `php artisan diagnose`

**Status:** gotovo (11. 08. 2026.)
**Prethodi:** Faza 1 (P1–P9), dokumenti 36–51

---

## Zašto ovo postoji

Faza 1 je pročitala kod. Kod odgovara na pitanje *šta se dešava*, ali nikada na
*koliko to košta* i *radi li uopšte na serveru*. Indeks koji se nikad ne koristi
izgleda isto kao indeks koji nosi pola prometa. Cron koji je stao ne javlja
ništa — sajt i dalje radi, samo se obogaćivanje, podsjetnici i čišćenje više
nikad ne dese.

Ranije sam ta pitanja pokušao riješiti tako što sam korisniku dao sedam SQL
upita za `php artisan tinker`. Tinker je PHP REPL, ne psql — dobio je ekran
grešaka. Odatle ovaj paket: **ja pišem alat, korisnik pokrene jednu komandu i
pošalje izlaz.**

---

## Šta se pokreće

```bash
php artisan diagnose
```

Jedna komanda, deset provjera, jedan izlaz. **Sve samo čita.** Nijedna provjera
ništa ne mijenja, ne briše i ne piše.

Ako neka provjera ne može da se izvrši (Redis ugašen, ekstenzija nedostaje),
kaže to i ostale nastave — jedan nedostupan servis ne smije da košta devet
drugih odgovora.

| Komanda | Odgovara na |
|---|---|
| `diagnose:config` | Okruženje, drajveri, `APP_DEBUG` na produkciji, ključevi iz `.env.example` kojih nema, je li config keširan |
| `diagnose:db` | Indeksi s nula skenova, strani ključevi bez indeksa, mrtvi redovi, `pg_stat_statements` najskuplji upiti, dugi lockovi, tabele bez primarnog ključa |
| `diagnose:orphans` | Siročad po relacijama, duplikati, prekršeni invarijanti (postoji od P6) |
| `diagnose:redis` | `maxmemory` i politika, memorija, ključevi po prefiksu, **ključevi bez TTL-a**, dubina redova |
| `diagnose:queue` | `failed_jobs` po klasi, najstariji posao, dubina reda |
| `diagnose:schedule` | Otkucaj rasporeda, spisak zakazanih zadataka i sljedeće izvršavanje |
| `diagnose:storage` | Disk po direktoriju, redovi čiji fajl ne postoji, prevelike slike, (`--orphans`) fajlovi koje nijedna kolona ne spominje |
| `diagnose:http` | Sigurnosni headeri, zastavice kolačića, `robots.txt`, TLS istek — mjereno s mašine |
| `diagnose:perf` | Vrijeme odgovora po javnoj GET ruti, medijan od tri mjerenja |

---

## Odluke koje su oblikovale alat

### Kolone se otkrivaju iz baze, ne pišu u kodu

Prva verzija `diagnose:storage` imala je ručni spisak kolona s putanjama. U njemu
je stajalo `articles.featured_image`. Ta kolona se odavno zove
`featured_image_url`, a zaštita `Schema::hasColumn()` ju je tiho preskakala — pa
je izlaz pisao *„svaki zapisani put ima svoj fajl"* dok cijelu tabelu nije ni
pogledao.

Sada se kolone traže kroz `information_schema` po imenu (`image`, `path`,
`avatar`, `cover`, `icon`, `logo`, …). Preimenovana kolona se i dalje provjerava,
nova se pokrije sama. Ručni spisak ostaje samo za izuzetke — `page_seo.page_path`
i `users.profile_visibility` matchuju obrazac a nisu fajlovi.

### Četiri oblika iste putanje

U tim kolonama završe četiri različite stvari i samo je jedna naša:

| Oblik | Gdje živi |
|---|---|
| `articles/foo.jpg` | public disk backenda |
| `/storage/articles/foo.jpg` | isti fajl, zapisan kroz `Storage::url()` |
| `/ranks/apex.webp` | **`frontend/public/`** — servira Next, ne backend |
| `cpu`, `⚡`, Steam CDN URL | uopšte nije fajl, ili nije naš |

Ovo nije akademska razlika. Prva verzija je prijavila **svih 20 rank ikonica kao
slomljene slike na živom sajtu**. Nisu bile: `/ranks/apex.webp` postoji u
`frontend/public/ranks/`, a na backend disku stoje iste te ikonice kao `.png`.
Lažna uzbuna te vrste je gora od nikakve provjere.

### Varijante slike su jedan upload

`foo_thumb.webp`, `foo_medium.webp` i `foo.jpg` su jedna slika, a u koloni stoji
samo jedna od njih. Alat svodi ime na korijen prije poređenja, inače bi tri
četvrtine diska prijavio kao „ničije". Dva pisca koriste dva razdvajača —
`ImageOptimizationService` crticu, media pipeline donju crtu — pa se gledaju oba.

### Ono što se ne prijavljuje

Strani ključevi bez indeksa: ima ih 54, ali svi na tabelama ispod 256 KB.
Skeniranje prazne tabele ne košta ništa, a 54 reda šuma sakriju onaj jedan koji
bi bio bitan. Prijavljuju se samo oni iznad praga; ostali se prebroje u jednoj
liniji.

Popis fajlova koje nijedna kolona ne spominje je iza `--orphans` i **nikad nije
spisak za brisanje**. Sadržaj članaka drži slike u HTML-u, ne u koloni — te su
tu iako se koriste. Vrijedi samo kao trag gdje disk odlazi.

### `diagnose:perf` ne smije ništa da pokrene

Rute se otkrivaju iz registra: GET, bez parametra, bez `auth` middlewarea. Iz
tog skupa se izbacuje sve što po imenu nešto zapisuje — `track`, `view`,
`increment`, `revalidate`, `ping`, `sync`, `claim`, `callback`, `webhook`. GET
koji broji pregled je i dalje GET, i alat koji tvrdi da samo čita ne smije da ga
pozove.

Rate limit je vlastiti problem alata: 45 ruta puta tri mjerenja u jednoj minuti
s jedne IP adrese je tačno ono što throttle postoji da spriječi. 429 se
prijavljuje odvojeno, s uputom `--limit=15` ili `--delay=1200`, jer to nije
nalaz o ruti nego o mjerenju.

---

## Nalazi s prvog pokretanja

Lokalna kopija, prije produkcije:

**15 indeksa s nula skenova**, najveći `games_name_trgm_gin` na **45 MB**, pa
`game_external_ids_game_id_provider_index` na 12 MB i još jedanaest na `games`
(`games_rating_index`, `games_tags_gin`, `games_platforms_gin`, tri
`games_hub_*`, `games_genres_gin`, …). Svaki od njih usporava svaki upis u
`games`, a nijedno čitanje ne ubrzava.

**Ovo se ne smije čitati kao presuda.** Brojači se resetuju restartom baze —
komanda to i ispisuje — pa svjež server pokazuje nule lažno. Odlučuju brojke s
produkcije, poslije nekoliko dana rada.

**32 slike preko 1,5 MB, ukupno 54,8 MB.** Next optimizacija slika je namjerno
isključena (`images: { unoptimized: true }`, zbog veličine biblioteke igara), pa
ono što je uploadovano je tačno ono što posjetilac skine.

**13 redova u `media.path` bez fajla** — slomljene slike na stranicama koje su
trenutno žive.

---

## Regresija koju je alat našao

`diagnose:perf` je na `wow/leaderboard` i `wow/recent` vratio **500**. U logu:

```
Class "App\Services\BlizzardDataTransformer" not found
  at app/Services/BlizzardDataTransformerV2.php
```

Tu klasu sam obrisao u P5 (commit `55bd046c`), s obrazloženjem *„tri fajla koje
niko nije importovao"*. Za nju to nije bilo tačno:

```php
class BlizzardDataTransformerV2 extends BlizzardDataTransformer
```

Nasljeđivanje unutar istog namespacea **ne treba `use` liniju**, pa ga pretraga
po importima nije vidjela. Obje WoW rute su od 8. augusta vraćale 500.

Fajl je vraćen, rute ponovo vraćaju 200. Provjereno je i ostalih obrisanih klasa
iz istog commita — jedina druga preostala referenca na `CommentPolicy` je u
komentaru, ne u kodu.

**Pouka za svako sljedeće brisanje:** grep za `use X` nije dovoljan. Traži i
`extends X`, `implements X`, `new X`, `X::`, i ime klase u stringovima
(konfiguracija, `dispatch`, Filament resursi).

---

## Prvo produkcijsko pokretanje — i šta je alat pogriješio

Tri provjere su na produkciji dale neupotrebljiv izlaz. Popravljene su prije
nego što je iz njih išta zaključeno.

### `diagnose:config` je prijavio da ništa nije postavljeno

Ispisao je `(nije postavljeno)` za svih dvanaest postavki i svih šezdeset
ključeva iz `.env.example` kao nedostajuće — na serveru koji radi na svima
njima.

Uzrok: koristio je `env()`. Kad je `config:cache` jednom pokrenut — a na
ispravno deployanom serveru jeste, i sam izlaz to kaže (`config: da`) — Laravel
**više nikad ne čita `.env`** i `env()` vraća `null` za sve.

Sada žive vrijednosti dolaze iz `config()`, a poređenje s `.env.example` čita
fajl s diska, jer je to jedino mjesto gdje taj odgovor postoji. Dodana je i
sekcija koja provjerava postoje li ključne tajne — nikad ne ispisuje vrijednost,
samo ima li je.

### `diagnose:perf` je mjerio odbijanje, ne aplikaciju

Petnaest ruta, svih petnaest `403`, sve oko 52 ms. To nije aplikacija — to je
nginx ili WAF koji odbija podrazumijevani Guzzle User-Agent prije nego zahtjev
uopšte stigne do Laravela.

Dvije izmjene: alat sada šalje User-Agent kakav šalje browser, i **prepoznaje
situaciju** — kad sve rute vrate isti ne-2xx status, prestaje praviti tabelu i
kaže da mjerenje nije doprlo do aplikacije, uz komandu za mjerenje iza ruba
(`--base=http://127.0.0.1:PORT --host=api-beta.techplay.gg`).

### Popis „ničijih" fajlova je bio tri četvrtine lažan

466 fajlova i 196 MB u `articles`, 61 fajl i 67 MB u `guides`. Skoro sve su
slike ugrađene u tekst članaka, gdje ih drži HTML a ne kolona.

Sada se čitaju i `content` kolone i iz njih vade `/storage/…` putanje. Lokalno
je popis pao s 408 fajlova (173 MB) na 64 (17,3 MB) — tek to je nešto o čemu se
može odlučivati.

### Sitnije

- Otkucaj rasporeda je pisao `-14.983623 s ranije`; Carbonov `diffInSeconds` je
  predznačen i decimalan.
- `diagnose:queue` je gledao tabelu `jobs` na osnovu `Schema::hasTable('jobs')`.
  Ta tabela postoji bez obzira na drajver, pa bi na Redis redu ispisala umirujuću
  nulu o redu koji nije ni pogledala. Sada grana po drajveru i imenuje ga; `sync`
  na produkciji se posebno prijavljuje, jer tada posjetilac čeka svaki posao.
- „Nula skenova" je tvrdnja o periodu, a period se nije ispisivao. Sada se čita
  `stats_reset`, uz `pg_postmaster_start_time()` kao donju granicu kad brojači
  nikad nisu ručno resetovani, i ispod tri dana se nula izričito označava kao
  neizmjerena.

---

## Zamka: `APP_DEBUG` i keš ruta se moraju mijenjati zajedno

Gašenje `APP_DEBUG` na produkciji je **oborilo admin panel**. Vrijedi zapamtiti
mehanizam, jer čeka svaku sljedeću izmjenu `.env`.

Livewire ime svoje skripte izvodi iz `app.debug` u trenutku registracije rute:

```php
config('app.debug')
    ? Route::get(EndpointResolver::scriptPath(minified: false), $handle)  // livewire.js
    : Route::get(EndpointResolver::scriptPath(minified: true), $handle);  // livewire.min.js
```

Iscrtana stranica izvodi isto ime na isti način, pa se to dvoje uvijek slaže —
osim ako su rute keširane pod jednom postavkom a stranica se iscrtava pod
drugom.

Same se ne mogu ispraviti: `Router::setCompiledRoutes()` **zamijeni cijelu
kolekciju** keširanom, i to u `booted` povratnom pozivu, dakle nakon što se svi
provideri podignu. Sve što Livewire registruje pri bootu se odbaci. Vrijedi samo
fajl keša.

Ishod: stranice traže `livewire.min.js`, keš zna samo za `livewire.js`, 404 se
vrati kao HTML, browser ga odbije izvršiti kao skriptu, i cijeli `/admin` je
mrtav.

**Pravilo:** svaka izmjena `.env` je `config:cache` **i** `route:cache`, pa
`supervisorctl restart techplay-octane:*`. `deployment/deploy.sh` to već radi
ispravnim redoslijedom; opasne su ručne izmjene.

`diagnose:config` sada poredi keširanu rutu s trenutnim `APP_DEBUG` i javi kad
se raziđu.

---

## Nalazi s produkcije (11. 08. 2026, 03:28)

### Redis nema gornju granicu — najozbiljnije

```
iskorišteno: 133.2 MB
maxmemory:   NIJE POSTAVLJEN
politika:    noeviction
```

Redis će rasti dok mašina ne odbije, a RAM dijeli s Postgresom. S `noeviction`
ishod nije usporenje nego **greška pri svakom upisu u keš** čim se memorija
napuni.

Ublažavajuće: od 20.000 pregledanih ključeva **nijedan nema beskonačan rok** —
svi ističu. To znači da je `volatile-lru` ispravan izbor (izbacuje samo ključeve
s rokom), a ne `allkeys-lru`, koji bi mogao pojesti i podatke koji nisu keš.

### `pg_stat_statements` nije uključen

Bez njega baza ne pamti koji upiti troše vrijeme. To je jedini alat koji na
pitanje „gdje odlazi vrijeme" odgovara imenom upita umjesto pretpostavkom.
Traži liniju u `postgresql.conf` i restart baze.

### Pulse nije snimao ništa

`pulse_entries` i `pulse_aggregates` imaju **nula skenova** na svim indeksima
(ukupno ~3,1 MB indeksa).

**Prvo objašnjenje je bilo pogrešno.** Zapisao sam da Pulse „snima na svaki
zahtjev a dashboard niko ne otvara", jer je `config/pulse.php` postavljen na
`env('PULSE_ENABLED', true)`. Provjera 11. 08. je pokazala suprotno:

```
enabled: false      entries: 0
```

U `.env` je stajalo `PULSE_ENABLED=false` — **dva puta**, na linijama 76 i 77.
Tabela je bila prazna, indeksi su bili prazni, i trošak koji sam pripisao Pulseu
nije postojao. Nula skenova ne znači „niko ne čita"; znači i „nema šta čitati",
a razlika se ne vidi iz brojača.

Uključeno je, uz `config:cache` + `route:cache` + restart Octanea (`PULSE_ENABLED`
utiče i na registraciju `/pulse` rute), i snima normalno. Podešavanje za
produkciju — Redis ingest i dva stalna procesa — u `docs/53-pulse-monitoring.md`.

Duplirani ključ u `.env` je i dalje tamo i vrijedi ga očistiti: dvije iste
varijable znače da onaj ko sljedeći put izmijeni jednu ne zna hoće li ta važiti.

### Ostali indeksi bez ijednog skena

`games_hub_name_idx` (6,7 MB), `games_release_precision_index` (1,2 MB),
`idx_article_views_throttle` (224 kB), `idx_threads_fulltext` (40 kB).

`idx_threads_fulltext` je zanimljiv: postoji fulltext indeks za forum, a
pretraga ga ne dira — vjerovatno ide kroz `ILIKE`. `idx_article_views_throttle`
je vjerovatno stvarno suvišan otkad se pregledi broje u Redisu.

**Sve ovo čeka ponovno pokretanje s ispravljenom komandom**, jer se sada uz
brojke ispisuje i otkad se broji.

### Disk: 577,7 MB, od toga 92,5 MB u prevelikim slikama

54 slike preko 1,5 MB. Next optimizacija je namjerno isključena, pa je ono što
je uploadovano tačno ono što posjetilac skine.

### 13 redova u `media.path` bez fajla

Slomljene slike na živim stranicama.

### Dvije aktivne sezone

Poznato i odgođeno: `Summer of Gaming 2026` se primjenjuje, `Season 1: Ignition`
traje ali je ignorisana, pa njeni questovi ne napreduju.

### Ono što je čisto

Svi sigurnosni headeri postoje (HSTS, CSP, X-Frame-Options, Permissions-Policy),
TLS ističe za 46 dana, `robots.txt` ne blokira sajt, raspored kuca, nijedan
posao nije pao, integritet podataka bez ijednog siročeta, nijedna isplata se
nije ponovila.

Jedina sitnica: `server: nginx/1.24.0 (Ubuntu)` i `x-powered-by: Next.js` odaju
verzije. Nije rupa, ali je besplatna informacija.

---

## Šta ostaje

Brojke s produkcije. Sve gore je lokalna kopija; jedina stvar koju lokalni izlaz
pouzdano govori jeste **da provjere rade**.

Na serveru:

```bash
cd /var/www/techplay/backend
php artisan diagnose > /tmp/diagnose.txt 2>&1
php artisan diagnose:storage --orphans >> /tmp/diagnose.txt 2>&1
php artisan diagnose:perf --limit=15 --delay=1200 >> /tmp/diagnose.txt 2>&1
cat /tmp/diagnose.txt
```

`diagnose:perf` je odvojen jer s većim brojem ruta potroši vlastiti rate limit.

---

## Veze

- `docs/35-plan-pune-analize.md` — Faza 2 u kontekstu cijelog plana
- `docs/46-p5-mrtav-kod.md` — brisanja iz P5, uključujući ono ispravljeno ovdje
- `docs/47-p6-integritet-podataka.md` — `diagnose:orphans`, koji je ovaj paket usvojio
