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
posljedica jedne stvari: kanal `deprecations` se nije razrješavao, pa je svako
PHP upozorenje postajalo `EMERGENCY` sa stack traceom.

> **Ispravka, isti dan.** Ovdje je prvo pisalo „danas toga više nema". Nije bilo
> tačno. Provjera je bila `Log::channel('deprecations')` — a taj poziv **tiho
> padne na emergency logger** umjesto da baci grešku, pa je „kanal radi" bilo
> lažno. Vidjelo se tek kad je probe zavrsio **u samom `laravel.log`-u**.
>
> Pravi uzrok: `.env` kaže `LOG_DEPRECATIONS_CHANNEL=null`, a Laravel
> nekvotirani `null` čita kao **PHP null**. Podrazumijevana vrijednost `'null'`
> u `env($key, $default)` vrijedi samo kad ključ **nedostaje**, nikad kad
> postoji i null je. Kanal `null` postoji cijelo vrijeme, deset redova niže u
> istom fajlu — samo ga niko nije tražio.
>
> To je i uzrok onih 259 petstotina na `/api/v1/games/{slug}`: izuzetak se
> diže iz `HandleExceptions` usred zahtjeva, pa bezopasno upozorenje postane
> HTTP 500.
>
> Popravljeno s `env('LOG_DEPRECATIONS_CHANNEL') ?: 'null'`, koje ne zavisi od
> navodnika u `.env`. `DeprecationChannelTest` provjerava **razrješava li se
> kanal**, ne ima li config vrijednost. `laravel.log` ispražnjen; poslije 60
> sekundi i dalje 0 bajta.

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

---

## Dopuna: mrtav kod obrisan, alt tekst spojen *(isti dan)*

### Obrisano — 1.350 redova

| | redova |
|---|---|
| `SeoAnalyzerService` | 343 |
| `seo-score.blade` | 231 |
| `KeywordDensityService` | 184 |
| `GeminiService` | 179 |
| `OpenAIService` | 156 |
| `social-preview.blade` | 147 |
| `Jobs/PingIndexNow` | 41 |
| `seo-preview.blade` | 41 |
| `serp-preview.blade` | 28 |

`AltTextService` je **zadrzan i ukljucen**, jer alt tekst treba za SEO.

### Zasto ga nije bilo dovoljno samo pozvati

Nad nasim storageom stari servis je davao ovo:

```
01KEQ5KW66WJGTKV4KBRH7WEH4.webp   ->  Keq5Kw66Wjgtkv4Kbrh7Weh4
usUTo74GmWm0hYlJLA1yYR10R8...png  ->  Usuto74Gmwm0Hyljla1Yyr10R8...
```

Filament snima pod generisanim identifikatorom, pa „parsiraj ime fajla" ovdje
nije strategija nego masina koja cita masinsko knjigovodstvo i zove to opisom.
**Takav alt je gori od praznog:** Google ga obezvrijedi, a citac ekrana ga
procita naglas, slovo po slovo, nekome ko je pitao sta je na slici.

Servis sada vazi jedno pravilo — **radije nista nego sum**. `suggest()` vraca
`null` kad nema nista posteno, i redom pokusava:

1. natpis koji je covjek napisao,
2. ime s kojim je fajl stigao, ako je to jezik,
3. naslov teksta koji slika ilustruje,
4. nista.

### I onda se naslo zasto to nikad nije ni radilo

`featured_image_alt` stoji na formi, u Media tabu, otkad taj tab postoji — i
**zavrsavao je u bazi.** `ArticleResource` ga nije slao, nijedna stranica ga
nije citala, a front je za `alt` koristio naslov clanka.

`ReviewResource` ga je slao od ranije, ali ga `ReviewDetailView` nije koristio.

Znaci svaki opis koji je urednik pazljivo napisao za naslovnu sliku isao je u
nista, godinu dana.

### Poslije

| | prije | poslije |
|---|---|---|
| Clanaka bez opisa naslovne slike | 345 od 625 | **0 od 626** |
| Slika u biblioteci bez opisa | 887 od 1.167 | 538 od 1.168 |
| Stize li opis do stranice | **ne** | da |

