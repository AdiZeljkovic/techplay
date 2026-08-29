# 🎯 Ad Campaign System - Complete Upgrade

Kompletan upgrade sistema za upravljanje reklamama sa IAB standardima, device targeting-om, in-text reklamama i analytics dashboard-om.

---

## 📊 Šta je Urađeno

### Phase 1: Redis Sync & Click Tracking ✅

**Backend Fajlovi:**
- ✅ [SyncAdMetrics.php](backend/app/Console/Commands/SyncAdMetrics.php) - Artisan command za sync Redis → Database
- ✅ [console.php](backend/routes/console.php) - Dodao scheduler entry (hourly sync)

**Kako Radi:**
1. Svaki put kad se reklama prikaže → Redis `INCR views:ad:{id}`
2. Svaki klik → Redis `INCR clicks:ad:{id}`
3. Svaki sat → `php artisan ads:sync-metrics` sync-uje u bazu i čisti Redis
4. Admin panel prikazuje tačne brojeve

**Komande:**
```bash
# Manual sync
php artisan ads:sync-metrics

# Scheduler (automatski pokreće svaki sat)
# Već je konfigurisan u console.php
```

---

### Phase 2: IAB Standard Formats & Device Targeting ✅

**Backend Fajlovi:**
- ✅ [2026_01_23_130000_add_iab_fields_to_ad_campaigns.php](backend/database/migrations/2026_01_23_130000_add_iab_fields_to_ad_campaigns.php) - Nova polja
- ✅ [AdCampaign.php](backend/app/Models/AdCampaign.php) - Model update sa scope methods
- ✅ [AdCampaignResource.php](backend/app/Filament/Resources/AdCampaignResource.php) - Admin panel update
- ✅ [AdController.php](backend/app/Http/Controllers/Api/V1/AdController.php) - Device detection & targeting

**Nova Polja u Bazi:**
```php
'format'           // IAB format (ros, rectangle, billboard, in-text, skyscraper, etc.)
'width'            // Širina u pikselima
'height'           // Visina u pikselima
'platforms'        // JSON array: ["desktop", "mobile_web", "ios_app", "android_app"]
'device_targeting' // all, desktop_only, mobile_only
'cpm_price'        // Cijena po 1000 impressions (KM)
'description'      // Interne note
```

**IAB Formati:**
- 🏷️ **ROS** (Run of Site)
- 📐 **Rectangle** (300x250px)
- 🖼️ **Billboard** (970x250px)
- 📝 **In-Text**
- 🏢 **Skyscraper** (160x600px)
- 🎯 **Leaderboard** (728x90px)
- 📱 **Mobile Banner** (320x50px)
- 🎬 **Video Pre-Roll** (Skippable / Non-Skippable)
- 🎥 **Video Outstream**

**Device Targeting:**
- Automatski detektuje device iz User-Agent
- Desktop users vide `desktop_only` ili `all` reklame
- Mobile users vide `mobile_only` ili `all` reklame
- iOS/Android detection za app-specific reklame

**Admin Panel Features:**
- Filter po formatu, device targeting-u, poziciji
- CTR (Click Through Rate) kolona sa colour-coding
- Estimated Revenue kolona (CPM calculation)
- Dimensions input sa validacijom

---

### Phase 3: Ad Placements Svuda ✅

**Frontend Fajlovi:**

**Homepage:**
- ✅ [page.tsx](frontend/app/page.tsx)
  - `home_hero` - Hero banner ispod carousel-a
  - `home_mid_1` - Između News i Reviews sekcija
  - `home_mid_2` - Između Reviews i Hardware sekcija

> HomeSidebar je uklonjen u redizajnu portala; `sidebar_top` i `sidebar_bottom`
> danas žive u `components/news/ArticleDetailView.tsx` (aside kolona).

**Listing Pages:**
- ✅ [NewsClient.tsx](frontend/app/news/NewsClient.tsx) - `listing_top`
- ✅ [ReviewsClient.tsx](frontend/app/reviews/ReviewsClient.tsx) - `listing_top`
- ✅ [HardwareClient.tsx](frontend/app/hardware/HardwareClient.tsx) - `listing_top`

