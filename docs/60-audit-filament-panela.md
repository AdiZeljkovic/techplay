# Audit Filament admin panela — 15.08.2026.

Panel je jedina površina projekta koja do sada nije prošla nijedan pregled, a
kroz njega ide sav redakcijski rad. Obuhvat: 40 resursa, 6 stranica, 8 widgeta,
autorizacija, navigacija, pokrivenost modela i performanse tabela.

Panel je živ i zdrav: `/admin` vraća 302 na login, login 200.

---

## 1. Tri resursa koja nikad nisu ušla u sistem dozvola

Sistem uloga postoji i pažljivo je stepenovan — `RolesAndPermissionsSeeder`
pravi pet uloga (Moderator, Journalist, Editor, Editor-in-Chief, Super Admin),
a `PanelPolicy` i tri njena nasljednika prevode te uloge u dozvole po resursu.
Docblock u `AuthServiceProvider` to i kaže doslovno:

> *Filament tretira nemapiran model kao "dozvoljeno", pa izostavljanje ovdje
> nije nedostajuća funkcija — to su otvorena vrata za svakog ko može otvoriti
> panel.*

Tvrdnja je bila netačna. Tri resursa dodata poslije tog sistema nikad mu se
nisu pridružila: **Redirect, Task i Role**.

Provjereno u izvoru Filamenta, `vendor/filament/filament/src/helpers.php` —
kad policy ne postoji i strict mode je isključen (podrazumijevano), funkcija
završava sa `Response::allow()`. Dakle sve je dozvoljeno.

Najozbiljniji je **Role**. `RoleResource` ima `CheckboxList::make('permissions')`
i stoji u grupi System. Moderator — čija je jedina namijenjena moć moderacija
foruma — mogao je otvoriti Roles, čekirati `manage users` na vlastitu ulogu i
ući u sve što mu slojevi iznad brane. Ljestvica se penjala s vlastite donje
prečke.

**Popravljeno**: `Role => AdminOnlyPolicy`, `Redirect => ContentPolicy`,
`Task => ContentPolicy`. Redirecti idu uz redakciju jer preimenovan slug traži
redirect isti dan; `PanelPolicy` i dalje drži masovno brisanje kod admina.

**Brana**: `AdminPanelAccessTest` je dobio deveti test — Moderator i Editor ne
dolaze do Roles, Editor dolazi do Redirects i Tasks, Moderator ne. **9 testova,
36 tvrdnji, sve prolazi.**

---

## 2. Dashboard je pokazivao prihod svima — i crtao izmišljene grafikone

`StatsOverview` je jedini widget koji se registruje ručno i vidi ga svako ko
uđe u panel. Prikazivao je **Total Revenue**, dok je `Order` pod
`AdminOnlyPolicy`. Moderator nije mogao otvoriti Orders, ali je usput čitao
ukupnu zaradu.

Uz to, dva grafikona su bila doslovno upisani nizovi:

```php
->chart([7, 2, 10, 3, 15, 4, 17])   // Total Users
->chart([15, 4, 10, 2, 12, 4, 12])  // Total Revenue
```

Oba crtaju samouvjerenu uzlaznu liniju koja ne opisuje ništa — na jedinom
ekranu koji tim pogleda prije nego išta odluči.

**Popravljeno**: prihod se prikazuje samo adminu; grafikoni su sada stvarnih
sedam dana (`DATE(created_at)` grupisano, prazni dani su nule a ne rupe,
keširano 15 minuta). Provjereno testom: tri korisnika prije dva dana i dva
danas daju `[0,0,0,0,3,0,2]`.

---

## 3. Dvije navigacione grupe koje panel ne zna da postoje

`AdminPanelProvider` deklariše sedam grupa. U resursima su se koristile
**devet**: `GTA 6` i `Marketing & Branding` nisu bile na spisku. Nedeklarisana
grupa se i dalje iscrta, ali tek **iza svih deklarisanih** — pa je GTA 6 padao
na dno, ispod System, bez obzira na `navigationSort`.

**Popravljeno**: `GTA 6` je dodat u spisak, odmah iza Game Database.
`Marketing & Branding` je bila grupa od jednog resursa (Media Kit) uz već
postojeću `SEO & Marketing` koja znači isto — spojene.

---

## 4. Pet stvari koje su ličile na kvar a nisu

Zabilježeno da se ne traže ponovo:

1. **"40 resursa, nijedan ne definiše autorizaciju."** Tačno, ali nebitno —
   Filament pada na model policies, a one postoje za 29 modela.
2. **"N+1 u tabelama: 12 resursa crta relacijske kolone, 4 imaju eager
   loading."** Filament to radi sam: `HasRecords.php:51` poziva
   `applyEagerLoading()` za svaku kolonu.
3. **"Dupli Review i Thread resursi."** Oba imaju
   `$shouldRegisterNavigation = false` — skriveni su namjerno, kao zajednička
   osnova za vidljive varijante.
4. **"Widget Most Viewed čita brojače koje smo ukinuli."** Ukinuti su
   *po-posjeti logovi*; agregatna kolona `views` živi, puni je
   `Redis::incr('views:article:…')` iz četiri kontrolera, a
   `FlushViewCounters` je zakazan na svakih pet minuta.
5. **"Sezona se ne može zaključiti iz panela."** `season:conclude` je zakazan
   dnevno u 00:20. Moj prvi `grep` je gledao samo prvih dvadeset linija
   `routes/console.php`.

Uz to: giveaway se vodi do kraja iz panela (`viewParticipants`, `pickWinner`,
`manualWinner`, `pickWinnersByTiers`), a stranice panela — osim Dashboarda,
gdje to i treba — sve definišu `canAccess()`.

