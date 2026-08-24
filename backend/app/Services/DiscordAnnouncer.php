<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Tells the Discord bot the moment something is published.
 *
 * The bot polled four feeds every sixty seconds — 5,760 requests a day for an
 * event that happens a handful of times a day, and an article still took up to
 * a minute to appear. This site knows exactly when one goes out.
 *
 * Fire-and-forget by design: an unreachable bot must never fail a publish. If
 * this knock is missed the bot's poll picks the article up on its next pass,
 * which is what the poll is for now.
 */
class DiscordAnnouncer
{
    /**
     * Which section of the site an article belongs to, in the bot's words.
     *
     * The bot's feeds are named for the API endpoints they poll, and `tech`
     * is the one whose URL prefix differs from its name — the articles live
     * under /hardware. Mapping it here keeps that quirk in one place.
     */
    private const FEEDS = ['news', 'reviews', 'guides', 'tech'];

    public function published(Article $article, string $feed): void
    {
        if (! in_array($feed, self::FEEDS, true)) {
            return;
        }

        $url = config('services.discord.publish_url');
        $secret = config('services.discord.bot_secret');

        if (! $url || ! $secret) {
            return;
        }

        try {
            // Two seconds and no retry. The bot is on this machine; if it does
            // not answer in two seconds it is not running, and the poll will
            // carry the article instead.
            Http::withHeaders(['X-Discord-Bot-Token' => $secret])
                ->timeout(2)
                ->post($url, [
                    'type' => $feed,
                    'item' => [
                        'id' => $article->id,
                        'title' => $article->title,
                        'slug' => $article->slug,
                        'excerpt' => $article->excerpt,
                        'featured_image_url' => $article->featured_image_url ?? null,
                    ],
                ]);
        } catch (\Throwable $e) {
            Log::info('Discord announce skipped', ['article' => $article->id, 'error' => $e->getMessage()]);
        }
    }
}
