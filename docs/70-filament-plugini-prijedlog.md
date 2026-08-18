# Filament plugini: šta vrijedi, a šta nam ne treba

*Istraživanje 18.08.2026. Svaka verzija provjerena na Packagistu i protiv naše
stvarne instalacije, ne po opisu na sajtu.*

Ekosistem ima **979 plugina od 453 autora**. Ovo je filtrirano kroz ono što je u
ovom panelu stvarno viđeno kao rupa, i kroz dva ograničenja koja odbacuju dobar
dio ponude.

---

## Prvo: dva ograničenja koja odlučuju

### 1. Filament v5 je nov, i mnogi plugini ga ne prate

v5 je izašao 16.01.2026. i **nema funkcionalnih promjena u odnosu na v4** —
jedina je razlika podrška za Livewire v4. To znači da plugin koji radi na v4
najčešće radi i na v5, ali ga composer neće pustiti dok autor ne doda `^5.0` u
ograničenja. Filament ima skriptu koja pri nadogradnji provjeri plugine i javi
koji nisu spremni.

### 2. Imamo dvije PHP verzije, i to tiho bira starije plugine

| Gdje | Verzija |
|---|---|
| Composer / `php artisan` (CLI) | **8.3.32** |
| FrankenPHP koji servira aplikaciju | **8.4.16** |
| `composer.json` → `config.platform` | zaključan na **8.3.29** |

Posljedica nije teoretska. `pxlrbt/filament-activity-log` ima v3.1.2 (14.08.2026),
ali ona traži PHP 8.4 — pa je composer kod nas razriješio na **v2.2.0**, godinu
stariju. Provjereno pokretanjem `composer require --dry-run` na serveru.

Srećom, v2.2.0 podržava `filament ^4.0|^5.0`, pa radi. Ali obrazac vrijedi
uopšteno: **dok CLI PHP ne pređe na 8.4, dobijamo starije linije plugina.**

---

## Drugo: ovo je već u jezgru — ne treba plugin

Provjereno postojanjem klasa u instaliranom Filamentu v5.6.7:

| Funkcija | Klasa |
|---|---|
| Uvoz iz CSV-a | `Filament\Actions\ImportAction` |
| Izvoz u CSV/XLSX | `Filament\Actions\ExportAction` |
| Grafikoni (Chart.js) | `Filament\Widgets\ChartWidget` |
| Pregled zapisa (infolist) | `Filament\Infolists\...` |
| Rich editor | `Filament\Forms\Components\RichEditor` |
| Napredni filteri | `Filament\Tables\Filters\QueryBuilder` |
| Wizard obrasci | `Filament\Schemas\Components\Wizard` |
| Notifikacije u bazi | `Filament\Notifications\DatabaseNotification` |

Za bilo šta od ovoga plugin bi bio čist gubitak — dodatna zavisnost za nešto što
već imamo.

---

## Prijedlozi, po vrijednosti za **ovaj** panel

### 1. Activity log — dnevnik ko je šta promijenio

`pxlrbt/filament-activity-log` · 824k instalacija · `filament ^4.0|^5.0`

**Zašto baš nama:** panel ima 38 ekrana i više ljudi koji objavljuju. Danas
postoji jedino `content_versions` (64 reda) i to samo za članke. Ko je promijenio
cijenu, ko je obrisao komentar, ko je ugasio giveaway — nigdje ne piše.

**Cijena:** dolazi uz `spatie/laravel-activitylog`, dakle nova tabela i po jedan
upis na svaku izmjenu. Kod nas nema `spatie/laravel-activitylog`, pa je to nova
zavisnost.

**Kvaka:** kod nas bi se instalirala **v2.2.0**, ne najnovija — vidi ograničenje 2.

### 2. Backup u panelu

`shuvroroy/filament-spatie-laravel-backup` · 523k instalacija · `^4.0|^5.0`

**Zašto:** backup od sinoć radi svake noći u 03:15 na StorageBox, i **nigdje se
u panelu ne vidi.** Ovaj plugin daje stranicu s popisom backupa, veličinama,
datumima i dugmetom za ručno pokretanje i preuzimanje.

**Kvaka:** traži `spatie/laravel-backup`, a naš backup je **vlastita skripta**
(`/usr/local/bin/techplay-backup`). Prelazak znači zamjenu onoga što radi. To je
argument protiv, osim ako se hoće baš vidljivost u panelu.

### 3. Spotlight — ⌘K za navigaciju

`pxlrbt/filament-spotlight` · 528k instalacija · `^3.0|^4.0|^5.0`

**Zašto:** 36 stavki u sidebaru. Tipkanje umjesto traženja očima je stvarna ušteda.

**Ali prvo treba ovo:** globalna pretraga je podešena na **4 od 37 resursa**.
Bez toga spotlight nalazi ekrane, ali ne i zapise. Podesiti
`getGloballySearchableAttributes()` na glavnim resursima je posao od pola sata i
**poboljšava i postojeću pretragu u topbaru** — pa to vrijedi uraditi bez obzira
na plugin.

