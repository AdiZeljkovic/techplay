# Plan pune analize TechPlaya — 30 područja

Radni plan, ne izvještaj. Trideset traženih područja razvrstanih po tome **šta je
za njih stvarno potrebno**, pa poredanih tako da se prvo iscrpi ono što ne traži
ništa osim koda, zatim ono što traži brojke s produkcije, pa tek onda ono što
traži pristup mašini ili alate izvana.

Svaki paket ima: šta pokriva, kako se izvršava, šta ostaje iza njega i grubu
procjenu. Paketi su namjerno takve veličine da svaki stane u jednu sesiju.

**Šta je već urađeno 08.08.2026** je označeno — pregled iz `docs/34` pokrio je
dio ovih područja u širinu i popravio nađeno. Gdje piše *produbiti*, znači da
je površina pregledana ali ne endpoint-po-endpoint.

---

## Faza 1 — iz koda, bez ičega vanjskog

Devet paketa. Ne traže pristup, ne traže da ti išta pokrećeš, i mogu se raditi
bilo kojim redom — ali poredani su po tome koliko vjerovatno kriju nešto skupo.

### P1. Autorizacija, IDOR i vlasništvo — *područja 7, dijelom 6*
**Zašto prvo:** `docs/34` je utvrdio da u 81 kontroleru nema nijednog
`authorize()` ni `Gate::`, i da dvije sheme rola daju različite odgovore po
endpointu. To je jedina kategorija gdje jedan propust znači da stranac čita ili
mijenja tuđe podatke.

**Kako:** ručno kroz svih ~296 ruta. Za svaku: ko smije, gdje se to provjerava,
i šta se desi kad se `{id}` zamijeni tuđim. Posebno gledati rute koje primaju
identifikator resursa a ne izvode ga iz `$request->user()`.

**Ostaje:** tabela svih ruta s ocjenom (`ok` / `slabo` / `rupa`), popravke za
rupe, i predlog jedne sheme rola umjesto dvije.
**Procjena:** 1–2 sesije.

> **URAĐENO 09.08.2026 → `docs/36-p1-autorizacija.md`.** Klasičnog IDOR-a nema
> — svaka izmjenjujuća ruta veže zapis za pozivaoca. Rupe su bile druge vrste:
> isti podatak dostupan kroz druga vrata bez provjere (privatni klanski forumi,
> liste skrivenih profila, prisutnost), provjere koje se nikad ne izvršavaju
> (blokiranje, potpis verifikacionog linka, zakomentarisana PayPal verifikacija),
> i ekonomija bez idempotencije (prekidač rješenja, finansiraj-pa-otkaži).
> Sve popravljeno, 13 regresionih testova dodato, 370/370 prolazi.
>
> Ostaje otvoreno i **prelazi u P2/P4**: Xbox povezivanje bez dokaza vlasništva
> (traži OAuth), PayPal webhook bez zaštite od ponavljanja, i **jedna shema rola
> umjesto dvije** — forum i dalje ima četiri odvojena spiska osoblja plus
> `users.role` kao paralelni sistem uz Spatie.

### P2. Filament — *područje 8*
Pristup panelu (`canAccessPanel` gleda `role === 'admin'`), policies po resursu,
**bulk akcije** (najopasnije — brišu u gomili i često nemaju provjeru), custom
stranice, destruktivne akcije, i postoji li MFA za administratore.

**Ostaje:** popis resursa s pravima koja stvarno provjeravaju, popravke, i
odgovor na pitanje treba li panelu drugi sloj zaštite (IP, MFA).
**Procjena:** 1 sesija.

> **URAĐENO 09.08.2026 → `docs/37-p2-filament.md`.** 30 od 35 resursa nije imalo
> nikakvu autorizaciju, a `view admin panel` nose i Moderator i Journalist — pa
> je moderator mogao čitati adrese kupaca, mijenjati cijene, paliti maintenance
> mode i obrisati katalog od 187k igara u gomili. Obrnuto, `CommentPolicy` je
> gledala samo `role === 'admin'`, pa moderator nije mogao moderirati komentare.
> Uvedena jedna shema od četiri sloja naslonjena na postojeća ovlaštenja;
> nerazvrstan model nema pristup. Brisanje u gomili je svugdje samo adminovo.
> 8 testova zaključava matricu, 378/378 prolazi.
>
> **Odgovor na pitanje o drugom sloju:** prijava već ima ograničenje pokušaja
> (Filament `rateLimit(5)`). MFA postoji u Filamentu v5 ali nije uključen —
> preporučen, nije izveden, jer traži migraciju i upis svih administratora.

