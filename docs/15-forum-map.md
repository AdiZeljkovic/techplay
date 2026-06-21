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
- `GET /forum/categories/{slug}` — threadovi u kategoriji
- `GET /forum/threads/{slug}` — thread s postovima
- `GET /forum/active` — aktivni threadovi (sortovani po zadnjoj aktivnosti)
- `POST /forum/threads` — kreiraj thread (auth)

---

## Postovi (`posts` tabela)

**Ključna polja:**
- `id`, `thread_id`, `author_id`, `content`
- `parent_id` — za nested replies (UNKNOWN koliko nivoa)
- `upvotes` — upvote count
- `is_deleted` — soft delete flag
- `edited_at` — timestamp izmjene

**API:**
- `POST /forum/threads/{slug}/posts` — kreiraj post (auth)
- `PUT /forum/threads/{slug}/posts/{postId}` — ažuriraj (auth, samo vlastiti)
- `DELETE /forum/threads/{slug}/posts/{postId}` — obriši (soft, auth)
- `POST /forum/threads/{slug}/upvote` — upvote threada (auth)
- `POST /forum/threads/{slug}/pin` — pin thread (admin/moderator)

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

**Frontend moderation:** UNKNOWN (nema vidljivih moderacijskih alata za korisnike)

**Pin/Lock:** `POST /forum/threads/{slug}/pin` — vjerovatno zahtijeva admin rolu (UNKNOWN provjera)

---

## Real-time

- `ThreadObserver` → Broadcast `ThreadCreated` event
- `ForumPostObserver` → Broadcast `ForumReplyPosted` event
- `useRealTimeForum` hook u frontendu

---

## XP integracija

- XP za kreiranje threadova ili postova — UNKNOWN detalji
- `XpService` vjerovatno pozvan iz ForumController

---

## Discord bot integracija

- `/forum` slash komanda → prikazuje trending threadove (`GET /forum/active`)
- Bot formatira i prikazuje top threadove u Discord embeds

---

## Nedostaci

1. **Nema report sistema** specifičnog za forum postove
2. **Nema spam zaštite** (samo rate limiting na API)
3. **Nema User ban** sistema integriranog s forumom
4. **Nema kategorizacijskih pravila** (pinned opisi kategorija)
5. **Nema privatnih kategorija** (members-only ili premium)
6. **Moderator role** nije jasno definirana — ko može pinati/brisati?
7. **Nema threading notifikacija** (email ili in-app kada neko odgovori na tvoj post)
