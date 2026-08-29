# 04 — Frontend Map

## Framework i osnove

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS** za stilizaciju
- **Laravel Echo** + `pusher-js` za WebSocket real-time
- **ISR** kao primarni caching mehanizam
- `images: { unoptimized: true }` — Image optimization isključena (sprečava disk exhaustion)

---

## Routing (App Router)

Sve stranice su u `frontend/app/`. Svaki folder = ruta.

| Ruta | Stranica | Opis |
|------|----------|------|
| `/` | `app/page.tsx` | Homepage — ISR za **sve**, logovan ili ne. `HomeGate` je uklonjen 14.08.2026: naslovnica sajta je bila nečiji profil, a swap se mogao desiti tek nakon hydration pa je logovan čitalac dobijao skeleton preko već renderovane ISR stranice. Dashboard nije nigdje otišao — on je Overview tvog profila |
| `/news` | `app/news/` | News listing + `[slug]` detalj |
| `/reviews` | `app/reviews/` | Reviews listing + `[slug]` detalj |
| `/guides` | `app/guides/` | Guides listing + `[slug]` detalj — dijeli `components/editorial/SectionHub` |

### Sekcijske stranice (news / reviews / hardware / guides)

Sve četiri renderuje jedna komponenta, `components/editorial/SectionHub`, uz
`components/editorial/sections.ts` gdje su skupljene razlike: endpoint ključ,
URL prefiks (tech članci žive pod `/hardware`), naziv filter parametra
(`category` vs `difficulty` za guides) i da li kategorija ima vlastitu stranicu.

Okvir stranice (tabovi s brojevima, spotlight, ticker, most read, upcoming
releases, stats) dolazi s `GET /newsroom/{section}`; sama lista i dalje ide na
postojeći endpoint sekcije, jer admin za svaku ima zasebnu površinu za pisanje.

Ista komponenta renderuje i **podkategorije** (`/news/gaming`,
`/reviews/indie-gems`, `/hardware/benchmarks`) preko `category` propa: lista je
prikovana na tu kategoriju, naslov postaje ime kategorije, a spotlight je
najnoviji članak iz nje — sekcijski spotlight bi tu bio van teme. Kod news i
reviews te rute nisu zaseban folder nego žive unutar `[slug]`, koja odlučuje je
li segment ime kategorije ili slug članka; zato ih je lako previdjeti.

Tabovi su **linkovi na te stranice**, ne filteri na mjestu — inače bi
indeksirane podkategorije ostale bez ijednog internog linka. Mapiranje DB slug →
URL segment se izvodi iz `lib/categories` (`id` = DB slug, `slug` = URL segment),
da ne postoje dva izvora istine. Guides nemaju kategorije, samo `difficulty`, i
filtriraju na mjestu.

Jedna razlika u API-ju: **guides liste vraćaju goli paginator** (`current_page`
na vrhu), a articles resource collection (`meta`). `SectionHub` čita oba oblika.
| `/hardware` | `app/hardware/` | Tech/hardware listing + `[slug]` detalj — dijeli `components/editorial/SectionHub` |
| `/games` | `app/games/` | Game database listing + `[slug]` detalj |
| `/calendar` | `app/calendar/` | Release calendar |
| `/forum` | `app/forum/` | Forum kategorije + `[slug]` thread |
| `/profile` | `app/profile/` | Korisnički profil (`[username]`) |
| `/settings` | `app/settings/` | Korisničke postavke |
| `/friends` | `app/friends/` | Prijatelji |
| `/messages` | `app/messages/` | Direct messages |
| `/leaderboard` | `app/leaderboard/` | XP leaderboard |
| `/compare` | `app/compare/` | Profile compare `[username]/[other]` |
| `/giveaways` | `app/giveaways/` | Giveaways listing + `[slug]` |
| `/shop` | `app/shop/` | Shop katalog |
| `/cart` | `app/cart/` | Košarica |
| `/checkout` | `app/checkout/` | PayPal checkout |
| `/wow-analyzer` | `app/wow-analyzer/` | WoW karakter analiza |
| `/backlog-advisor` | `app/backlog-advisor/` | AI preporuka igara |
| `/wrapped` | `app/wrapped/` | Godišnji gaming rezime |
| `/about` | `app/about/` | O nama / Staff |
| `/contact` | `app/contact/` | Kontakt forma |
| `/roadmap` | `app/roadmap/` | Javni razvojni roadmap |
| `/media-kit` | `app/media-kit/` | Media kit za partnere |
| `/newsletter` | `app/newsletter/` | Newsletter subscribe |
| `/support` | `app/support/` | Support tier info |
| `/login` | `app/(auth)/login` | Login stranica |
| `/register` | `app/(auth)/register` | Registracija |
| `/auth/*` | `app/auth/` | OAuth callback stranice |

