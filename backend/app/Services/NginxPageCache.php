<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Drops one page out of the nginx cache that sits in front of Next.
 *
 * `/games/*` is served through `proxy_cache` for an hour (see
 * `deployment/nginx-games-cache.conf`), and the revalidation endpoint could not
 * reach it: it purges Next's own cache and Cloudflare's, and the copy in the
 * middle went on answering until the hour was up. An admin editing a game saw
 * their change everywhere except on the page itself.
 *
 * Open-source nginx has no purge command — `proxy_cache_purge` is a commercial
 * feature — but the on-disk layout is documented and deterministic, so deleting
 * the file is the purge. The path is
 *
 *     <root>/<last char of md5>/<two chars before that>/<md5>
 *
 * from `levels=1:2`, where the md5 is of `proxy_cache_key`, which this site
 * sets to `"$scheme$host$request_uri"`.
 *
 * Verified against a live entry before this shipped: a page requested twice
 * returned `X-Cache-Status: HIT`, and the path computed here was the file
 * holding it.
 *
 * This runs as `www-data`, which owns the cache directory. It is deliberately
 * quiet about a missing file — a page that was never cached has nothing to
 * purge, and that is the common case, not a fault.
 */
class NginxPageCache
{
    public function forgetGame(string $slug): void
    {
        $this->forgetPath("/games/{$slug}");
    }

    public function forgetPath(string $path): void
    {
        $root = rtrim((string) config('services.nginx_cache.path'), '/');

        if ($root === '' || ! is_dir($root)) {
            return;
        }

        $host = parse_url((string) config('app.site_url'), PHP_URL_HOST);

        if (! $host) {
            return;
        }

        // Matches proxy_cache_key "$scheme$host$request_uri" exactly. The site
        // is https-only; port 80 redirects before anything is cached.
        $md5 = md5("https{$host}{$path}");
        $file = $root.'/'.substr($md5, -1).'/'.substr($md5, -3, 2).'/'.$md5;

        if (! is_file($file)) {
            return;
        }

        try {
            if (! @unlink($file)) {
                Log::warning('nginx page cache: could not remove entry', ['path' => $path, 'file' => $file]);
            }
        } catch (\Throwable $e) {
            Log::warning('nginx page cache: purge failed', ['path' => $path, 'error' => $e->getMessage()]);
        }
    }
}
