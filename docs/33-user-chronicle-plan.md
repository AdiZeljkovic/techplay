# 33 — User Chronicle: interni sistem učenja o gameru (IZVEDBENI PLAN)

> Status: PLAN — odobrenje čeka. Ništa odavde još nije implementirano.
> Cilj: sistem u pozadini uči o registrovanom gameru iz SVEGA što radi na TechPlayu,
> sažima to u interni "chronicle" red uvezan s games bazom, i SVE površine koje
> išta preporučuju čitaju taj jedan izvor. Korisnik chronicle nikad ne vidi —
> vidi samo da ga TechPlay pogađa.

---

## 0. Zatečeno stanje (audit 08/2026)

- **Tri odvojena "mozga ukusa"** koja se ne slažu:
  - `GameRecommendationService` (najbolji: statusne težine, favoriti, peer signal, ere) — čita SAMO `user_games`
  - `DashboardController::tasteProfile` (slabiji duplikat, bez peera) — pogoni dashboard "Recommended Next"
  - `GamerDnaService` (statična žanr→vektor tabela) — pogoni DNA tab
- **`Feed\InterestProfile`** (reads/bookmarks/comments, najbogatiji signali) — izolovan od preporuka igara
- **Lažno personalizovano**: `RecommendedNews.tsx` = slice(0,4) najnovijih (na news+reviews+guides!);
  `UpcomingForYouRow` = globalni kalendar; `/games/{slug}/suggested` = žanr+ocjena, isto za sve
- **Signali koje niko ne čita**: vlastite ocjene igara, hours_played, playstyle_tags, pc_specs
  (osim DNA bedža), presences.game_name, per-user search (ne postoji), steam_achievements (mrtva tabela),
  čitanje game-linked članaka (kičma iz 08/2026 to omogućava)
- **Orphani**: GiveRecognitionButton (recognitions se prikazuju, nema UI da se daju!), SpecsCard,
  GamertagsCard, ReputationBountyCard, CommunityRanking, ContributionMilestones (milestones se
  fetchuje pa baca), LivePresenceBadge, CurrentlyPlayingSidebar

---

## 1. Schema (Faza 1 + 2)

### 1.1 `user_chronicles` — dosije, jedan red po korisniku (INTERNO)
```
user_id          bigint PK → users
taste            jsonb   -- {"genres": {"RPG": 0.84, ...}, "platforms": {...}, "eras": {"2010s": 0.6}, "tags": {...}}
game_affinities  jsonb   -- top 50: {"<game_id>": 0.91, ...} (igre koje ga trenutno okupiraju)
negative         jsonb   -- {"genres": {...}} iz dropped/low ratings — i NE-volim je učenje
peer_ids         jsonb   -- keširan spisak 20 najsličnijih korisnika (za collaborative sloj)
signals_count    int     -- koliko je signala ušlo u build (za "honest empty" pragove)
last_signal_at   timestamptz
built_at         timestamptz
version          smallint -- verzija buildera; bump = svi se rebuilding
```
Nikad ne izlazi kroz javni API. Ne ulazi u profil payload.

### 1.2 `player_signals` — samo ono što bi inače isparilo
```
id, user_id, game_id nullable → games, type varchar(32), weight numeric(4,2),
meta jsonb, day date
UNIQUE (user_id, type, game_id, day)  -- dnevni rollup, ne sirovi pingovi
```
Tipovi u Fazi 2: `search` (upit + matchovana igra), `presence` (viđen da igra X — 1 red/dan/igri),
`steam_achievement_batch`. Sve ostalo se NE duplira — čita se iz postojećih tabela.

### 1.3 Steam achievements (postojeća mrtva tabela oživljava)
`steam_achievements` puni `games:sync-steam-achievements` (dnevno, za povezane naloge)
preko postojećeg `SteamService`. Kolone po potrebi uskladiti pri implementaciji.

---

## 2. ChronicleBuilder — šta ulazi i s kojom težinom

| Izvor (postojeća tabela) | Signal | Bazna težina |
|---|---|---|
| `game_ratings` (vlastita ocjena) | 8–10 → jak +, ≤4 → negativan | 5.0 / −3.0 |
| `user_games.is_favorite` | favorit | 4.0 |
| `user_games.status=completed` | završio | 3.0 |
| `play_sessions` (sati!) | log(1+h) množi afinitet igre | do 3.0 |
| `article_bookmarks` → `articles.game_id` (kičma) | bookmark o igri | 3.0 |
| `game_ratings.review_text` / recenzija | napisao o igri | 3.0 |
| `user_games.status=playing` | igra sada | 2.5 |
| `comments` na game-linked članke | komentar | 2.0 |
| `user_games.status=backlog` | planira | 1.5 |
| `article_reads` (progress≥50) → game_id | pročitao o igri | 1.5 |
| `user_games.status=wishlist` | želi | 1.0 |
| `player_signals.search` | tražio | 0.6 |
| `player_signals.presence` | viđen da igra | 0.8 |
| `steam_achievements` | žanrovi igara s achievementima | 1.0 |
| `users.playstyle_tags` | ručno izjašnjen stil | direktno u taste |
| `user_games.status=dropped` | odustao | −1.5 |

**Opadanje**: težina × e^(−dani/180) — pola vrijednosti nakon ~6 mjeseci. Novo važi više; ukus smije da se mijenja.
**Agregacija**: igra → njeni `genres/platforms/tags/released` iz NAŠE baze (zato je kvalitet baze bio preduslov).
**Okidači**: queued job (debounce 5 min) na bitne događaje + noćni rebuild za korisnike sa `last_signal_at` < 48h + `chronicle:rebuild {--all}` komanda.
**Peer sloj**: kosinus sličnost game_affinities → `peer_ids` (nasljeđuje postojeću peer logiku, sada nad bogatijim profilom).

