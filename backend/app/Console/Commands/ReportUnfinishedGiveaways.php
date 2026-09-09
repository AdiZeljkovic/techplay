<?php

namespace App\Console\Commands;

use App\Filament\Resources\GiveawayResource;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * A giveaway that ended and was never drawn, said out loud, every day.
 *
 * The badge in the admin menu was meant to be enough. It was not: the World of
 * Tanks draw closed on 15 February 2026 with 18 people entered, and was still
 * undrawn 207 days later. The badge was empty that whole time because of a bug
 * in its own query — but even working, a number in a menu is only seen by
 * somebody already looking at the menu.
 *
 * So this says it in the place messages arrive, and says it again tomorrow. It
 * is deliberately not a one-off notice: the failure was not missing a message,
 * it was nobody minding for seven months. A reminder that repeats is the only
 * kind that survives that.
 *
 * It does not draw the winner. Handing somebody a prize is a person's act —
 * there is a code to send, an entry list worth glancing at first, and a draw
 * that cannot be taken back. What this removes is the forgetting, not the
 * deciding.
 */
class ReportUnfinishedGiveaways extends Command
{
    protected $signature = 'giveaways:unfinished';

    protected $description = 'Report giveaways that have ended without a draw';

    public function handle(): int
    {
        $waiting = GiveawayResource::unfinishedDraws()
            ->withCount('entries')
            ->orderBy('ends_at')
            ->get();

        if ($waiting->isEmpty()) {
            $this->info('Nothing waiting to be drawn.');

            return self::SUCCESS;
        }

        $lines = $waiting->map(function ($giveaway) {
            $days = (int) now()->diffInDays($giveaway->ends_at, absolute: true);

            return sprintf(
                '· %s — ended %d day%s ago, %d entries',
                $giveaway->title,
                $days,
                $days === 1 ? '' : 's',
                $giveaway->entries_count,
            );
        });

        foreach ($lines as $line) {
            $this->warn($line);
        }

        /*
         * Sent as an error so it reaches Telegram: that channel's level is
         * `error`, which is the whole reason anything gets through it. The
         * channel also de-duplicates for ten minutes, which is right — this
         * runs once a day and should repeat daily, not be silenced.
         */
        Log::channel('telegram')->error(
            "🎁 A giveaway has ended and nobody has drawn it.\n\n"
            .$lines->implode("\n")
            ."\n\nDraw it in the admin: Giveaways → Pick winner."
        );

        return self::SUCCESS;
    }
}
