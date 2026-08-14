# Pregled koda — 14.08.2026.

Prolaz kroz sva tri dijela projekta: **backend 94.782 linije PHP-a** (988
fajlova), **frontend 67.309 linija** (409), **Discord bot 3.473** (16).

Metod: unakrsne provjere, ne čitanje. Svaka od 271 API rute upoređena sa
svakim pozivom u frontendu, botu i backendu; svaki fajl protiv svakog uvoza;
svako `$fillable` polje protiv svega što bi ga moglo pročitati. Svaki nalaz
provjeren pojedinačno prije nego je upisan ovdje — prvi prolaz je davao lažne
nalaze i oni su ispravljeni, ne prijavljeni.

---

## 1. Šta je zdravo

- **Nema nijednog poziva na nepostojeći endpoint.** 271 ruta protiv svih 153
  poziva iz frontenda — nijedna funkcija ne puca tiho zbog pogrešne putanje.
- **Discord bot je čist**: 19 komandi definisano, svih 19 obrađeno u handleru.
  Nijedna registrovana komanda ne pada u prazno.
- **Svi observeri su registrovani** (20/20). `ArticleVersionObserver` se
  registruje u samom modelu, ne u provideru — izgleda kao propust, nije.
- **Nema `dd()`, `dump()` ni `var_dump()`** u backendu. Dva `console.log` u
  frontendu.
- **TODO/FIXME: 6 ukupno** na 162.000 linija.

---

## 2. Popravljeno u ovom prolazu

Obrisano, svaki fajl provjeren da nema referencu nigdje u repou:

| Fajl | Zašto |
|---|---|
| `frontend/app/giveaways/GiveawaysClient.tsx` | 277 linija, stara verzija; `/giveaways` renderuje `GiveawayHub` |
| `frontend/components/seo/RelatedArticles.tsx` | osirotjela kad su izbačene "Slične" sekcije |
| `frontend/components/seo/SeoContent.tsx` | isto |
| `frontend/hooks/useSearchLimit.ts` | hook bez pozivača |
| `backend/app/Events/ArticlePublished.php` | event koji se nikad ne dispatchuje |
| `backend/app/Models/SeoMeta.php` + `Traits/HasSeoMeta.php` | **cijeli drugi SEO model** koji se referiše samo sam na sebe |

Tabela `seo_metas` i njena migracija su **ostavljene** — brisanje tabele je
odluka o podacima, ne čišćenje.

