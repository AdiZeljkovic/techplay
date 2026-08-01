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
| `/guides` | `app/guides/` | Guides listing + `[slug]` detalj |
| `/hardware` | `app/hardware/` | Tech/hardware listing + `[slug]` detalj |
| `/videos` | `app/videos/` | Videos listing + `[slug]` detalj |
| `/games` | `app/games/` | Game database listing + `[slug]` detalj |
| `/calendar` | `app/calendar/` | Release calendar |
| `/forum` | `app/forum/` | Forum kategorije + `[slug]` thread |
| `/profile` | `app/profile/` | Korisnički profil (`[username]`) |
| `/settings` | `app/settings/` | Korisničke postavke |
| `/friends` | `app/friends/` | Prijatelji |
| `/messages` | `app/messages/` | Direct messages |
| `/leaderboard` | `app/leaderboard/` | XP leaderboard |
| `/clans` | `app/clans/` | Clans listing + `[slug]` detalj |
| `/compare` | `app/compare/` | Profile compare `[username]/[other]` |
| `/giveaways` | `app/giveaways/` | Giveaways listing + `[slug]` |
| `/giveaway` | `app/giveaway/` | Privée giveaway (poseban flow) |
| `/shop` | `app/shop/` | Shop katalog |
| `/cart` | `app/cart/` | Košarica |
| `/checkout` | `app/checkout/` | PayPal checkout |
| `/wow-analyzer` | `app/wow-analyzer/` | WoW karakter analiza |
| `/wow-characters` | `app/wow-characters/` | Moji WoW likovi |
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
- **Middleware** (`middleware.ts`) — ne enforces auth (localStorage nije dostupan server-side). Samo maintenance mode check.
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

Obrisano: `ProfileHeader.tsx`, `ProfileTabs.tsx`, `OwnProfileShell.tsx`.

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
