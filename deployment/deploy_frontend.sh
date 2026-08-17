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
# Next keeps fetched data in .next/cache between builds, so a rebuild alone does
# not pick up anything edited in the admin panel — titles and descriptions kept
# serving their old values through two deploys on 17 Aug 2026 before anybody
# worked out why. The static chunk archive above is a different directory and is
# untouched by this.
rm -rf .next/cache/fetch-cache

npm run build

# 3. Resurrect prior chunks alongside the new ones (-n: never overwrite new).
if [ -d "$ARCHIVE" ]; then
    cp -rn "$ARCHIVE/." .next/static/ 2>/dev/null || true
fi

# 3a. Make every one of them readable by whoever serves them.
#
# Precaution, not a diagnosis. A restored chunk arrives owned by whoever ran
# this script, and if that is not the user pm2 runs as, the file cannot be
# opened by the process that has to serve it. That was offered once as the
# explanation for chunks answering 500 and it was wrong — `ls` showed the files
# simply absent. The line stays because it costs nothing and closes a real hole;
# it is not evidence of anything.
#
# The directory's own owner is the reference, so this needs no configuration.
OWNER=$(stat -c '%U:%G' "$FRONT" 2>/dev/null || echo "")
if [ -n "$OWNER" ]; then
    chown -R "$OWNER" .next/static 2>/dev/null || true
fi
chmod -R u+rwX,go+rX .next/static 2>/dev/null || true

# 4. Old chunks earn retirement after a week — nobody's tab lives longer.
find "$ARCHIVE" -type f -mtime +7 -delete 2>/dev/null || true
find "$ARCHIVE" -type d -empty -delete 2>/dev/null || true

# 5. Serve it.
pm2 restart techplay-frontend

PROBE_BASE="${PROBE_BASE:-http://127.0.0.1:3000}"

# 5a. Wait for it to actually be listening.
#
# The check below used to run the instant pm2 returned, which is several
# seconds before Next accepts a connection — so it reported every page as
# unreachable and failed a deploy that had in fact worked. A failing check that
# cries wolf is worse than no check: the next real failure gets ignored.
echo -n "Cekam da se digne"
ready=0
for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null --max-time 3 "$PROBE_BASE/" 2>/dev/null; then
        ready=1
        break
    fi
    echo -n "."
    sleep 1
done
echo

if [ "$ready" -ne 1 ]; then
    echo "NEUSPJEH: server se nije digao za 60s."
    echo "  pm2 logs techplay-frontend --lines 40 --nostream"
    exit 1
fi

# 5b. Drop the edge cache in front of the game pages.
#
# nginx holds /games/* for an hour (deployment/nginx-games-cache.conf). Without
# this, a deploy that changes how a game page renders reaches nobody until that
# hour is up — the archive above means the stale HTML still *works*, which is
# worse in its way: nothing breaks, so nothing tells you the new build is not
# being served.
#
# Deliberately after the readiness check. Emptying the cache while the server
# is still coming up would refill it with whatever a half-started Next answers.
CACHE=/var/cache/nginx/techplay
if [ -d "$CACHE" ]; then
    before=$(du -sh "$CACHE" 2>/dev/null | cut -f1)
    find "$CACHE" -type f -delete 2>/dev/null || true
    echo "Ispraznjen nginx kes za /games/ (bilo: ${before:-?})"
fi

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
        [ "$code" = "200" ] && continue

        missing=$((missing + 1))
        file="$FRONT/.next/${asset#/_next/}"

        # 404 and 500 are different faults and want different answers, so say
        # which one this is rather than leaving it to be guessed.
        if [ ! -f "$file" ]; then
            echo "  !! $path trazi $asset -> $code (fajla nema na disku)"
        elif [ ! -r "$file" ]; then
            echo "  !! $path trazi $asset -> $code (fajl postoji ali se ne moze citati: $(stat -c '%U:%G %a' "$file"))"
        else
            echo "  !! $path trazi $asset -> $code (fajl je citljiv — pogledaj pm2 logs techplay-frontend)"
        fi
    done
done

if [ "$missing" -gt 0 ]; then
    echo
    echo "NEUSPJEH: $missing resursa koje stranice traze se ne posluzuje."
    echo "Stranica ce pasti na ChunkLoadError. Redom:"
    echo "  1. cist build:  rm -rf $FRONT/.next && bash \$0"
    echo "  2. ako i dalje: pm2 logs techplay-frontend --lines 40 --nostream"
    echo
    echo "NE brisi $ARCHIVE osim ako ti drugo ne uspije — to je jedino sto"
    echo "cuva stare chunkove za ljude koji bas sada imaju otvorenu stranicu."
    exit 1
fi

echo "  sve trazeno postoji."
echo
echo "Deploy gotov — stari chunkovi prezivljavaju 7 dana, ChunkLoadError vise nema."
