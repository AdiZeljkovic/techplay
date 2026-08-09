# P2 — Filament admin panel (09.08.2026)

Drugi paket iz `docs/35-plan-pune-analize.md`.

Nalaz je kratak i neugodan: **30 od 35 resursa nije imalo nikakvu autorizaciju.**
Filament resurs bez policy-ja tretira kao otvoren. Uz to, `view admin panel` nose
i **Moderator** i **Journalist** — pa je moderator, čije je jedino predviđeno
ovlaštenje `moderate forum`, u panelu mogao:

- otvoriti **Narudžbe** i čitati adrese kupaca,
- mijenjati **cijene i zalihe** proizvoda,
- upaliti **maintenance mode** preko Postavki sajta,
- izvesti **listu pretplatnika** newslettera,
- i obrisati u gomili **katalog od 187 hiljada igara** — svih 33 resursa imaju
  `DeleteBulkAction`.

Ništa od toga nije odbijeno. Navigacija je jednostavno bila duga.

I obrnuto: `CommentPolicy` je gledala isključivo `role === 'admin'`, pa moderator
**nije mogao moderirati komentare** — jedino zbog čega postoji. Dvije sheme rola
nisu se slagale ni u jednom smjeru.

---

## Jedna shema umjesto nijedne

Četiri sloja, naslonjena na ovlaštenja koja **već postoje** u
`RolesAndPermissionsSeeder` — nije uveden nijedan novi pojam:

| Sloj | Ovlaštenje | Modeli |
|---|---|---|
| Moderacija | `moderate forum` ili `manage content` | Comment, Post, Thread, Report |
| Sadržaj | `manage content` | Category, EditorialChannel, Game, GameRating, Gta6×3, Guide, Media, PageSeo |
| Korisnici | `manage users` | User |
| Admin | samo Admin / Super Admin | Achievement, AdCampaign, ClanMissionTemplate, Customization, Giveaway, MediaKitSetting, NewsletterSubscriber, Order, PageSeo, Product, Rank, RewardItem, SiteSetting, SupportTier, UserGame, UserSupport |

`Article`, `News` i `Review` zadržavaju vlastite policy klase — one su od
početka bile ispravno stepenovane (`create`/`update` na `manage content`,
`delete` na `delete articles`, `publish` na `publish articles`).

Dva pravila su stroža od sloja kojem model pripada:

- **Brisanje u gomili je samo za admina, svugdje.** To je najrazornije dugme u
  panelu i nijedan urednički ni moderatorski tok ga ne treba.
- **Brisanje igre i ocjene igre je samo za admina.** Urednici kuriraju katalog;
  uklanjanje redova iz njega nije kuriranje, a 187k redova stoji jedan checkbox
  daleko.

**Model koji nije u mapi nema pristup.** Resurs dodat sutra je nevidljiv dok ga
neko ne razvrsta — što je pravi smjer, jer je dosadašnji podrazumijevani bio
"dostupno svakome ko otvori panel".

### Uz to

- `canAccessPanel` je za svaki panel koji nije `admin` vraćao `true`. Danas
  postoji samo jedan panel pa to nije koštalo ništa, ali bi drugi panel bio
  otvoren svakom prijavljenom korisniku. Sada se zatvara.
- Tri custom stranice nisu imale `canAccess`: **SocialSettings** (piše društvene
  linkove koji se renderuju na svakoj stranici), **UltimateSeo** (`save()` piše
  postavke sajta) i **Analytics** (promet, prihod, konverzija). Prve dvije i
  Analytics sada traže admina; UltimateSeo prihvata i uredničke role.
- `CommentResource` je imao `$modelPolicy = CommentPolicy::class`, što bi
  zaobišlo centralnu mapu. Preglasavanje uklonjeno, `CommentPolicy` obrisana
  (bila je referencirana samo odatle).

---

## Provjereno pa odbačeno

- **Prijava u panel ima ograničenje pokušaja.** Filament v5 radi `rateLimit(5)`
  u `Auth/Pages/Login.php`, plus zaseban limiter na MFA izazov. Nije rupa.
- **Force delete / restore** ne postoje nigdje u panelu — nema soft-delete
  površine koju bi trebalo posebno štititi.
- **UserResource** je jedini resurs koji je i ranije imao provjeru
  (`canAccess()` na `manage users`). Sada mu se policy i resource gate slažu
  umjesto da svaki ima svoje mišljenje.

---

## Preporuka koju nisam izveo sam

**Dvofaktorska prijava za panel.** Filament v5 je nosi u paketu
(`Auth/MultiFactor/` — TOTP aplikacija i e-mail), a nije uključena. Za panel
koji drži narudžbe, adrese kupaca i platne zapise to je razlika između
"ukradena lozinka" i "ukraden sajt".

Nisam je uključio jer traži migraciju (kolone za tajnu i recovery kodove) i
znači da se **svi administratori moraju upisati pri sljedećoj prijavi** — to je
promjena koju biraš ti, ne ja. Ako kažeš, uradim je u sljedećem prolazu.

---

## Testovi

`tests/Feature/AdminPanelAccessTest.php` — 8 testova koji zaključavaju matricu:
moderator ne vidi narudžbe, urednik ne vidi novac, novinar ne dira ekonomiju,
brisanje u gomili je samo adminovo, i **naslijeđena `users.role` kolona i dalje
pušta admina** (gašenje te grane zaključalo bi naloge koji nikad nisu dobili
Spatie rolu).

Ukupno: **378/378 prolazi.**

## Deploy

Nema migracija. Poslije `git pull` dovoljno je uobičajeno:

```
php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```

Ako se neko od uredničkog tima požali da mu je nestala stavka iz menija — to je
namjerno, i tabela slojeva gore kaže zašto. Premještanje modela u drugi sloj je
jedna linija u `AuthServiceProvider`.
