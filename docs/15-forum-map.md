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
6. **Nema quote-reply** ni reakcija na pojedinačni post (postoji upvote, ali samo na temu).
   Editor ima `blockquote` dugme, ali to je formatiranje — nema akcije „citiraj ovaj post".
7. **Nema praćenja pročitanog** — ne postoji `thread_reads` tabela niti bilo šta slično.
   Posjetilac ne vidi šta je novo od zadnje posjete. Za ozbiljan forum ovo je najveći
   pojedinačni nedostatak.
8. **Nema slika u postovima** — `config/purifier.php` profil `forum` ne dozvoljava `img`.
   Na *gaming* forumu to znači: nema screenshotova, nema slika buildova, nema grafova.
9. **Nema anketa** — nema `polls` tabele.
10. **Trajne poveznice na odgovor rade samo na prvoj strani** — sidro `#post-N` postoji
    (dodano 2026-08-16), ali API ne kaže na kojoj je strani post, a strane su po 15.
11. **Pretraga nema filtere** (ploča, autor, datum) i vezana je za PostgreSQL
    (`to_tsvector`/`plainto_tsquery`) — na SQLite vraća 500, pa je jedini forum endpoint
    koji test suite ne može pokriti.

**Ispravka ove liste (2026-08-16):** stavka „nema premještanja teme" je bila netačna —
`SimpleThreadResource` ima `Select::make('category_id')`, pa moderator temu premješta iz
admin panela. Spajanje (merge) dvije teme i dalje ne postoji.

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

---

## Changelog 2026-08-16 — puni pregled foruma

Traženo: bugovi, sigurnost, propusti, SQL injekcije, nedostajuće funkcije. Sve niže je
**izmjereno** — ili pokrenutim zahtjevom protiv produkcije, ili čitanjem koda, nikad
pretpostavkom.

### Nađeno i popravljeno

| | Nalaz | Gdje |
|---|---|---|
| **Kritično** | `/forum/categories/{slug}` je javno, bez prijave, vraćao **email adresu svakog autora teme**. Uzrok: vraćao je sirovi paginator, a `User::$hidden` namjerno ne skriva `email` (treba korisniku na postavkama), pa svaka serijalizacija Usera bez Resource-a objavljuje adresu. Potvrđeno živim zahtjevom prije popravke. | `ForumController::showCategory` |
| **Kritično** | Isti propust na `/games/{slug}/threads`. Nije se dao reprodukovati uživo jer nijedna tema trenutno nije vezana za igru — utvrđeno čitanjem koda. | `ForumController::gameThreads` |
| Visoko | Neuspio odgovor vraćao je **poruku izuzetka** pozivaocu — imena tabela, kolona i putanje onome ko uspije srušiti upis. Isto u komentarima i u shopu (tamo je najgore: neuspjela narudžba je mjesto koje kupac namjerno čačka). | `ForumController::createPost`, `CommentController`, `ShopController` |
| Srednje | Brojke na stranici ploče su se sabirale iz 20 redova na ekranu — ploča od 100 tema pisala je „20", a odgovori i pregledi mijenjali su se ovisno o strani. | `showCategory` + `[category]/page.tsx` |
| Nisko | `latestPost.author` se eager-loadao za kolonu koju lista više ne crta — join i još jedan cijeli User red po temi, ni za šta. | `showCategory` |
| Nisko | Pretraga linka na `#post-N`, a tema nije renderovala to sidro. | `thread/[slug]/page.tsx` |

Čuva ih `tests/Feature/ForumPrivacyTest.php` — tvrdnje idu nad **cijelim tijelom
odgovora**, pa preimenovano ili drugdje ugniježđeno polje i dalje pada.

### Provjereno i čisto (da se ne provjerava ponovo)

- **SQL injekcija:** jedini sirovi SQL u forumu je pretraga, i koristi vezane parametre
  (`?` + `[$query]`). Nema konkatenacije korisničkog unosa u upit nigdje u `ForumController`.
- **XSS:** dvostruko — HTMLPurifier profil `forum` na ulazu (bez `img`, bez `iframe`,
  bez `target`, `rel=nofollow`) i DOMPurify na izlazu.
- **Ovlaštenja:** izmjena i brisanje posta traže vlasnika ili moderatora, vezani su za
  temu iz URL-a, i zaključana tema odbija izmjene. Pin/lock/delete traže moderatora.
- **Ban:** `CheckUserBan` je zakačen na **cijelu** `api` grupu (`bootstrap/app.php:62`),
  pa su i rute bez `ban.check` aliasa pokrivene. Čitanja ostaju otvorena namjerno.
- **Spam kroz nove naloge:** registracija ima Cloudflare Turnstile i **ne izdaje token**
  prije verifikacije emaila, a `login()` ga isto odbija. Neverificiran nalog ne može pisati.
- **Obrisani postovi:** `PostResource` vraća `content: null` za soft-obrisane — nadgrobni
  kamen bez sadržaja.
- **@mention:** ograničen na 10 po postu, pa fan-out notifikacija ne može eksplodirati.
- **Prijave:** `POST /reports` ima allowlist tipova, sprječava duplu prijavu, sanitizira
  razlog, throttle 5/min.
- **Notifikacije:** kanal je samo `database` — nema SMTP poziva u zahtjevu.
- **Upvote:** transakcija s `lockForUpdate`, bez self-farminga.

### Ostaje otvoreno (nije popravljeno)