---

## Layout sistem

- **Root layout:** `app/layout.tsx` — wrapped sa svim Contextima, GlobalSeo, fonts
- **Contexts injektirani u root:**
  - `AuthContext` — korisnik + token
  - `CartContext` — shopping cart
  - `ThemeContext` — dark/light
  - `SiteSettingsContext` — site-wide postavke iz API
  - `MobileMenuContext` — mobile nav

---

## Auth na frontendu

- **Metoda:** Client-side, Bearer token u `localStorage`
- **`AuthContext`** (`context/AuthContext.tsx`) — stores token + user, restores on mount, verifikuje u pozadini
- **Dohvat sadržaja na serveru** — `lib/fetchContent.ts`. Razlikuje 404/410 (stvarno
  ne postoji → `notFound()`) od svega ostalog (API se nije javio → jedan retry pa
  `ContentUnavailable`, što hvata `app/error.tsx`). Prije ovoga je svaka detaljna
  stranica radila `if (!res.ok) return null` → `notFound()`, pa je svaki prolazni
  kvar backenda čitaocu izgledao kao „stranica ne postoji" — otud 404-pa-refresh.
- **Middleware** — nema ga. `middleware.ts` je postojao samo zbog maintenance modea koji nikad nije radio (nije bilo `/coming-soon` stranice ni prekidača u adminu), a plaćao se blokirajućim `fetch`-om na svaki zahtjev. Auth je ionako client-side; `protectedRoutes` je bio prazan.
- **Protected stranice** — client-side redirect na `/login` kada token nije prisutan
- **Login flow:** POST `/api/v1/auth/login` → token → localStorage

---

## Data fetching strategija

- **Server Components:** direktan fetch od backend za SSR/ISR (`next: { revalidate: N }`)
- **Client Components:** `useApi` hook ili `lib/api.ts` + `lib/axios.ts`
- **Real-time:** hooks `useRealTime*.ts` — Laravel Echo listeners na WebSocket channels

### Real-time hooks

**Ostao je jedan.** `hooks/useRealTimeForum.ts`, koji uvoze `ThreadClient.tsx` i
`CategoryClient.tsx` — jedini stvarno spojen na stranicu.

| Izvoz | Odakle | Ko ga uvozi |
|------|--------|-------------|
| `useRealTimeForum` | `hooks/useRealTimeForum.ts` | `CategoryClient.tsx` |
| `useRealTimeThreadReplies` | isti fajl | `ThreadClient.tsx` |

Obrisani 29.08.2026., jer su bili napisani, izvezeni i **nikad uvezeni ni u
jednu stranicu** — bundler ih nije ni isporučivao: `useRealTimeNews`,
`useRealTimeReviews`, `useRealTimeComments`, `useRealTimeGuides`,
`useRealTimeShop`, `useRealTimeNotifications`, `useMediaKit`.

> `useRealTimeVideos` je bio u ovoj tabeli a **nikad nije postojao u repou** —
> provjereno, nula pogodaka u cijelom `frontend/`.

