# 10 — Features Map

## News

**Status:** COMPLETE

**Opis:** Gaming news članci s kategorijama, tagovima, hero flagom, view counters, SEO.

**Frontend:** `app/news/`, `components/news/`
**Backend:** `NewsController`, `Article` model, `ArticleObserver`
**Admin:** `NewsResource` (Filament)
**Database:** `articles`, `categories`, `seo_metas`
**API:** `GET /news`, `GET /news/trending`, `GET /news/{slug}`
**Discord bot:** PollingService polira nove članke i šalje na Discord channel
**Napomene:** Article model koristi se i za tech/hardware sadržaj. Real-time update kroz Reverb (`ArticlePublished` event).

---

## Reviews

**Status:** COMPLETE

**Opis:** Game reviews s ocjenama (0-10), specs tabelom, SEO, cover image.

**Frontend:** `app/reviews/`, `components/reviews/`
**Backend:** `ReviewController`, `Review` model, `ReviewObserver`
**Admin:** `ReviewResource`, `Reviews` (folder)
**Database:** `reviews`, `seo_metas`
**API:** `GET /reviews`, `GET /reviews/{slug}`
**Discord bot:** Nije direktno integrisano (samo news polling)
**Napomene:** Review je poseban model od Article. Ima vlastitu tabelu i controller. Real-time update kroz Reverb (`ReviewPublished`).

---

## Tech / Hardware

**Status:** COMPLETE

**Opis:** Tech i hardware recenzije/vijesti, kategorizovano zasebno.

**Frontend:** `app/hardware/`, `components/` (dijelom dijeli komponente s news)
**Backend:** `TechController`, `Article` model (ista tabela kao news, različita kategorija)
**Admin:** `TechResource`
**Database:** `articles`, `categories`
**API:** `GET /tech`, `GET /tech/{slug}`
**Napomene:** Koristi isti Article model kao news — razlikovanje po kategoriji.

---

## Guides

**Status:** COMPLETE

**Opis:** Gaming guides s voting sistemom (upvote/downvote), SEO.

**Frontend:** `app/guides/`, `components/guides/`
**Backend:** `GuideController`, `Guide` model, `GuideObserver`
**Admin:** `GuideResource`
**Database:** `guides`, `guide_votes`
**API:** `GET /guides`, `GET /guides/{slug}`
**Napomene:** Voting sistem kroz `GuideVote` model. Real-time (`GuidePublished`).

---

## Videos — UKLONJENO 08/2026

**Status:** REMOVED

Sekcija je stajala u navigaciji s nula redova u tabeli. Uklonjeni su stranica,
API rute, `VideoController`, `Video` model, `VideoObserver`, `VideoPublished`,
`VideoResource` u adminu i `sitemap-videos.xml`. Tabela `videos` je ostavljena
netaknuta — brisanje je nepovratno, a prazna tabela ne smeta.

Ovdje je živio i jedini preostali Privée blok (logo, App Store linkovi); otišao
je s njom.

---

## Game Database

**Status:** COMPLETE — kanonska TechPlay baza od 08/2026 (RAWG, Moby i IGDB penzionisani)

**Opis:** Vlastita baza od ~187.7k igara. Kanonska schema (cover_url, description,
genres/platforms/tags/developers/publishers TEXT[], videos/alt_titles/age_ratings json,
series_key/series_name, website). Adult sadržaj očišćen komandom `games:purge-adult`
(Adult tag + sigurne riječi; ručni whitelist čuva mainstream naslove poput Witcher/GoW;
sivi skup ide u `storage/app/adult-review.json` na pregled, ništa se ne briše slijepo).
Obrisani slugovi ostaju u `game_tombstones` i API im vraća **410**. Nove igre ulaze
isključivo kroz store agregator; traileri se pune u `videos` kolonu (agregator ih već
piše, admin ih može ručno dodati).

**Frontend:** `app/games/`, `components/games/`
**Backend:** `GameController`, `Game` model, `games:purge-adult` komanda
**Admin:** `GameResource` (opis, cover, screenshoti, traileri, kompanije, taksonomija)
**Database:** `games`, `game_tombstones`, `game_companies`, `game_external_ids`
**API:** `GET /games`, `GET /games/{slug}` (410 za tombstone), `/screenshots`, `/videos`, `/series`, `/suggested`, `GET /games/calendar` (lokalno, `match_key` + `hype_score`)
**Discord bot:** Bot može pretražiti igre (`/search` komanda)
**Napomene:** TEXT[] arrays idu kroz `PostgresArray` cast; kod raw upita `pgArray()`. API NIKAD ne zove vanjske servise — sve je lokalno. `import_payload` je arhiva sirovog Moby payloada i ne izlaže se u API.

---

## Release Calendar

**Status:** COMPLETE — prepisan 08/2026, vlastiti agregator umjesto RAWG-a

**Opis:** Mjesečni kalendar izlazaka. Podaci se povlače sa **četiri storea** (Steam,
Nintendo eShop, Xbox, PlayStation) po rasporedu u našu bazu, duplikati se spajaju u
jedan unos, a stranica čita **isključivo iz naše baze** — nijedan zahtjev prema
vanjskim servisima.

**Frontend:** `app/calendar/`
**Backend:** `CalendarController` (čita `games` gdje `match_key` nije null)
**Admin:** Editorial Tools → Release Calendar (urednički red za sporne parove)
**Database:** `games` + `game_store_links` + `game_match_decisions`
**API:** `GET /calendar`, `POST /calendar/{slug}/reminder`
**Komande:** `releases:sync`, `releases:merge`
**Discord bot:** CheckWishlistReleases provjerava nove release datume
**Detaljno:** vidi `docs/34-release-calendar-aggregator.md`

**Zašto je prepisan:** RAWG je pao 04.08.2026. i povukao kalendar sa sobom. Sada
tuđi ispad nije naš ispad — test to i tvrdi (`Http::preventStrayRequests`).

---

## Forum

**Status:** COMPLETE (osnova), PARTIAL (moderacija, advanced features)

**Opis:** Community forum s kategorijama, threadovima, postovima/replyima, search.

**Frontend:** `app/forum/`, `components/forum/`
**Backend:** `ForumController`, `Thread`, `Post` modeli, `ForumPostObserver`, `ThreadObserver`
**Admin:** `ForumCategoryResource`, `SimpleThreadResource`, `PostResource`
**Database:** `threads`, `posts`, `categories`
**API:** `GET /forum/categories`, `GET /forum/threads/{slug}`, `POST /forum/threads`, itd.
**Discord bot:** `/forum` slash komanda prikazuje trending threadove
**Napomene:** Soft delete za postove. Full-text search index. Real-time (`ForumReplyPosted`, `ThreadCreated`). Nema report sistema specifičnog za forum.

---

## User Profiles

**Status:** COMPLETE

**Opis:** Profil je istovremeno logovana naslovnica. Jedna komponenta servira sve profile; sekcije su `?tab=` na `/profile/{username}`.

**Frontend:** `app/profile/[username]/page.tsx`, `components/home-dashboard/` (ProfileHero, ProfileTabStrip, DashboardHome), `components/profile/`, `lib/hero.ts`, `lib/profileTabs.ts`
**Backend:** `AuthController::show`, `ProfileService`, `ActivityService`, `LevelService`
**Admin:** `UserResource`
**Database:** `users` (+ `profile_visibility`), `user_games`, `achievements`, `user_recognitions`, `presences`
**API:** `GET /users/{username}`, `GET /users/{username}/activity`, `GET /users/{username}/collection`
**Discord bot:** `/profile` komanda prikazuje profil
**Napomene:** Profil je deriviran od više tabela — `ProfileService` agregira. Recognition sistem (user-to-user). Steam achievements prikaz. `/` i `/profile/{ti}` renderuju isti `DashboardHome` — redirect nije moguć jer je auth client-side, a `/` je ISR.

---

### Audit profila 12.08.2026

