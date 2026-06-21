# 17 — Comments Map

## Pregled

Polymorphic comment sistem — isti model i tabela za komentare na svim content tipovima.

---

## Gdje se komentari koriste

| Content tip | commentable_type | Endpoint |
|-------------|----------------|---------|
| News/Article | `App\Models\Article` | `GET /comments/article/{id}` |
| Review | `App\Models\Review` | `GET /comments/review/{id}` |
| Guide | `App\Models\Guide` | `GET /comments/guide/{id}` |
| Video | `App\Models\Video` | `GET /comments/video/{id}` |
| Game | `App\Models\Game` | `GET /comments/game/{id}` (UNKNOWN da li je implementirano) |

---

## Model (`comments` tabela)

**Ključne kolone:**
- `id`
- `commentable_type` — klasa modela (polymorphic)
- `commentable_id` — ID entiteta
- `user_id` — autor
- `content` — tekst komentara
- `parent_id` — za nested replies (nullable)
- `is_deleted` — soft delete
- `upvotes`, `downvotes` (ili kroz `comment_likes` tabelu)

---

## API

| Metoda | Ruta | Auth | Opis |
|--------|------|------|------|
| GET | `/comments/{type}/{id}` | - | Lista komentara |
| POST | `/comments` | ✓ (throttle:30) | Kreiraj komentar |
| POST | `/comments/{id}/vote` | ✓ (throttle:30) | Like/dislike |

---

## Kreiranje komentara

```
POST /api/v1/comments
{
  "commentable_type": "article",
  "commentable_id": 123,
  "content": "...",
  "parent_id": null  // null za top-level, ID za reply
}
```

1. `SanitizationService` — XSS zaštita sadržaja
2. `Comment::create()`
3. `CommentObserver::created`
4. Broadcast `CommentPosted` event → Reverb WebSocket
5. `XpService::awardForComment()` — XP korisniku
6. `AchievementService::check()` — možda achievement provjera

---

## Voting

- `POST /comments/{id}/vote` — like/dislike
- `comment_likes` tabela: comment_id, user_id, type
- Jedan korisnik jedan glas po komentaru
- Score utječe na ranking komentara (UNKNOWN sortiranje)

---

## Real-time

- `CommentObserver` broadcast `CommentPosted` event
- `useRealTimeComments` hook u frontendu
- Novi komentari se pojavljuju automatski bez page reload

---

## Moderacija

**Admin panel:**
- `CommentResource` — admin vidi sve komentare, može ih brisati
- Soft delete: `is_deleted = true` (komentar ostaje u bazi)

**Korisnici:**
- Nema report dugmeta specifičnog za komentar (Report model postoji za generalne abuse prijave)
- `POST /reports` — korisnik može reportovati sadržaj (throttle:5,1)

**Spam zaštita:**
- Rate limiting: throttle:30,1 (30 komentara po minuti)
- `SanitizationService` za XSS
- UNKNOWN: da li postoji spam keyword filter ili AI moderacija

---

## Nedostaci

1. **Nema in-line report dugmeta** na frontendu za komentare
2. **Nema moderator queue** — admin vidi sve ali nema workflow za review
3. **Nema email notifikacija** za reply na komentar
4. **In-app notifikacije** za replies UNKNOWN (vjerovatno nisu implementirane)
5. **Spam filter** — samo rate limiting, nema keyword filter
6. **Comment edit** — nema endpoint za editovanje vlastitog komentara