**Pouka:** `useRealTimeThreadReplies` je bio na listi za brisanje i vraćen je.
Nije zasebni fajl nego drugi izvoz iz `useRealTimeForum.ts`, pa je „nema fajla s
tim imenom" izgledalo kao „niko ga ne koristi". **Traži uvoz, ne fajl.**

---

## API komunikacija

- **Lib:** `lib/api.ts` → `getApiUrl()` koji zamjenjuje `localhost` → `127.0.0.1` (IPv6 fix)
- **Axios instanca:** `lib/axios.ts` — konfigurisan sa Bearer token interceptorom
- **Base URL:** `process.env.NEXT_PUBLIC_API_URL`
- **Storage URL:** `process.env.NEXT_PUBLIC_STORAGE_URL`

---

## SEO / Meta handling

- `components/seo/GlobalSeo.tsx` — dinamičke meta tagove po stranici
- `lib/seo.ts` — SEO helper funkcije
- Root `layout.tsx` — Organization + WebSite JSON-LD
- Svaka stranica/servisni komponenta može injektovati vlastite meta tagove
- OG slike generisane dinamički kroz `app/og/` Next.js rute

---

## Komponente po domenima

| Folder | Opis |
|--------|------|
| `components/ui/` | Bazne UI komponente (Button, Card, Modal, Badge, itd.) |
| `components/layout/` | Header, Footer, Sidebar, Navigation |
| `components/news/` | NewsCard, NewsList, ArticleBody |
| `components/reviews/` | ReviewCard, ReviewBody |
| `components/games/` | GameCard, GameFilter, GameGrid, **ReleaseCard** (dijeljena kartica neizašle igre — kalendar i "Upcoming For You" na profilu crtaju isti objekt; izvozi i `platformMarks()` / `PlatformMarks`) |
| `components/forum/` | ThreadCard, ThreadList, PostCard |
| `components/profile/` | CollectionGrid, ListsTab, ActivityFeed, StatsPanel, AchievementGrid, LockedProfile |
| `components/home-dashboard/` | ProfileHero, ProfileTabStrip, RankInsignia, DailyMissions, DashboardHome — identitet i sekcije profila/logovane naslovnice |
| `components/comments/` | CommentForm, CommentList, CommentItem |
| `components/home/` | Hero, FeaturedSection, LatestNews |
| `components/seo/` | GlobalSeo, PageSeo, JsonLd |
| `components/ads/` | AdBanner, InTextAd |
| `components/tracking/` | View tracking komponente |
| `components/providers/` | Context provider omotači |

---

## Profil = logovana naslovnica (08/2026)

Jedna komponenta servira svaki profil. Nema više odvojenog "dashboarda" i "profila".

- **`/profile/{username}`** je jedina stranica. Sekcije su `?tab=` query parametri (`collection`, `lists`, `achievements`, `activity`, `stats`, `rewards`) — nisu zasebne rute, nema reloada.
- **Tvoj Overview** renderuje `DashboardHome` — jedino mjesto gdje dashboard sada živi. Naslovnica ga više ne preuzima.
- **Svaki drugi tab** (tvoj ili tuđi) renderuje `ProfileHero` + sadržaj taba. Hero je isti za sve; razlikuju se samo akcije (Continue Playing / Edit vs Add Friend / Message) i to da `Rewards` tab postoji samo na tvom profilu.
- **`lib/hero.ts`** normalizuje dva različita payloada (`/me/dashboard` i `/users/{username}`) u jedan `HeroModel` — hero ne zna odakle podaci dolaze.
- **`lib/profileTabs.ts`** je jedini izvor tab seta (`PROFILE_TABS`).
- **`LockedProfile`** je ono što stranac vidi na `friends`-only profilu: avatar, ime, level, rank, "member since" i Add Friend. Nikad 404.
- **`lib/level.ts` mora ostati identičan `backend/app/Services/LevelService.php`** — ako se mijenja kriva, mijenjaju se oba, inače header i profil pokazuju različit level.
- **Jedan panel jezik (08/2026):** sve sekcije naslovnice idu kroz `components/ui/Panel` (header: tick + 12px font-black naslov; hairline `border-white/[0.07]`; inset sub-kartice `bg-white/[0.02]`). `variant="console"` = topli gradijent + accent ivica + corner bracket — **najviše jedan po koloni** (Campaign Progress u glavnoj, Daily Missions u sidebaru). Ljubičasta `--xp` isključivo za progresiju (XP nagrade, match ringovi); narandžasta za akcije; emerald za LIVE; amber za bounty. `lib/timeAgo.ts` je jedini relative-time helper.