### P3. Ulazna i API sigurnost — *područja 9, 10, 11*
XSS (gdje ide `dangerouslySetInnerHTML` i šta ga sanitizuje), SQLi (sirovi
upiti — danas provjereno da su parametrizovani, treba potvrditi za nove),
Markdown, URL-ovi, **imena fajlova i uploadi** (`ImageUploadRequest` postoji i
niko ga ne koristi), SVG, mass assignment, over-fetching u resursima (šta API
šalje a ne treba), enumeracija korisnika, i otpornost na botove i spam.

**Ostaje:** popravke, i jedan `FormRequest` po write-endpointu umjesto inline
validacije na 296 mjesta.
**Procjena:** 1–2 sesije.

> **URAĐENO 10.08.2026 → `docs/38-p3-ulazna-sigurnost.md`.** Tri rupe: Filamentov
> `->image()` je primao SVG (skripta na istom porijeklu gdje stoji admin sesija),
> `PageSeo.seo_text` se čuvao i renderovao sirov na hostu gdje token stoji u
> localStorage, i javni profil je slao tuđi `bounty_balance` koji frontend ionako
> prikazuje samo vlasniku. Ostalo provjereno pa odbačeno: SQLi (svi `whereRaw`
> vezuju parametre, Filamentov `{$direction}` je normalizovan), Laravel 12 `image`
> pravilo ne pušta SVG, HTMLPurifier `staff_content` profil je dobro postavljen,
> `processContent` ima ograničene capture grupe. 380/380 prolazi.
>
> **Namjerno ostavljeno:** enumeracija pri registraciji (proizvodna odluka, traži
> novi e-mail tok) i `FormRequest` refaktor — validacija postoji svugdje, samo je
> inline, pa to vrijedi raditi uz izmjene endpointa a ne kao jedan veliki prolaz.

### P4. Poslovna logika, end-to-end — *područje 4*
Najveći paket, pa ide po cjelinama, jedna po sesiji:
registracija i verifikacija · profil, XP, rankovi, questovi, sezone · kolekcija
i liste · forum i komentari · klanovi · shop i narudžbe · giveaways · chronicle
i preporuke · Discord bot.

Za svaku: sva stanja kroz koja objekat prolazi, ko ih smije mijenjati, šta se
desi na svakom prekidu (zatvoren tab, dupli klik, istekla sesija), i da li
postoji stanje iz kojeg se ne može izaći.

**Ostaje:** dijagram stanja po cjelini i popis mrtvih uglova.
**Procjena:** 6–8 sesija.

> **Cjelina 1/9 — registracija i verifikacija — URAĐENO 10.08.2026 →
> `docs/39-p4-registracija-verifikacija.md`.** Dva mrtva ugla, oba su zatvarala
> korisnike van naloga: (1) **nije postojao nijedan način da se povrati
> zaboravljena lozinka** — login je linkovao stranicu koja nikad nije napravljena,
> backend nije imao endpoint; sada postoji pun tok koji uz to gasi sve stare
> sesije; (2) nalozi napravljeni preko Discorda imali su nasumičnu lozinku koju
> niko nije vidio i nisu je mogli promijeniti ni resetovati.
>
> Uz to, na traženje: **Discord prijava popravljena** — driver nije bio
> registrovan (svaki poziv 500), `redirect()` je vraćao JSON umjesto redirecta,
> a podrazumijevani redirect URI vodio je na putanju koju Next.js ne poslužuje.
> U istoj izmjeni zatvoreno i preuzimanje naloga: spajanje po e-mailu sada traži
> da su **obje strane** potvrdile istu adresu.
>
> I **neverifikovane registracije se čiste** — `users:prune-unverified` dnevno,
> ali samo naloge bez ijedne aktivnosti, jer "neverifikovan" može biti i stari
> nalog iz vremena prije nego je verifikacija postala obavezna.
>
> Sljedeće cjeline: profil/XP/rankovi · kolekcija i liste · forum i komentari ·
> klanovi · shop · giveaways · chronicle · Discord bot.

### P5. Mrtav kod i pokvarene reference — *područja 2, 3*
*Dijelom urađeno:* 26 fajlova obrisano, 16 nespojenih funkcionalnosti nađeno.
**Produbiti:** neiskorištene rute, modeli bez upotrebe, **kolone i tabele koje
niko ne čita**, mrtve `config` stavke i `env` varijable, feature flagovi,
pokvareni importi i assets, linkovi na obrisane stranice, stari slugovi.

**Ostaje:** brisanje, i popis kolona koje čekaju migraciju.
**Procjena:** 1 sesija.

