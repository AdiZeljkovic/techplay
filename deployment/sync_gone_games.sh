#!/bin/bash
#
# Install the nginx map of purged games and reload — but only when it changed.
#
# The application writes the map (it is the only thing that knows which games
# were purged) and runs as www-data; /etc/nginx belongs to root. This carries
# it across that line, which is the same split every other part of the deploy
# respects.
#
# `nginx -t` before every reload, without exception. A map this size is one
# unquoted character away from a config nginx refuses to start with, and a
# refused reload on a live origin is a site that is down rather than a page
# that is wrong.

set -euo pipefail

SRC=/var/www/techplay/backend/storage/app/nginx/techplay-gone-games.conf
DST=/etc/nginx/conf.d/techplay-gone-games.conf

if [ ! -f "$SRC" ]; then
  echo "  nema generisane mape ($SRC) — preskacem"
  exit 0
fi

if [ -f "$DST" ] && cmp -s "$SRC" "$DST"; then
  echo "  mapa obrisanih igara nepromijenjena ($(grep -c ' 1;' "$DST" || true) unosa)"
  exit 0
fi

# Keep the old one: if the new map is bad, nginx -t fails and we put it back
# rather than leaving the server unable to start on its next restart.
BACKUP=""
if [ -f "$DST" ]; then
  BACKUP=$(mktemp)
  cp "$DST" "$BACKUP"
fi

cp "$SRC" "$DST"

if ! nginx -t 2>/dev/null; then
  echo "  nginx odbio novu mapu — vracam staru"
  if [ -n "$BACKUP" ]; then
    cp "$BACKUP" "$DST"
  else
    rm -f "$DST"
  fi
  nginx -t
  exit 1
fi

systemctl reload nginx
echo "  mapa obrisanih igara instalirana: $(grep -c ' 1;' "$DST" || true) unosa, nginx reloadovan"

[ -n "$BACKUP" ] && rm -f "$BACKUP"
exit 0
