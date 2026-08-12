# 19 — External Integrations

## Pregled

| Servis | Env varijabla(e) | Svrha | Lokacija koda |
|--------|-----------------|-------|---------------|
| MobyGames | `MOBY_API_KEY` | Game import (primarni) | `MobyGamesService` |
| RAWG | `RAWG_API_KEY` | Screenshots, movies, suggestions | `RawgService` |
| Blizzard/Battle.net | `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET` | WoW character data | `BlizzardService`, `BattleNetAuthController` |
| RaiderIO | UNKNOWN env | WoW Mythic+ data | `RaiderIOService` |
| Discord | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | OAuth login + bot | `SocialAuthController`, `discord/` |
| Steam | `STEAM_API_KEY` | Library import, presence | `SteamService`, `SyncSteamLibrary` |
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` | Shop, subscriptions | `PayPalService`, `PayPalWebhookController` |
| OpenAI | `OPENAI_API_KEY` | GPT-4 Turbo WoW analiza | `OpenAIService` |
| Gemini | `GEMINI_API_KEY` | Gemini 2.5 Flash WoW analiza | `GeminiService` |
| Groq | `GROQ_API_KEY` | Brza AI inferencija | `GroqService` |
| IndexNow | `INDEXNOW_KEY` | Bing/Yandex instant indexing | `IndexNowService` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Cache + Queue | Laravel Cache/Queue |
| Laravel Reverb | `REVERB_*` | WebSocket real-time | Laravel Reverb config |

---

## MobyGames

**Svrha:** Primarni izvor podataka za game database
**Servis:** `app/Services/MobyGamesService.php`
**Komande:**
- `php artisan moby:fetch` — fetch novih igara
- `php artisan import:moby-csv` — import iz CSV dump-a
- `php artisan moby:enrich` — enrich detalja
- `MobyEnrichmentJob` — background job za enrich
**Podaci:** naziv, opis, cover, release date, developer, publisher, žanrovi, platforme, Moby ID
**Napomena:** API nikad proxiran na frontend. Podaci su uvijek lokalni.

---

## RAWG

**Svrha:** Screenshoti, filmovi, suggested igre (supplementarno)
**Servis:** `app/Services/RawgService.php`
**Env:** `RAWG_API_KEY`
**Koristi se za:** Fallback kada nema lokalnih screenshota
**Napomena:** API key ima rate limits. Endpointi na frontendu direktno prolaze kroz backend proxy.
**Rizik:** Ako RAWG key istekne ili RAWG ugasi API, game stranice gube screenshote.

---

## Blizzard / Battle.net

**Svrha:** WoW character fetch za analyzer, Battle.net OAuth login
**Servisi:** `BlizzardService`, `BlizzardDataTransformer`, `BlizzardDataTransformerV2`
**Auth kontroler:** `BattleNetAuthController`
**Env:** `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`
**Koristi se za:**
- Battle.net social login
- WoW character data za `/wow-analyzer`
- Transformer minificira podatke prije AI slanja (cost optimizacija)

---

## RaiderIO

**Svrha:** WoW Mythic+ statistike (Mythic+ score, highest key, itd.)
**Servis:** `app/Services/RaiderIOService.php`
**Env:** UNKNOWN (RaiderIO API je djelimično javni)
**Koristi se za:** Dopunjavanje WoW analize s M+ podacima

---

## Discord

**Svrha 1: OAuth login**
- `SocialAuthController` + discord.php Socialite config
- Env: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`

**Svrha 2: Discord bot**
- Zasebna komponenta u `discord/` folderu
- Env: `DISCORD_TOKEN`, `DISCORD_GUILD_ID`
- Bot autentifikacija prema backendu: `DISCORD_BOT_SECRET`

---

## Steam

**Svrha:** Korisnik povezuje Steam account, importuje biblioteku, presence tracking
**Servis:** `app/Services/SteamService.php`
**Jobs:** `SyncSteamLibrary`, `PollSteamPresence`
**Env:** `STEAM_API_KEY`
**Kontroler:** `SteamAchievementController`
**Tabele:** `connected_accounts`, `steam_achievements`, `user_games`
**Frontend:** Steam achievements prikaz na profilu