**Payload `GET /users/{username}`: 24.221 B → ~7.100 B (-71%).**

| Blok | Prije | Zašto je otišao |
|---|---|---|
| `achievements` | 13.596 B (56%) | Slao se **cijeli katalog od 66**, s opisima, većina zaključana. Overview crta **5 zadnjih otključanih**, a Achievements tab ima svoj endpoint `/users/{u}/achievements`. Sada samo tih 5. |
| `recent_articles` | 3.061 B (13%) | Niko ne renderuje. |
| `recent_threads` | 1.530 B (6%) | Niko ne renderuje. |
| `recent_comments` | ~500 B | Niko ne renderuje. |

Uz tri bloka otišla su i tri upita po izgradnji profila. Nedavna aktivnost na profilu
dolazi iz `/users/{u}/activity`, koji overview zove sam — drugi izvor je samo garantovao
da se ta dva mogu razići.

**Bug: dva različita upita dijelila su isti ključ keša.**
`AuthController` je keširao `Achievement::where('is_hidden', false)->get()`, a
`AchievementController` `Achievement::all()` — **oba pod `achievements.catalog.v2`**, na
sat vremena. Ko prvi napuni keš, taj odlučuje šta drugi vidi: ili Achievements tab
izgubi svako skriveno dostignuće (uključujući ona koja je korisnik već otključao i koja
je tab izričito trebao pokazati), ili profil dobije nefiltrirani set uprkos komentaru
koji tvrdi suprotno. Sada je jedan upit, a svaki pozivalac filtrira za sebe.

**Nije bug, ali treba znati:**

- **`posts_count` znači dvije stvari.** `UserResource` ga računa kao
  `posts + threads` (forum sidebar i kartica autora pokazuju 7), a profil `stats.posts_count`
  kao samo odgovore (0). Na profilu je to ispravno jer stoji uz `threads_count`, na forumu
  je konvencija da se prva poruka broji — ali ista riječ nosi dva broja.
- **`xbox_profile` se gradi i nikad ne crta.** Komentar kaže "for the hero chip"; taj chip
  nikad nije napravljen. Ostavljeno kao nespojena funkcija, ne mrtav kod.
- **Vlastiti profil povlači dva payloada.** Na svom Overviewu stranica rendera
  `DashboardHome` (koji čita `/me/dashboard`), ali `useSWR` za `/users/{ja}` svejedno
  odradi punu izgradnju (35+ upita) — jedino što se iz nje koristi je `stats.games_count`
  za welcome wizard. Vrijedi preseliti tu provjeru na `/me/dashboard`.
- **`getUserProfile` u Discord botu** (`ApiService.ts`) nije pozvan nigdje.
- Komentar u `config/milestones.php` upućuje na `ProfileService::milestoneMetrics()`,
  metodu koja ne postoji — metrike prosljeđuje `AuthController`.

**Provjereno kao ispravno:** svih 7 tabova je spojeno na komponentu, i svih 9 profilnih
endpointa vraća 200 (`collection`, `achievements`, `journal`, `lists`, `gamer-dna`,
`activity`, `steam-achievements`, `recognitions`, `collection-goals`); **nema mrtvih
komponenti** — sve 35 u `components/profile/` je uvezano (prva provjera je lažno
prijavila 18 siročadi jer se uvoze relativnim putanjama); privatan profil vraća zaključani
payload prije bilo kakvog grananja, `bounty_balance` se skida svima osim vlasniku, a
`recognitions` se prepisuje po posmatraču da `given_by_me` ne dođe iz dijeljenog keša.

---

### Redizajn profila — Faza 1, 13.08.2026

Plan: sedam sekcija → pet, grupisano po glagolu (upravljaj / bilježi / kuriraj /
juri / razumij / budi viđen). Faza 1 je Overview i Trophy Case.

**Overview: 11 panela → 5 panela i 3 trake.** Pravilo koje oblikuje stranicu:
*ništa što ima svoj tab ne dobija panel ovdje*. Van su išli Gamer DNA panel,
Upcoming Releases, Friend Activity i Supporter & Cosmetics — svaki od njih je bio
skraćena kopija neke sekcije. Collection i Lists ostaju kao **gole trake** s
naslovom i „vidi sve", bez okvira koji ih je činio odredištima.

**Forum Activity ostaje svoja sekcija** (odluka korisnika): watched i bookmarked
teme su alat — mjesta na koja se vraćaš — a stapanje u feed bi ih pretvorilo u
„šta se već desilo".

**Trophy Case** — nova tabela `trophy_case_slots` (`source` + `reference` +
`position`), `TrophyCaseService` i tri rute. Pet mjesta koja vlasnik bira, iz
**bilo kojeg izvora**: naša dostignuća i pojedinačna Steam dostignuća koja već
čuvamo (`steam_achievements` ima naziv, ikonu i datum). Zamjenjuje „Achievement
Spotlight", koji je pokazivao pet **najnovijih** — a to je sortiranje, ne izbor.
Dok polica nije složena, sekcija se zove „Recent Unlocks" i pokazuje iste te
najnovije, pa nijedan profil ne ostane prazan.

- Slot koji pokazuje na nešto obrisano se **preskače**, ne crta kao rupa.
- Može se zakačiti samo ono što je stvarno otključano — provjerava se protiv
  istog resolvera iz kojeg stranica čita.
- Preko kapaciteta je 422, ne tiho odbacivanje; duplikat se ignoriše.

**Rig & IDs** — novi sidebar panel: PC specifikacije, gamertagovi i Discord
značka. Preseljeno iz Gamer DNK gdje je stajalo pod naslovom o ukusu — kakva ti
je mašina i kako se zoveš na kojoj platformi je identitet, ne analiza.

---

### Redizajn profila — Faza 4: Library, 13.08.2026

**Collection + Journal → Library.** Bila su to dva taba koja opisuju iste
objekte: sesija je uvijek o igri s police, a „Completed Timeline" i „Reviews" su
podaci kolekcije pod naslovom dnevnika. Razdvojeno, dnevnik je skoro svakome
izgledao kao prazan tab — a prazan tab izgleda kao pokvaren proizvod, dok prazan
dnevnik unutar pune police izgleda kao poziv.

Tri sočiva nad jednim skupom:

| Pogled | Šta pokazuje | Odakle |
|---|---|---|
| **Shelf** | polica s filterima, featured kartica, sidebar | `CollectionGrid` |
| **Diary** | sesije **i** kalendar toplote, složeni | Journal `sessions` + `calendar` |
| **Timeline** | završene igre **i** recenzije o njima | Journal `completed` + `reviews` |

Journalova četiri taba su postala dva sočiva: sesije i kalendar odgovaraju na
isto pitanje (šta sam igrao i kada), pa se slažu jedno ispod drugog umjesto da
se kriju jedno iza drugog. Isto vrijedi za završenu igru i ono što si o njoj
napisao.

**„Log a session" s kartice igre.** Do sad je bilježenje značilo napustiti
policu, otvoriti dnevnik i unatrag tražiti igru koju si upravo spustio — to je
obrazac za popunjavanje, ne dnevnik. Pero na omotu sad predaje igru dnevniku s
već otvorenim composerom. Predaja se **izvodi** iz propa, ne kopira u state:
roditelj drži predaju, a njeno brisanje zatvara composer, pa se to dvoje ne
može raziću oko toga je li otvoren.

Izbor sočiva je lokalni state, ne URL parametar: `?tab=` već imenuje sekciju, a
kad neko podijeli svoju biblioteku misli na biblioteku, ne na način na koji je
baš tad gledao.

`PROFILE_TABS` je sa šest na **pet** ulaza. `LEGACY_TABS` prima
`?tab=collection` i `?tab=journal` → `library`. Svih 12 internih linkova je
preusmjereno direktno, ne kroz forwarder.

---

### Redizajn profila — Faze 2 i 3, 13.08.2026

**Faza 2 — Insights (Gamer DNA): 8 panela → 5, 715 → 486 linija.**

