# 72 — Admin panel: završni pregled

*18. 08. 2026. Popis nakon dana rada na panelu. Sve brojke su izmjerene na
živom sistemu, ne procijenjene.*

---

## Kratko

| | |
|---|---|
| Ekrana u panelu (lista + kreiranje + izmjena) | **100** |
| Koji pucaju | **0** |
| Najsporiji ekran | Giveaways izmjena, 468 ms |
| Testova | 570, nijedan ne pada |
| Healthcheck | osam od osam |

Panel je konstrukcijski zdrav. Ono što je nađeno u ovom krugu nije bilo vidljivo
s ekrana — našlo se u **logovima servera** i u **poređenju svih lista odjednom**.

---

## 1. Nađeno i popravljeno

### 1.1 Živa greška u API-ju — `GamerDnaService`

```
SQLSTATE[42703]: column "avatar" does not exist
select "id", "username", "display_name", "avatar" from "users" where "id" in (82)
```

`peers()` je birao kolonu `avatar`. Tabela `users` je **nikad nije imala** — ima
`avatar_url`, i mapiranje odmah ispod upita je već čitalo `avatar_url`. Samo je
`select` bio pogrešan.

Posljedica: cijeli `/dna` endpoint je padao za **svakog čitaoca koji ima
peerove**. Ništa u panelu i ništa u test svити nije prolazilo tim putem —
nađeno je čitanjem produkcijskog loga.

Popravljeno, dva testa (`GamerDnaPeersTest`). Provjereno uživo: `build()`
prolazi, vraća peera s avatarom.

### 1.2 SEO Manager je brojao bajtove

Ekran čija je jedina svrha dužina meta naslova i opisa preko svih 625 članaka
mjerio je `strlen`.

| | |
|---|---|
| Naslova s krivom dužinom | 74 |
| Opisa s krivom dužinom | 141 |
| **Značaka s krivom bojom** | **8** |

### 1.3 `QueueMonitor` bez policy-a

Jedini model u panelu bez policy klase — stigao je s Jobs Monitor pluginom
istog dana. Filament za nemapiran model **dozvoljava sve**, a ta lista nosi
dvije grupne akcije nad jedinim zapisom o tome šta je palo i zašto.

Test `PanelToolingTest` sada pada ako ijedan model iza liste ostane nemapiran.

### 1.4 Quests: nijedna kolona sortabilna

42 reda, sedam kolona, nula sortabilnih. „Koji quest najviše plaća" nije imalo
odgovor na ekranu koji izlistava questove.

### 1.5 Games: 142.110 redova iza jednog filtera

Najtanji alat na najvećoj listi. Dodani **platforma** i **naslovnica**.

Platforma ide kroz `platforms @> ARRAY[?]::text[]` — operator koji
`games_platforms_gin` odgovara, a taj indeks je stajao **neiskorišten od strane
panela** otkad je katalog prepravljen.

```
PC                 80.720 pogodaka    najsporiji upit 1,9 ms
Nintendo Switch       174 pogotka
bez naslovnice      9.619 igara
```

### 1.6 nginx: 5.457 `[crit]` grešaka od jedne polovine posla

`deploy_frontend.sh` prazni keš za `/games/` sa `find -delete`. Ali brisanje
fajlova **ne kaže nginxu da ih nema** — indeks ključeva živi u dijeljenoj
memoriji mastera i preživi `reload`. Zato je poslije svakog deploya fronta
menadžer keša satima pokušavao izbaciti unose kojih na disku više nema:

> 5.457 `[crit] unlink() failed` u četiri sata, na kešu od 21.589 fajlova.

Skripta sada radi `systemctl restart nginx` poslije pražnjenja — što obnavlja
zonu iz onoga što stvarno postoji, traje ispod sekunde, i dolazi nakon što je
skripta već sačekala da novi front odgovori.

Izmjereno poslije: **0 grešaka u minuti**.

---

## 2. Mrtav kod — popis

Provjereno po referencama kroz `app/`, `routes/`, `config/`, `tests/`,
`database/`, `discord/` i front.

### 2.1 Servisi koje niko ne zove — **984 reda**