Obrisano: `ProfileHeader.tsx`, `ProfileTabs.tsx`, `OwnProfileShell.tsx`.

### Javni profil — šta posjetilac vidi (23.08.2026)

Izmjereno prije izmjene: od 53 naloga 51 je `public`, biblioteku ima **jedan** (191 igara), sljedeći ima 2 — prazan profil je pravilo, ne rub. Posjetiočev Overview je otvarao showcase i policu ("šta posjeduje"), a nijedan broj na stranici nije razlikovao policu popunjenu u jedno popodne od devet godina igranja.

- **`PlayerCard`** (`components/profile/PlayerCard.tsx`) je prvi blok posjetiočevog Overviewa: sati, `playing since`, platformski achievementi i najigranija igra s udjelom. Podaci iz novog `player_card` ključa. Ne crta se na tvom profilu niti na praznoj polici — nula izgleda kao mjerenje, a odsustvo nije.
- **`TasteMatch`** je pomjeren s dna `?tab=stats` na vrh Overviewa. Sam se gasi za odjavljenog čitaoca i na vlastitom profilu; više se ne renderuje na Gamer DNA tabu (bio bi isti panel dvaput).
- **Hero traka ima dvije verzije.** Vlasnik zadržava `Streak` i `Level N+1 loot` — to su kuke, a kuka radi samo na onom ko može reagovati. Posjetilac umjesto njih dobija `Playing since` (`hero.playing_since`, iz `player_card.span.from`).
- **`Progression` je `ownOnly`.** Posjetiocu je renderovao samo `SeasonPanel`, koji čita globalni `/seasons/active` — identična slika na svih 53 profila. Vraća se kad sezona dobije standing po igraču. Redirect za owner-only tabove sada čita `PROFILE_TABS`, ne hardkodovan `"rewards"`.
- **Kopija u treće lice na tuđem profilu:** Library hintovi, prazna stanja Diary/Timeline/Steam achievementa i "Add your first game" na `CollectionLedger` — sve je govorilo posjetiocu da uradi nešto s policom koja nije njegova.
- **SEO opis nosi brojke** (`describe()` u `app/profile/[username]/layout.tsx`) umjesto "Check out X's gaming profile" na svih 53 naloga. Zaključan profil dobija samo ime.
- **Recent Activity je uklonjen** (24.08.2026). Svaki red u njemu — "commented on", "rated", "added a game" — pokazuje na stranicu koja već postoji, pa je tuđi profil završavao spiskom stvari koje je taj neko uradio negdje drugdje. Profile Wall je sada zadnji blok. `ActivityFeed` komponenta ostaje, samo je ovdje niko ne zove.
- **Community Standing JE XP rank** (24.08.2026). Kartica je prvo dobila insignije po Standing tieru, i tek tada se vidjelo da problem nije ikonica nego druga ljestvica ispod nje: profil je gore pisao "Noob" (XP rank), a dole "Rookie III" (reputacijski tier). Izmjereno: prva promocija u Standingu je na 2.000 reputacije, reputacija se mijenja ±1 po glasu i +10 po prihvaćenom rješenju, a rekord sajta je **68** na 53 naloga od kojih dva imaju ikakvu — dakle svaki profil je pisao "Rookie III · Top 100%", ljestvica koju niko nikad nije popeo ni jednu prečku. Uz to su četiri od šest imena (Rookie, Veteran, Elite, Legend) i imena XP rankova.

  Sada kartica crta XP rank: ista insignija koju crta hero, plus ono što hero ne može reći — percentil po XP-u, koliko XP-a do sljedećeg ranga, i priznanja. Sparkline crta XP (kolona `reputation_snapshots.xp` postoji od 07/2026, pa historija ima podatke odmah), ne reputaciju — linija mora biti ista veličina kao broj iznad nje. Payload ključ je `reputation` → **`standing`**, tip `ReputationData` → `StandingData`. Reputacija ostaje broj u kartici (samo kad je > 0) i i dalje rangira leaderboard. `config/ranking.php` je izgubio `tiers`, zadržao `contribution_weights`.

