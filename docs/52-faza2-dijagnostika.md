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
