#!/bin/bash
set -e

DB_NAME="techplay"
DB_USER="techplay"
DUMP_FILE="deployment/database_backup.sql"

echo "🐘 Importing Database from $DUMP_FILE..."

if [ ! -f "$DUMP_FILE" ]; then
    echo "❌ Dump file not found!"
    exit 1
fi

# Reset DB (Dangerous! Only for initial setup or authorized overwrite)
read -p "⚠️  This will OVERWRITE the production database. Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Abort."
    exit 1
fi

sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Import
sudo -u postgres psql -d $DB_NAME -f $DUMP_FILE

echo "✅ Import Complete!"