---

## 3. TasteProfileService — jedini čitač

API (interni): `tasteFor(User)`, `gameAffinities(User)`, `recommendGames(User, filters)`,
`recommendArticles(User, limit)`, `upcomingFor(User)`, `peersOf(User)`.
`GameRecommendationService`, `DashboardController::tasteProfile` i `Feed\InterestProfile` se
**apsorbuju** u njega (peer + scoring logika se čuva, ne piše ispočetka). `GamerDnaService`
zadržava svoj narativ, ali ose računa iz chroniclea.

**Honest empty**: `signals_count < prag` → površine se ponašaju kao danas feed
(`personalised: false`, popularity fallback, bez lažnog "For You").

## 4. Površine koje se prespajaju (svih 9)

| Površina | Fajl | Promjena |
|---|---|---|
| Dashboard "Recommended Next" | `DashboardController::recommendations` | čita TasteProfileService |
| Dashboard backlog suggestion | `DashboardController::backlogSuggestion` | isto |
| Backlog Advisor | `BacklogAdvisorController` | isto (mood/filteri ostaju) |
| "You might also like" na igri | `GameController::suggested` | ulogovan → personalizovano; gost → kao sada |
| "Upcoming For You" | `UpcomingForYouRow.tsx` + novi `GET /me/upcoming` | kalendar × wishlist × taste |
| **RecommendedNews** (3 templatea!) | `RecommendedNews.tsx` + novi `GET /feed/recommended-news` | stvarno preporučeno preko kičme; gost → popularno (i preimenovati label ako nema profila) |
| Feed "For You" | `FeedController::personalized` | isti chronicle (članci + igre zajedno) |
| Sedmični digest | `SendWeeklyDigest` | isti chronicle (kraj trećeg seta signala) |
| Gamer DNA | `GamerDnaService` | ose iz chroniclea |

## 5. Faza 3 — punjenje sistema (sadržaj)

- **Questovi** (initial set, vezani za signale — questovi UBRZAVAJU učenje):
  dnevni: logiraj sesiju / ocijeni igru / pročitaj članak do kraja / dodaj igru u kolekciju;
  sedmični: završi igru iz backloga / napiši recenziju / napravi listu / 3 komentara;
  mjesečni: 10 sesija / popuni Gamer DNA (specs+tagovi) / poveži Steam
- **Season 1**: naziv/tema/period + sezonski quest track (postojeće `seasons` tabele)
- **Recognition dugme** nazad (orphan `GiveRecognitionButton` remont + mount na profil)
- **Steam achievements sync** komanda + connect hook

## 6. Faza 4 — higijena

Orphan komponente van (8 kom), `milestones` render ili ukinuti, `users` dijeta
(discord/bnet tokeni → `user_integrations` tabela), `game_ratings` prelaz na `game_id` ključ,
imenovanja ujednačiti (`customizations` vs `user_customizations`).

## 7. Verifikacija i deploy

- Unit testovi buildera (težine, decay, negativni signali, prag za honest-empty)
- Paritet test: stari vs novi recommender na istim fixture korisnicima (novi ne smije biti lošiji)
- Svih 350+ postojećih testova zeleno; route sweep
- Deploy redoslijed: migracije → `chronicle:rebuild --all` (55 korisnika = sekunde) →
  config/route cache → octane restart → front build; queue worker već radi
- Rizici: cold start (honest fallback), builder perf (queued, čitanje = 1 red),
  privatnost (chronicle interni, poštuje `profile_visibility` za peer izvore)

## 7b. Dva principa kroz SVE faze (dopuna nakon odobrenja)

**Frontend se gradi gdje fali.** Dio površina za sisteme koje punimo ne postoji ili je
sakriven (questovi imaju panel ali nema quest-log stranice; sezona nema banner logike sa
sadržajem; Recognition nema dugme; Steam achievements sekcija čeka podatke). Svaka faza
uključuje i frontend rad: kreiranje, otkopavanje orphana ili doradu — u postojećem
dizajn-jeziku (Panel, matte, 8/5 radijusi).

**Struktura baze korisnika prolazi istu sanaciju kao games baza.** Ne "sve u jednu
tabelu", nego red: izmjeriti svaku user-domenu tabelu, spojiti duple
(`customizations`/`user_customizations` konvencija), preimenovati nedosljedno,
`users` dijeta (49 kolona → integracijski tokeni u `user_integrations`, PayPal u
`user_billing` ili services konvenciju), `game_ratings` na `game_id`, obrisati stvarno
mrtvo. Mjerenje prvo, reverzibilne migracije, driver-guarded — isti protokol koji je
games bazu doveo u red. Nove chronicle tabele od prvog dana slijede tu konvenciju.

## 8. Redoslijed izvedbe

1. **Faza 1**: schema (1.1) + ChronicleBuilder (iz postojećih tabela) + TasteProfileService + rewire 9 površina
2. **Faza 2**: `player_signals` (search/presence) + Steam achievements pipeline + hours/ocjene/čitanja/tagovi u builder
3. **Faza 3**: questovi + Season 1 + Recognition
4. **Faza 4**: higijena

Svaka faza se zasebno testira, komituje i deploya — sajt je live, bez velikih rezova.
