# 03 — Folder Structure

## Root projekta (`/`)

```
TechPlay/
├── backend/          Laravel 12 backend + Filament admin
├── frontend/         Next.js 16 frontend aplikacija
├── discord/          Professor Buffy Discord bot
├── deployment/       Deploy skripte (push_and_deploy.ps1)
├── template/         Design predlošci (vjerovatno Figma/HTML)
├── docs/             Projektna dokumentacija (ovaj folder)
├── CLAUDE.md         Instrukcije za Claude Code
├── background.png    Design asset
├── bg-site.png       Design asset
├── forum.png         Screenshot/asset
├── game-calendar.png Screenshot/asset
├── game-database.png Screenshot/asset
└── *.md              Razne specifikacije (AD_SYSTEM, CACHE, DEPLOYMENT, itd.)
```

---

## Backend (`backend/`)

```
backend/
├── app/
│   ├── Casts/              Custom Eloquent casts
│   ├── Console/
│   │   └── Commands/       Artisan CLI komande (18 komandi)
│   ├── Data/               Data transfer objects
│   ├── Events/             Broadcast eventi (ArticlePublished, CommentPosted, itd.)
│   ├── Filament/
│   │   ├── Components/     Custom Filament komponente
│   │   ├── Pages/          Custom admin stranice
│   │   ├── Resources/      Admin CRUD resursi (38 resursa)
│   │   └── Widgets/        Dashboard widgeti
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/V1/     68 API kontrolera
│   │   ├── Middleware/     SecurityHeaders middleware
│   │   └── Requests/       Form request validacija (UNKNOWN struktura)
│   ├── Jobs/               Background jobs (9 jobs)
│   ├── Mail/               Mail klase
│   ├── Models/             Eloquent modeli (68 modela)
│   ├── Notifications/      Laravel notifikacije
│   ├── Observers/          Model observeri (16 observera)
│   ├── Policies/           Autorizacijske politike
│   ├── Providers/          Service provideri (AppServiceProvider, itd.)
│   ├── Services/           Poslovni servisi (40 servisa)
│   └── Traits/             Reusable traits (ApiResponse)
├── bootstrap/
│   └── app.php             Laravel bootstrap
├── config/                 Laravel konfiguracija
├── database/
│   ├── migrations/         ~80 migracija od Dec 2025 do Jun 2026
│   ├── seeders/            Database seederi
│   └── factories/          Model factories
├── resources/
│   └── views/              Blade views (minimalni, uglavnom za emails)
├── routes/
│   ├── api.php             Sve API rute (/api/v1/*)
│   ├── web.php             Web rute (uglavnom SitemapController, RssController)
│   └── channels.php        WebSocket channel auth
├── storage/                Fajlovi, logovi, cache
├── tests/
│   ├── Feature/            Feature testovi
│   └── Unit/               Unit testovi
├── public/                 Web root (entry point)
├── composer.json           PHP dependencije
├── .env                    Environment varijable (nije u gitu)
└── phpunit.xml             Test konfiguracija
```

### Ključni backend fajlovi

| Fajl | Svrha |
|------|-------|
| `app/Traits/ApiResponse.php` | Standardizuje `{success, data, message}` JSON odgovore |
| `app/Providers/AppServiceProvider.php` | Registracija observera, N+1 zaštita |
| `routes/api.php` | Sve API rute (~200 definicija) |
| `config/auth.php` | Auth guard konfiguracija |

---

## Frontend (`frontend/`)