Van su išla četiri panela koja su ponavljala druge sekcije:

| Panel | Zašto | Gdje živi |
|---|---|---|
| Collection Breakdown | polica broji svoje statuse | Collection tab |
| Platform Affinity | ista agregacija, drugi crtež | Collection sidebar |
| Community Contribution | isti podatak | Overview → Community Standing |
| Setup Overview | hardver je identitet, ne analiza ukusa | Overview → Rig & IDs |

Ostaje ono što je stvarno DNK: Identity Card, Genre Profile, Playstyle
Fingerprint, Gaming Eras i Player Archetype. Podnaslov je s „The statistics of
your taste in games" prešao na „What your library says about you".

**Faza 3 — Progression: Achievements + Rewards + sezona na jednom ekranu.**

Bila su to dva taba koja se međusobno nikad nisu spomenula, pa je petlja koju
čine bila nevidljiva: otključaš dostignuće → dobiješ XP i bounty → bounty kupuje
ono u prodavnici. Razdvojeno na dva odredišta, čitalac je morao već razumjeti
sistem da bi ga primijetio.

Redoslijed na stranici prati redoslijed radnje:

1. **Sezona** (`SeasonPanel`) — ime, preostali dani, traka proteklog vremena,
   množitelji ako nisu 1.00. Prije je to bila tanka traka unutar Daily Huba,
   zbog čega skoro niko nije znao da sezona uopšte teče. Između sezona se ne
   crta ništa — prazan okvir s „nema sezone" je gori od nikakvog.
2. **Dostignuća** — postojeći `AchievementsTab`, javno.
3. **Steam dostignuća** — pod istim krovom, ne u zasebnoj sekciji niže.
4. **Prodavnica, inventar, historija** — samo vlasnik.

`PROFILE_TABS` je sa sedam na šest ulaza (Rewards više nije zaseban), a
**`LEGACY_TABS`** preusmjerava stare linkove: `?tab=achievements` i
`?tab=rewards` slijeću na Progression, `?tab=activity` i `?tab=forum` na
Overview. Podijeljen link nikad ne otvara sekciju koja više ne postoji.

**Uklonjen deveti duplikat:** `Daily Missions` je stajao i u prodavnici i u
Daily Hubu na Overviewu. Ostaje na Overviewu — to je stranica koju vlasnik prvo
otvori i prirodno mjesto za sve što ima rok.

---

### Sezone i Discord članstvo 13.08.2026

**Bug: dvije aktivne sezone su se preklapale šest sedmica.** Produkcija je nosila
„Summer of Gaming 2026" (20.6.–21.9.) i „Season 1: Ignition" (7.8.–7.11.), obje
`is_active`. `Season::active()` je remi rješavao po **najmanjem id-u**, pa je
Summer pobjeđivao a Ignition bio nevidljiv cijelo vrijeme dok je trebao teći —
množitelji mu se nisu primjenjivali i ništa vezano za njega se ne bi pojavilo.

Summer je ostavljen netaknut (teče, ljudi su zarađivali pod ×1.25, pomjeranje
kraja bi prepisalo ono što se već desilo). Ignition klizi na dan poslije Summera,
Overdrive ide za njim:

| Sezona | Od | Do | Množitelji |
|---|---|---|---|
| Summer of Gaming 2026 | 20.6.2026. | 21.9.2026. | ×1.25 |
| Season 1: Ignition | 22.9.2026. | 21.12.2026. | ×1.00 |
| Season 2: Overdrive | 22.12.2026. | 21.3.2027. | ×1.00 |

Novi množitelji su namjerno 1.00: množitelj čini da XP znači različitu količinu
rada ovisno o tome kad je zarađen, a XP je jedini broj na kojem stoji cijela
ljestvica rankova. Sezona treba da znači kroz questove, ljestvicu i značku.
`active()` sad rješava remi po **najnovijem datumu početka**, pa ako se greška
ponovi pobjeđuje sezona u kojoj ljudi misle da jesu.

Dva questa vezana za sezonu (`Season Grind`, `Season Chronicler`) bila su generični
mjesečni questovi zakačeni za sezonu koja je slučajno postojala — nestali bi na
dan njenog kraja. Odvezani.

**Discord: bot je znao ko je na serveru i nikad to nije rekao backendu.** Radi s
`GuildMembers` intentom i povlači listu članova za statistiku kanala. Zato je
profil mogao pokazivati značku zajednice nekome ko je otišao prije godinu dana.

- `POST /discord/membership` — jedan član ušao/izašao (`GuildMemberAdd/Remove`)
- `POST /discord/membership/sync` — cijela lista na startu bota; popravlja sve
  propušteno dok je bot bio ugašen. **Prazna lista se odbija** (422) jer skoro
  sigurno znači neuspjelo dohvaćanje, a ne da se server ispraznio.
- `users.discord_guild_member` + `_joined_at` + `_checked_at`
- Achievement `discord` broji **članstvo**, ne vezu — uz popust: ako bot nikad
  nije javio, veza i dalje vrijedi, pa niko ne gubi značku zbog nedeployanog bota.

---

### Popravke profila 13.08.2026

Drugi prolaz kroz profil — ovaj put s produkcije, s izmjerenim payloadom.

**Hero je pisao "16 / 5" dostignuća svakom posjetiocu.** `heroFromProfile` je uzimao
`profile.achievements.length` kao veličinu kataloga, ali taj niz je od prethodnog audita
**pet zadnjih otključanih**, ne katalog. Payload sada nosi `stats.achievements_total`,
brojan istim pravilom kao Achievements tab (skriveni ulaze samo ako ih taj čitalac ima),
pa se dvije stranice više ne mogu razići. Na vlastitom profilu je oduvijek bilo tačno jer
`/me/dashboard` šalje pravi total.

**Svaki izmišljeni username bio je indeksabilna stranica.** `/profile/bilo-sta` je vraćao
200 s `index, follow` i generisanom OG slikom od ~100 KB — beskonačna crawl površina, i
render slike po pogotku. Layout je sada server komponenta koja pita backend: 404 od
backenda → `notFound()`; backend ne odgovara → stranica se pušta (kvar API-ja ne smije
pretvoriti sve profile u 404). Privatan profil dobija `noindex` jer zaključana vrata u
rezultatima pretrage nisu bolja od ničega. `/og/profile` vraća 404 umjesto da slika bilo
koji string.

**12 od 66 dostignuća se nije moglo otključati.** Njihovi criteria tipovi nisu imali
nijedan poziv `AchievementService::check()` u trenutku kad postanu istiniti, a
`achievements:sync` nije bio u scheduleru — postojao je samo kao ručna komanda. Dokaz:
`Early Adopter` je na osnivačevom profilu stajao `1/1, unlocked=false`. Sada:
`friends_count` na prihvaćen zahtjev (obje strane), `email_verified` na verifikaciju,
`orders_count` na obje putanje naplate (inline capture i webhook), a **nightly sweep u
04:15** hvata ostatak (`early_adopter`, `support_duration`, `long_posts`,
`comment_likes_received`, `thread_upvotes_received`). Komanda je prešla s `User::all()` na
`chunkById(200)` i preživljava grešku pojedinog korisnika.

**Sparkline u Community Standingu crtao je pogrešnih šest tačaka.** Upit je bio
`orderBy('period')->limit(6)` — to je *najstarijih* šest, pa bi se linija zamrzla na
početku 2026. čim postoji sedmi mjesec. Gore: tjedni baseline za leaderboard piše
`2026-W32` u **istu kolonu**, a to string-sortiranjem dolazi iza `2026-08`, pa se serija
miješala. Sada: samo mjesečni redovi, zadnjih šest, obrnuto u čitljiv redoslijed.

**Gamer DNA je sabirao 125%.** Postotak se dijelio brojem igara, a jedna igra nosi više
žanrova — svaki red je bio tačan a kolona besmislena. Nazivnik je sada ukupan broj
spominjanja (`SUM(COUNT(*)) OVER ()`, uključujući imena izvan top 5), pa vidljive trake
ostaju poštena kriška cjeline. SQLite fallback prati istu matematiku.

