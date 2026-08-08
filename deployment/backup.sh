#!/usr/bin/env bash
# TechPlay — nightly backup.
#
# The platform had none. The only database script in this folder went the other
# way: server_import_db.sh DROPs the production database and restores a laptop
# dump over it. That made a disk failure the end of the platform rather than an
# outage.
#
# What this does: a compressed custom-format dump of Postgres, a copy of the
# Redis snapshot, and the uploaded files — then ships them off the machine,
# because a backup on the same disk as the thing it protects is not a backup.
#
# Install (as root, once):
#   cp deployment/backup.sh /usr/local/bin/techplay-backup
#   chmod +x /usr/local/bin/techplay-backup
#   crontab -e   →   15 3 * * * /usr/local/bin/techplay-backup >> /var/log/techplay-backup.log 2>&1
#
# Off-site: set REMOTE to an rclone target (S3, B2, a Storage Box). Without it
# the script still runs, but says loudly that the copy never left the machine.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/techplay}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/techplay}"
REMOTE="${TECHPLAY_BACKUP_REMOTE:-}"      # e.g. b2:techplay-backups
KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-4}"

STAMP="$(date +%Y-%m-%d_%H%M)"
DEST="${BACKUP_DIR}/${STAMP}"
mkdir -p "$DEST"

# Credentials come from the app's own .env — one source of truth.
ENV_FILE="${APP_DIR}/backend/.env"
[ -f "$ENV_FILE" ] || { echo "No .env at $ENV_FILE" >&2; exit 1; }

envget() { grep -E "^${1}=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'"; }

DB_NAME="$(envget DB_DATABASE)"
DB_USER="$(envget DB_USERNAME)"
DB_HOST="$(envget DB_HOST)"; DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="$(envget DB_PORT)"; DB_PORT="${DB_PORT:-5432}"
export PGPASSWORD="$(envget DB_PASSWORD)"

echo "[$(date -Is)] backing up ${DB_NAME}"

# -Fc: custom format, compressed, restorable table-by-table with pg_restore.
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -Fc "$DB_NAME" > "${DEST}/db.dump"

# Redis holds sessions and the queue. Worth having, not worth blocking on.
if [ -f /var/lib/redis/dump.rdb ]; then
    cp /var/lib/redis/dump.rdb "${DEST}/redis.rdb" || echo "  redis snapshot unreadable, continuing"
fi

# Uploads: avatars, covers, clan art. Not in git, not recoverable from anywhere.
if [ -d "${APP_DIR}/backend/storage/app/public" ]; then
    tar -czf "${DEST}/uploads.tar.gz" -C "${APP_DIR}/backend/storage/app" public
fi

# A backup nobody can read is a rumour: prove the dump is well-formed.
if ! pg_restore --list "${DEST}/db.dump" > /dev/null 2>&1; then
    echo "  !! dump failed its own integrity check" >&2
    exit 1
fi

SIZE="$(du -sh "$DEST" | cut -f1)"
echo "  ${SIZE} written to ${DEST}"

# ── off the machine ──
if [ -n "$REMOTE" ] && command -v rclone > /dev/null 2>&1; then
    rclone copy "$DEST" "${REMOTE}/${STAMP}" --transfers 4
    echo "  copied to ${REMOTE}/${STAMP}"
else
    echo "  !! NOT copied off this machine — set TECHPLAY_BACKUP_REMOTE and install rclone."
    echo "     A backup on the same disk survives a mistake, not a dead disk."
fi

# ── retention: keep the last N days, plus one per week ──
find "$BACKUP_DIR" -maxdepth 1 -type d -name '20*' -mtime "+${KEEP_DAILY}" \
    ! -name "*-0[17]_*" -exec rm -rf {} + 2>/dev/null || true
find "$BACKUP_DIR" -maxdepth 1 -type d -name '20*' -mtime "+$((KEEP_WEEKLY * 7))" \
    -exec rm -rf {} + 2>/dev/null || true

echo "[$(date -Is)] done"
