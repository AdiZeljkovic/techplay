# 18 — Discord Bot Map

## Lokacija koda

**`discord/src/`** — TypeScript Discord bot u istom monorepo

---

## Tehnologije

- **Framework:** discord.js v14
- **Jezik:** TypeScript
- **Runtime:** Node.js
- **Dev:** `ts-node src/index.ts` (live reload)
- **Prod:** `tsc` → `node dist/index.js`
- **Intents:** Guilds, GuildMessages, GuildMembers, MessageContent, GuildPresences

---

## Entry point

**`discord/src/index.ts`**

Pri pokretanju:
1. Discord client inicijalizacija s intents
2. `registerCommands()` — slash komande registruju se s Discord API
3. `ClientReady` event:
   - Pokreće sve servise kao singletons ili instance
   - `PollingService.start()` — news/giveaway polling
   - `ServerStatsService.start()` — voice channel stats
   - `XpService.getInstance().start()` — XP tracking
   - `StatusService.start()` — status rotacija
   - `TriviaService.getInstance().start()` — trivia scheduling
   - `RecapService.start()` — weekly recap
4. Event handleri: `setupWelcome`, `setupModeration`, `setupChallengeReactions`, `setupPresenceTracking`

---

## Environment varijable

| Varijabla | Opis |
|-----------|------|
| `DISCORD_TOKEN` | Bot token (osjetljivo!) |
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_GUILD_ID` | Server ID (single-guild bot) |
| `DISCORD_BOT_SECRET` | Shared secret za TechPlay backend auth |
| `API_URL` | Backend URL (`https://techplay.gg/api/v1`) |
| `RECAP_CHANNEL_ID` | Channel za weekly recap |
| `LATEST_NEWS_CHANNEL_ID` | Channel za news |
| `SOCIAL_MEDIA_CHANNEL_ID` | Channel za Privée videa |
| `PRIVEE_USER_ID` | Privée user ID za video polling |
| `CHECK_INTERVAL_SECONDS` | Polling interval (default: 600) |

---

## Slash komande (`discord/src/commands/definitions.ts`)

| Komanda | Opis |
|---------|------|
| `/profile [user]` | Prikaz TechPlay profila korisnika |
| `/link` | Poveži Discord account s TechPlay računom |
| `/sync` | Sinkroniziraj Discord role s TechPlay rangom |
| `/search <query>` | Pretraži TechPlay artikel |
| `/trivia` | Pokren tech/gaming trivia pitanje (XP nagrada) |
| `/daily` | Claim dnevni XP bonus |
| `/leaderboard` | Prikaz XP leaderboarda |
| `/stats` | Server statistike |
| `/help` | Lista svih komandi |
| `/tip` | Random gaming/tech savjet od Professor Buffyja |
| `/techplay` | Status TechPlay.gg servisa |
| `/latest` | Najnoviji news članci |
| `/giveaways` | Aktivni giveaways |
| `/forum` | Trending forum diskusije |
| (+ potencijalno više komandi) | Detalji zahtijevaju čitanje definitions.ts dalje |

---

## Handleri (`discord/src/handlers/`)

### `commands.ts`
- Dispatcher za slash komande
- Prima komandu, prosljeđuje odgovarajućem handleru

### `events.ts`
- `setupWelcome(client)` — Welcome poruka novim korisnicima
- `setupModeration(client)` — Automatska moderacija (UNKNOWN detalji)
- `setupChallengeReactions(client)` — Reaction-based challenge prihvat
- `setupPresenceTracking(client)` — Tracking Discord Rich Presence → backend

---

## Servisi (`discord/src/services/`)

### `ApiService.ts`
- Centralizovani HTTP client za komunikaciju s backendom
- Koristi `DISCORD_BOT_SECRET` za autentifikaciju
- Base URL: `API_URL` env var

### `PollingService.ts`
- Periodično (svakih `CHECK_INTERVAL_SECONDS`) provjera novi sadržaj
- `GET /news?since={last_checked}` — novi članci
- Ako postoje: formatira Discord embed i šalje u `LATEST_NEWS_CHANNEL_ID`
- Također polira giveaways

