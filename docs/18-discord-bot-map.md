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
- 15 XP po poruci — **traženih**, ne nužno dodijeljenih
- 60s cooldown po korisniku
- `POST /api/v1/discord/xp` → backend dodjela XP
- Sedmična aktivnost broji `xp_awarded` iz odgovora, ne traženih 15. Backend
  ima dnevnu granicu od 100 XP i sezonski množitelj, pa se traženo i dobijeno
  redovno razlikuju; do 29.08.2026. bot je zbrajao izmišljenih 15 i „Member of
  the Week" je krunisao po broju koji ne postoji. Uz XP se sada broje i poruke,
  jer je stari kod broj poruka izvodio dijeljenjem tog XP-a s 15 — što je radilo
  samo dok je XP bio lažan.
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
- Odredište se od 29.08.2026. rješava kroz `AnnouncementChannel.ts`, jedno
  mjesto za sve objave bota. Prije toga je najava o preticanju na ljestvici
  išla u `message.channel` — dakle u kanal u kojem je neko slučajno pisao kad
  je provjera opalila. Resolver i **dohvaća** kanal, ne samo čita keš: promašaj
  keša je ranije značio da recap tiho ne uradi ništa, pa ni ne resetuje
  sedmičnu aktivnost.

### `SubscriptionService.ts`
- Upravljanje Discord channel subscriptions za news notifikacije
- `GET /discord/subscriptions` — dohvaćanje aktivnih subscriptions
- Korisnici mogu subscribat channel za specifičan tip vijesti

### `ChallengeService.ts`
- Gaming challenges s reaction-based prihvat
- Korisnik prihvaća challenge reakcijom na poruku
- Detalji nagrada UNKNOWN

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


---

## Obnova 24.08.2026 — bot je stigao u današnji TechPlay

Bot je napisan u januaru 2026, kad je TechPlay bio portal s vijestima i rank ljestvicom. Sve ispod je izmjereno prije nego dirano.

### Uklonjeno
- **`/trivia` i `/challenge`** — `TriviaService` i `ChallengeService` obrisani. `/trivia` je vukao opentdb kategoriju **18 = Science: Computers** (dueli su koristili 15 = Video Games), pitanja o HTML-u na gaming serveru.

### Popravljeno
- **XP ekonomija.** `DiscordXpController` je radio `$user->increment('xp')` direktno — mimo `XpService`, dakle mimo dnevnog limita od 100, mimo sezonskog množioca i ledgera. Jedina granica bila je 100 po zahtjevu; bot plaća 15 po poruci sa 60 s pauze = **900/sat, 21.600/dan**. Sad ide kroz `XpService` s tipom akcije `discord_message`, ceiling je `XP_DISCORD_MESSAGE` (15), i odgovor vraća **koliko je stvarno palo** (`xp_awarded`), jer bot taj broj objavljuje u kanal.
- **Rank → rola.** `LinkService` je imao ručnu mapu od pet imena (Newbie, Gamer, Pro Gamer, Elite, Legend); „Gamer" i „Pro Gamer" nikad nisu postojali u `ranks`, a Noob/Newbie su penzionisani 24.08. Mapa se sada gradi iz **`GET /discord/ranks`**. `/sync` uz to **skida** role za rangove koje si prošao i javlja kad rola za tvoj rang ne postoji u serveru — tišina je ono što je krilo pokvarenu mapu.
- **`ephemeral: true` → `MessageFlags.Ephemeral`** na 12 mjesta (deprecirano, puca u discord.js v15).

### Novo
- **`GET /discord/ranks`** — ljestvica, da mapa rola ima jedan izvor.
- **`GET /discord/user/{id}`** proširen: player card (sati, span, najigranija, platformski achievementi), brojači police, level, sljedeći rang, `profile_url`. Ranije je vraćao četiri polja.
- **`DiscordLibraryController`**: `/discord/library/{id}`, `/discord/match/{id}/{other}`, `/discord/backlog/{id}`. Svaki odbija privatan profil.
- **Komande:** `/library`, `/match`, `/backlog`; `/game` dobio **autocomplete** (katalog od 332.000 naslova se do sada kucao naslijepo).
- **`/profile`** crta player card umjesto Rank/XP/Position/Progress iz januara.
- **Push umjesto ankete.** `PublishListener` sluša na **127.0.0.1:8099**, `ArticleObserver` ga kucne preko `DiscordAnnouncer` na objavu. Anketa je ostala kao mreža, interval 60 s → 600 s: **5.760 → 576 zahtjeva dnevno**.
- **`createNotLinkedEmbed`** vodi s tim **šta povezivanje donosi**, ne s tim da red u bazi ne postoji. Od 153 člana servera nijedan nije bio povezan — ne zato što je teško, nego što nigdje nije pisalo čemu služi.

### Popravljeno 29.08.2026.

- **Presence throttle je radio naopako.** Uslov je bio strukturno pogrešan, ne
  operator: **nepromijenjeno** stanje se ponovo slalo svakih 30 s, a **promjena**
  se nije prigušivala uopšte. Discord šalje `PresenceUpdate` i za idle, Spotify i
  rich-presence tajmere, pa je to cijelo veče kucalo backend. Backendov
  `PresenceService::set()` je stanje bez TTL-a, dakle otkucaj svakih pola minute
  nije kupovao ništa a plaćao je upis `last_played_at` po igraču. Gore: promjena
  naslova zove `bankSession()`, pa je neprigušen launcher koji trepće upisivao
  odigrane sesije koje niko nije odigrao.
- **Feed je ostajao mrtav do restarta.** `checkFeed` je filtrirao
  `id > lastCheckedId && lastCheckedId !== 0`, a to je postavljao samo start.
  Backend nedostupan pri dizanju bota = taj feed šuti zauvijek. Sada se naoruža
  na prvom pollu koji prođe, bez najave unazad.
- **StatusService je na jednu grešku javno pisao „Maintenance 🔧"** — timeout,
  429 s limitera, restart octanea, svejedno. Sada traži tri promašaja zaredom, a
  ispod praga zadržava zadnje što je pisalo.
- **Dispatch komandi je bio bez try/catch.** Komanda koja baci ostavljala je
  interakciju bez odgovora. Sada se hvata, loguje i odgovara — kroz
  `editReply`/`followUp`/`reply`, ovisno o stanju interakcije.
- Obrisano: `RECOMMENDATIONS.md` (predprojektni pitch), paket `he` (nigdje
  importovan). Hardkodiranih „332.000" bilo je na tri mjesta, ne dva; sada je
  jedna imenovana konstanta `BuffyService.CATALOGUE_SIZE` s datumom mjerenja.

### Ostalo neriješeno
- Role u serveru su i dalje stara ljestvica s tipfelerima: `Rokie`, `Challener`, `Legendary`, `Global Elite`, `God Of Gaming`, `Noob`, `Newbie`; `Apex` ne postoji. `/sync` sada **kaže** kad rola fali, ali ih ne pravi — preimenovanje je ručni posao u Discordu.
- `RECAP_CHANNEL_ID` nije postavljen, pa `RecapService` nema gdje pisati — a sada
  kroz njega ide i najava o preticanju, dakle i ona šuti dok se ne postavi.
- Sedmična aktivnost živi u memoriji, pa restart bota vraća „Member of the Week"
  na „No active members".
- `.env.example` i dalje nudi `API_URL=https://techplay.gg/api/v1`, vrijednost za
  koju `config.ts` ima komentar zašto je pogrešna (vodi bota kroz Cloudflare do
  backenda na istoj mašini). Svaka nova instalacija ponovo napravi taj bug.
