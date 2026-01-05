#!/bin/bash

# EXIT ON ERROR
set -e

# --- CONFIGURATION ---
DOMAIN_FRONTEND="beta.techplay.gg"
DOMAIN_BACKEND="api-beta.techplay.gg"
DB_NAME="techplay"
DB_USER="techplay"
# PASSWORD WILL BE ASKED OR GENERATED
RUBBER_STAMP_DB_PASS="StrongPass!" # Change this in production or prompt

echo "🚀 Starting Production Provisioning for TechPlay.gg..."
echo "-----------------------------------------------------"

# 1. UPDATE & BASIC TOOLS
echo "📦 Updating system and installing base tools..."
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y
apt-get install -y git curl zip unzip acl gnupg supervisor nginx

# 2. PHP 8.3 & EXTENSIONS (Ondrej PPA)
echo "🐘 Installing PHP 8.3..."
if ! command -v php > /dev/null; then
    add-apt-repository ppa:ondrej/php -y
    apt-get update
    apt-get install -y php8.3-fpm php8.3-cli php8.3-common php8.3-pgsql php8.3-zip php8.3-gd php8.3-mbstring php8.3-curl php8.3-xml php8.3-bcmath php8.3-intl php8.3-redis
fi

# 3. COMPOSER
echo "🎼 Installing Composer..."
if ! command -v composer > /dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# 4. NODE.JS 20 (LTS)
echo "🟢 Installing Node.js 20..."
if ! command -v node > /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -g pm2
fi

# 5. POSTGRESQL
echo "🐘 Installing PostgreSQL..."
if ! command -v psql > /dev/null; then
    apt-get install -y postgresql postgresql-contrib
    
    # Configure DB
    echo "⚙️ Configuring Database..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$RUBBER_STAMP_DB_PASS';" || true
    sudo -u postgres psql -c "ALTER ROLE $DB_USER SET client_encoding TO 'utf8';"
    sudo -u postgres psql -c "ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';"
    sudo -u postgres psql -c "ALTER ROLE $DB_USER SET timezone TO 'UTC';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

# 6. REDIS
echo "🚀 Installing Redis..."
apt-get install -y redis-server

# 7. CERTBOT (SSL)
echo "🔒 Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# 8. DIRECTORY SETUP
echo "📂 Setting up directories..."
mkdir -p /var/www/techplay
chown -R $USER:www-data /var/www/techplay
chmod -R 775 /var/www/techplay

echo "✅ Provisioning Complete!"
echo "-----------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Clone your repository into /var/www/techplay"
echo "2. Copy env files (.env.production)"
echo "3. Run 'sh deployment/deploy.sh'"