**"Now Playing" je gubio ime igre.** Picker u Daily Hubu je pisao `POST /presence`, a
`GET /presence/{username}` **nije imao nijednog potrošača na frontu** — jedini efekat je
bila zelena tačkica. Presence sada putuje u oba payloada (profil i `/me/dashboard`) i
hero crta pill "Playing X" uz @handle, s linkom na igru kad postoji slug. `globalMutate`
je gađao `/presence/` prefiks koji niko ne čita; sada osvježava `/me/dashboard` i
`/users/…`.

**Sitnije:**
- `collection_snapshot` je dobio **Playing** kockicu — jedini bucket koji je vodio u
  statistici a nije imao pločicu.
- "Get the backlog under 10" je pisalo *done* svakome ko nema nijednu igru. Prazna polica
  nije osvojen backlog: prazna kolekcija je sada 0%.
- `/profile/me` bez prijave je vječno vrtio skeleton (jedini uslov u čuvaru koji nikad ne
  prestane biti tačan). Sada je `SignInWall`, isti dizajn kao `/login`.
- `milestones` (700 B), `xbox_profile`, `is_premium` i `premium_tier` izbačeni iz
  payloada — nijedna komponenta ih nikad nije čitala. `ProfileService::milestones()`
  ostaje ako se panel ikad spoji. `platforms_genres` **ostaje** jer ga crta panel
  Platforms na Collection tabu.

**Provjereno kao ispravno:** privatnost drži na svih 11 per-user endpointa (trait
`ProfilePrivacy` čita **sanctum** guard, ne default) — provjeren svaki; `bounty_balance`
se skida svima osim vlasniku; svih 8 owner ruta vraća 401 anonimno; svih 32 poziva s
fronta imaju rutu; nema mrtvih komponenti (34 u `components/profile`, 19 u
`home-dashboard`).

---

### Audit settings + auth 12.08.2026

**Bug: prelazak na privatan profil nije skidao korisnika s leaderboarda.**
`updateProfile` je brisao `leaderboard:{board}` i `leaderboard:{board}:week:{key}` —
ključeve koje **niko nikad nije pisao**. `LeaderboardController` kešira pod
`leaderboard.v2.{type}.{period}.{periodKey}`, pa je komentar "drop off the public boards
now rather than in five minutes" opisivao nešto što se nije dešavalo: stari javni red se
servirao do isteka TTL-a. Sada se brišu stvarni ključevi (6 ploča × 3 perioda + viewer
keš + `rising`).

**Nespojeno:** kolona `users.email_notifications` postoji i putuje u payloadu, ali
**nema nijedne kontrole u settingsima** — korisnik ne može isključiti e-mail obavijesti.

**Provjereno kao ispravno (bez izmjena):**
- Login ide kroz Turnstile; bypass token je tajna iz configa, nema ga po defaultu.
- Neuspješna prijava vraća generičko "Invalid credentials" — nema nabrajanja korisnika.
- `forgot-password` i `reset-password` su na `throttle:5,10`; **uživo provjereno** da
  nepostojeći i postojeći e-mail vraćaju isti odgovor (200), pa se ni tu ne može nabrajati.
- Promjena lozinke traži trenutnu i **briše sve ostale tokene** — ukradeni token ne
  preživi promjenu.
- Brisanje naloga traži lozinku i anonimizuje 15 kolona (uključujući platform handle-ove,
  `author_slug` i hardver).
- `updateProfile` ima strogu bijelu listu polja; upload ide kroz `_method=PUT` spoofing
  jer PUT ne nosi fajlove.

---

## Profile Privacy

**Status:** COMPLETE (08/2026)

**Opis:** Dva nivoa — Public (default) i Friends only. Skriva agregate profila, ne dira javno objavljen sadržaj (forum, komentari, recenzije).

**Frontend:** `app/settings/` (Privacy & Data tab), `components/profile/LockedProfile.tsx`
**Backend:** `ProfileService::canViewProfile()`, trait `App\Traits\ProfilePrivacy`, `AuthController::show` + `updateProfile`
**Database:** `users.profile_visibility` (`public` \| `friends`)
**API:** `PUT /user/profile` (`profile_visibility`); svi `/users/{username}*` gate-ovani
**Napomene:** Privatan profil ispada iz leaderboarda i member searcha, ali direktan link i dalje vodi na teaser s Add Friend dugmetom — nikad 404. Provjera je isključivo serverska. Testovi: `tests/Feature/ProfileVisibilityTest.php`.

---

## XP Sistem

**Status:** COMPLETE

**Opis:** XP dodjela za komentare, čitanje, Discord aktivnost, streak, queste. Rank sistem.

**Frontend:** Prikazano na profilu, leaderboardu
**Backend:** `XpService`, `StreakController`, `DiscordXpController`
**Admin:** `RankResource` (threshold za rankove)
**Database:** `users.xp`, `ranks`
**API:** `POST /discord/xp`, `POST /user/streak/claim`, `GET /leaderboard`
**Discord bot:** XpService u botu (15 XP/msg, 60s cooldown) → POST `/discord/xp`
**Napomene:** 100 XP/day cap za web interakcije. Rank promotion automatska po XP thresholds.
Čitanje članaka **ne** donosi XP — konstanta je postojala ali je niko nije zvao (uklonjeno 11.08.2026).

### Leaderboard — audit 12.08.2026

**Payload:** `GET /leaderboard` = 3,2 KB za 10 redova + podium + season + rising +
viewer. Nema šta da se skida.

**Bug (potvrđen na produkciji): `season.your_xp` je bio u dijeljenom kešu.**
Cijeli `season` blok se keširao pod `leaderboard.v2.season` na 5 minuta, a sadrži
`your_xp` — XP prijavljenog korisnika u sezoni. Ko prvi promaši keš, njegov broj se
servira **svima** narednih 5 minuta, uključujući odjavljene posjetioce. Anonimni
`curl` je vraćao `"your_xp": 1791`. Sada je keširan samo dio koji je isti za sve
(`leaderboard.v2.season.public`), a `your_xp` se računa po zahtjevu.

**Bug: viewer keš se nikad nije koristio.** `$viewerId = $request->user()?->id` — ruta
je javna, a default guard je `web`, pa je za bearer token uvijek `null`. Grana s
`Cache::remember` nije se izvršavala nijednom; svaki zahtjev je radio ~4 upita za
viewera. Sada se korisnik razrješava kroz `sanctum` guard, isto kao u `viewer()`.

**Bug: kolona "Trend" je na svim pločama pokazivala kretanje XP-a**, i na Reputation i
na Collection ploči. Kolona se sada zove "XP this week" — to i jeste ono što mjeri.

**Bug: `period` dugmad su ostajala neosvijetljena.** Ploče bez baseline snapshota
(collection, completions, reviews, achievements) backend prisilno servira kao
all-time, ali je frontend zadržavao `week` u stanju — pa nijedno dugme nije bilo
aktivno nad all-time podacima. Highlight sada prati `data.period` iz odgovora.

**Bug: nije bilo error stanja.** `error` iz SWR-a je bio dodijeljen a nigdje korišten,
pa je pad API-ja izgledao kao "Nobody on this board yet" — sasvim druga tvrdnja od
"nismo mogli pitati".

**Provjereno kao ispravno:** svih 6 ploča i 3 perioda vraćaju očekivano;
`profile_visibility != public` ispada iz svakog rangiranja i iz `rising`;
`positionOf` broji, ne čita s ekrana, pa ostaje tačan i van top 50; nedostatak
sedmičnog snapshota kod korisnika registrovanog usred sedmice ispravno računa cijeli
XP kao dobitak te sedmice (snapshot job pokriva sve korisnike ponedjeljkom).

---

## Achievements