Onih 538 su slike iz tijela teksta koje nijedan clanak ne koristi kao
naslovnu, s generisanim imenima — servis ih posteno odbija umjesto da izmisli.

Provjereno na zivoj stranici:

```
alt="Arc Raiders, no logo, no text just plain image"
```

umjesto naslova clanka, koji je tu stajao ranije.

---

## Sta su alati za nadzor prijavili *(18.08.2026, uvece)*

Provjereni su GlitchTip, Netdata i logovi — sve troje otkako su postavljeni.

### GlitchTip: 301 dogadjaj, 17.08 17:25 → 18.08 16:21

| sat | dogadjaja |
|---|---|
| **17.08 23:00** | **277** |
| ostalih jedanaest sati | 24 |

Devedeset dva posto svega je jedan sat. Rasporedjeno po vrsti:

| vrsta | puta | sta je |
|---|---|---|
| `500` na `/api/v1/games/{slug}` | **259** | prava greska, jedan uzrok |
| `Could not reach the API` | 27 | **nase** — restarti Octanea pri deployu |
| `500` na `/api/v1/news/{slug}` | 10 | isti uzrok |
| `500` na `/api/v1/reviews/{slug}` | 2 | isti uzrok |
| `Failed to find Server Action` | 1 | neko je imao staru stranicu otvorenu za vrijeme deploya |
| React `#418` | 1 | neslaganje pri hidraciji |
| `RuntimeException: provjera GlitchTipa (drugi pokusaj)` | 1 | **nas test** pri postavljanju |

### Uzrok onih 271 pete stotine

```
$request->get()                     Symfony 7.4 ga je oznacio zastarjelim
  -> Laravel salje deprecation na kanal "deprecations"
  -> config kes bio zastario, kanal se nije razrjesavao
  -> InvalidArgumentException usred zahtjeva
  -> HTTP 500
```

**Bezopasno upozorenje postalo je tvrda greska zato sto je zapisivanje tog
upozorenja pucalo.** Isti korijen kao 11,7 MB `laravel.log`-a iz ranijeg dijela
ovog pregleda — samo sto je tamo proizveo smece u logu, a ovdje 500 na stranici
igre.

Kanal se danas razrjesava, jer je `config:cache` usput osvjezen. To je krhko:
zavisi od toga je li kes svjez. Zato je popravljen **izvor** — 32 poziva u 14
fajlova prelaze na `$request->input()`, pa se deprecation vise ne emituje i 500
se ne moze vratiti bez obzira na stanje kesa.

### Nase greske, prepoznate po vremenu

Onih 27 `Could not reach the API` dolaze u parovima i trojkama, svaki put
nekoliko sekundi oko restarta Octanea: 20:23, 20:36, 21:09, 22:01, 22:23,
22:48, 23:07, 23:18, 23:51, pa 18.08 u 07:56, 10:38, 10:52, 11:34, 11:59,
12:24, 13:49, 16:21. Svaki od tih trenutaka je jedan nas deploy.

To nije greska sajta nego posljedica toga kako deployamo — kratak prozor dok
Octane ustaje. Vrijedi znati da tako izgleda u alatu, da se ne trazi uzrok
tamo gdje ga nema.

### Netdata: **609 alarma naoruzano, nijedan nije okinuo**

| | |
|---|---|
| Alarma u normali | 609 |
| Warning | 0 |
| Critical | 0 |

Za dane rada nijedan nije prijavio nista — sto je dobra vijest, ali sam po sebi
nije dokaz da bi prijavio. Zato je put provjeren: `alarm-notify.sh test` je
poslao tri poruke na Telegram (WARNING → CRITICAL → CLEAR), i to preko **istog
bota** koji koristi aplikacija (`sha256` tokena se poklapa).

Jedna zamka usput: `health.d/` je prazan, sto na prvi pogled izgleda kao da
alarma nema. Nema **nasih** alarma; onih 141 fabrickih zivi u
`/usr/lib/netdata/conf.d/health.d/`.

### Ostaje

Telegram token stoji u citljivom obliku u `/etc/netdata/health_alarm_notify.conf`
— vec je na spisku za rotaciju.
