# Jedna shema rola (10.08.2026)

Nije paket iz plana nego dug koji se pojavio u **tri odvojena paketa** i svaki
put ostao otvoren — u P1 kao nalaz, u P2 djelimično riješen za panel, u P4
ponovo zapisan kao neriješeno.

---

## Šta je bilo

Dvije sheme su radile paralelno:

- **Spatie role** — `Super Admin`, `Editor-in-Chief`, `Editor`, `Journalist`,
  `Moderator`. Ovo panel uređuje.
- **`users.role` kolona** — string `admin` / `super_admin` / `editor` /
  `moderator`. **Panel je ne može promijeniti** (`UserResource` uređuje
  `->relationship('roles')`), ali je 47 provjera čitalo.

Uz to, **22 fajla su nosila vlastiti tvrdo kodiran spisak imena rola**, i ti
spiskovi se nisu poklapali. Posljedice koje su bile stvarne:

| Ko | Šta je mogao | Šta nije | Zašto |
|---|---|---|---|
| Editor-in-Chief | obrisati **cijelu** temu | urediti jednu objavu u njoj | `deleteThread` ga je imao na spisku, `updatePost` nije |
| Moderator | zaključati temu | moderirati komentare | `CommentPolicy` je gledala samo `role === 'admin'` |
| bilo ko sa starom kolonom | sve što kolona daje | — | oduzimanje Spatie role nije oduzimalo pristup |

`AuthorController` je imao i **petu** varijantu — vlastitu normalizaciju imena
(`editor_in_chief`, `super_admin`…) i vlastiti spisak.

---

## Šta je sada

Četiri metode na `User`, i ništa drugo ne odlučuje ko je osoblje:

```php
$user->isAdmin()            // Super Admin, Admin
$user->isEditorialStaff()   // + Editor-in-Chief, Editor, Journalist
$user->isForumModerator()   // + Moderator
$user->isStaff()            // bilo koje od gornja dva
```

Provjereno da se slojevi razdvajaju:

| Rola | admin | editorial | moderator |
|---|:---:|:---:|:---:|
| Super Admin | ✅ | ✅ | ✅ |
| Editor-in-Chief | — | ✅ | ✅ |
| Editor | — | ✅ | — |
| Journalist | — | ✅ | — |
| Moderator | — | — | ✅ |

**Spatie je jedini izvor.** Kolona `users.role` ostaje u tabeli kao istorijski
podatak i **više se ne čita za autorizaciju**.

### Migracija koja to čini sigurnim

`2026_08_10_000600` daje Spatie rolu svakome ko je moć imao **samo** kroz
kolonu. Namjerno uska: dira isključivo korisnike koji nemaju **nijednu** Spatie
rolu. Ne može nikoga sniziti niti promijeniti nekoga koga je administrator već
uredio kako treba.

Mapiranje je ono što je kod ionako davao: `admin` i `super_admin` → `Super
Admin`, `editor` → `Editor`, `moderator` → `Moderator`, `journalist` →
`Journalist`.

Ako ikoga dodirne, upisuje se u log — jer to nekome dodjeljuje ovlaštenja i onaj
ko pokreće deploy treba moći vidjeti kome.

**Na lokalnoj bazi nije dodirnula nikoga:** od 55 korisnika, 1 ima `role=admin`
u koloni i taj već ima Spatie role. Produkcija može biti drugačija — zato
migracija i postoji.

---

## Obim izmjene

| | |
|---|---|
| Fajlova s vlastitim spiskom rola | 22 → **0** |
| Provjera naslijeđene kolone | 47 → **0** (u autorizaciji) |
| Mrtvih pomoćnika uklonjeno | `normalizeRole`, `normalizedEditorialRoles`, 7 × `$allowedRoles` |

Jedno mjesto je namjerno **nije** dirano: `ClanMember::role` je klanska rola
(`owner` / `officer`), potpuno druga stvar koja slučajno dijeli ime kolone.

---

## Testovi

`tests/Feature/RoleSchemeTest.php` — 9 testova. Svaka rola je provjerena u sva
tri sloja kroz data provider, plus:

- obični član nije ništa od toga,
- **naslijeđena kolona više ne daje ništa** — postavljanje `role = 'admin'`
  direktno u bazi ne čini nikoga adminom,
- moderator **može** moderirati komentare (slučaj koji su dvije sheme grešile u
  suprotnim smjerovima),
- Editor-in-Chief može i obrisati temu i urediti objavu u njoj.

## Deploy

**Ima migraciju.** Ona mora proći **prije** nego novi kod počne raditi, jer novi
kod više ne čita kolonu.

```
cd /var/www/techplay && git pull
cd backend && php artisan migrate --force
php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```

Poslije deploya vrijedi provjeriti da niko nije ostao bez pristupa:

```bash
php artisan tinker --execute="foreach (App\Models\User::whereIn('role',['admin','super_admin','editor','moderator'])->get() as \$u) { echo \$u->username.' → '.(\$u->isStaff() ? 'staff' : 'NEMA PRISTUP').PHP_EOL; }"
```

Svi moraju pisati `staff`. Ako neko piše suprotno, dodijeli mu rolu u panelu —
`Korisnici → uredi → Roles`.