### 4. Health stranica u panelu

`shuvroroy/filament-spatie-laravel-health` · 812k instalacija · `^4.0|^5.0`

**Zašto ne odmah:** već imamo `/usr/local/bin/techplay-healthcheck` svakih 5
minuta s Telegram obavijestima, Netdata i GlitchTip. Ovo bi dodalo isti podatak
na četvrto mjesto. Vrijedi jedino ako se hoće da urednici vide stanje bez SSH-a.

---

## Šta bih preskočio, i zašto

| Plugin | Zašto ne |
|---|---|
| **Filament Shield** (4,6M instalacija) | Najpopularniji za dozvole, i radi na v5 — ali imamo **sedam ručno pisanih policy klasa** s namjernom strukturom (`AdminOnlyPolicy`, `ContentPolicy`, `ModerationPolicy`…) i 35 mapiranja. Shield generiše svoje po resursu. To je zamjena promišljenog sistema generisanim, ne dobitak. |
| **Curator / media manager** | Već imamo `MediaPickerFields` komponentu koju koristi 7 resursa, i `MediaResource`. Curator k tome **ne radi** sa Spatie Media Library, pa bi bio treći sistem za slike. |
| **Teme (Material 3 i slične)** | Upravo smo napravili temu iz tokena sajta. Gotova tema bi se tukla s njom. |
| **Charts pluginovi** | `ChartWidget` je u jezgru. |
| **Schedule Monitor** | Traži Filament v3; nije spreman za v5. |

---

## Preporuka

**Uraditi bez plugina, prvo:**

Podesiti globalnu pretragu na glavnim resursima (4/37 → svi važni). To je jedina
stvar s ovog spiska koja **odmah** poboljšava svakodnevni rad i ne košta
zavisnost.

**Ako se dodaje samo jedan plugin: activity log.** Panel danas ne zna reći ko je
šta promijenio, a to je jedino pitanje na koje se ne može odgovoriti ni iz koda
ni iz baze.

**Prije bilo čega drugog: podići CLI PHP na 8.4** da se poklopi s onim koji
aplikacija ionako već koristi. Inače svaki plugin koji se ubuduće instalira
dolazi u starijoj liniji, tiho.

---

## Urađeno *(18.08.2026)*

Obje preporuke koje ne traže plugin.

### CLI PHP 8.3 → 8.4

Instaliran `php8.4` sa **svim** ekstenzijama koje je 8.3 imao — provjereno
`diff`-om spiska modula, prazan. Prije prebacivanja podrazumijevanog testirano
pod 8.4: Laravel bootuje, baza i Redis odgovaraju, Filament učitava 38 resursa,
admin stranica vraća 200.

| | Prije | Poslije |
|---|---|---|
| CLI / composer / artisan | 8.3.32 | **8.4.24** |
| FrankenPHP (servira aplikaciju) | 8.4.16 | 8.4.16 |
| `config.platform.php` | 8.3.29 | **8.4.16** |

Platform pin ide na **8.4.16**, dakle na nižu od dvije verzije koje stvarno
rade — tako razrješavanje paketa vrijedi i za CLI i za servirani proces.

**Dokaz da je vrijedilo:** isti `composer require --dry-run` koji je prije
nudio `pxlrbt/filament-activity-log` **v2.2.0** sada nudi **v3.1.2**.

Restartovani svi servisi koji idu preko CLI PHP-a — Octane, queue worker i
Reverb. Scheduler radi, healthcheck svih osam zeleno.

### Globalna pretraga, bez plugina

Bila je podešena na četiri resursa — Ad Campaigns, Media, Redirects i Roles —
što je otprilike četiri koja bi čovjek najmanje tražio. Sada je na **14**.

Deset dodanih: News, Reviews, Tech, Guides, Games, Users, Threads, Giveaways i
obje kategorije. Svaki pogodak nosi red konteksta — sekciju i status za članke,
godinu izlaska za igru, e-mail za korisnika — jer dva slična naslova bez toga
izgledaju isto.

**Limit je spušten sa 50 na 5 po resursu.** Sa 142.110 igara svaka česta riječ
je preplavljivala panel: pretraga „adi" vraćala je pedeset igara i zatrpala dva
korisnika koje je zapravo tražila.

| Upit | Prije | Poslije |
|---|---|---|
| „elder scrolls" | 56 pogodaka, 212 ms | **10**, 119 ms |
| „adi" | 70 pogodaka, 122 ms | **14**, 66 ms — *korisnici se sada vide* |
| „gaming" | 55 pogodaka, 296 ms | **21** kroz 7 vrsta, 146 ms |

Uže je i **brže**, jer se ne dohvaća pedeset redova po resursu.

Svih 38 lista se i dalje iscrtava bez greške.
