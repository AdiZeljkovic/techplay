# 15 — Forum Map

## Pregled

Community forum s kategorijama, threadovima i postovima/replyima. Podržava full-text pretragu, soft delete, real-time updates.

---

## Struktura

```
Forum
 └── Categories (kategorije)
      └── Threads (threadovi)
           └── Posts (postovi / replies)
```

---

## Kategorije

- `categories` tabela, `type = 'forum'`
- Upravljanje kroz `ForumCategoryResource` u Filamentu
- Frontend: `GET /api/v1/forum/categories`

---

## Threadovi (`threads` tabela)

**Ključna polja:**
- `id`, `title`, `slug`
- `category_id` — FK na categories
- `author_id` (user_id)
- `is_pinned` — pinned thread
- `is_locked` — locked (nema novih postova)
- `views` — broj pregleda
- `posts_count` — broj postova (denormalizovano)

**API:**
- `GET /forum/categories/{slug}` — threadovi u kategoriji (paginirano, `?page=`, frontend ima prev/next kontrole)
- `GET /forum/threads/{slug}` — thread s postovima
- `GET /forum/active` — aktivni threadovi (sortovani po zadnjoj aktivnosti)
- `GET /forum/unanswered` — threadovi bez odgovora (0 postova), najnoviji prvi
- `POST /forum/threads` — kreiraj thread (auth, throttle:10,1)
- `POST /forum/threads/{slug}/lock` — zaključaj/otključaj thread (staff)
- `DELETE /forum/threads/{slug}` — obriši thread i sve replyje (staff, hard delete — cascade na `posts` tabeli)

---

## Postovi (`posts` tabela)

**Ključna polja:**
- `id`, `thread_id`, `author_id`, `content`
- Replies su flat (nema `parent_id` kolone — nema nested/threaded odgovora)
- `upvotes` — upvote count (na nivou threada, preko `thread_upvotes` pivot tabele)
- `is_deleted` — soft delete flag
- `edited_at` — timestamp izmjene

**API:**
- `POST /forum/threads/{slug}/posts` — kreiraj post (auth, throttle:20,1)
- `PUT /forum/threads/{slug}/posts/{postId}` — ažuriraj (auth, vlasnik ili staff, throttle:20,1)
- `DELETE /forum/threads/{slug}/posts/{postId}` — obriši (soft, auth, vlasnik ili staff, throttle:20,1)
- `POST /forum/threads/{slug}/upvote` — upvote threada (auth, throttle:20,1) — autor threada dobija +1/-1 forum_reputation (osim kod self-upvote)
- `POST /forum/threads/{slug}/pin` — pin thread (staff)

---

## Pretraga

- `GET /forum/search?q=` — full-text pretraga (throttle:30,1)
- Full-text indeks na `threads` i `posts` tabelama (migracija: `add_fulltext_index_to_forum_tables.php`)

---

## Statistike

- `GET /forum/stats` — ukupan broj threadova, postova, aktivnih korisnika

---

## Moderacija

**Admin panel:**
- `ForumCategoryResource` — kreiranje/editovanje kategorija
- `SimpleThreadResource` — pregled i brisanje threadova
- `PostResource` — pregled i brisanje postova

**Frontend moderation:** staff (Super Admin/Admin/Editor-in-Chief/Moderator) vide Pin/Unpin, Lock/Unlock i Delete Thread dugmad direktno na thread stranici (`/forum/thread/[slug]`), bez potrebe za admin panelom.

**Pin/Lock/Delete:** sve tri akcije zahtijevaju `hasAnyRole(['Super Admin','Admin','Editor-in-Chief','Moderator'])` ili legacy `role` u `['admin','super_admin','moderator']` — provjera je konzistentna kroz `pinThread()`, `lockThread()`, `deleteThread()` u `ForumController`.

---

## Real-time

- `ThreadObserver::created()` → Broadcast `ThreadCreated` event (dispatch je u Observeru, ne u kontroleru)
- `ForumPostObserver::created()` → Broadcast `ForumReplyPosted` event
- `useRealTimeForum` hook u frontendu — koristi se na `/forum/[category]` za prikaz novih threadova uživo
- `useRealTimeThreadReplies` hook postoji ali **nije povezan** na thread stranicu — nove reply-je vidiš tek nakon manual/SWR revalidacije, ne uživo

---

## XP integracija

- Post (reply): `+20 XP`, `+5 forum_reputation` — `PostObserver::created()`
- Thread (nova tema): `+15 XP`, `+3 forum_reputation` — `ThreadObserver::created()`, poziva `XpService::awardXp()` (poštuje dnevni cap i mirror u Bounty) + `AchievementService::check($user, ['threads_count', 'reputation'])`
- Upvote primljen na svoju temu: `+1 forum_reputation` autoru threada (ne i za self-upvote) — `ForumController::upvote()`

---

## Discord bot integracija

- `/forum` slash komanda → prikazuje trending threadove (`GET /forum/active`)
- Bot formatira i prikazuje top threadove u Discord embeds

---

## Nedostaci

> Revidirano 2026-08-11 — dvije stavke sa stare liste su bile netačne.