---

## PayPal

**Svrha:** Shop narudžbe i pretplatni sistemi
**Servis:** `app/Services/PayPalService.php`
**Webhook:** `PayPalWebhookController` — signature-verified webhooks
**Env:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` (sandbox/live)
**Koristi se za:**
- Digitalni shop (one-time purchase)
- Support tier pretplate (recurring)
- Webhook: potvrda plaćanja, cancel subscriptions

---

## OpenAI (GPT-4 Turbo)

**Svrha:** WoW character readiness analiza
**Servis:** `app/Services/OpenAIService.php`
**Env:** `OPENAI_API_KEY`
**Rizik:** Skuplje od Gemini. Rate limits mogu biti problem pri velikom prometu.

---

## Gemini (Google)

**Svrha:** Gemini 2.5 Flash WoW analiza (primarni AI provider)
**Servis:** `app/Services/GeminiService.php`
**Env:** `GEMINI_API_KEY`
**Napomena:** Jeftiniji od GPT-4 Turbo, brži output

---

## Groq

**Svrha:** Brza AI inferencija (alternativa)
**Servis:** `app/Services/GroqService.php`
**Env:** `GROQ_API_KEY`
**Koristi se za:** UNKNOWN (potencijalno SEO analiza, alt text, ili interna upotreba)

---

## IndexNow (Bing/Yandex)

**Svrha:** Instant indexing na Bing i Yandex
**Servis:** `app/Services/IndexNowService.php`
**Jobs:** `PingIndexNow`, `SubmitIndexNow`
**Env:** `INDEXNOW_KEY`
**Ključ fajl:** `frontend/public/{INDEXNOW_KEY}.txt` (mora biti dostupan na domeni)
**Trigger:** ArticleObserver, ReviewObserver, itd. → PingIndexNow job

---

## Laravel Reverb (WebSocket)

**Svrha:** Real-time WebSocket server (Pusher protokol)
**Env:** `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, `REVERB_HOST`, `REVERB_PORT`
**Frontend:** `laravel-echo` + `pusher-js` (u `lib/echo.ts`)
**Hooks:** `useRealTime*.ts` hookovi za sve content tipove
**Channels:** Public channels za broadcast, private user channels za notifikacije

---

## Sigurnosne napomene za integracije

1. NIKAD ne commitovati `.env` fajlove s pravim ključevima u git
2. RAWG API key → rotirati ako se koristi dugo (rate limit abuse prevencija)
3. DISCORD_BOT_SECRET → rotirati periodično
4. PAYPAL_MODE → u produkciji mora biti `live`, ne `sandbox`
5. OPENAI_API_KEY → ima billing, rate limit na endpoint throttling
6. BLIZZARD keys → Blizzard API zahtijeva registrovanu app s ispravnim redirect URLs
7. IndexNow key fajl mora biti na `techplay.gg/{key}.txt` za validaciju

## Xbox (OpenXBL) — dodano 2026-07-19

- **Kako radi**: korisnik unese gamertag u Settings -> Connected Accounts -> Xbox. Backend preko OpenXBL (xbl.io, site API key u OPENXBL_API_KEY) rjesava gamertag -> XUID (GET /search/{gt}) i povlaci JAVNI title history (GET /achievements/player/{xuid}). Bez OAuth-a — cita se javno dostupan Xbox Live profil.
- **Sync** (SyncXboxLibrary job): title type=Game -> match preko game_external_ids (provider xbox, external_id=titleId) pa matchByName; novi unosi: playing ako igran u zadnjih 14 dana, inace backlog, platform=Xbox, progress=achievement progressPercentage. Nikad ne gazi user-set status. NAPOMENA: Xbox API ne daje ukupne sate igranja.
- **Fajlovi**: OpenXblService, SyncXboxLibrary, ConnectedAccountController@xboxConnect, ruta POST /connected-accounts/xbox/connect (throttle 10/min), frontend ConnectedAccountsSection (connectMode: gamertag).
- **Ogranicenja**: privatni profili ne rade (poruka korisniku); gamerscore se dohvaca ali jos ne prikazuje na profilu (buduci widget).