### `XpService.ts` (bot-side)
- Sluša svaku poruku na serveru (MessageCreate event)
- 15 XP po poruci
- 60s cooldown po korisniku
- `POST /api/v1/discord/xp` → backend dodjela XP
- **Napomena:** Zasebna implementacija od backend XpService — potrebna sinkronizacija

### `ServerStatsService.ts`
- Ažurira voice channel nazive s live statistikama servera
- Npr. "👥 Members: 1,234" kao naziv voice channela
- Interval: UNKNOWN (vjerovatno 10-30 minuta)

### `TriviaService.ts`
- Scheduler za trivia pitanja
- Periodično šalje trivia pitanje
- Korisnici odgovaraju (reaction ili message)
- Točan odgovor → XP nagrada

### `RecapService.ts`
- Nedeljni recap aktivnosti
- Šalje u `RECAP_CHANNEL_ID` (ili traži #announcements/#general)
- Sadrži: top korisnici po XP, novi članci, forum aktivnost

### `SubscriptionService.ts`
- Upravljanje Discord channel subscriptions za news notifikacije
- `GET /discord/subscriptions` — dohvaćanje aktivnih subscriptions
- Korisnici mogu subscribat channel za specifičan tip vijesti

### `ChallengeService.ts`
- Gaming challenges s reaction-based prihvat
- Korisnik prihvaća challenge reakcijom na poruku
- Detalji nagrada UNKNOWN

### `PriveeService.ts`
- Integracija s Privée platformom
- Polira Privée videa za `PRIVEE_USER_ID`
- Šalje u `SOCIAL_MEDIA_CHANNEL_ID`

### `StatusService.ts`
- Bot status rotacija (šta Buffy "gleda/igra/sluša")
- Periodično mijenja status

### `LinkService.ts`
- Discord↔TechPlay account linking
- `/link` komanda → generira link token → korisnik klikne na web
- Backend: `ConnectedAccount` model za Discord

### `BuffyService.ts`
- Core bot funkcionalnosti (tips, help responses, itd.)

---

## Discord bot autentifikacija prema backendu

- Bot šalje `DISCORD_BOT_SECRET` u svakom HTTP requestu
- Backend rute pod `/api/v1/discord/*` imaju `throttle:300,1` (300/min)
- **KRITIČNO:** Nema Sanctum auth — samo shared secret
- Ako `DISCORD_BOT_SECRET` procuri, neko može manipulisati XP-om

---

## Što bot RADI

- ✅ Polira news i šalje na Discord
- ✅ Polira giveaways
- ✅ Dodjeljuje XP za Discord aktivnost
- ✅ `/daily` claim
- ✅ XP leaderboard
- ✅ Trivia kviz
- ✅ Server statistike (voice channel nazivi)
- ✅ Tjedni recap
- ✅ Account linking
- ✅ Presence tracking (Discord Rich Presence → backend)
- ✅ Challenge sistem
- ✅ Privée video sharing

## Što bot NE RADI (ili je UNKNOWN)

- ❌ Direktan pristup bazi — sve kroz backend API
- ❌ Nema vlastiti storage/baze
- ❓ Moderation detalji (`setupModeration`) UNKNOWN
- ❓ Kako challenge nagrade funkcionišu
- ❓ Koji Discord rol se dodjeljuje pri sync-u

---

## Sigurnosne napomene

1. **`DISCORD_TOKEN`** mora biti u `.env`, nikad u kodu ni gitu
2. **`DISCORD_BOT_SECRET`** mora se rotirati ako procuri
3. **Single-guild bot** — `DISCORD_GUILD_ID` ograničava efekt na jedan server
4. **GuildPresences intent** zahtijeva Privileged Intent odobrenje na Discord Developer Portalu
5. **`MessageContent` intent** zahtijeva Privileged Intent — potrebno odobrenje

---

## Kako pokrenuti bota

```bash
cd discord/
npm install
# Dev:
npm run dev    # ts-node src/index.ts
# Prod:
npm run build  # tsc
npm start      # node dist/index.js
```
