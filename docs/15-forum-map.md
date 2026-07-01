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

1. **Nema User ban** sistema specifičnog za forum (samo globalni account ban)
2. **Nema privatnih kategorija** (members-only ili premium)
3. **Nema email notifikacija** za forum reply — samo in-app (`ForumReplyNotification`, `database` kanal)
4. **Nema @mention sistema** u postovima (nema mention-parsing u `SanitizationService`)
5. **Discord bot ne najavljuje** nove forum threadove automatski — `/forum` komanda samo ručno prikazuje trending threadove (`PollingService` ne pokriva forum)
6. **`useRealTimeThreadReplies` hook nije povezan** na thread stranicu — infrastruktura postoji, nije iskorištena
7. **Nema `generateMetadata`/OG tagova** na kategorijskoj i thread stranici (obje su client component, nema server-side SEO meta)

Napomena: report sistem **postoji** i radi (`POST /reports` sa `reportable_type: thread|post`, `throttle:5,1`), samo je generički (dijeli endpoint s komentarima), ne forum-specifičan.