**Article Pages:**
- ✅ [ArticleDetailView.tsx](frontend/components/news/ArticleDetailView.tsx)
  - `article_in_text` - Automatski nakon 3. i 6. paragrafa
  - `article_mid` - Mid-content (mobile/tablet)
  - `sidebar_top` - Sidebar top
  - `sidebar_bottom` - Sidebar bottom

**Sve Pozicije:**
```javascript
// Homepage
'home_hero'           // 🏠 Hero banner
'home_mid_1'          // 🏠 Mid section 1
'home_mid_2'          // 🏠 Mid section 2
'home_sidebar'        // 🏠 Sidebar

// Listing Pages
'listing_top'         // 📰 Top banner
'listing_sidebar'     // 📰 Sidebar (nije još implementirano)

// Article Pages
'article_after_hero'  // 📄 After hero (nije korišćeno)
'article_mid'         // 📄 Mid content (mobile)
'article_in_text'     // 📄 In-text (auto inject)

// Global
'sidebar_top'         // 🌐 Sidebar top
'sidebar_bottom'      // 🌐 Sidebar bottom
'header_top'          // 🌐 Header top (nije korišćeno)
'footer_top'          // 🌐 Footer top (nije korišćeno)
```

---

### Phase 4: In-Text Ads (Auto Injection) ⚠️ NIJE AKTIVNO

Pozicija `article_in_text` postoji u adminu (AdCampaignResource) i backend je
servira, ali frontend je ne renderuje: `InTextAd.tsx` je izvađen iz
`ArticleDetailView` (commit e60a9e2d) zbog razmaka između paragrafa koji je
lomilo dijeljenje HTML-a. Komponenta stoji spremna; treba riješiti taj CSS
problem prije nego se vrati. Prvi pokušaj (`ContentWithInTextAds` +
`injectInTextAds`) je obrisan — nikad nije prikazivao reklamu.

**Frontend Fajlovi:**
- ⚠️ [InTextAd.tsx](frontend/components/ads/InTextAd.tsx) - spremna, nije uvezana

**Kako Radi:**
1. Parsira HTML content i broji paragrafe
2. Automatski ubacuje `<AdUnit>` nakon specifičnih paragrafa
3. Default: nakon 3. i 6. paragrafa
4. Samo ako članak ima dovoljno paragrafa (min 5)

**Primjer Upotrebe:**
```tsx
<InTextAd
    content={safeContent}
    afterParagraphs={[3, 6]}  // Nakon 3. i 6. paragrafa
    position="article_in_text"
    className="prose..."
/>
```

---

### Phase 5: Analytics Dashboard ✅

**Backend Fajlovi:**
- ✅ [AdCampaignStats.php](backend/app/Filament/Widgets/AdCampaignStats.php) - Stats widget
- ✅ [TopPerformingAds.php](backend/app/Filament/Widgets/TopPerformingAds.php) - Table widget
- ✅ [ListAdCampaigns.php](backend/app/Filament/Resources/AdCampaignResource/Pages/ListAdCampaigns.php) - Integracija

**Widgets:**

**1. Ad Campaign Stats (Top)**
- 📊 Total Impressions - sa trend chart-om
- 🖱️ Total Clicks - sa overall CTR
- 💰 Estimated Revenue - CPM calculation
- 📢 Active Campaigns - broj aktivnih

**2. Top Performing Ads (Bottom)**
- Sortiran po CTR (Click Through Rate)
- Prikazuje: Name, Format, Views, Clicks, CTR, Revenue
- Colour-coded CTR badges:
  - 🟢 > 5% = Success
  - 🟡 2-5% = Warning
  - 🔴 < 2% = Danger

**Model Methods:**
```php
// AdCampaign.php
$ad->ctr                  // Click Through Rate (%)
$ad->estimated_revenue    // Revenue based on CPM
```

---

## 🚀 Deployment Steps

### 1. Run Migration

```bash
cd backend
php artisan migrate
```

Ova migracija dodaje:
- `format`, `width`, `height`
- `platforms` (JSON)
- `device_targeting`
- `cpm_price`
- `description`

### 2. Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 3. Frontend Build

```bash
cd frontend
npm run build
```