### P6. Integritet podataka iz koda — *područje 5, kod-strana*
Gdje se piše u više koraka bez transakcije, gdje postoji provjeri-pa-uradi
utrka (nađena jedna kod `rewards/redeem`), gdje uvoz može ostati napola, i koje
putanje mogu proizvesti siročad. Stvarne duplikate i siročad u podacima gleda
Faza 2.

**Ostaje:** popravke + popis upita za Fazu 2 koji traže stvarne siročad.
**Procjena:** 1 sesija.

### P7. Laravel i Next.js u dubinu — *područja 14, 15*
*Dijelom urađeno.* **Produbiti:** granice servisa (šta je u kontroleru a treba
biti u servisu), događaji i poslovi, middleware; na frontu Server/Client
podjela, waterfalls, veličina bundlea po ruti, hidracija.

**Ostaje:** popis komponenti koje ne moraju biti klijentske, i plan za
framer-motion (164 KB na svakoj ruti).
**Procjena:** 1–2 sesije.

### P8. Tajne i zavisnosti — *područja 12, 13*
*Dijelom urađeno:* lozinke izvađene iz skripti, dump u historiji identifikovan.
**Produbiti:** `composer audit` i `npm audit`, napušteni paketi, zavisnosti koje
se ne koriste, i **plan čišćenja git historije** — jer to traži dogovor, force
push i prisilnu promjenu lozinki.

**Ostaje:** popis ranjivosti s ocjenom iskoristivosti, i pisani postupak za
čišćenje historije.
**Procjena:** 1 sesija.

### P9. Arhitektonska mapa — *područje 1, kod-strana*
Sve što se vidi iz koda: servisi, ulazne tačke, tok podataka, third-party
integracije i šta se desi kad svaka od njih otkaže. Stvarna topologija (nginx,
Cloudflare pravila, šta zaista radi na mašini) dolazi u Fazi 3.

**Ostaje:** dijagram i tabela integracija s procjenom rizika.
**Procjena:** 1 sesija.

---

## Faza 2 — dijagnostika koju ti pokreneš

Ja pišem alat, ti pokreneš jednu komandu, pošalješ izlaz. Bez kredencijala, bez
pristupa, a pokriva deset područja o kojima se iz koda može samo nagađati.

Ovo se piše **u jednoj sesiji**, poslije P1–P3, i naslanja se na ono što već
postoji (`games:enrichment-status`, `db:sizes`, `system/health`).

### `php artisan diagnose` — jedan izlaz, deset odgovora

| Provjera | Područje | Šta ispisuje |
|---|---|---|
| `diagnose:db` | 16 | Neiskorišteni indeksi (`idx_scan = 0`), strani ključevi bez indeksa, bloat, `pg_stat_statements` top 20 po vremenu, dugi lockovi, tabele bez primarnog ključa |
| `diagnose:data` | 5 | Stvarni duplikati po ključnim tabelama, siročad po svakoj relaciji, redovi koji krše očekivane invarijante |
| `diagnose:redis` | 17 | `maxmemory` i politika, ukupna memorija, broj ključeva po prefiksu, **ključevi bez TTL-a**, dubina redova, uzorak vrućih ključeva |
| `diagnose:queue` | 18 | `failed_jobs` po klasi, najstariji posao u redu, prosječno vrijeme čekanja, poslovi koji se ponavljaju |
| `diagnose:schedule` | 19 | Zadnje izvršavanje po zadatku, koji su preskočeni, koliko traju |
| `diagnose:storage` | 25 | Veličina po direktoriju, **fajlovi bez reda u bazi**, redovi bez fajla, najveći fajlovi |
| `diagnose:config` | 30 | `APP_DEBUG`, `APP_ENV`, drajveri, koje `.env` varijable nedostaju u odnosu na `.env.example`, razlike backend↔frontend |
| `diagnose:http` | 30 | Sigurnosni headeri, CORS, zastavice kolačića, `robots.txt`, TLS istek — mjereno s same mašine |
| `diagnose:perf` | 20 | Vrijeme odgovora po najprometnijim rutama, broj upita i vrijeme u bazi po zahtjevu |
| `diagnose:media` | 25 | Slike bez varijanti, prevelike originalne slike, neupotrijebljeni uploadi |

Sve je **samo za čitanje**. Nijedna provjera ništa ne mijenja.

**Ostaje:** jedan izlaz koji odgovara na područja 5, 16, 17, 18, 19, 20, 25 i 30
stvarnim brojkama umjesto pretpostavkama.
**Procjena:** 1–2 sesije za pisanje, tebi 5 minuta za pokretanje.

---

## Faza 3 — s pristupom mašini

Ovdje pristup stvarno treba, jer se ne ispisuje nego **mijenja**. Redoslijed je
po tome šta te najviše košta ako se desi večeras.

