<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrokenLink extends Model
{
    protected $fillable = [
        'article_id',
        'url',
        'status_code',
        'error_message',
        'last_checked_at',
        'is_fixed',
    ];

    protected $casts = [
        'is_fixed' => 'boolean',
        'last_checked_at' => 'datetime',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * What the status code actually tells you.
     *
     * Sixty-two rows sorted by nothing is a number, not a worklist. Measured on
     * 16 Aug 2026, those sixty-two were three different problems wearing the
     * same badge:
     *
     *   gone         404 and 410 — the page is not there. Somebody has to
     *                rewrite the sentence around the link.
     *   blocked      403, 405, 429, 451 — the site refused our checker, not a
     *                reader. x.com, reddit and samsung account for most of
     *                these and every one of those links works in a browser.
     *   unreachable  5xx and connection failures — a snapshot of a bad moment.
     *                Of the ten 5xx recorded that night, three were our own
     *                game pages during an Octane restart and all three answer
     *                200 today.
     *
     * Only the first group is work. The other two are reasons to check again.
     */
    public function classify(): string
    {
        return match (true) {
            in_array($this->status_code, [404, 410], true) => 'gone',
            in_array($this->status_code, [403, 405, 429, 451], true) => 'blocked',
            default => 'unreachable',
        };
    }

    /**
     * Our own link or somebody else's.
     *
     * The distinction decides who can fix it. A dead techplay.gg URL is a page
     * we deleted or renamed, and a redirect fixes every article at once. A dead
     * link to a news site is a sentence that has to be rewritten by hand.
     */
    public function isInternal(): bool
    {
        $host = parse_url($this->url, PHP_URL_HOST);

        return $host !== null && str_contains($host, 'techplay.gg');
    }

    public function scopeUnfixed($query)
    {
        return $query->where('is_fixed', false);
    }

    public function scopeGone($query)
    {
        return $query->whereIn('status_code', [404, 410]);
    }

    public function scopeBlocked($query)
    {
        return $query->whereIn('status_code', [403, 405, 429, 451]);
    }

    public function scopeInternal($query)
    {
        return $query->where('url', 'like', '%techplay.gg%');
    }

    public function scopeByStatus($query, int $code)
    {
        return $query->where('status_code', $code);
    }

    public function markAsFixed(): void
    {
        $this->update(['is_fixed' => true]);
    }
}