**Status:** COMPLETE (sistem), PARTIAL (coverage)

**Opis:** Achievement sistem s definisanim achievementima, seed skriptama, prikaz na profilu.

**Frontend:** Prikaz na profilu
**Backend:** `AchievementService`, `Achievement` model
**Admin:** `AchievementResource`
**Database:** `achievements`, pivot tabela za user achievemente (UNKNOWN ime)
**API:** UNKNOWN direktan endpoint za achievemente (vjerovatno dio profil response)
**Discord bot:** UNKNOWN direktna integracija
**Napomene:** Seed skripte postoje (`2026_06_20_000001_seed_gaming_achievements.php`). `SyncAchievements` artisan komanda postoji.

---

## Komentari

**Status:** COMPLETE

**Opis:** Polymorphic komentari na news, reviews i guides. Voting, nesting.

**Frontend:** `components/comments/`
**Backend:** `CommentController`, `Comment` model, `CommentObserver`
**Admin:** `CommentResource`
**Database:** `comments`, `comment_likes`
**API:** `GET /comments/{type}/{id}`, `POST /comments`, `POST /comments/{id}/vote`
**Discord bot:** Nije integrisano direktno
**Napomene:** XP dodjela pri komentiranju (XpService). Real-time (`CommentPosted`). Nema moderacija alata na frontendu.

---

## Search

**Status:** PARTIAL

**Opis:** Pretraga članaka. Forum search postoji posebno.

**Frontend:** Postoji search UI (nepoznata lokacija)
**Backend:** `SearchController::articles`, `ForumController::search`
**Database:** Full-text index na `articles` i `forum` tabelama
**API:** `GET /search/articles`, `GET /forum/search`
**Napomene:** Pretraga igara UNKNOWN (vjerovatno kroz `GET /games?q=`). Nema unified search.

---

### Audit 12.08.2026 — posljednje stranice

**Bug: stranica pojedinačnog giveawaya bila je nevidljiva dijeljenju i pretraživačima.**
`generateMetadata` je dohvatao podatke preko `NEXT_PUBLIC_API_URL` — javnog hosta — iz
**servera**, dakle van kroz Cloudflare i nazad. Fetch nikad nije dao JSON, pa je svaki
giveaway podijeljen na Discordu ili Facebooku izlazio kao **"Giveaway | TechPlay |
TechPlay"**, bez opisa i bez slike. Tijelo stranice je klijentsko, pa je čitalac u
pregledniku vidio sve — ali u izvornom HTML-u nema ni riječi o nagradi. Sada ide kroz
`getServerApiUrl()`, kao svaka druga serverska komponenta.

Isti obrazac popravljen na još dva mjesta: **impressum** (spisak redakcije se
renderovao prazan) i **komentari na stranici članka** (sam članak je oduvijek išao kroz
`getServerApiUrl`, komentari nisu). `newsletter/verify` je ostavljen — to je klijentska
komponenta, tamo je javni URL ispravan.

**Bug: nijedna autorska stranica nije postojala.** `AuthorController::findEditorialAuthor`
traži isključivo po `author_slug`, a ta kolona je **null na svakom nalogu** — pa je
`/author/{bilo šta}` vraćao 404. Uz to, JSON-LD na svakom članku, reviewu i vodiču
postavlja `author.url` na `/author/{author_slug || username}`, dakle **strukturirani
podaci su svuda upućivali na mrtav link**. Sada se razrješava i po `username`, uz
prednost `author_slug` kad postoji.

**Čisto:** `/contact` (throttle 3/10min, validacija, šalje mail — jedina zamjerka je da
je adresa primaoca zakucana u kodu umjesto u configu), `/rating-system`,
`/newsletter/verify`, `/giveaway/{slug}` sadržajno.

---

## SEO

**Status:** COMPLETE (osnova), PARTIAL (game pages, structured data)

**Opis:** Meta tagovi, OG, Twitter cards, sitemap, structured data, IndexNow.

**Frontend:** `components/seo/`, `lib/seo.ts`
**Backend:** `SchemaService`, `SeoAnalyzerService`, `IndexNowService`, `HreflangService`
**Admin:** `SeoManagerResource`, `PageSeoResource`
**Database:** `seo_metas`, `page_seos`
**API:** `GET /page-seo`, `GET /page-seo/{path}`, `POST /seo/suggest-links`
**Napomene:** IndexNow integrisano (Bing/Yandex instant indexing). AI-powered SEO analiza i link prijedlozi.

### Audit 12.08.2026 — SEO vodovod

**Bug: `<title>` se sijekao usred riječi.** Dugme "Fill from Article Title" u admin
panelu radilo je `substr($title, 0, 57).'...'`, pa je svaki članak s naslovom preko 60
znakova dobijao title tag koji se prekida usred riječi — *"makes a surprise return to
…"*, *"Extended Look o…"*, *"world's greatest action g…"*. Taj `meta_title` je i
`<title>` i `og:title`, dakle i tab u pregledniku i svaka podijeljena kartica.
**Uzorak od 13 članaka: 5 ih ima elipsu** (svi kojima je naslov > 60 znakova).

Google ionako sam skraćuje red u rezultatima — title tag s elipsom je samo kraći naslov
koji izgleda pokvareno. Dugme sada siječe **na granici riječi i bez elipse**
(`SeoFields::shorten`). Za već spremljene redove postoji
`php artisan seo:fix-truncated-titles` — **suho po defaultu**, piše tek s `--apply`, i
preskače elipsu koju je neko namjerno napisao (mijenja samo ono što je stvarno rez
vlastitog naslova).

**`frontend/public/robots.txt` je bio mrtav fajl.** Živi robots dolazi iz backenda
(`routes/web.php` → `SiteSetting::get('seo_robots_txt_content')`), uređuje se iz admin
panela, i **oba hosta serviraju identičan sadržaj** (provjereno md5 sumom). Fajl u repou
se nikad nije servirao a govorio je nešto drugo — obrisan, da izvor istine bude jedan.

**Za ispraviti u admin panelu** (`seo_robots_txt_content`, nije kod):
1. `Disallow: /_next/` — blokira Nextove JS i CSS pakete. Google mora dohvatiti te
   fajlove da bi renderovao stranicu; blokiranje resursa za render je klasična greška.
2. `Sitemap: https://api-beta.techplay.gg/sitemap.xml` — deklarisan na API hostu, a
   kanonski host je `techplay.gg`. Oba serviraju isti sadržaj, ali sitemap se prijavljuje
   na hostu čije URL-ove nabraja.
3. `Allow: /tech/` u Googlebot-News bloku — ruta je `/hardware`, `/tech` ne postoji.

**Provjereno kao ispravno:** sitemap index nabraja 10 pod-sitemapova (38 stranica, 617
članaka, 3 × ~50k igara) i `sitemap-articles.xml` je osvježen sinoć u 23:54 — dokaz da
`sitemap:generate` prolazi. Strukturirani podaci na članku su bogati i tačni:
NewsArticle, BreadcrumbList, Organization, WebSite + SearchAction, Person, ImageObject,
Speakable. Canonical pokazuje na pravi URL. IndexNow se okida iz `ContentObserver`.

---

## Auth

**Status:** COMPLETE

**Opis:** Register, login, logout, Discord OAuth, Battle.net OAuth, email verify.

**Frontend:** `app/(auth)/`, `context/AuthContext.tsx`
**Backend:** `AuthController`, `SocialAuthController`, `BattleNetAuthController`, `VerificationController`
**Database:** `users`, `personal_access_tokens`
**API:** `/auth/*`
**Napomene:** Sve auth client-side na frontendu osim email verifikacije.

---

## Admin Panel

**Status:** COMPLETE (osnova), PARTIAL (napredne funkcije)

**Opis:** Filament v5 admin za sav sadržaj.

**Frontend:** `/admin` (Filament renders own UI)
**Backend:** `app/Filament/`
**Napomene:** NeoBrutalism tema. 38+ resursa.

