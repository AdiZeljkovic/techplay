#!/bin/bash

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
# Restart Queue Workers (if using Supervisor)
# sudo supervisorctl restart all
# Setup storage link
php artisan storage:link

# 3. FRONTEND SETUP
echo "🎨 Building Frontend..."
cd $FRONTEND_DIR
npm ci --legacy-peer-deps
npm run build

# 4. RESTART PROCESSES
echo "🔄 Restarting Services..."
# Restart PHP-FPM
sudo service php8.3-fpm reload

# Restart Next.js (PM2)
# Check if started, if not start, else reload
if pm2 list | grep -q "techplay-frontend"; then
    pm2 reload techplay-frontend
else
    pm2 start npm --name "techplay-frontend" -- start
fi

echo "✅ Deployment Complete!"