### S1. Oporavak od katastrofe — *područje 28*
Cron za `deployment/backup.sh`, prva stvarna proba vraćanja u praznu bazu,
odluka o PITR-u (WAL arhiviranje), i **napisan postupak oporavka** — ne u
nečijoj glavi. Ovo je prvo jer sve ostalo pretpostavlja da podaci postoje.

### S2. Observability — *područje 26*
Sentry ili Flare za greške, uptime provjera na `/system/health`, alarmi na
disk, dubinu reda i memoriju Redisa, rotacija logova, `LOG_LEVEL` na `warning`.
Bez ovoga svaka sljedeća faza radi naslijepo.

### S3. Produkcijska konfiguracija — *područje 30*
Redis `maxmemory` i politika, nginx s TLS-om **u repozitorij** (sada postoji
samo na disku), `real_ip` za Cloudflare (bez toga svaki rate limit gleda CF-ov
IP), headeri, CORS, kolačići, provjera `APP_DEBUG`.

### S4. Deployment i skaliranje — *područja 21, 27*
Release direktoriji sa symlink zamjenom i rollbackom jednom komandom, build u
CI-ju umjesto na produkcijskoj mašini, pravilo expand/contract za migracije,
supervisor za sve procese a ne samo za Octane, pm2 u cluster modu.

### S5. Staging — *preduslov za Fazu 4*
Mašina koja se noću vraća iz backupa. Rješava dvije stvari odjednom: dokazuje
da backup radi, i daje metu za load testiranje koja nije produkcija.

---

## Faza 4 — alati izvana

Traži staging (S5) i alate koje treba pokrenuti, ne pročitati.

### E1. Load i stress — *područje 22*
**Nikad na produkciju.** Na stagingu, k6 ili Artillery: normalno opterećenje,
špic, nagli skok, soak preko noći, pa namjerno rušenje jedne komponente
(Redis, baza) da se vidi kako se sistem oporavlja. Cilj je naći tačku gdje puca
prije nego je nađe promet.

### E2. Core Web Vitals — *područje 24*
Lighthouse i CrUX na stvarnim stranicama: LCP, CLS, INP po tipu stranice.
Ovdje se mjeri ono što je `docs/34` samo pretpostavio — cijena neoptimizovanih
slika i 164 KB framer-motiona.

### E3. SEO indeksacija — *područje 23*
Search Console: šta je zaista indeksirano, koje kanonske oznake Google prihvata,
pokriva li sitemap sadržaj. Kod-strana (kanonikali, schema, redirekti) ide
ranije, u Fazi 1.

### E4. Kompatibilnost i pristupačnost — *područje 29*
Pravi browseri i prave veličine ekrana, prazna i greškom pogođena stanja,
čitač ekrana. Ovo ne mogu ja — treba neko ko gleda.

---

## Redoslijed izvršavanja

```
Faza 1:  P1 → P2 → P3        (sigurnost prvo — jedina kategorija gdje
                              propust znači tuđi podaci)
         P5 → P6 → P9        (čišćenje i mapa)
         P4                   (poslovna logika, po cjelinama)
         P7 → P8              (dubina i higijena)

Faza 2:  diagnose paket       (poslije P3, da znam šta pitati)
         → ti pokreneš        → analiza stvarnih brojki

Faza 3:  S1 → S2 → S3 → S4 → S5

Faza 4:  E1 (traži S5) · E2 · E3 · E4
```

**Ukupno:** Faza 1 oko 14–18 sesija, Faza 2 dvije plus tvojih pet minuta,
Faza 3 zavisi od pristupa, Faza 4 traži staging i nekog s browserom.

---

## Pravila kojih se držim kroz sve faze

**Svaka tvrdnja nosi dokaz.** Putanja do fajla i linija, ili izlaz komande.
Ono što je pretpostavka piše da je pretpostavka — `docs/34` je tako pisan i
jedan nalaz se ispostavio netačnim (sanitizacija članaka), što se vidjelo baš
zato što je bio provjerljiv.

**Ništa se ne popravlja naslijepo.** Danas sam dvaput mehanički izmijenio kod
bez pokretanja rezultata i dvaput ga razbio. Svaka izmjena ide uz pokretanje —
test, build, ili komanda koja pokaže da radi.

**Kad nešto zamijenim, staro brišem u istom commitu.** Cijela kategorija
duplikata u ovoj bazi koda postoji jer se to nije radilo.

**Load test ide na staging.** Ne na produkciju, ni "samo malo".

**Sve što je destruktivno ide tek poslije S1.** Backup prvi, pa onda čišćenje
historije, migracije koje brišu kolone, i sve ostalo što se ne vraća.