### Povezane platforme — dokle se stiglo (24.08.2026)

| Platforma | Uvoz biblioteke | Šta daje |
|---|---|---|
| Steam | ✅ | sati, podjela po uređaju, zadnje igrano, achievementi (imena, ikone, datumi), completed iz 100% |
| Xbox | ✅ | zadnje igrano, progres %, completed iz 100%, gamerscore — **bez sati** (Microsoft ih ne izlaže) |
| PlayStation | ✅ (upaljen 24.08.) | igre s trofejima, progres — bez sati |
| GOG | ✅ (novo) | **samo šta posjeduješ** — bez sati, bez datuma, bez achievementa; sve ulazi kao `backlog` |
| Epic Games | ✅ (novo) | **samo šta posjeduješ** + ime — bez sati, datuma i achievementa; sve ulazi kao `backlog` |
| Ubisoft / Battle.net / EA | ❌ | vidi dolje |

**Epic ide istim putem kao PSN i GOG.** Epic Account Services — OAuth koji sajt smije koristiti — ima tačno četiri scope-a (`basic_profile`, `friends_list`, `presence`, `offline_access`) i nijedan ne vraća šta neko posjeduje. Zato `EpicService` koristi tok Epic Games Launchera (kredencijali javni u Legendary/Heroic): korisnik otvori Epicov `/id/api/redirect`, dobije `authorizationCode` i zalijepi ga. Provjereno uživo prije pisanja — redirect 200, token endpoint prihvata kredencijale i odbija samo kod, library servis 401 bez tokena. Epicova lista su **artefakti**, ne igre: engine buildovi, pluginovi, soundtrackovi i DLC stižu u istom nizu, pa katalog odlučuje šta je igra (`categories` sadrži `games`, a `mainGameItem` prazan). Iza `EPIC_ENABLED`.

**Zašto Ubisoft i Battle.net i dalje ne mogu.** Ubisoft nema javni API uopšte. Battle.net ima `openid`, `wow.profile`, `sc2.profile`, `d3.profile`; pojam „biblioteka" kod njih ne postoji (BattleNetAuthController koji imamo sinhronizuje WoW likove, ne igre). Sve što to ipak čita autentifikuje se **kao njihov launcher** s korisničkim kredencijalima — ne tražimo to od čitalaca. Za njih `AddGameModal` ima polje **Platform** s `datalist` prijedlozima (Ubisoft Connect, Battle.net, EA app, Nintendo, PC, Itch.io) i slobodnim unosom.

**GOG ide istim putem kao PSN**: nema OAuth programa za treće strane, pa se koristi tok koji koristi GOG Galaxy klijent — čitalac se prijavi na GOG-ovoj stranici i zalijepi `code` iz adresne trake. `GogService` nosi Galaxyjev client_id (javan, u svakom open-source GOG alatu), a cijela integracija je iza `GOG_ENABLED` prekidača kao i PSN.

