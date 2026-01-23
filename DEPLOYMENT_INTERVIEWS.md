# 🚀 Deployment Instrukcije - Interviews Podkategorija

## 📦 Šta je dodato

Dodata je **Interviews** podkategorija u NEWS sekciju koja će se pojaviti:
- ✅ U Admin Panelu → News → Category dropdown
- ✅ U Frontend navigaciji → News podmeni
- ✅ SEO-friendly URL: `/news/interviews`

---

## 🔧 Deployment na Server

### Metoda 1: Koristeći Migraciju (Preporučeno)

```bash
# 1. SSH na server
ssh korisnik@server

# 2. Navigate to project folder
cd /putanja/do/projekta

# 3. Pull latest changes from GitHub
git pull origin main

# 4. Run migration
cd backend
php artisan migrate

# 5. Refresh SEO data for new category
php artisan db:seed --class=CategorySeoSeeder

# 6. Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 7. Restart services (ako je potrebno)
sudo systemctl restart php8.2-fpm  # ili php-fpm zavisno od konfiguracije
```

---

### Metoda 2: Koristeći PostgreSQL Skriptu (Ako ne radi migracija)

```bash
# 1. SSH na server i pull changes
ssh korisnik@server
cd /putanja/do/projekta
git pull origin main

# 2. Konektuj se na PostgreSQL
psql -U korisnik -d ime_baze

# 3. U PostgreSQL promptu, izvršite skriptu:
\i backend/database/add_interviews_category.sql

# ili direktno:
psql -U korisnik -d ime_baze -f backend/database/add_interviews_category.sql

# 4. Proveri da li je dodato
SELECT c.id, c.name, c.slug, c.type, p.name as parent_category
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.type = 'news'
ORDER BY c.parent_id, c.name;

# 5. Refresh SEO data
cd backend
php artisan db:seed --class=CategorySeoSeeder

# 6. Clear cache
php artisan cache:clear
```

---

### Metoda 3: Ručni INSERT u PostgreSQL

Ako ne možeš da koristiš nijednu od gornjih metoda:

```sql
-- 1. Nađi News parent ID
SELECT id FROM categories WHERE type = 'news' AND parent_id IS NULL;
-- Npr. dobio si: 1

-- 2. Dodaj Interviews (zameni <NEWS_ID> sa pravim ID-om)
INSERT INTO categories (name, slug, parent_id, type, created_at, updated_at)
VALUES ('Interviews', 'news-interviews', <NEWS_ID>, 'news', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
```

---

## ✅ Verifikacija

### 1. Admin Panel
- Idi na: `/admin/news-articles/create`
- Klikni na **Category** dropdown
- Trebao bi da vidiš **Interviews** opciju

### 2. Frontend
- Refresh homepage
- Navigiraj mišem preko **NEWS** u meniju
- U padajućem meniju trebao bi da vidiš **Interviews**

### 3. Baza podataka
```sql
-- Proveri da li postoji Interviews
SELECT * FROM categories WHERE slug = 'news-interviews';

-- Trebao bi da vidiš:
-- id | name       | slug            | parent_id | type | ...
-- ?? | Interviews | news-interviews | (News ID) | news | ...
```

---

## 🔄 Rollback (Ako nešto pođe po zlu)

```bash
# Samo obriši Interviews kategoriju
psql -U korisnik -d ime_baze -c "DELETE FROM categories WHERE slug = 'news-interviews';"
```

---

## 📝 Napomene

1. **Cache je bitan** - Frontend cache može da prikaže staru navigaciju. Clear cache nakon deployment-a.
2. **SEO Seeder** - Automatski kreira SEO metadata za novu kategoriju.
3. **Migracija je idempotentna** - Može se pokrenuti više puta, neće dodati duplikate.
4. **SQL skripta je idempotentna** - Proverava da li već postoji pre dodavanja.

---

## 🆘 Troubleshooting

### Problem: Interviews se ne pojavljuje u Admin Panelu
```bash
# Clear Filament cache
php artisan filament:cache-components
php artisan optimize:clear
```

### Problem: Interviews se ne pojavljuje u Frontend meniju
```bash
# Proveri API response
curl https://tvoj-domen.com/api/v1/navigation/tree

# Trebao bi da vidiš:
# {
#   "news": [
#     ...
#     {"name": "Interviews", "href": "/news/interviews"}
#   ]
# }
```

### Problem: 404 na /news/interviews
```bash
# Proveri da li postoji u bazi
psql -U korisnik -d ime_baze -c "SELECT * FROM categories WHERE slug = 'news-interviews';"

# Ako ne postoji, vidi Metodu 2 ili 3 iznad
```

---

## 📊 Commit Info

- **Commit Hash**: `80c42dc`
- **Branch**: `main`
- **Fajlovi promenjeni**:
  - `backend/app/Filament/Resources/Articles/Schemas/ArticleForm.php`
  - `backend/database/seeders/CategorySeeder.php`
  - `backend/database/seeders/CategorySeoSeeder.php`
  - `backend/database/migrations/2026_01_23_120000_add_interviews_subcategory_to_news.php`
  - `backend/database/add_interviews_category.sql`

---

Srećan deployment! 🚀