---

## Discord Bot (Professor Buffy)

**Status:** COMPLETE (osnova), PARTIAL (dublja integracija)

**Opis:** Discord bot koji polira sadržaj, dodjeljuje XP, vodi trivia, šalje recapove.

**Lokacija:** `discord/src/`
**Integracija s backendom:** HTTP API pozivi na `/api/v1/discord/*`
**Napomene:** Detalji u `18-discord-bot-map.md`.

---

## Giveaways

**Status:** COMPLETE


**Frontend:** `app/giveaways/`, `app/giveaway/`, `components/giveaway/`
Pobjednik se izvlači **ručno** iz Filamenta (`GiveawayResource` akcija) — nema scheduled joba.

### Audit 12.08.2026

**Bug (sigurnosni): `?status=ended` je propuštao neobjavljene giveaway-e.**

```php
$query->where('is_public', true)          // ranije u lancu
      ->where('status', 'ended')->orWhere('ends_at', '<', now());
```

`orWhere` nije bio grupisan, pa SQL to čita kao
`(is_public AND status='ended') OR (ends_at < NOW())` — svaki giveaway koji editor
još nije objavio pojavio bi se u javnoj listi čim mu prođe datum završetka. Isto je
kvarilo i facet filtere, koji su se lijepili samo na drugu granu OR-a. Sada je
grupisano u closure.

**Bug: "People taking part" je brojao učesnike igara koje stranica ne prikazuje.**
`DB::table('giveaway_entries')->distinct('user_id')->count()` bez ijednog uslova —
hub je pokazivao **21 učesnika** dok obje javne igre imaju `total_entries: 0`.
Sada je join na `giveaways.is_public`.

**Payload: opis je bio 51% odgovora.** Listing je slao **cijeli** tekst giveaway-a
(`strip_tags`, bez skraćivanja) za karticu koja prikazuje dvije linije. Sada
`Str::limit(…, 180)` — 3.108 B → ~1.900 B na dvije stavke, i ne raste s dužinom teksta.

**UX: prazna stranica bez izlaza.** Filter se otvara na "Active", a trenutno nijedan
giveaway nije aktivan — posjetilac dobije praznu stranicu i nijedno dugme. Dodano
"See past giveaways".

**Dizajn:** četiri brojke u heroju prešle na traku pilula (kao forum i social hub),
a Active/All/Ended na leaderboard prekidač.

**Provjereno kao ispravno:** `/giveaways/hub` radi (moj prvi 404 je bio greška u mom
URL-u, bez kose crte); facet filteri se nude samo za vrijednosti koje editor stvarno
koristi; `enter`/`completeTask`/`daily-bonus` su iza `throttle:10,1`.

---

## Social Hub

**Status:** COMPLETE

**Opis:** Jedan chat sistem za direktne i grupne razgovore, plus prijatelji,
zahtjevi, blokirani i prijedlozi. Zamijenio je stari `messages` sistem 08/2026.

**Frontend:** `app/social/SocialClient.tsx` (`/friends` i `/messages` su preusmjerenja)
**Backend:** `ChatController`, `ChatService`, `FriendController`
**Database:** `conversations`, `conversation_participants`, `messages`, `message_reactions`, `friendships`
**API:** `GET /social`, `GET|POST /conversations`, `GET|POST|DELETE /conversations/{id}/messages…`,
`POST /conversations/{id}/read`, `POST /conversations/{id}/participants`,
`DELETE /conversations/{id}/leave`, `POST /messages/{id}/react`
**Real-time:** Laravel Reverb — `conversation.{id}` za otvorenu nit, `user.{id}.chat` za listu i bedževe

**Šta postoji:** direktne poruke, grupe do 24 člana, slike (privatni disk + potpisani
URL), reakcije (zatvoren set od 6 emojija), unread po razgovoru, blokiranje koje
zaustavlja i postojeću nit, uloge u grupi (samo owner dodaje ljude), prijedlozi
prijatelja (prijatelji prijatelja, rangirani po broju zajedničkih).

### Audit 12.08.2026

**Bug: unread se brojao u PHP-u.** `ChatService::inbox()` je učitavao **svaku poruku
koju korisnik nije napisao, iz svih njegovih razgovora**, hidrirao ih u modele i
brojao u PHP-u — samo da bi stavio broj na bedž. Sada je to jedan `COUNT(*)` s
`GROUP BY` i joinom na `conversation_participants.last_read_at`.

**Bug: `onlineIds()` se zvao unutar petlje.** U `messages()` se Redis pitao jednom po
članu razgovora — grupa od 24 člana značila je 24 Redis poziva za isti odgovor.

**Bug: poruka o napuštanju direktne niti upućivala je na nepostojeću funkciju.**
"delete the conversation instead" — takav endpoint ne postoji. Tekst sada kaže šta
zaista vrijedi (blokiraj sagovornika).

**Nedostajalo: nije se moglo doći do starijih poruka.** `thread()` je imao tvrdi
limit od 50 bez ikakvog načina da se traži ranije — razgovor je bio dug 50 poruka
koliko god da je rečeno. Dodano `before_id` + `has_more` i dugme "Load older messages".

**Nedostajalo: unsend.** Nije postojao način da se poruka obriše. Dodano
`DELETE /conversations/{id}/messages/{message}` — svoja poruka uvijek, tuđa samo ako
si vlasnik grupe (u direktnoj niti nema moderatora). Brisanje pomjera
`conversations.last_message_at` na novu posljednju poruku da pregled u listi ne
citira poruku koje više nema.

**I dalje nedostaje (nije rađeno):** indikator kucanja, potvrde o čitanju vidljive
pošiljaocu, preimenovanje grupe, izbacivanje člana i prenos vlasništva (ako vlasnik
napusti grupu, niko više ne može dodavati ljude), te brisanje razgovora za sebe.

**Layout:** chat panel je visok koliko i ekran (`xl:h-[calc(100vh-104px)]`), a dijelovi
koji rastu — lista razgovora i poruke — skroluju unutar njega dok zaglavlje i polje za
pisanje stoje. Prije je bio blok od 640 px unutar stranice koja skroluje, pa je polje za
pisanje bilo ispod ruba ekrana.

**Napomena o payloadu:** `GET /social` vraća **cijeli roster prijatelja** bez
ograničenja. Za današnje brojeve je zanemarivo, ali korisnik s više stotina
prijatelja povukao bi ih sve na svako otvaranje stranice.

---

## Presence (što korisnik igra)

**Status:** COMPLETE

**Opis:** Real-time tracking što korisnik igra. Vidljivo na profilu.

**Frontend:** Prikaz na profilu
**Backend:** `PresenceController`, `PresenceService`
**Database:** `presences`
**API:** `GET /presence/{username}`, `POST /presence`, `POST /discord/presence`
**Discord bot:** setupPresenceTracking u event handleru. Bot šalje Discord Rich Presence na backend.

---

## Shop

**Status:** COMPLETE (osnova)

**Opis:** Digitalni shop s PayPal integracijom.

**Frontend:** `app/shop/`, `app/cart/`, `app/checkout/`
**Backend:** `ShopController`, `PayPalController`, `PayPalWebhookController`
**Database:** `products`, `orders`, `order_items`
**API:** Shop, PayPal endpointi

---

## The Last Disc (kampanja)

**Status:** COMPLETE (stranica + potpisi + anketa)

**Opis:** Otvoreno pismo Sonyju da zadrži fizička PlayStation izdanja poslije 2028, s
odbrojavanjem do januara 2028, anketom i formom za potpis.

**Frontend:** `app/last-disc/` (`page.tsx` SSR + `LastDiscClient.tsx` za anketu i potpis)
**Backend:** `LastDiscController`
**Database:** `last_disc_signatures`, `last_disc_votes`
**API:** `GET /last-disc`, `POST /last-disc/sign` (throttle 5/10min),
`POST /last-disc/vote` (throttle 10/10min), `GET /last-disc/export` (staff, CSV)
**Meni:** Tools → The Last Disc
**Pismo:** `/last-disc/letter` — puni tekst na vlastitoj stranici. Hiljadu i dvjesto
riječi iznad forme zatrpa formu, a dokument koji se traži da se potpiše zaslužuje
vlastitu adresu za dijeljenje i citiranje.

