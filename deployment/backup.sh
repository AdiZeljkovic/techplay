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
# Nothing is kept locally once it has shipped. The local directory is a
# staging area, not an archive: each night is 1.3 GB, and eleven of them had
# quietly grown to 14 GB on a 75 GB disk before anybody looked. The archive
# lives on the Storage Box, which is what it is for.
#
# The one exception is a night that failed to ship. That copy stays, because
# it is then the only copy there is — and the next night that succeeds clears
# it, since the far side is by then holding something newer.
#
# Install (as root, once):
#   cp deployment/backup.sh /usr/local/bin/techplay-backup
#   chmod +x /usr/local/bin/techplay-backup
#   systemctl enable --now techplay-backup.timer
#
# systemd rather than cron, for one reason: Persistent=true. A cron entry that
# comes due while the machine is down is simply skipped, and the night it is
# skipped is the night that mattered. The timer catches up on boot.
#
# Settings live in /etc/techplay-backup.conf, which the unit reads as an
# EnvironmentFile.
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

# ── telling somebody ──
#
# Everything below used to print to stdout and rely on cron mailing it, on a
# box whose outbound mail does not work. A backup that fails quietly is worse
# than no backup: it is a backup you believe in.
#
# Telegram directly, not through Laravel. Laravel's telegram channel goes
# through a DeduplicationHandler that buffers until the process ends and is
# wrapped in a WhatFailureGroupHandler that swallows its own failures —
# measured on 28 Aug 2026, an error reached the log file and never reached
# Telegram. A job that guards the data cannot depend on a channel that goes
# quiet when it breaks.
TELEGRAM_TOKEN="${TELEGRAM_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

telegram() {
    [ -z "$TELEGRAM_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ] && return 0
    curl -sS --max-time 20 \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=$1" \
        "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" > /dev/null 2>&1 || true
    return 0
}

# Any exit that is not a clean one gets reported, including the `set -e` ones
# that would otherwise leave no trace at all.
on_exit() {
    code=$?
    [ "$code" -eq 0 ] && return 0
    telegram "🔴 TechPlay backup PAO (izlaz ${code}) — $(date -Is)

Zadnji korak: ${STEP:-nepoznat}
Provjeri: journalctl -u techplay-backup -n 50"
}
trap on_exit EXIT

STEP="start"

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
STEP="uploadi"
if [ -d "${APP_DIR}/backend/storage/app/public" ]; then
    tar -czf "${DEST}/uploads.tar.gz" -C "${APP_DIR}/backend/storage/app" public
fi

# The configuration, without which the machine cannot be rebuilt without
# guessing: the .env files, nginx, supervisor, the crontab. Kilobytes, and the
# difference between restoring a platform and reconstructing one.
STEP="konfiguracija"
crontab -l > "${DEST}/root-crontab.txt" 2>/dev/null || true
tar -czf "${DEST}/config.tar.gz" --ignore-failed-read -C / \
    var/www/techplay/backend/.env \
    var/www/techplay/frontend/.env \
    var/www/techplay/frontend/.env.local \
    var/www/techplay/discord/.env \
    etc/nginx/sites-available \
    etc/supervisor/conf.d \
    etc/ssh/sshd_config.d \
    2>/dev/null || echo "  config archive incomplete, continuing"
chmod 600 "${DEST}/config.tar.gz" 2>/dev/null || true

# A backup nobody can read is a rumour: prove the dump is well-formed.
STEP="provjera dumpa"
if ! pg_restore --list "${DEST}/db.dump" > /dev/null 2>&1; then
    echo "  !! dump failed its own integrity check" >&2
    exit 1
fi

# Well-formed is not the same as complete. A dump taken against an empty or
# half-migrated database passes the check above and restores cleanly over the
# real thing — which is the one way a backup makes an outage worse. The
# catalogue carries 121 tables with data; anything under 20 is not this
# platform.
TABLES="$(pg_restore --list "${DEST}/db.dump" 2>/dev/null | grep -c 'TABLE DATA' || true)"
if [ "${TABLES:-0}" -lt 20 ]; then
    echo "  !! dump holds only ${TABLES} tables with data — refusing to call this a backup" >&2
    exit 1
fi

DUMP_BYTES="$(stat -c%s "${DEST}/db.dump")"
if [ "$DUMP_BYTES" -lt 100000000 ]; then
    echo "  !! dump is $((DUMP_BYTES / 1048576)) MB, expected several hundred" >&2
    exit 1
fi
echo "  dump verified: ${TABLES} tables, $((DUMP_BYTES / 1048576)) MB"

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
    # This copy stays — it is the only one. But a Storage Box that has been
    # unreachable for a fortnight must not be the reason the disk fills and
    # the site stops: two nights is enough to restore from, and the third
    # night's failure is the one to act on, not to store.
    KEEP="$(ls -1d "${BACKUP_DIR}"/20*/ 2>/dev/null | wc -l)"
    if [ "$KEEP" -gt 2 ]; then
        ls -1d "${BACKUP_DIR}"/20*/ 2>/dev/null | sort | head -n -2 | xargs -r rm -rf
        echo "  kept the two most recent unshipped copies, dropped the rest"
    fi

    echo "  !! NOT copied off this machine — set TECHPLAY_BACKUP_SSH (or _REMOTE)."
    echo "     A backup on the same disk survives a mistake, not a dead disk."
    exit 2
fi

# ── the local copy goes ──
#
# It shipped, so the far side has it and this disk does not need to. That also
# clears anything left behind by earlier nights that failed to ship: the
# Storage Box now holds something newer than any of them, so they protect
# nothing and cost 1.3 GB each.
STEP="ciscenje lokalne kopije"
rm -rf "${BACKUP_DIR:?}"/20*/ 2>/dev/null || true
echo "  local staging cleared — the archive is on ${SSH_REMOTE:-${REMOTE}}"

STEP="gotovo"
echo "[$(date -Is)] done"

# Weekly, not nightly. A success message every morning is a message that gets
# learned into the background, and then the failure gets learned with it.
if [ "$(date +%u)" = "1" ]; then
    telegram "🟢 TechPlay backup — sedmica cista

${TABLES} tabela, $((DUMP_BYTES / 1048576)) MB
Poslano na: ${SSH_REMOTE:-${REMOTE:-nigdje}}"
fi
