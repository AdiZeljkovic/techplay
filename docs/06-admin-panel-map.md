# 06 — Admin Panel Map

## Tehnologija

- **Filament v5** — Laravel admin framework
- **Tema:** NeoBrutalism (`caresome/filament-neobrutalism-theme`)
- **URL:** `/admin`
- **Auth:** Filament panel auth (odvojeno od Sanctum API auth)
- **Lokacija koda:** `backend/app/Filament/`

Filament je integrisan direktno u Laravel backend aplikaciju — nije zasebna deployabilna komponenta.

---

## Admin resursi (`app/Filament/Resources/`)

### Content management

| Resource | Model | Opis |
|----------|-------|------|
| `NewsResource` | Article | Kreiranje i upravljanje news člancima |
| `ReviewResource` | Review | Kreiranje i upravljanje reviewima |
| `TechResource` | Article (tech/hardware) | Tech/hardware sadržaj |
| `GuideResource` | Guide | Upravljanje guidovima |
| `VideoResource` | Video | Upravljanje video sadržajem |
| `CategoryResource` | Category | Upravljanje kategorijama |
| `MediaResource` | Media | Upload i media library |

### Game management

| Resource | Model | Opis |
|----------|-------|------|
| `GameResource` | Game | Upravljanje game databaseom |
| `UserGameResource` | UserGame | Pregled korisničkih biblioteka |

### Community management

| Resource | Model | Opis |
|----------|-------|------|
| `ForumCategoryResource` | Category (forum) | Forum kategorije |
| `SimpleThreadResource` | Thread | Forum threadovi (read/delete) |
| `PostResource` | Post | Forum postovi (moderate/delete) |
| `CommentResource` | Comment | Moderacija komentara |

### User management

| Resource | Model | Opis |
|----------|-------|------|
| `UserResource` | User | Upravljanje korisnicima |
| `RankResource` | Rank | XP rangovi (threshold definicije) |
| `AchievementResource` | Achievement | Achievement definicije |
| `UserSupportResource` | UserSupport | Pregled supportera |
| `SupportTierResource` | SupportTier | Support tier definicije |

### Gamification management

| Resource | Model | Opis |
|----------|-------|------|
| `CustomizationResource` | Customization | Profile customization opcije |

### Commerce management

| Resource | Model | Opis |
|----------|-------|------|
| `ProductResource` | Product | Shop proizvodi |
| `OrderResource` | Order | Narudžbe |
| `GiveawayResource` | Giveaway | Giveaway events |

### SEO management

| Resource | Model | Opis |
|----------|-------|------|
| `SeoManagerResource` | SeoMeta/PageSeo | SEO per-page override |
| `PageSeoResource` | PageSeo | Page SEO management |
| `Redirects` | Redirect | URL redirect upravljanje |

### System management

| Resource | Model | Opis |
|----------|-------|------|
| `SiteSettingResource` | SiteSetting | Globalne postavke, maintenance mode |
| `AdCampaignResource` | AdCampaign | Reklamne kampanje |
| `MediaKitSettingResource` | MediaKitSetting | Media kit konfiguracija |
| `NewsletterSubscriberResource` | NewsletterSubscriber | Newsletter pretplatnici |
| `ReportResource` | Report | User report |
| `RewardItemResource` | RewardItem | Reward store proizvodi |

### Editorial chat

| Resource | Model | Opis |
|----------|-------|------|
| `EditorialChannelResource` | EditorialChannel | Interni editorial chat kanali |
| `Tasks` | Task | Interni zadaci |
| `Roles` | Permission/Role | Spatie role management |

---

## Kako admin kreira sadržaj

### News članak
1. Filament admin → NewsResource
2. Unosi: naslov, slug (auto), kategorija, tekst (rich editor), hero slika
3. SEO polja: meta title, meta description, OG image
4. Opcije: featured, scheduled publish
5. Publish → ArticleObserver → CacheRevalidationService → Next.js ISR revalidacija

### Review
1. Filament admin → ReviewResource
2. Unosi: naslov, igra (link na Game model), tekst, ocjena (0-10), specs tabela
3. SEO polja
4. Publish → ReviewObserver → Next.js ISR revalidacija

### Guide
1. GuideResource → naslov, slug, kategorija, tekst
2. Voting sistem (GuideVote model) — korisnici glasaju
3. Publish → GuideObserver → ISR

### Game (Game Database)
1. GameResource → admin može ručno unositi/editovati
2. Import: `php artisan moby:fetch` / `php artisan import:moby-csv`
3. Enrich: `php artisan moby:enrich` → MobyGamesService

---

## Šta admin panel može

- Kreirati/editovati/brisati sav sadržaj (news, reviews, guides, videos, tech)
- Upravljati game databaseom (manuelno + import trigger)
- Moderirati komentare (brisanje, zastavica)
- Upravljati forum kategorijama i brisati threadove/postove
- Upravljati korisnicima (deaktivacija, edit profila, dodjela rola)
- Konfigurirati XP rangove (threshold XP vrijednosti)
- Upravljati achievementima (definirani seederi)
- Kreirati/upravljati giveawayima i nagradama
- Upravljati shopom (proizvodi, narudžbe)
- Konfigurirati SEO po stranici
- Upravljati redirectima
- Konfigurirati reklamne kampanje
- Upravljati site postavkama (uključujući maintenance mode)
- Upravljati newsletter pretplatnicima
- Pregledati i rješavati korisničke reporte

## Šta admin panel ne može (ili je nejasno)

- **Masovno brisanje** — vjerovatno nije implementirano za sav sadržaj
- **Bulk publish/unpublish** — UNKNOWN
- **Direktno pokretanje MobyGames importa** kroz UI (samo artisan command)
- **Discord bot upravljanje** — nema Filament sekcije za bota
- **Analitika/statistike** — postoje Filament Widgets, ali opseg UNKNOWN
- **Email preview** — UNKNOWN
- **Moderacija DM poruka** — vjerovatno nije u adminu
