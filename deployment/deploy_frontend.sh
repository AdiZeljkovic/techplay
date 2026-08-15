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

# 6. Ask the running server what it thinks it needs, then check it is there.
#
# The archive above protects HTML already in the wild. It does not protect
# against the server itself emitting a filename that is not on disk — which is
# exactly what happened to the forum thread page: every other route asked for
# chunks that returned 200, and that one route asked for a route-level
# stylesheet that returned 404, so the page rendered half-unstyled on every
# direct load. Nothing failed; the deploy said "gotov" and the page was broken.
#
# So the deploy now reads the pages back and follows every asset they name.
echo
echo "Provjera: prati sve sto stranice traze."

PROBE_BASE="${PROBE_BASE:-http://127.0.0.1:3000}"
PROBE_PATHS=(/ /latest /news /reviews /games /forum /calendar /leaderboard)

# One real thread and one real article — the routes with their own chunks, and
# the ones a synthetic list of paths would never cover.
thread=$(curl -fsS "$PROBE_BASE/forum" 2>/dev/null | grep -o '/forum/thread/[a-z0-9-]\{8,\}' | head -1 || true)
article=$(curl -fsS "$PROBE_BASE/news" 2>/dev/null | grep -o '/news/[a-z0-9-]\{12,\}' | head -1 || true)
[ -n "$thread" ] && PROBE_PATHS+=("$thread")
[ -n "$article" ] && PROBE_PATHS+=("$article")

missing=0
for path in "${PROBE_PATHS[@]}"; do
    html=$(curl -fsS "$PROBE_BASE$path" 2>/dev/null || true)
    [ -z "$html" ] && { echo "  !! $path se ne ucitava"; missing=$((missing + 1)); continue; }

    for asset in $(printf '%s' "$html" | grep -o '/_next/static/[a-zA-Z0-9._/-]*\.\(css\|js\)' | sort -u); do
        code=$(curl -s -o /dev/null -w '%{http_code}' "$PROBE_BASE$asset")
        if [ "$code" != "200" ]; then
            echo "  !! $path trazi $asset -> $code"
            missing=$((missing + 1))
        fi
    done
done

if [ "$missing" -gt 0 ]; then
    echo
    echo "NEUSPJEH: $missing resursa koje stranice traze ne postoji."
    echo "Stranice ce se crtati bez dijela stilova. Pokreni deploy ponovo;"
    echo "ako se ponovi, obrisi .next i .static-archive pa gradi iz cista."
    exit 1
fi

echo "  sve trazeno postoji."
echo
echo "Deploy gotov — stari chunkovi prezivljavaju 7 dana, ChunkLoadError vise nema."