**Napomene:**
- **Sve brojke su stvarne.** Kampanjska stranica koja naduva broj potpisa vrijedi manje
  od one koja prizna da ih ima jedanaest — broj **jeste** argument, pa mora biti tačan.
  Kreće od nule.
- Jedan potpis po e-mail adresi (unique indeks); jedan glas po posjetiocu
  (`voter_hash` = HMAC nad IP+UA s `app.key`, prijavljeni glasaju kao nalog pa im glas
  prelazi između uređaja). **Sirovi IP se nigdje ne upisuje.**
- Ime se čuva **samo ako će biti prikazano** — ko potpiše anonimno, njegovo ime se ne
  sprema uopšte.
- `GET /last-disc/export` daje CSV za onoga ko pismo bude predavao. Peticija koja se ne
  može izvući iz baze nije peticija.
- "Latest coverage" se puni pretragom (`/search/articles?q=physical`) i **sakriva se dok
  nema članaka** — prazan naslov je gori od nikakvog.
- Zajednica vodi na forum umjesto da izmišlja teme; kad se otvori prava tema, tu se linka.

---

## WoW Analyzer

**Status:** COMPLETE

**Opis:** AI-powered World of Warcraft character analiza (Blizzard API + Gemini/OpenAI).

**Frontend:** `app/wow-analyzer/`, `components/wow/`
**Backend:** `WowAnalyzerController`, `BlizzardService`, `GeminiService`, `OpenAIService`
**Database:** `wow_analyses`, `user_wow_characters`
**API:** `/wow/*`

### Audit 12.08.2026

**Bug: prolazni kvar se keširao 24 sata.** Cijela `analyze()` metoda je stajala unutar
`Cache::remember`, zajedno sa svim greškama — pa se `JsonResponse` čuvao **šta god da je
u njemu pisalo**. Pogrešno otkucano ime lika keširalo je 404 na dan, a — daleko gore —
jedan trenutak nedostupnosti inference servisa keširao je
*"Professor Buffy is currently unavailable"* na **24 sata**, pretvarajući treptaj u
cjelodnevni ispad za taj lik. Sada se kešira samo gotova analiza; greške prolaze
nekeširane.

**Payload: leaderboard je slao 48 kolona za listu od 10.**
`WowAnalysis::leaderboard()->get()` je vraćao **cijeli red** — uključujući AI savjet
(~640 B po liku), kompletan popis opreme, raid progres, profesije i enchant/gem liste —
da bi se nacrtali ime, portret i postotak. UI čita tačno **9 polja**. Isto i `recent()`.
**19,7 KB → ~2 KB.**

**Nema nijednog testa.** `--filter=Wow|Blizzard|Groq` → "No tests found". Ovo je
podsistem koji je u avgustu bio slomljen sedam dana (`BlizzardDataTransformer` obrisan
kao "mrtav", a `BlizzardDataTransformerV2` ga nasljeđuje).

**Napomene bez izmjene:** `throttle:60,1` dopušta 60 analiza u minuti po IP-u, a svaka
zove Blizzard (12 endpointa), Raider.IO i Groq — keš pomaže samo za ponovljene likove.
Komentar uz rutu i dalje govori o "OpenAI costs" iako se koristi Groq.

---

## Notifications

**Status:** PARTIAL

**Opis:** Laravel notifikacije (in-app).

**Frontend:** Notifikacije bell, real-time hook `useRealTimeNotifications`
**Backend:** `NotificationController`, `NotificationReceived` event
**Database:** `notifications`
**API:** `/notifications`, `/user/notifications/counts`
**Napomene:** Backend implementiran. Frontend — UNKNOWN koliko je kompletno.

### Audit 12.08.2026 — notifikacije, komentari, pretraga

**Bug: koverta u headeru brojala je iz ukinutog sistema poruka.**
`NotificationController::counts()` je računao
`Message::where('receiver_id', $userId)->where('is_read', false)`. Otkad je Social Hub
zamijenio stari inbox, **`messages.is_read` niko ne piše** — nepročitano se izvodi iz
`conversation_participants.last_read_at` — a grupne poruke uopšte nemaju `receiver_id`.
Posljedica: bedž je brojao **svaku direktnu poruku ikad primljenu**, nikad se nije
očistio kad pročitaš razgovor, i grupe nije vidio. Zato je header pokazivao 1 dok je
Social Hub u istom trenutku pisao "0 UNREAD". Sada koristi
`ChatService::unreadCount()` — jedan upit, ista definicija koju hub crta.

**Komentari — čisto.** Moderacija se primjenjuje na **svakoj dubini** (odgovori su
filtrirani po `status = approved`, ne samo prvi nivo), glasovi se učitavaju u jednom
upitu umjesto N+1, dubina je ograničena (100/50/25), i `UserResource` propušta `email`
samo vlasniku. Payload 621 B.

**Pretraga — čisto.** Tri endpointa (`articles`, `games`, `users`), svaki keširan 60 s i
ograničen na 5–10 rezultata. Pretraga korisnika **poštuje privatnost** — profili
"friends only" ispadaju iz rezultata, direktan link i dalje vodi na zaključani teaser.
Upit za igre usput upisuje `player_signals` za Chronicle, u try/catch da učenje nikad ne
obori pretragu.

---

## Steam Integration

**Status:** PARTIAL

**Opis:** Steam library import, presence, achievements.

**Backend:** `SteamService`, `SyncSteamLibrary` job, `PollSteamPresence` job, `SteamAchievementController`
**Database:** `connected_accounts`, `steam_achievements`, `user_games`
**API:** `GET /users/{username}/steam-achievements`
**Napomene:** Import job postoji. Frontend prikaz steam achievementa na profilu. Detalji integracije UNKNOWN.

### Audit 12.08.2026 — presence, Steam, Discord bot

**Nespojeno (sada spojeno): nije se moglo sakriti šta igraš.** Tekst iznad liste
povezanih naloga oduvijek kaže *"only you control its visibility"* — a kontrole nije
bilo. Povezivanje Steama postavlja `visibility = 'public'`, i **nijedan endpoint to nije
mogao promijeniti**; jedini izlaz je bio odspojiti nalog. Kolona je pritom radila pravi
posao: `PollSteamPresence` čita samo naloge označene kao public. Dodano
`PATCH /connected-accounts/{id}/visibility` + prekidač Visible/Hidden u settingsima;
prelazak na Hidden usput obriše trenutnu presence ako je došla s tog izvora.

**Mrtav kod u botu:** `ApiService.getUserProfile()` nije pozvan nigdje.

**Provjereno kao ispravno:**
- Steam OpenID callback radi pravi `check_authentication` round-trip prema Steamu — ne
  vjeruje parametrima na riječ. `state` je jednokratan (`Cache::pull`), pa se ponovljeni
  callback ne može iskoristiti.
- `GET /presence/{username}` poštuje privatan profil i vraća **null, ne 403** — odbijanje
  bi potvrdilo da nalog postoji. Bez toga bi anketiranje s `started_at` rekonstruisalo
  dnevni raspored igranja privatnog profila bez ijednog naloga.
- `PollSteamPresence` grupiše po 100 ID-eva (Steamov limit), ne pregazi ručnu ili Discord
  presence, i svaki korisnik je u vlastitom try/catch.
- Discord bot ↔ backend: **svih 19 endpointa koje bot zove postoji** (provjereno uživo
  za javne, `route:list` za `/discord/*`). Bot-token provjera stoji na grupi, ne po
  endpointu — raniji copy-paste je ostavljao `/discord/presence` i `/discord/user`
  otvorenim.

---

## Backlog Advisor

