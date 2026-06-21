# 22 — Admin Workflows

## Pristup admin panelu

1. Idi na `techplay.gg/admin` ili `api.techplay.gg/admin`
2. Login s admin akreditivima (Filament auth)
3. Dashboard s widgetima i navigacijom

---

## Kreiranje news članka

1. **Admin → NewsResource → "New Article"**
2. Popuni formu:
   - `Title` — naslov (slug auto-generisan)
   - `Category` — odaberi news kategoriju
   - `Content` — rich text editor (HTML)
   - `Hero Image` — upload slike
   - `Is Hero` — toggle za featured/hero poziciju
   - `Published At` — odmah ili scheduled
3. **SEO tab:**
   - Meta title, meta description
   - OG image (može biti zasebna od hero)
   - Canonical URL (auto-generisana)
4. Klik **Save** → ArticleObserver → ISR revalidation → IndexNow ping
5. Članak je live na techplay.gg/news/{slug}

---

## Kreiranje reviewa

1. **Admin → ReviewResource → "New Review"**
2. Popuni formu:
   - `Title` — naslov
   - `Game` — veza na Game model (search/select)
   - `Content` — rich text
   - `Score` — ocjena 0-10
   - `Specs` — hardware specs tabela (JSON ili tabela UI)
   - `Cover Image`
3. **SEO tab** (isto kao news)
4. Save → ReviewObserver → ISR → IndexNow

---

## Kreiranje guidea

1. **Admin → GuideResource → "New Guide"**
2. `Title`, `Category`, `Content` (rich text), `Status` (draft/published)
3. SEO polja
4. Save → GuideObserver → ISR

---

## Kreiranje tech/hardware članka

1. **Admin → TechResource → "New Article"**
2. Isto kao news, ali kroz TechResource (vjerovatno filtriran po tech kategoriji)

---

## Upravljanje igrama

### Ručno kreiranje/editovanje
1. **Admin → GameResource → "Edit"** ili "New"
2. Popuni: naziv, slug, opis, cover, release_date, developer, publisher, žanrovi, platforme
3. Save

### Import iz MobyGames
1. SSH na server
2. `cd backend && php artisan moby:fetch` — fetch novih igara
3. `php artisan moby:enrich` — enrich detalja
4. Alternativno: `php artisan import:moby-csv --file=path.csv` za CSV import

### RAWG screenshots
- Automatski se fetchuju na game detail stranici ako nema lokalnih

---

## Upravljanje release calendarom

- Release datum je polje na Game modelu
- Admin edituje `release_date` u GameResource
- Nema poseban calendar admin UI

---

## Upravljanje korisnicima

1. **Admin → UserResource**
2. Pregled: lista svih korisnika s XP, rank, email
3. Akcije:
   - Edit profil (username, email, bio)
   - Dodjela rola (Spatie roles)
   - Brisanje/deaktivacija računa (UNKNOWN da li je soft delete)
   - Ručni XP adjustment (UNKNOWN da li UI postoji)

---

## Upravljanje forumom

1. **Admin → ForumCategoryResource** — kreiranje/edit kategorija
2. **Admin → SimpleThreadResource** — lista threadova, brisanje
3. **Admin → PostResource** — lista postova, brisanje
4. **Pinning:** `POST /forum/threads/{slug}/pin` API (vjerovatno iz admin panela)

---

## Moderacija komentara

1. **Admin → CommentResource**
2. Lista svih komentara sa: author, content, entity (na čemu je komentar), datum
3. Admin može obrisati komentar
4. **Soft delete** — komentar markiran kao deleted, ostaje u bazi
5. Nema moderator queue (sve odmah vidljivo)

---

## Upravljanje XP i rangovima

1. **Admin → RankResource**
2. Lista rangova: naziv, XP threshold, boja, ikona
3. Edit/kreiranje novih rangova
4. **Napomena:** Promjena XP thresholda NEMA retroaktivan efekat bez pokretanja `SyncUserXP`

---

## Upravljanje achievementima

1. **Admin → AchievementResource**
2. Lista achievementa: naziv, opis, trigger, XP nagrada
3. Edit/kreiranje
4. `php artisan sync:achievements` za retroaktivnu dodjelu

---

## Upravljanje giveawayima

1. **Admin → GiveawayResource → "New Giveaway"**
2. `Title`, `Slug`, `Description`, `Ends At`, `Winner Count`
3. Prize Tiers — nested editor za nagrade
4. Tasks — bonus zadaci za extra tickets
5. Privée ID (ako je Privée giveaway)
6. Publish

---

## Site postavke

1. **Admin → SiteSettingResource**
2. Ključne postavke:
   - `maintenance_mode: true/false` — uključuje maintenance
   - Ostale globalne postavke
3. **Promjena maintenance mode:**
   - Klik edit na `maintenance_mode` setting
   - Mijenja vrijednost
   - Svi fronted requesti počinju provjeravati `/system/status`
   - Korisnici bez bypass cookie-ja se redirectuju na `/coming-soon`

---

## SEO upravljanje

1. **Admin → SeoManagerResource ili PageSeoResource**
2. Odaberi path (npr. `/games`)
3. Definiraj: title, description, og_image
4. Frontend fetchuje ove vrijednosti server-side

---

## Upravljanje reklamama

1. **Admin → AdCampaignResource**
2. Definiraj: pozicija, sadržaj, datumi aktivnosti, IAB kategorije
3. Frontend fetchuje reklamni sadržaj: `GET /ads/{position}`

---

## Upravljanje newsletter pretplatnicima

1. **Admin → NewsletterSubscriberResource**
2. Lista pretplatnika s email, verified, datum
3. Export UNKNOWN
4. **Slanje newslettera:** UNKNOWN (nema vidljivo u admin panelu)

---

## Upravljanje redirectima

1. **Admin → Redirects resource**
2. Dodaj: from_path → to_path, status (301/302)
3. `GET /api/v1/redirects` — frontend fetche sve redirecte i handleuje client-side ili middleware

---

## Upravljanje medijima (upload)

1. **Admin → MediaResource**
2. Upload novih fajlova
3. Browse/delete postojećih
4. MediaObserver prati upload događaje