`.env.example` je dobio `NEXT_PUBLIC_GA_ID` i `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
— kod ih čita, a svjež klon je dobijao nula analitike i PayPal dugme koje se
iscrta ali ne može platiti, bez ijedne naznake zašto.

---

## 3. Nalazi koji traže tvoju odluku

### 3.1 Petnaest ruta koje niko ne zove

Svaka provjerena pojedinačno protiv frontenda, bota i backenda.

| Ruta | Šta znači |
|---|---|
| ~~`GET /friends/pending`, `/friends/search`~~ | **uklonjeni** — `ChatController::hub()` ima vlastiti `pendingRequests()` čiji komentar kaže da vraća isto; bili su drugi način da se pita isto pitanje |
| `GET /friends/activity` | zasebna funkcija, nespojena — ostavljena |
| `GET /seo/orphan-pages`, `POST /seo/suggest-links`, `GET /seo/articles/{id}/inbound-links` | **SEO alat bez ijednog dugmeta** — tri gotova endpointa, nula UI-ja |
| ~~`DELETE /journal/moments/{id}`~~ | **spojeno** — moment sad ima dugme za brisanje, vidljivo samo vlasniku dnevnika |
| `GET /last-disc/export` | izvoz bez dugmeta |
| `GET /me/reading` | istorija čitanja koju ništa ne prikazuje |
| `GET /support/mine` | "moje podrške" bez ekrana |
| `GET /rewards/redemptions` | namjerno uspavano (store je "coming soon") |
| `GET /wow/analysis/{id}`, `GET /chat/attachments/{id}` | dijeljenje analize i prilozi u chatu |
| `GET /redirects`, `GET /system/health` | alat/monitoring bez pozivača |

Nisu greške po sebi — to su **funkcije koje postoje na backendu a nemaju
ulaz**. Za svaku je izbor: spojiti je, ili je ukloniti.

### 3.2 Mrtvi frontend fajlovi koje nisam dirao

| Fajlovi | Linija | Zašto nisam obrisao |
|---|---:|---|
| 7 WoW komponenti (`WowLeaderboard`, `PreparationChecklist`, `HousingReadiness`, `WowRecentAnalyses`, `TimelineTracker`, `HistoricalProgress`, `DailyPlanner`) | ~2.200 | nespojene, ne mrtve — možda ih još namjeravaš uvezati |
| `LoyaltyCustomization`, `UpcomingReleasesWidget`, `DistributionBars`, `HexBadge` | ~420 | ostaci s profil dashboarda |

### 3.3 Polja koja ništa ne čita

Devetnaest ukupno; dva su vrijedna pažnje:

- **`Message.deleted_by_sender` / `deleted_by_receiver`** — **ispravka ranije
  tvrdnje.** Prvo sam ovo zapisao kao kvar: brisanje briše objema stranama.
  Čitanje koda pokazuje suprotno — `ChatController::destroyMessage` je
  dokumentovan kao **unsend**, i brisanje za sve je namjera, ne greška. Kolone
  su ostatak ranijeg "obriši samo kod mene" dizajna koji nikad nije isporučen;
  ništa ih ne piše ni ne čita. Uklonjene su iz `$fillable`, `$casts` i
  `$hidden` jer su govorile da model ima per-stranu soft delete, a nema.
  Kolone u tabeli ostaju.
- **`SeoMeta.is_nofollow`, `schema_data`** — dio obrisanog drugog SEO modela.

Ostalo: `Game.is_editorial`, `Redirect.hits`, `GiveawayEntry.streak_bonus_points`,
`GiveawayTask.verification_type`, `User.paypal_customer_id`,
`WowCharacter.last_analyzed_at`, `ConnectedAccount.scopes`, tri `GameCompany.moby_*`
(ostaci penzionisanog MobyGames lanca).

### 3.4 Komande

46 artisan komandi, **18 u rasporedu**. Ostalih 28 su uglavnom legitimni
ručni alati (`diagnose:*`, `env:validate`, jednokratni `games:purge-*`).
Nema komande koja bi trebala biti zakazana a nije.

---

## 4. Testovi — riješeno

`php artisan test` je padao s `Allowed memory size of 134217728 bytes
exhausted` u `FileinfoMimeTypeGuesser`. Podizanje preko `php -d memory_limit`
ne pomaže jer `artisan test` pokreće PHPUnit kao **podproces s vlastitim
limitom**; `<ini name="memory_limit" value="1024M"/>` u `phpunit.xml` je
jedino mjesto koje čitaju oba ulaza.

Poslije toga, pušteno fajl po fajl s ograničenjem po fajlu:

**50 od 50 test fajlova prolazi. Nula padova, nula visenja.**

Suite nije visio — bio je samo spor: `SocialHubTest` 58s, `DashboardTest`
30s, `CollectionRewardsTest` 44s, `ReadingTest` 37s. Ukupno oko 8–10 minuta.

## 5. Šta ostaje neriješeno

**React upozorenje o ključu na `/games/[slug]`.** Locirano do RSC rendera te
rute i do React-ove `warnForMissingKey`, ali dalje ne ide: serverski log ne
nosi stack, a `captureOwnerStack()` vraća prazno jer Flight renderer ne vodi
owner lanac. Provjereni su svi `.map()` u stranici i u svakoj njenoj
komponenti — svi imaju ključ. Dev-only; produkcijski build ga ne emituje.
