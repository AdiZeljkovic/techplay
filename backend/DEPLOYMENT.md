# TechPlay Backend Deployment Guide

Complete deployment checklist for api-beta.techplay.gg → api.techplay.gg

## 📦 Pre-Deployment Checklist

### 1. Environment Configuration

Update `.env` file with production values:

```bash
APP_NAME="TechPlay"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.techplay.gg  # or api-beta.techplay.gg for beta

# Database
DB_CONNECTION=mysql
DB_PERSISTENT_CONNECTION=true  # IMPORTANT: Enable persistent connections
DB_POOL_MIN=2
DB_POOL_MAX=10

# Security
SANCTUM_STATEFUL_DOMAINS=techplay.gg,beta.techplay.gg,api.techplay.gg,api-beta.techplay.gg
SANCTUM_TOKEN_EXPIRATION=10080  # 7 days
SESSION_LIFETIME=480  # 8 hours
SESSION_ENCRYPT=true

# PayPal (CRITICAL)
PAYPAL_MODE=live  # or sandbox for beta
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_SECRET=your_live_secret
PAYPAL_WEBHOOK_ID=your_webhook_id_from_dashboard
PAYPAL_CURRENCY=EUR

# Logging (Production Optimized)
LOG_CHANNEL=stack
LOG_API_REQUESTS=false  # Disable in production for performance
LOG_PERFORMANCE=false  # Disable in production for performance
SLOW_QUERY_THRESHOLD=1000  # Log queries slower than 1s

# Cache (IMPORTANT: Use Redis in production)
CACHE_STORE=redis  # or file for beta
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Giveaway
GIVEAWAY_CACHE_LEADERBOARD_TTL=60  # seconds
```

### 2. Validate Environment

```bash
php artisan env:validate
```

Fix any errors or warnings before proceeding.

### 3. Install Dependencies

```bash
# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Optional: Install image optimization (recommended)
composer require intervention/image
```

### 4. Run Database Migrations

```bash
# CRITICAL: This adds performance indexes
php artisan migrate --force

# Verify migrations
php artisan migrate:status
```

### 5. Clear and Optimize Caches

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 6. Set Permissions

```bash
# Storage and cache directories
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## 🔒 PayPal Webhook Configuration

### For Beta Environment (api-beta.techplay.gg)

1. Log into PayPal Developer Dashboard
2. Go to **Webhooks** section
3. Create new webhook:
   - **URL:** `https://api-beta.techplay.gg/api/v1/webhooks/paypal`
   - **Events:**
     - PAYMENT.SALE.COMPLETED
     - PAYMENT.SALE.REFUNDED
     - BILLING.SUBSCRIPTION.CREATED
     - BILLING.SUBSCRIPTION.ACTIVATED
     - BILLING.SUBSCRIPTION.CANCELLED
     - BILLING.SUBSCRIPTION.EXPIRED
     - BILLING.SUBSCRIPTION.SUSPENDED
4. Copy **Webhook ID** to `.env` as `PAYPAL_WEBHOOK_ID`

### For Production (api.techplay.gg)

Repeat above steps with production URL: `https://api.techplay.gg/api/v1/webhooks/paypal`

## 🚀 Deployment Steps

### Pull Latest Code

```bash
cd /path/to/backend
git pull origin main
```

### Install/Update Dependencies

```bash
composer install --optimize-autoloader --no-dev
```

### Run Migrations

```bash
php artisan migrate --force
```

### Clear Caches

```bash
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

### Restart Services

```bash
# PHP-FPM
sudo systemctl restart php8.3-fpm

# Or reload without downtime
sudo systemctl reload php8.3-fpm

# Queue workers (if using)
php artisan queue:restart
```

## ✅ Post-Deployment Verification

### 1. Health Check

```bash
curl https://api.techplay.gg/up
# Should return 200 OK
```

### 2. Test API Endpoints

```bash
# Test auth
curl https://api.techplay.gg/api/v1/navigation/tree

# Test giveaways
curl https://api.techplay.gg/api/v1/giveaways
```

### 3. Test PayPal Webhook

Use PayPal Dashboard to send test webhook events.

### 4. Check Logs

```bash
tail -f storage/logs/laravel.log
```

Look for:
- No errors on startup
- Slow query logs (if any >1000ms)
- Security incidents

### 5. Monitor Performance

```bash
# Check slow queries
grep "SLOW QUERY" storage/logs/laravel.log

# Check security incidents
grep "SECURITY" storage/logs/laravel.log
```

## 🔧 Troubleshooting

### Issue: "Class not found" errors

```bash
composer dump-autoload
php artisan optimize:clear
```

### Issue: Cache not working

```bash
# Verify Redis connection
redis-cli ping  # Should return PONG

# Check config
php artisan config:show cache
```

### Issue: PayPal webhooks not working

1. Check `.env` has correct `PAYPAL_WEBHOOK_ID`
2. Verify webhook URL is publicly accessible
3. Check logs: `grep "PayPal webhook" storage/logs/laravel.log`
4. Test webhook signature verification

### Issue: Slow performance

1. Enable persistent DB connections: `DB_PERSISTENT_CONNECTION=true`
2. Use Redis cache: `CACHE_STORE=redis`
3. Enable OPcache in php.ini
4. Check slow query logs

## 📊 Monitoring

### Laravel Telescope (Development Only)

```bash
# Install Telescope for development
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

**WARNING:** Do NOT use Telescope in production!

### Laravel Pulse (Production Monitoring)

Already installed. Access at: `https://api.techplay.gg/pulse`

Authorization: Admin users only (see `AppServiceProvider::boot()`)

### Query Monitoring

Automatic slow query logging is enabled. Check:

```bash
grep "SLOW QUERY" storage/logs/laravel.log
```

## 🔄 Rollback Plan

If deployment fails:

```bash
# 1. Checkout previous version
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# 2. Restore database (if migrations failed)
php artisan migrate:rollback --step=1

# 3. Clear caches
php artisan optimize:clear

# 4. Restart services
sudo systemctl restart php8.3-fpm
```

## 📝 Deployment Log

Keep track of deployments:

| Date | Commit | Changes | Status |
|------|--------|---------|--------|
| 2026-01-24 | c1a04a5 | Critical fixes (indexes, memory leak, rate limiting) | ✅ |
| 2026-01-24 | 0a25819 | HIGH fixes (N+1, sanitization, PayPal webhooks) | ✅ |
| 2026-01-24 | PENDING | MEDIUM fixes (CSRF, DB pooling, logging, security headers) | 🔄 |

## 🎯 Performance Targets

After deployment, verify these metrics:

- **API response time:** <200ms (95th percentile)
- **Database query time:** <100ms (average)
- **Leaderboard cache hit rate:** >90%
- **Memory usage:** <100MB per process
- **No N+1 queries** in production

---

**Contact:** For deployment issues, check `storage/logs/laravel.log` first!