### 4. Restart Services

```bash
# Laravel queue workers
php artisan queue:restart

# Next.js (ako koristiš PM2)
pm2 restart nextjs-app
```

### 5. Test Sync Command

```bash
# Manual test
php artisan ads:sync-metrics
```

---

## 📝 Kako Koristiti Admin Panel

### Kreiranje Nove Reklame

1. **Basic Info:**
   - Name: "Nvidia GeForce Banner"
   - Type: Image Banner ili Custom Code

2. **IAB Format:**
   - Format: Rectangle (300x250px)
   - Width: 300px
   - Height: 250px

3. **Targeting:**
   - Platforms: ☑️ Desktop, ☑️ Mobile Web
   - Device: All Devices (ili Desktop Only / Mobile Only)

4. **Content:**
   - Upload Image ili Paste Code
   - Target URL: https://example.com

5. **Position:**
   - Odaberi poziciju (npr. "🏠 Homepage - Hero Banner")

6. **Pricing:**
   - CPM Price: 10.00 KM

7. **Schedule:**
   - Start Date: 2026-01-23
   - End Date: 2026-02-23
   - Active: ✅

### Praćenje Performansi

**Na Ad Campaigns List Page:**

1. **Top Widgets** (AdCampaignStats):
   - Total Impressions sa chart-om
   - Total Clicks sa CTR
   - Estimated Revenue
   - Active Campaigns

2. **Main Table:**
   - CTR kolona (colour-coded)
   - Revenue kolona
   - Filter by Format, Device, Position

3. **Bottom Widget** (TopPerformingAds):
   - Najbolje performing reklame
   - Sortiran po CTR

---

## 🎯 Best Practices

### CPM Pricing

Standardne cijene u regiji:
- **Premium (970x250px Billboard):** 15-25 KM
- **Rectangle (300x250px):** 10-15 KM
- **Leaderboard (728x90px):** 8-12 KM
- **Mobile Banner (320x50px):** 5-8 KM
- **In-Text:** 12-18 KM
- **Video Pre-Roll:** 20-30 KM

### CTR Benchmarks

- **> 5%** = Odlično 🟢
- **2-5%** = Dobro 🟡
- **< 2%** = Slabo, optimizuj 🔴

### Device Targeting Tips

- **Desktop Only:** Koristi za velike formate (Billboard 970x250)
- **Mobile Only:** Koristi za male formate (Mobile Banner 320x50)
- **All Devices:** In-Text, Rectangle, Leaderboard

---

## 🔧 Troubleshooting

### Redis Keys ne Sync-uju

```bash
# Check Redis keys
redis-cli
KEYS *ad*

# Manual sync
php artisan ads:sync-metrics

# Check scheduler
php artisan schedule:list
```

### Frontend ne Prikazuje Reklame

```bash
# Check API endpoint
curl http://localhost:3000/api/v1/ads/home_hero

# Check Next.js logs
pm2 logs nextjs-app

# Rebuild frontend
cd frontend
rm -rf .next
npm run build
```

### Device Targeting ne Radi

Problem: `forDevice()` scope možda ne radi kako treba

```php
// AdController.php - provjeri User-Agent detection
$userAgent = $request->header('User-Agent', '');
$isMobile = preg_match('/Mobile|Android|iPhone|iPad|iPod/i', $userAgent);
```

---

## 📊 Očekivane Metrike

| Pozicija | Očekivan CTR | Prioritet |
|----------|--------------|-----------|
| Homepage Hero | 3-5% | High |
| Article In-Text | 4-7% | Very High |
| Sidebar Top | 2-4% | Medium |
| Listing Top | 3-5% | High |
| Article Mid | 2-3% | Medium |

---

## 🎉 Zaključak

Sistem je sada spreman za:
- ✅ IAB standard formate
- ✅ Device & Platform targeting
- ✅ Automatic in-text ads
- ✅ Real-time click tracking
- ✅ Revenue tracking & analytics
- ✅ Performance monitoring

**Sve što trebaš da uradiš:**
1. Run migration
2. Clear cache
3. Rebuild frontend
4. Kreiraj reklame u admin panelu
5. Prati performanse!

Uživaj! 🚀
