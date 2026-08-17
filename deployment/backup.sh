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
# Off-site, two ways, either of which is enough:
#
#   TECHPLAY_BACKUP_SSH     rsync over SSH — what a Hetzner Storage Box wants,
#                           e.g. storagebox:techplay (a Host in ~/.ssh/config,
#                           so the port and key live there rather than here)
#   TECHPLAY_BACKUP_REMOTE  an rclone target, e.g. b2:techplay-backups
#
# With neither, the script still runs and says loudly that the copy never left
# the machine.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/techplay}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/techplay}"
REMOTE="${TECHPLAY_BACKUP_REMOTE:-}"      # e.g. b2:techplay-backups
SSH_REMOTE="${TECHPLAY_BACKUP_SSH:-}"     # e.g. storagebox:techplay
KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-4}"
KEEP_REMOTE="${KEEP_REMOTE:-14}"          # how many nights to keep off-site

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
#
# This is the half that matters. Everything above survives a mistake; only this
# survives the disk.
shipped=0

if [ -n "$SSH_REMOTE" ]; then
    host="${SSH_REMOTE%%:*}"
    path="${SSH_REMOTE#*:}"
    # -e ssh with no options: the Host entry in ~/.ssh/config carries the port,
    # the key and the user, so none of it is duplicated here.
    if ssh "$host" "mkdir -p ${path}/${STAMP}" 2>/dev/null \
       && rsync -a --partial "${DEST}/" "${host}:${path}/${STAMP}/"; then
        echo "  copied to ${SSH_REMOTE}/${STAMP}"
        shipped=1

        # Retention on the far side, from the far side's own listing. A local
        # `find` cannot see what is over there, and an off-site copy that grows
        # without limit eventually stops being written at all.
        ssh "$host" "ls -1d ${path}/20* 2>/dev/null | sort | head -n -${KEEP_REMOTE} | xargs -r rm -rf" \
            2>/dev/null || echo "  (remote retention pass failed — harmless, but check the quota)"
    else
        echo "  !! rsync to ${SSH_REMOTE} FAILED" >&2
    fi
fi

if [ "$shipped" -eq 0 ] && [ -n "$REMOTE" ] && command -v rclone > /dev/null 2>&1; then
    rclone copy "$DEST" "${REMOTE}/${STAMP}" --transfers 4
    echo "  copied to ${REMOTE}/${STAMP}"
    shipped=1
fi

if [ "$shipped" -eq 0 ]; then
    echo "  !! NOT copied off this machine — set TECHPLAY_BACKUP_SSH (or _REMOTE)."
    echo "     A backup on the same disk survives a mistake, not a dead disk."
    exit 2
fi

# ── retention: keep the last N days, plus one per week ──
find "$BACKUP_DIR" -maxdepth 1 -type d -name '20*' -mtime "+${KEEP_DAILY}" \
    ! -name "*-0[17]_*" -exec rm -rf {} + 2>/dev/null || true
find "$BACKUP_DIR" -maxdepth 1 -type d -name '20*' -mtime "+$((KEEP_WEEKLY * 7))" \
    -exec rm -rf {} + 2>/dev/null || true

echo "[$(date -Is)] done"
