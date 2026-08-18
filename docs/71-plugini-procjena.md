# Trinaest plugina: procjena za TechPlay

*18.08.2026. Svaki provjeren protiv **naše** instalacije — Filament v5.6.7,
PHP 8.4, i onoga što u panelu već postoji. Ne po opisu na sajtu.*

Kratko: **dva vrijedi uzeti, dva su plaćena i vrijedna razmatranja, devet
otpada.** I ne otpadaju zato što su loši — nego zato što bi kod nas bili
duplikat, ne rade na v5, ili traže nešto što nemamo.

---

## Vrijedi uzeti

### Jobs Monitor · `croustibat/filament-jobs-monitor`
**Besplatan · v5 ✓ · 369k instalacija**

Ekran za red poslova: šta čeka, šta je gotovo, šta je palo — grupisano po vrsti
greške, s napretkom i čišćenjem starih zapisa. Inspirisan Horizonom, ali radi sa
svakim drajverom.

**Zašto nama:** imamo sedam vrsta poslova u redu (`FetchOgData`,
`FlushViewCounters`, `MobyEnrichmentJob`, `PingIndexNow`, `SubmitIndexNow`,
`SendGiveawayReminders`, `SendChatReminder`) i **nemamo Horizon**. Danas se
neuspjeli posao vidi jedino kao broj na Dashboardu — a taj broj ne vodi nigdje.

### Apex Charts · `leandrocfe/filament-apex-charts`
**Besplatan · v5 ✓ (v5.1.3, 13.07.2026)**

Ljepši i bogatiji grafikoni od `ChartWidget` u jezgru — više tipova, bolje
interakcije.

**Napomena:** kad se v5 tek pojavio, ovaj plugin **nije** bio kompatibilan i tako
piše po starijim izvorima. Provjerio sam na Packagistu: verzija 5.1.3 traži
`filament/widgets ^4.0|^5.0`. Radi.

**Ali:** jezgro već ima `ChartWidget`, a Dashboard trenutno koristi ručno pisan
SVG sparkline. Ovo vrijedi tek ako se hoće prava analitička stranica s više
grafikona — ne prije toga.

---

## Plaćeni, ali stvarno dobri

### Advanced Tables · `kenneth-sese/advanced-tables` · **€79**
**v5 ✓**

Korisnik snima kombinaciju filtera, vidljivih kolona, sortiranja i grupisanja
kao **imenovani pogled** i prebacuje se između njih. Plus brzi filteri i
sortiranje po više kolona.

**Zašto bi baš nama sjelo:** 38 lista, a najčešći posao je „pokaži mi draftove
ovog autora" ili „igre bez opisa". Danas se to svaki put sklapa ručno. Mi smo
dodali pamćenje filtera u sesiji, što pamti **jedan** izbor — ovo bi pamtilo
imenovane.

### Database Mail · `martinpetricko/filament-database-mail` · **€59**

Predlošci e-mailova se uređuju u panelu umjesto u kodu, vezani za Laravel
događaje, s Unlayer editorom.

**Zašto bi moglo:** imamo **19 notifikacija i 2 Mail klase** — svaka promjena
teksta danas traži programera i deploy.

**Oprez:** stranica plugina tvrdi v5, ali composer ograničenje na istoj stranici
piše `Filament ^3.3`. To je kontradikcija — prije kupovine treba potvrditi kod
autora.

---

## Otpada: jezgro to već ima

| Plugin | Šta u jezgru radi isto |
|---|---|
| **Flatpickr** `coolsam/flatpickr` | `DatePicker` i `DateTimePicker` |
| **Toggle Icon Column** `kenneth-sese/toggle-icon-column` | `ToggleColumn` + `IconColumn` |
| **Flexible Content Blocks** `statikbe/...` | `Builder` komponenta |

Flexible Content Blocks je uz to najskuplji po trudu: traži da se modelima dodaju
interfejsi (`HasContentBlocks`, `HasPageAttributes`…) i da se **ručno pišu
migracije**. To je preuređenje modela sadržaja, ne dodatak. Naši članci su
`Article` s rich editorom i to radi.

## Otpada: ne radi na v5

**Image Optimizer** `joshembling/image-optimizer` — zadnja verzija v1.6.4 traži
`filament ^3.2`, a autor u README-u piše: *„nema planova da se ovaj plugin
produžava iza Filamenta v3."* Mrtav kolosijek.

*(Uz to imamo `ImageOptimizationService` u projektu.)*

## Otpada: duplira ono što smo upravo napravili

**SEO** `ralphjsmit/laravel-filament-seo` — dolazi uz `ralphjsmit/laravel-seo` i
svoju tabelu preko `seo()` relacije. Mi imamo `SeoFields` komponentu u 4 resursa,
`page_seo` tabelu sa 44 reda, meta polja na članku, robots direktive i canonical
— i sve to je juče provjereno od baze do iscrtane stranice. Ovo bi bio **drugi
SEO sistem paralelno s prvim**.

**Shield** `bezhansalleh/filament-shield` — najpopularniji za dozvole (4,6M) i
radi na v5, ali imamo sedam ručno pisanih policy klasa s namjernom strukturom i
35 mapiranja. Shield generiše svoje po resursu. Zamjena promišljenog sistema
generisanim.

## Otpada: traži preduslov koji nemamo

**Google Analytics** `bezhansalleh/filament-google-analytics` — besplatan i radi
na v5, ali traži **servisni nalog Google Analyticsa** (JSON u
`storage/app/analytics/`) i `ANALYTICS_PROPERTY_ID`.

Kod nas je `seo_google_analytics_id` u postavkama **prazan**, i nijedan GA ključ
nije u `.env`. Front ima infrastrukturu — consent mode i proxy za `gtag.js` — ali
bez property ID-a plugin nema šta prikazati. **Prvo GA, pa onda plugin.**

**Push Notifications** `xentixar/filament-push-notifications` — u projektu nema
nijednog traga web-push infrastrukture: ni service workera, ni VAPID ključeva, ni
tabele za pretplate. Plugin je zadnji korak tog posla, ne prvi.

## Otpada: kozmetika

**IP to Country Flag** `mohammadhprp/...` — zastavica države iz IP adrese u
koloni tabele. Lijepo, ali mi IP adrese nigdje ne prikazujemo u panelu.

---

## Ako bih birao

1. **Jobs Monitor** — besplatan, popunjava stvarnu rupu (nemamo Horizon), i broj
   neuspjelih poslova s Dashboarda konačno vodi negdje.
2. **Advanced Tables (€79)** — jedini s ovog spiska koji bi mijenjao svakodnevni
   rad na svih 38 lista. Vrijedi ako se u panelu provodi sat dnevno.

Ostalo bih ostavio. Ne zato što je loše, nego zato što bi kod nas bio drugi
sistem za nešto što već radi.