**Discord Rich Presence je proradio tako što je bot upaljen.** Kod je odavno napisan — bot ima `GuildPresences` intent, sluša `PresenceUpdate`, šalje na `/discord/presence`, a `presences.source` odavno prima `discord`. Bot jednostavno **nije bio pokrenut**: kod je stajao u `/var/www/techplay/discord` a PM2 je vrtio samo frontend. Sad je pod PM2 (`techplay-bot`, `pm2 save` odrađen). Presence hvata **svaki launcher** — Epic, GOG, Ubisoft, EA — bez ijednog njihovog API-ja. Uslov: korisnik mora povezati Discord; trenutno to **niko nije uradio** (0 od 54), pa se još ništa ne prikazuje.

**Nađeno usput, nije dirano:** `ProfileOverviewDashboard` renderuje se **samo posjetiocu** — stranica vrati `DashboardHome` prije njega kad gledaš svoj Overview. Sve `{isOwnProfile && ...}` grane u njemu (ProfileChecklist, DailyHub ×2) su mrtve. `LoyaltyCustomization.tsx` se ne renderuje nigdje.

---

## Auth — jedan izvor istine (08/2026)

`context/AuthContext` je **jedino** stanje sesije. Drži korisnika i token u
localStorage, vraća ih pri mountu i potvrđuje token u pozadini.

`hooks/useAuth` je sloj nad njim: nudi `register` / `login` / `logout` i
`middleware` preusmjeravanja, ali **nema vlastito stanje**. Import ostaje isti
za svih 22 fajla koji ga koriste.

Do 08/2026 su to bila **dva nezavisna sistema** — hook je držao svog korisnika
u SWR kešu s `/auth/me`, kontekst svog u localStorage. Posljedice:

- header (hook) je pokazivao prijavljenog čitaoca dok je stranica koja čita
  kontekst pokazivala „Sign in" — tako se manifestovalo na Social Hubu
- hookov `login()` je pisao **samo `token`**, nikad `user`, pa je kontekst na
  svakom učitavanju morao ići po `/auth/me` prije nego zna ko si
- `SettingsClient` je čitao korisnika iz hooka a ažurirao ga u kontekstu, pa
  snimanje profila nije osvježavalo prikaz

**Pravilo:** `isLoading` mora biti istinit dok se sesija vraća, i **nijedan
gate ne smije odlučivati dok traje**. `if (!user) return <SignIn/>` bez te
provjere prijavljenom čitaocu kaže da nije prijavljen.

---

## Dizajn sistem (08/2026)

Sve živi u `app/globals.css`. Nijedna od ovih vrijednosti se ne piše ručno po
komponentama — postoji token, čita se token.

**Fontovi** — `Archivo` za naslove, `Inter` za tekst, oba preko `next/font`.
„Archivo SemiCondensed" nije zasebna familija nego Archivo na 87,5% širine, pa
je `font-stretch: 87.5%` pinovan na `.font-display` klasu; time pokriva svih
100+ mjesta bez diranja ijednog. Archivo ide do težine 900, pa `font-black`
konačno crta pravi Black.

**Boje** — crimson rampa:

| Token | Vrijednost | Uloga |
|---|---|---|
| `--accent` | `#DC143C` | ispune: dugmad, čipovi, badgevi |
| `--accent-hover` / `--accent-ink` | `#FF4D6A` | hover, i accent obojen **tekst** |
| `--accent-deep` | `#4A0D1A` | glow |

Podjela nije kozmetička: `#DC143C` na `--surface-0` daje 4,04:1, ispod praga
od 4,5:1 za sitan tekst, dok je bijelo *na* njemu 4,99:1. Zato primarna drži
ispune, a `--accent-ink` (6,26:1) postoji za accent obojene natpise.

**Radijusi — naoštrena ljestvica.** Panel 8 / kartica 5 / unutrašnji 3,
stegnuto sa 16/12/8. Tailwind v4 čita `rounded-*` utility klase iz
`--radius-*` tokena, pa je redefinisanje ljestvice pomjerilo i svih 551
mjesto pisano kao `rounded-xl`/`rounded-lg` bez ijedne izmjene fajla.

