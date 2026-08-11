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
| `/` | `app/page.tsx` | Homepage — ISR gost verzija; `app/HomeGate.tsx` client-side swapa logovane korisnike na dashboard (`components/home-dashboard/DashboardHome`, podaci iz `GET /me/dashboard` + self-fetching widgeti). Gate koristi `hooks/useAuth`, ne AuthContext |
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
| `/giveaway` | `app/giveaway/` | Privée giveaway (poseban flow) |
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
| Hook | Channel / Event |
|------|----------------|
| `useRealTimeNews` | News publish events |
| `useRealTimeReviews` | Review publish events |
| `useRealTimeComments` | Comment posted events |
| `useRealTimeForum` | Forum reply events |
| `useRealTimeGuides` | Guide publish events |
| `useRealTimeVideos` | Video publish events |
| `useRealTimeShop` | Shop stock update events |
| `useRealTimeNotifications` | User notification events |

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
| `components/games/` | GameCard, GameFilter, GameGrid |
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
- **Tvoj Overview** renderuje `DashboardHome` — isti sadržaj koji `HomeGate` prikazuje na `/` kad si logovan. Isti komponent, dva URL-a.
- **Svaki drugi tab** (tvoj ili tuđi) renderuje `ProfileHero` + sadržaj taba. Hero je isti za sve; razlikuju se samo akcije (Continue Playing / Edit vs Add Friend / Message) i to da `Rewards` tab postoji samo na tvom profilu.
- **`lib/hero.ts`** normalizuje dva različita payloada (`/me/dashboard` i `/users/{username}`) u jedan `HeroModel` — hero ne zna odakle podaci dolaze.
- **`lib/profileTabs.ts`** je jedini izvor tab seta (`PROFILE_TABS`).
- **`LockedProfile`** je ono što stranac vidi na `friends`-only profilu: avatar, ime, level, rank, "member since" i Add Friend. Nikad 404.
- **`lib/level.ts` mora ostati identičan `backend/app/Services/LevelService.php`** — ako se mijenja kriva, mijenjaju se oba, inače header i profil pokazuju različit level.
- **Jedan panel jezik (08/2026):** sve sekcije naslovnice idu kroz `components/ui/Panel` (header: tick + 12px font-black naslov; hairline `border-white/[0.07]`; inset sub-kartice `bg-white/[0.02]`). `variant="console"` = topli gradijent + accent ivica + corner bracket — **najviše jedan po koloni** (Campaign Progress u glavnoj, Daily Missions u sidebaru). Ljubičasta `--xp` isključivo za progresiju (XP nagrade, match ringovi); narandžasta za akcije; emerald za LIVE; amber za bounty. `lib/timeAgo.ts` je jedini relative-time helper.

Obrisano: `ProfileHeader.tsx`, `ProfileTabs.tsx`, `OwnProfileShell.tsx`.

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
