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

# Reload Octane workers so they pick up the new code (graceful, finishes
# in-flight requests). Falls back to a supervisor restart if reload fails.
php artisan octane:reload || sudo supervisorctl restart techplay-octane:*

# Signal queue workers to restart after their current job (supervisor
# autorestart brings them back with the new code).
php artisan queue:restart

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