1. **Nema forum-specifičnog bana** (postoji samo globalni account ban + `ban.check` middleware)
2. **Nema privatnih kategorija** (members-only ili premium)
3. **Nema email notifikacija** za reply — samo in-app (`ForumReplyNotification`, `database` kanal)
4. **Nema `generateMetadata`/OG tagova** na kategorijskoj i thread stranici — obje su
   client komponente, pa nema server-side SEO meta. Forum je nevidljiv pretraživačima.
5. **Discord bot ne najavljuje** nove threadove automatski — `/forum` komanda prikazuje
   trending threadove ručno, `PollingService` forum ne pokriva
6. **Nema premještanja teme** u drugu kategoriju (moderator mora obrisati i tražiti ponovni post)
7. **Nema quote-reply** ni reakcija na pojedinačni post (postoji upvote, ali samo na temu)

**Ispravke stare liste:** @mention **radi** (`SanitizationService::extractMentions` →
`ForumController::notifyMentions` → `MentionNotification`), i
`useRealTimeThreadReplies` **jeste povezan** (`thread/[slug]/page.tsx`, linija 149).
Report sistem postoji i radi (`POST /reports`, `reportable_type: thread|post`).

---

## Changelog 2026-08-11 — audit, sigurnost i redizajn

### Sigurnost

**`/forum/active` i `/forum/unanswered` su vraćali cijeli User model svakog autora**
— uključujući **`email`**, `discord_id`, `battlenet_id`, `battletag`,
`bounty_balance`, `daily_streak`, `last_seen_at`, `profile_visibility`, `pc_specs`
i `location`. Oba endpointa su javna, bez autentifikacije. Uzrok: `User::$hidden`
namjerno ne skriva `email` (treba korisniku na settings stranici), pa svaka
serijalizacija Usera bez resursa to prosljeđuje dalje. Isto je vrijedilo i za
`/forum/watched` i `/forum/bookmarks` (auth, ali autori su drugi ljudi).

Popravljeno novim `ForumThreadCardResource` — autor je sveden na `id`, `username`,
`display_name`, `avatar_url`.

### Payload

| Endpoint | prije | poslije |
|---|---|---|
| `/forum/categories` | 8.751 B | ~2.400 B |
| `/forum/active` | 16.097 B | ~2.900 B |
| `/forum/unanswered` | 23.751 B | ~3.800 B |

- Liste su slale **cijeli HTML prve poruke** teme (27% odgovora) za karticu koja
  crta samo naslov, kategoriju i vrijeme.
- `/forum/categories` je slao šest SEO kolona, `rules`, `focus_keyword` i oba
  timestampa po kategoriji. Novi `ForumCategoryResource`.

### Bugovi

- **`stats.total_posts` je brojao teme kao poruke** (`Thread::count() + Post::count()`),
  pa se broj u heroju nije slagao ni s jednom karticom ispod njega — one broje
  odgovore. Sada `Post::count()`.
- **Kategorija "Clans" je ostala visjeti** nakon uklanjanja clan sistema 11.08.2026:
  prazna grupa bez ijednog djeteta na dnu foruma. Migracija je briše, ali samo ako
  je zaista prazna.
- `showCategory` je logovao `Log::info` na svaki cache miss.

### Nova funkcionalnost

**`PUT /forum/threads/{slug}` — uređivanje teme.** Svaki odgovor se mogao urediti,
prva poruka nije — nije postojala ruta. Autor koji je pogriješio u naslovu morao je
tražiti moderatora da obriše temu. Slug se **ne mijenja** s naslovom, jer je u svakom
već podijeljenom linku. Autor ili moderator; zaključana tema prima izmjene samo od
moderatora.

### Dizajn

- Hero foruma preuređen po uzoru na Game Database: veliki dvobojni naslov, search
  polje oblika header search bara, i statistika kao pilule.
- Tabovi (All categories / New posts / Unanswered) u jeziku leaderboard menija.
- **Kartice kategorija su sada jedan red po ploči** umjesto mreže: marka, ime, opis,
  posljednja tema s autorom i vremenom, dvije brojke, strelica.
- Sedam ploča dobilo je vlastite PNG marke (`public/images/forum/*.webp`, obrađene
  iz izvornih 1.1 MB PNG-ova na ~6 KB). Ploča bez marke i dalje pada na lucide glif.
  Marke stoje **bez pozadinske kutije** — nose vlastitu boju i vlastiti obris, a
  tonirani zaobljeni kvadrat oko njih je sve ploče vraćao na isti sivi kvadratić.
  Isto vrijedi i u "Latest posts" traci i u zaglavlju kategorije.
- Zaglavlje kategorije koristi istu podlogu kao zaglavlje teme (`--surface-1`, bez
  obojenog preljeva) — otvaranje ploče i otvaranje teme u njoj ne smiju izgledati
  kao dva različita sajta.
- Profilna kartica u sidebaru: prsten oko avatara **jeste** XP traka (conic-gradient),
  rank kao chip u vlastitoj boji, tri brojke (Posts / Rep / Streak), i prečica na
  novu temu.
- `/forum/rules` prepisana — bila je jedina stranica na starim tokenima
  (`--bg-card`, `--text-secondary`, `rounded-3xl`, `shadow-2xl`).
- `/forum/search` i `/forum/create` dobili naslove u jeziku ostatka sajta.