`rounded-full` je **namjerno netaknut**: od 662 upotrebe 236 su stvarni
krugovi (avatari, tačkice, ringovi) i 32 progress trake. Kvadriranje njih ne
bi čitalo kao oštro nego kao pokvareno.

**Prelaz stranice** — dvije polovine. `components/layout/PageTransition`
označi `<body>` kad počne stvarna navigacija i odlazeća stranica se prigasi;
`app/template.tsx` se remontira s novom, skine oznaku i pusti ulaz. Prigašenje
ima 90ms kašnjenja, pa prefetchana navigacija koja se riješi trenutno nikad ne
pokaže dim. Sve je CSS na kompozitoru i gasi se uz `prefers-reduced-motion`.

**Command dugme** — `.btn-command` (i `Button variant="command"`): dva ugla
odsječena pod 45° i hazard šrafura. Rezervisano za **jednu odlučujuću akciju
po površini**; ponovljeno na svakoj kontroli prestaje išta značiti. Zasjek je
`clip-path`, ne border — border ne može pratiti odsječen ugao — i isti clip
reže šrafuru, pa ona može biti običan overlay. Skalira s visinom dugmeta.

**Brend assets** — `techplay-logo.png` (wordmark), `techplay-mark.png` (sam
znak), `logo.png` (JSON-LD Organization), pun set favicona i `quicklinks/*`
ikone naslovnice. Izvori su transparentni PNG-ovi; obrada ih normalizuje na
`--accent` i kropuje na najveću povezanu grupu tinte, jer izvozi nose i film
alfe preko cijelog platna i pokoju usamljenu liniju uz ivicu.

**Migracija na sistem (07.08.2026)** — sistem sada zaista drži cijelu
stranicu, ne samo redizajnirane sekcije. Prošlo je ~130 fajlova:

- `tp-accent` alias i `--bg-card`/`--text-*`/`--border` legacy tokeni su
  penzionisani u korist `--surface-*` / `--line` / bijelih alfa.
- Svi `dark:` parovi su srušeni na tamnu polovinu — `<html>` nosi `dark`
  bezuslovno, pa svijetla polovina nikad nije ni renderovana.
- 23 zamućene „glow" kugle uklonjene; narandžasti akcent (prije crimsona)
  izbačen iz support checkouta, impressuma i giveaway CTA-a.
- `lib/prose.ts` (tijelo svakog članka) više ne drži privatnu paletu.
- `PageHero` prepisan: prima i **prikazuje** `backgroundImage`, akcentuje
  posljednju riječ naslova (staro pravilo je bojilo drugu po redu, pa je na
  „Advertising & Partnerships" bojilo ampersand).
- Dvoslojno pravilo dugmadi dovršeno: accent ispuna na visini dugmeta =
  `.btn-command`; čipovi, badgevi i okrugli markeri zadržavaju svoj oblik.

**Namjerno ostalo van sistema:** `components/wow/**` (analyzer prvo dobija
nazad nespojene funkcionalnosti) i `app/media-kit/**` (čeka prave brojke).
GTA 6 zadržava svoju Vice City paletu — to je pod-brend, ne drift.

**Zamka pri pisanju klasa:** razmak unutar Tailwind arbitrary vrijednosti
(`shadow-[0_0_15px_rgba(220, 20, 60,0.25)]`) cijepa klasu i ona se nikad ne
kompajlira. Petnaest takvih je zateceno mrtvo 08/2026.

---

## Što je hardkodirano (treba provjeriti)

- `lib/categories.ts` — kategorije su vjerovatno hardkodirane + API
- `data/` folder — statički podaci (nepoznat sadržaj)
- `lib/roadmapData.ts` — roadmap podaci mogući hardkod

---

## Poznati frontend problemi

- `images: { unoptimized: true }` — sve slike servira se nekomprimovano. Veliki perf impact za spore konekcije.
- Auth je 100% client-side — server ne zna ko je korisnik pri SSR renderovanju
- `lib/axios.ts` i `lib/api.ts` mogu biti duplikovani pristup istom cilju