**Status:** COMPLETE

**Opis:** Preporuke igara bodovane prema korisnikovoj kolekciji.

**Frontend:** `app/backlog-advisor/AdvisorClient.tsx`
**Backend:** `BacklogAdvisorController::recommendations`
**API:** `GET /backlog/recommendations?mood=&genres[]=&exclude_backlog=&exclude_played=`
**Napomene:** **Nema AI-ja** — raniji zapis je govorio "AI preporuka (Gemini ili OpenAI)"
i `POST /backlog/suggest`; ni jedno ni drugo ne postoji. Bodovanje je deterministički
zbir četiri komponente do 100: tvoja kolekcija, igrači sa sličnom policom, kvalitet
(ocjene) i era. "Why" na kartici pokazuje raspodjelu bodova.

### Audit 12.08.2026

**Bug: "Backlog health" je psovao praznu policu.** Formula je
`completion_rate * 0.7 + (1 - pressure) * 30`. Korisnik s **praznim backlogom** ima
`pressure = 0`, što je najzdravije moguće stanje, ali bez ijedne završene igre dobija
tačno 30% i poruku "The pile is winning. Pick something short and clear it." — o gomili
od nula igara. Dodana grana za `backlog === 0`.

**Bug: ključ za bodovanje je spominjao kolonu koju smo obrisali.** "Player ratings and
Metacritic, where we have them" — `games.metacritic` je izbačen u čišćenju scheme
08/2026 (bio je nula na svakom redu), a bodovanje kvaliteta oduvijek čita samo
`games.rating`. Tekst je ispravljen.

**Mrtav kod:** `BacklogAdvisorController::MOODS` se nigdje nije koristio i navodio je
`relaxed`, raspoloženje koje ni validacija ni servis ne poznaju (stvarni set je
`any, action, story, chill, competitive`). Obrisano.

**Payload:** 12 preporuka + do 14 žanrova + summary + weights, procijenjeno ~7 KB.
Endpoint traži autentifikaciju pa ga nisam mogao izmjeriti izvana — nema očiglednog
viška: svaka preporuka nosi 9 polja, tri žanra i četiri stavke raspodjele bodova, i
sve to stranica crta.

**Provjereno kao ispravno:** raspodjela bodova se zbraja u 100 i `max` po komponenti
odgovara `WEIGHTS`, pa trake u "Why" nisu ukrasne; `taste` profil keširan 15 min,
lista žanrova 24 h; upiti su ograničeni (`CANDIDATE_POOL` 400, peer signal 600) i biraju
samo kolone koje trebaju.

**Redizajn 12.08.2026:** traka statistike prešla na pilule kao na ostalim hubovima;
kartica preporuke dobila rub u boji ocjene i traku ispod broja (ocjena se sada i vidi,
ne samo čita); "How these are scored" i "Backlog health" spojeni u jednu kutiju na vrhu
lijeve kolone — ključ za bodovanje treba da stoji **pored** ocjena, a ne ispod liste
gdje niko ne gleda.

---

## Profile Wrapped

**Status:** COMPLETE

**Opis:** Godišnji rezime gaming aktivnosti (à la Spotify Wrapped).

**Frontend:** `app/wrapped/`
**Backend:** `WrappedController`
**API:** `GET /users/{username}/wrapped/{year}`

### Audit 12.08.2026 — GTA6, Wrapped, liste, kalendar detalj

Sve četiri cjeline su **čiste** — nijedan bug, nijedan mrtav poziv, nijedan
prenapuhan payload.

| Endpoint | Payload | Napomena |
|---|---|---|
| `gta6/vehicles` | 19,3 KB / 2,2 KB brotli | 121 vozila × 7 kratkih polja = 170 B po redu; nema šta da se skida |
| `gta6/weapons` | 4,9 KB | |
| `gta6/characters` | 2,0 KB | |
| `users/{u}/wrapped/{god}` | 2,8 KB | |
| `users/{u}/lists` | 583 B | |
| `calendar/{slug}` | 5,1 KB | 2 KB screenshoti + 1,9 KB "also this month", oboje se crta |

**Provjereno:** svih 6 GTA6 stranica vraća 200 s punim SEO naslovima; svih 11
referenciranih slika postoji (`hero` je `.jpg`, ne `.png` — moj prvi test je lažno
prijavio 404); `/gta6/vehicles/classes` je registrovan **prije** `/gta6/vehicles/{slug}`
pa ga slug ruta ne guta; `/lists/{user}/{slug}` za nepostojeću listu vraća **404**, ne
praznu indeksabilnu stranicu kao što su radili game listinzi; `/wrapped` bez imena
preusmjerava na svoj wrapped ili na login.

**Nespojeno:** `GET /gta6/vehicles/{slug}` i `GET /gta6/weapons/{slug}` postoje na
backendu, ali **nemaju stranicu ni pozivaoca** — likovi imaju detaljnu stranicu, vozila i
oružja nemaju. Nespojena funkcija, ne mrtav kod.

**Siroče:** `public/gta6/card-gameplay.png` se ne referencira nigdje.

---

## Media/Uploads

**Status:** COMPLETE

**Opis:** Slike za članke, profile covers, avatare.

**Backend:** `ImageService`, `ImageOptimizationService`, `MediaObserver`
**Admin:** `MediaResource`
**Database:** `media`
**Napomene:** Upload → validacija → storage → opcijski resize/optimize.

---

## Ispravke statusa iz sigurnosnog pregleda 08–10.08.2026

Tri stvari za koje je mapa govorila jedno, a stvarnost drugo.

### Discord bot — **NE RADI U PRODUKCIJI**

Prethodni status je opisivao servise kao da rade. Provjereno 09.08.2026 na
serveru: bota **nema** ni u pm2, ni u supervisoru, ni u systemd, ni u dockeru,
ni kao goli node proces. Kod postoji i gradi se (`tsc` prolazi), `.env` je
kompletan i tajna se poklapa s backendom — jednostavno ga ništa ne pokreće.

Sve što ova mapa piše pod "**Discord bot:**" treba čitati kao *napisano i
spremno*, ne *aktivno*. Bot je i dalje jedina komponenta bez deploy putanje —
nije ni u jednoj skripti u `deployment/`.

Posljedica koju vrijedi znati: `API_URL` u botu pokazuje na `techplay.gg`, i to
je **ispravno** — nginx tamo proxy-ra `/api`, dok `api-beta.techplay.gg` vraća
403 na serverske pozive (Cloudflare). Ne "popravljati" to na api-beta.

### Podrška / pledge — bio slomljen, sada radi

`POST /support/pledge` je vraćao 500 na **svaki** poziv jer je kontroler čitao i
pisao kolone `payment_id` i `is_recurring` kojih u tabeli nije bilo. Status je
bio naveden kao gotov; funkcija nikad nije primila uplatu. Migracija
`2026_08_09_000200` to popravlja i uz to sprječava da se jedna uplata iskoristi
više puta.

Uz to: `activeSupport()` nije gledao `expires_at`, pa je jedan mjesec podrške
trajno otključavao tier kozmetiku.

### Klanovi — nedostaju osnovne radnje

Ne postoje kao rute, kontroleri, ni bilo šta drugo: **prijenos vlasništva,
raspuštanje klana, izbacivanje člana, promocija u oficira.**

Posljedice koje API stvarno provodi:

- Vlasnik ne može napustiti klan — `leave` mu kaže "prenesi vlasništvo", a ta
  ruta ne postoji. Jedini izlaz mu je brisanje naloga, što kaskadno ruši klan.
- **Oficirski nivo je nedostižan** — `admit()` uvijek upisuje `member`, i nigdje
  u kodu se ne piše `role => 'officer'`. Sve rute označene kao "officer+" su
  time de facto samo vlasnikove.
- Toksičan član se ne može ukloniti.

Ovo je nedostajuća funkcionalnost, ne rupa — ali izgleda kao da postoji, pa je
bolje da piše.
