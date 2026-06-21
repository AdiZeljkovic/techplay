# 01 — Project Overview

## Šta je TechPlay.gg?

TechPlay.gg je custom gaming platforma namijenjena gaming zajednici na globalnom nivou. Nije samo gaming news portal — kombinuje:

- **Gaming magazin** (news, reviews, guides, hardware/tech)
- **Game database** (lokalna baza igara, importovana iz MobyGames)
- **Release calendar** (kalendar datuma izlaska igara)
- **Community** (forum, profili, XP, achievements, prijatelji)
- **Discord integracija** (bot "Professor Buffy" koji povezuje web i Discord server)
- **Shop i giveaways** (PayPal, Privée platforma)
- **WoW Analyzer** (AI-powered World of Warcraft character analiza)

---

## Produkcijski URL-ovi

| Okolina | Frontend | Backend |
|---------|----------|---------|
| Production | `techplay.gg` | `api.techplay.gg` |
| Beta | `beta.techplay.gg` | `api-beta.techplay.gg` |

---

## Tehnologije

### Frontend
- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Stil:** Tailwind CSS
- **Real-time:** laravel-echo + pusher-js (Laravel Reverb WebSocket)
- **Auth:** Client-side, Bearer token u localStorage
- **Caching:** ISR (Incremental Static Regeneration)
- **Image handling:** Disabled Next.js optimization (unoptimized: true)

### Backend / API
- **Framework:** Laravel 12 (PHP 8.2+)
- **Server:** Laravel Octane
- **Database:** PostgreSQL (produkcija), SQLite in-memory (testovi)
- **Cache/Queue:** Redis
- **Auth:** Laravel Sanctum (Bearer token)
- **Real-time:** Laravel Reverb (WebSocket, Pusher protokol)
- **Admin:** Filament v5 (NeoBrutalism tema)

### Discord Bot
- **Ime:** Professor Buffy
- **Framework:** discord.js v14 + TypeScript
- **Lokacija:** `discord/src/`
- **Komunikacija:** HTTP prema backend API (`/api/v1/discord/*`)

### Deployment
- **Skript:** `deployment/push_and_deploy.ps1` (Windows PowerShell)
- **Proces:** Export DB → git push → SSH deploy na server

---

## Vanjske integracije

| Servis | Svrha |
|--------|-------|
| MobyGames API | Import podataka o igrama (primarni izvor) |
| RAWG API | Screenshoti, filmovi, prijedlozi igara |
| Blizzard/Battle.net API | WoW character data za analyzer |
| RaiderIO API | WoW Mythic+ statistike |
| Discord OAuth | Social login + bot auth |
| Steam API | Library import, presence tracking |
| PayPal | Shop narudžbe i subscription |
| Privée | Giveaway platforma (vanjska) |
| Google OAuth | Privée giveaway login |
| Gemini 2.5 Flash | AI WoW analiza (primarni) |
| OpenAI GPT-4 Turbo | AI WoW analiza (alternativa) |
| Groq | Brza AI inferencija |
| IndexNow | Bing/Yandex instant indexing |
| Redis | Cache + queue |
| Laravel Reverb | WebSocket server |

---

## Što je trenutno implementirano (COMPLETE ili uglavnom funkcionalno)

- News sistem (articles, kategorije, tagovi, SEO)
- Reviews (article-based, ocjene)
- Tech/Hardware sadržaj
- Guides (s voting sistemom)
- Videos
- Game Database (MobyGames import, RAWG fallback)
- Release Calendar
- Forum (kategorije, threadovi, postovi)
- User auth (register/login/logout, Discord OAuth, Battle.net OAuth)
- User profil (public profil, XP, rank, achievements, collection)
- XP sistem (dodjela za komentare, čitanje, Discord aktivnost)
- Achievements (definisani, seed skripte)
- Komentari (na news, reviews, guides, videos)
- Admin panel (Filament v5, svi resursi)
- Discord bot (Professor Buffy — polling, XP, leaderboard, trivia, presence)
- Giveaways (TechPlay + Privée)
- Shop (PayPal narudžbe i pretplate)
- WoW Analyzer (Blizzard API + AI analiza)
- SEO (meta tagovi, OG, structured data, sitemap, IndexNow)
- Real-time WebSocket (Reverb) za news, reviews, forum, komentare, notifikacije
- Presence tracking (što korisnik trenutno igra)
- Friends sistem
- Direct Messages
- Clans
- Quests i Season sistem
- Bounty sistem
- Steam achievements import
- Backlog Advisor (AI preporuka igara)
- Profile Wrapped (godišnji rezime)
- Profile Compare
- Leaderboard (globalni i Discord)

## Što je djelimično implementirano (PARTIAL)

- Notifikacije (backend model postoji, frontend parcijalan)
- Reward Store (definisan, redeem flow nejasan)
- MediaKit stranica (postoji, ali nepoznato da li je kompletna)
- Newsletter (subscribe/verify postoji, send flow nepoznat)
- Support tier sistem (postoji, PayPal integracija)
- Ads sistem (AdCampaign model, postoji ali opseg nepoznat)
- UserCustomization (postoji, frontend integracija nejasna)

## Što je nejasno ili nedostaje (UNKNOWN/MISSING)

- Email slanje u produkciji (mail config UNKNOWN)
- Sitemap automatski scheduling (command postoji, ali cron nepoznat)
- Analytics integracija (tracking postoji ali detalji UNKNOWN)
- Admin moderation tools za forum (UNKNOWN)
