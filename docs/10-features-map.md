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

**Opis:** TechPlay native giveaways + Privée giveaway platforma integracija.

**Frontend:** `app/giveaways/`, `app/giveaway/`, `components/giveaway/`
**Backend:** `GiveawayController`, `PriveeGiveawayController`
**Database:** `giveaways`, `giveaway_entries`, `giveaway_tasks`, `privee_giveaway_entries`
**Napomene:** Dvije zasebne logike (TechPlay i Privée). Discord bot šalje giveaway notifikacije.
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
