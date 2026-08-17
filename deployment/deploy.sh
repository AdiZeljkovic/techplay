#!/bin/bash
set -e

# CONFIG
PROJECT_ROOT="/var/www/techplay"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🚀 Starting Deployment..."

# 1. GIT PULL
echo "📥 Pulling latest code..."
cd $PROJECT_ROOT
git pull origin main

# 2. BACKEND SETUP
echo "🛠️ Building Backend..."
cd $BACKEND_DIR
composer install --no-dev --optimize-autoloader
# Migrations are now idempotent (safe to run even if tables exist)
php artisan migrate --force
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache
# Setup storage link (no-op / non-fatal when it already exists)
php artisan storage:link || true

# Restart Octane workers so they pick up the new code AND the freshly cached
# config — a worker holds both in memory from the moment it booted.
#
# Deliberately not octane:reload. Reload does not reliably retire the old
# workers, and each one holds a PostgreSQL connection: on 4 August that left
# 197 idle connections against a max of ~200 and the deploy failed outright
# with "remaining connection slots are reserved". Reload also exits 0, so the
# supervisor fallback this line used to carry never ran.
sudo supervisorctl restart techplay-octane:*

# Signal queue workers to restart after their current job (supervisor
# autorestart brings them back with the new code).
php artisan queue:restart

# 2b. ADMIN PANEL STYLESHEET
#
# The panel's theme is compiled by Vite from resources/css/filament/admin, and
# nothing else builds it — this script used to build the Next.js frontend and
# leave the backend's own assets alone. For a long time that did not show,
# because viteTheme() was never called and the compiled file was never loaded;
# now that it is, a deploy that skips this ships the previous look.
echo "Building admin theme..."
npm ci --no-audit --no-fund
npm run build

# 3. FRONTEND SETUP
echo "🎨 Building Frontend..."
cd $FRONTEND_DIR
npm ci --legacy-peer-deps
npm run build

# 4. RESTART PROCESSES
echo "🔄 Restarting Services..."
# Reload PHP-FPM if present (harmless when everything runs under Octane)
sudo service php8.3-fpm reload || true

# Restart Next.js (PM2)
# Check if started, if not start, else reload
if pm2 list | grep -q "techplay-frontend"; then
    pm2 reload techplay-frontend
else
    pm2 start npm --name "techplay-frontend" -- start
fi

# 5. HEALTH CHECK
echo "🩺 Health check..."
sleep 5
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v1/system/health || echo "000")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
echo "Backend /system/status: $BACKEND_STATUS | Frontend /: $FRONTEND_STATUS"
if [ "$BACKEND_STATUS" != "200" ]; then
    echo "❌ Backend health check FAILED (HTTP $BACKEND_STATUS)" >&2
    exit 1
fi
if [ "$FRONTEND_STATUS" != "200" ]; then
    echo "❌ Frontend health check FAILED (HTTP $FRONTEND_STATUS)" >&2
    exit 1
fi

echo "✅ Deployment Complete!"