1. `ForumReplyNotification` i `ThreadWatchNotification` **nisu u redu** (`ShouldQueue`).
   Odgovor u temi s 50 pratilaca radi 50 upisa sinhrono u zahtjevu.
2. `clearCategoryPageCache` ne briše ključeve filtrirane tagom (`.tag_{slug}`) — samoliječi
   se za 30 s, ali je nedosljedno.
3. Postoje **dva Filament resursa** za `Thread`: `SimpleThreadResource` (radni) i prazni
   scaffold `ThreadResource` (`$shouldRegisterNavigation = false`, ali rute
   `/admin/threads*` žive i renderuju praznu formu).
4. Teme nemaju soft delete — brisanje teme je nepovratno, dok postovi imaju.

---

## Changelog 2026-08-16 (drugi dio) — popravke i nove funkcije

Traženo: „želim sve to da napraviš i da popraviš". Ovo je prvi set.

### Zatvorene otvorene stavke iz pregleda

| Stavka | Kako |
|---|---|
| Notifikacije nisu bile u redu | `ForumReplyNotification`, `ThreadWatchNotification` i `MentionNotification` sada `implements ShouldQueue`. Odgovor u temi s 50 pratilaca više ne radi 50 sinhronih upisa u zahtjevu. |
| Keš nije brisao tag varijante | Nova klasa `App\Support\ForumCache`. Verzija ploče je dio ključa, pa jedno podizanje verzije penzioniše **sve** njene keširane strane i sve tag filtere odjednom. Logika je bila duplirana u kontroleru i u `ThreadObserver` — sad je na jednom mjestu, što je i bio uzrok. |
| Teme se nisu mogle vratiti | `threads.deleted_at` + `SoftDeletes`. Novi `POST /forum/threads/{slug}/restore` (samo staff). `ThreadObserver::restored()` vraća 3 reputacije koje brisanje oduzme. |
| Dva Filament resursa za `Thread` | Prazan scaffold `app/Filament/Resources/Threads/` obrisan; ostaje `SimpleThreadResource`. |

**Greška uhvaćena vlastitim testom:** prva verzija verzionisanja keša nije radila. `Cache::increment` na ključu koji ne postoji postavi ga na 1, a moja pretpostavljena vrijednost je isto bila 1 — pa prvo brisanje nije mijenjalo nijedan ključ. Sada polazi od 0.

### Praćenje pročitanog (novo)

Najveći nedostatak s liste. Ograničenje koje je oblikovalo rješenje: **stranice ploča su keširane i dijeljene među korisnicima**, pa u njihov payload ne smije ući ništa lično — jedan čitalac bi dobio tuđe oznake.

Zato je stanje čitanja odvojen, autentifikovan zahtjev:

- `thread_reads` (user_id, thread_id, last_read_at, unique par) — jedan red po temi koju si otvorio.
- `users.forum_last_read_at` — vodena linija za „označi sve pročitanim". Član s 3.000 nepročitanih tema košta **jedan UPDATE**, ne 3.000 INSERT-a.
- Tema je nepročitana kad joj je zadnja aktivnost novija **od oba**.

| Ruta | Šta radi |
|---|---|
| `GET /forum/reads` | mapa `thread_id → last_read_at` (prozor 90 dana) + vodena linija |
| `POST /forum/threads/{slug}/read` | označi ovu temu; POST a ne dio GET-a, jer `showThread` odgovara i gostima |
| `POST /forum/reads/all` | pomjeri vodenu liniju |

Frontend: hook `useForumReads`, oznaka „New" i podebljan naslov u `ThreadRow`, „Mark all read" u traci foruma. Ne blokira — ploča se iscrta odmah, oznake stignu trenutak kasnije, a odjavljen posjetilac ne pita uopšte.

### Slike u postovima (novo)

Purifier profil `forum` sada dozvoljava `img[src|alt|width|height]`, **ali samo s našeg hosta** (`URI.DisableExternalResources` + `URI.Host`). To je cijeli sigurnosni model: `<img>` na tuđi server je tracking piksel koji loguje IP svakog ko otvori temu.

Novi `POST /forum/uploads` (throttle 10/min):

- **Ne koristi biblioteku za slike** — `intervention/image` nije instaliran u ovom projektu, a cijela aplikacija ionako sprema uploade sirovo.
- `getimagesize()` dekodira zaglavlje; fajl koji nije prava rasterska slika pada bez obzira na ekstenziju i deklarisani MIME.
- Ekstenzija pod kojom se sprema dolazi **iz bajtova**, nikad iz imena koje je klijent poslao.
- EXIF se skida s JPEG-a hodanjem po segmentima (čist PHP) — telefon u fotografiju stola upiše GPS.
- **Poznato ograničenje, navedeno a ne prećutano:** PNG i WebP metapodaci se ne skidaju, jer to traži dekoder.

Editor: dugme sada otvara birač fajlova, i **lijepljenje radi** — Print Screen pa Ctrl+V, što je stvarni način na koji se screenshot dijeli.

### Usput nađen živi bug u admin panelu

`MediaObserver` je hvatao `\Exception`, a servis koji poziva gradi Intervention driver kojeg **nema instaliranog** — to baca `\Error`, koji taj catch ne hvata. Znači: **svaki upload slike koja nije WebP kroz `Media` model padao je fatalno.** Dokazano izvršenim PHP-om, ne pretpostavkom. Sada hvata `\Throwable`, a `ImageOptimizationService::available()` javlja da biblioteke nema umjesto da eksplodira.