| Servis | Redova | Napomena |
|---|---|---|
| `SeoAnalyzerService` | 343 | |
| `KeywordDensityService` | 184 | |
| `GeminiService` | 179 | CLAUDE.md ga opisuje kao WoW analizu |
| `OpenAIService` | 156 | isto |
| `AltTextService` | 122 | a 887 slika je bez alt teksta |

**WoW analizu stvarno radi `GroqService`**, uz `BlizzardService`,
`BlizzardDataTransformerV2` i `RaiderIOService`. Dokumentacija zaostaje za
kodom.

`AltTextService` je najzanimljiviji: postoji servis za generisanje alt teksta,
i postoji 887 slika bez njega, a njih dvoje se nikad nisu sreli.

### 2.2 Posao koji se ne dispečuje — 41 red

`Jobs/PingIndexNow`. Observer koristi **`SubmitIndexNow`**; `PingIndexNow`
nema nijedan `dispatch`. CLAUDE.md nabraja oba.

### 2.3 Blade pogledi bez ijedne reference — **447 redova**

```
filament.forms.components.seo-score       231
filament.components.social-preview        147
filament.forms.components.seo-preview      41
filament.components.serp-preview           28
```

Sve četiri su SEO pretpregledi iz ranije verzije SEO taba.

**Ukupno mrtvog koda: 1.472 reda.** Ništa od toga nije obrisano — brisanje 1.472
reda nije odluka koja se donosi usput tokom pregleda. Popis je ovdje da odluka
bude tvoja.

---

## 3. Dva lažna nalaza, zapisana da se ne ponove

Oba su nastala brojanjem umjesto čitanjem — isti obrazac koji je ovaj projekat
već platio.

**„40 mrtvih komandi."** Artisan komande se pozivaju **potpisom**
(`php artisan media:tidy`), ne imenom klase. Grep po imenu klase ne nalazi
ništa i sve izgledaju mrtve. Od 42 komande, 18 je zakazano, a ostale su ručni
alati — što je ono što jesu, ne mrtav kod.

**„Devet mrtvih CSS klasa."** `tp-tone-good`, `tp-mark--draft` i ostale se
sklapaju u PHP-u (`'tp-tone-'.$tone`), pa literalni grep promaši sve.

---

## 4. Brzina i stabilnost

### Svih 100 ekrana, poslije izmjena

| | |
|---|---|
| Puca | 0 |
| Najsporiji | Giveaways izmjena 468 ms (3 upita — Blade, ne baza) |
| Liste članaka | 303–353 ms, 13–14 upita |
| Games (142k redova) | 226 ms, **1 upit** |

Pojas iznad liste košta oko pet upita i ~40 ms, keširan pet minuta.

Baza nije usko grlo nigdje: najsporiji pojedinačni upit u cijelom pregledu je
ispod 3 ms. Ostatak je Blade, što je isti pojas za sve liste u panelu.

### Logovi

`storage/logs` je 23 MB, od čega je `laravel.log` **11,7 MB** i sav je
posljedica jedne stvari: **kanal `deprecations`** nije postojao 17. 08., pa je
svako PHP upozorenje postajalo `EMERGENCY` sa stack traceom. 641 put. Danas
toga više nema (0 pojava u dnevnom logu), ali stari fajl stoji i može se
obrisati.

Dvije deprecation poruke koje su to pokretale i dalje postoje u kodu:
`str_getcsv()` bez `$escape` (PHP 8.4) i jedna iz `symfony/http`.

---

## 5. Ostaje otvoreno

| | |
|---|---|
| Mrtav kod, 1.472 reda | tvoja odluka: brisati ili zadržati |
| `laravel.log` 11,7 MB | stari emergency izlaz, može se obrisati |
| `str_getcsv()` deprecation | PHP 8.4 traži `$escape` argument |
| psysh piše ERROR u log | `php artisan tinker` bez upisivog HOME-a; smeta traženju pravih grešaka |
| Jobs lista bez pretrage | 218 redova, tabela plugina — mijenjanje znači prepisivati tuđi ekran |
| CLAUDE.md zaostaje | WoW servisi, `PingIndexNow`, NeoBrutalism tema |
