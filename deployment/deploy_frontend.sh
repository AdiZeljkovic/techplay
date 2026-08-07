#!/usr/bin/env bash
# TechPlay frontend deploy — the chunk-survival edition.
#
# Every `next build` mints new hashed chunk names and deletes the old ones,
# while browsers and CDNs keep serving HTML that still asks for yesterday's
# hashes — the ChunkLoadError / text-plain-CSS breakage after every deploy.
# The fix: archive each build's static chunks and merge the archive back
# into the fresh build. Hashed names never collide, so old and new coexist,
# and any stale HTML in the wild still finds its files.
#
# Usage (on the server): bash /var/www/techplay/deployment/deploy_frontend.sh
set -euo pipefail

FRONT=/var/www/techplay/frontend
ARCHIVE="$FRONT/.static-archive"

cd "$FRONT"

# 1. Preserve the current build's chunks before they are clobbered.
if [ -d .next/static ]; then
    mkdir -p "$ARCHIVE"
    cp -r .next/static/. "$ARCHIVE/" 2>/dev/null || true
fi

# 2. Fresh build.
npm run build

# 3. Resurrect prior chunks alongside the new ones (-n: never overwrite new).
if [ -d "$ARCHIVE" ]; then
    cp -rn "$ARCHIVE/." .next/static/ 2>/dev/null || true
fi

# 4. Old chunks earn retirement after a week — nobody's tab lives longer.
find "$ARCHIVE" -type f -mtime +7 -delete 2>/dev/null || true
find "$ARCHIVE" -type d -empty -delete 2>/dev/null || true

# 5. Serve it.
pm2 restart techplay-frontend

echo "Deploy gotov — stari chunkovi prezivljavaju 7 dana, ChunkLoadError vise nema."