---

## 5. Ekonomija (sezone, misije, ledger) nije imala nijedan ekran

> **Ispravka usput.** Prvo sam ovo prijavio kao rok: jedna sezona, ističe
> 21.09.2026, niko je ne može naslijediti. **Netačno.** Migracija
> `2026_08_13_120000_lay_out_two_clean_seasons` slaže kalendar unaprijed —
> Ignition 22.09.–21.12., Overdrive 22.12.–21.03.2027 — i objašnjava zašto oba
> idu na množiocu 1.00. Nema roka za pet sedmica; horizont je **mart 2027.**
> Našao sam to tek kad je test pao jer je komanda zaključila sezonu koju ja
> nisam napravio.

Ono što ostaje tačno: sezone i misije se **autorizuju migracijama**. Poslije
21.03.2027. nova sezona traži novu migraciju, a nijedna se ne može ni
pogledati, ni ispraviti datum, ni ugasiti iz panela.

**Napravljeno**: `SeasonResource` i `QuestResource`, oba pod
`AdminOnlyPolicy` jer je to ekonomija, ne uređivanje.

Dvije stvari u njima nisu ukras:

1. **Kolona "Standing"** u listi sezona — i ispala je korisnija nego što sam
   mislio. Na produkciji su **sve tri sezone `is_active = true` istovremeno**;
   to je namjerno, datumi razrješavaju ko je na redu. Ali admin koji gleda samo
   tu zastavicu vidi tri aktivne sezone. Kolona kaže koju `Season::active()`
   **stvarno** vraća: *Live now* / *Flagged, not live* / *Closed*.
   (Da to nije akademski, potvrđuje ista migracija: Ignition je šest sedmica
   bio nevidljiv ispod Summera jer su se preklapali.)
2. **Kriteriji misije su padajuća lista, ne slobodan tekst.** Spisak nije
   izmišljen — to je svaki string koji aplikacija zaista prosljeđuje u
   `QuestService::progress()`. Misija s kriterijem van tog spiska može se
   napraviti, prikazati, i nikad se neće pomjeriti ni za jedan korak.

Uz njih ide i **`BountyTransactionResource`** — ledger sa `balance_after` i
idempotentnim `reference` ključem, jedino mjesto gdje se sporan saldo može
razriješiti, a do sada se nije mogao pogledati bez konzole. Namjerno je
**read-only**: ledger koji se može mijenjati ne odgovara ni na šta, jer odgovara
onim što je zadnje u njega upisano.

Uz to je `season:conclude` dobio jednu rečenicu koja mu je falila: kad zaključi
sezonu **iza koje ništa ne dolazi**, sada to kaže i upiše u log, umjesto da
sajt tiho ostane bez sezone. Danas ne javlja ništa, jer kalendar ide do 2027.

**Provjereno**: `EconomyAdminTest` otvara sve tri stranice onako kako ih otvara
browser (`loadTable()`) i vrti komandu u oba slučaja, plus `AdminPanelAccessTest`
provjerava da su admin-only. **15 testova, 92 tvrdnje.**

Dvije greške koje je taj test uhvatio prije nego su otišle u produkciju:
`quests.description` je `NOT NULL` a forma ga nije tražila (panel bi pukao na
snimanju), i lista misija nije imala podrazumijevani sort, pa je novonapravljena
misija otvarala **treću stranicu** iza dvadeset četiri zasijane.

---

## 6. Ostalo popravljeno u istom prolazu

- **`FaqItem` obrisan.** Model plus `HasFaq` trait sa `morphMany` i
  `toSchemaOrg()` — a trait nije koristio **nijedan** model, nijedan kontroler
  ga ne izlaže, nijedna ruta ne postoji i nijedan red se nikad nije upisao.
  Tabela `faq_items` ostaje; brisanje tabele je migracija nad živom bazom i
  nije vrijedno rizika za mrtvu funkciju.
- **`navigationSort` popravljen po grupama.** Content Studio je išao 1,2,3,5,6;
  Community 1,2,3,4,6,7,8,9,10; a Giveaways, Comments i Reports nisu imali sort
  pa su padali na dno svoje grupe — moderacija je stajala ispod
  Customizations. Sada su sve grupe neprekinute i moderacija je na okupu.
  > Usput: četiri resursa deklarišu sort **metodom** `getNavigationSort()`, koja
  > nadjačava svojstvo. Postavljanje svojstva na njima nije radilo ništa dok se
  > ne izmjeri — što je i uhvaćeno tek kad je panel podignut u testu i
  > ispisan redoslijed.

---

## 7. I dalje otvoreno, za odluku

| Nalaz | Napomena |
|---|---|
| **Tri SEO površine — provjereno, nisu duplikati** | Prvo sam ih zapisao kao kandidat za spajanje. Pogrešno: `UltimateSeo` drži globalne postavke (separator naslova, podrazumijevani opis, tip organizacije), `PageSeoResource` je override po statičkoj stranici, a `SeoManagerResource` je revizija meta polja **po članku** s dužinama i statusom. Tri sloja, ne tri kopije. Ostaje samo pitanje imenovanja — iz sidebara se ne vidi koji je koji. |
| **Modeli bez admin površine** | `Tag` (uređuje se inline preko `TagsInput`, ali se ne može globalno preimenovati ni spojiti), `GameCompany`, `GtaLocation`. |
| **Tabela `faq_items`** | Prazna ljuska bez koda. Briše se migracijom kad se bude dirala baza iz drugog razloga. |
