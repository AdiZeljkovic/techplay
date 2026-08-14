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

## 5. Otvoreno, za odluku

| Nalaz | Napomena |
|---|---|
| **`FaqItem` je mrtav model** | Nema kontroler, nema rutu, nema admin površinu. Tabela postoji. Brisanje modela nisam radio bez naloga. |
| **Tri SEO površine** | `PageSeoResource`, `SeoManagerResource` (nad Article) i stranica `UltimateSeo`. Kandidat za spajanje; vezuje se za 13 nepozvanih backend ruta iz `55-pregled-koda.md`. |
| **Rupe u `navigationSort`** | Content Studio ide 1,2,3,5,6; Community 1,2,3,4,6,7,8,9,10. Ostaci uklonjenih resursa. Stavke bez `sort` (Giveaways, Comments, Reports) padaju na kraj grupe. |
| **Modeli bez admin površine** | `Tag` (uređuje se inline preko `TagsInput`, ali se ne može globalno preimenovati ni spojiti), `GameCompany`, `Quest`, `Season`, `GtaLocation`, `BountyTransaction` (ekonomija se ne može revidirati iz panela). |