```
frontend/
├── app/                    Next.js App Router stranice
│   ├── (auth)/             Route group za login/register
│   ├── about/              About/staff stranica
│   ├── api/                Next.js API rute (revalidate, og, itd.)
│   ├── auth/               Auth callback stranice (Discord OAuth)
│   ├── backlog-advisor/    AI backlog preporuka
│   ├── calendar/           Release calendar
│   ├── cart/               Košarica
│   ├── checkout/           Checkout
│   ├── compare/            Profile compare
│   ├── contact/            Kontakt forma
│   ├── forum/              Forum (kategorije, threadovi)
│   ├── friends/            Prijatelji
│   ├── games/              Game database
│   ├── giveaway/           Single giveaway (Privée)
│   ├── giveaways/          Giveaways listing
│   ├── guides/             Guides sekcija
│   ├── hardware/           Tech/hardware sadržaj
│   ├── leaderboard/        XP leaderboard
│   ├── messages/           Direct messages
│   ├── news/               News listing i detalji
│   ├── og/                 Open Graph image generator
│   ├── profile/            Korisnički profil
│   ├── reviews/            Reviews listing i detalji
│   ├── settings/           Korisničke postavke
│   ├── shop/               Shop
│   ├── videos/             Video sekcija
│   ├── wow-analyzer/       WoW character analyzer
│   ├── wow-characters/     Saved WoW likovi
│   ├── wrapped/            Annual gaming wrapped
│   ├── layout.tsx          Root layout (metadata, contexts)
│   ├── page.tsx            Homepage
│   └── globals.css         Globalni stilovi
├── components/             Shared komponente po domenima
│   ├── ads/                Ad komponente
│   ├── analytics/          Analytics trackers
│   ├── comments/           Comment komponente
│   ├── forum/              Forum UI komponente
│   ├── games/              Game card, filter komponente
│   ├── giveaway/           Giveaway UI
│   ├── guides/             Guide komponente
│   ├── home/               Homepage sekcije
│   ├── layout/             Header, Footer, Sidebar
│   ├── messaging/          DM UI
│   ├── news/               News card, listing
│   ├── profile/            Profile komponente
│   ├── providers/          Provider wrapper komponente
│   ├── reviews/            Review komponente
│   ├── roadmap/            Roadmap prikaz
│   ├── seo/                SEO komponente (GlobalSeo, PageSeo)
│   ├── settings/           Settings forme
│   ├── share/              Share dugmad
│   ├── shop/               Shop UI
│   ├── sidebar/            Sidebar widgeti
│   ├── support/            Support tier UI
│   ├── tracking/           View tracking
│   ├── ui/                 Base UI komponente (Button, Card, Modal, itd.)
│   └── wow/                WoW analyzer UI
├── context/
│   ├── AuthContext.tsx     Auth state (token, user, login/logout)
│   ├── CartContext.tsx     Shopping cart state
│   ├── MobileMenuContext.tsx Mobile menu toggle
│   ├── SiteSettingsContext.tsx Site settings iz API
│   └── ThemeContext.tsx    Dark/light mode
├── data/                   Hardkodirani podaci (kategorije, itd.)
├── hooks/
│   ├── useApi.ts           Generic API hook
│   ├── useAuth.ts          Auth hook
│   ├── useRealTime*.ts     Real-time WebSocket hooks (8 hooks)
│   └── ...                 Ostali utility hooks
├── lib/
│   ├── api.ts              API URL utils, getApiUrl()
│   ├── axios.ts            Axios konfiguracija
│   ├── categories.ts       Kategorije konstante
│   ├── content.ts          Content helper funkcije
│   ├── echo.ts             Laravel Echo WebSocket setup
│   ├── seo.ts              SEO helper funkcije
│   └── utils.ts            Opće utility funkcije
├── types/                  TypeScript tipovi
├── middleware.ts            Maintenance mode check
├── next.config.ts          Next.js konfiguracija (unoptimized images)
└── tailwind.config.ts      Tailwind konfiguracija
```

---

## Discord Bot (`discord/`)

```
discord/
├── src/
│   ├── index.ts            Entry point — inicijalizacija bota
│   ├── config.ts           Bot konfiguracija iz .env
│   ├── commands/
│   │   └── definitions.ts  Slash komande definicije
│   ├── handlers/
│   │   ├── commands.ts     Komanda dispatcher
│   │   └── events.ts       Event handleri (welcome, moderation, challenges, presence)
│   └── services/
│       ├── ApiService.ts       HTTP pozivi prema TechPlay backend
│       ├── BuffyService.ts     Core bot logika
│       ├── ChallengeService.ts Gaming izazovi
│       ├── LinkService.ts      Discord↔TechPlay account linking
│       ├── PollingService.ts   Polling za news/giveaways
│       ├── PriveeService.ts    Privée platforma integracija
│       ├── RecapService.ts     Tjedni recap
│       ├── ServerStatsService.ts Voice channel stats
│       ├── StatusService.ts    Bot status rotacija
│       ├── SubscriptionService.ts Discord news subscription
│       ├── TriviaService.ts    Trivia kviz
│       └── XpService.ts        XP dodjela (15 XP/poruka, 60s cooldown)
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Deployment (`deployment/`)

```
deployment/
└── push_and_deploy.ps1     Windows PowerShell deploy skript
```
