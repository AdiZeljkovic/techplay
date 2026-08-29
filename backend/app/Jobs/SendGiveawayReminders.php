<?php

namespace App\Jobs;

use App\Models\Giveaway;
use App\Notifications\GiveawayReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendGiveawayReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        /*
         * Anything closing within a day that has not been reminded yet.
         *
         * This asked for a two-hour slice — ending between 23 and 25 hours from
         * now — while running every six. A giveaway whose end fell in the other
         * four hours of a cycle matched no run at all, so two out of every
         * three were never announced as closing. The window is now the whole
         * day and `reminder_sent_at` is what keeps it to one message; a run
         * that is missed or late catches up instead of stepping over it.
         */
        $giveaways = Giveaway::where('status', 'active')
            ->where('is_public', true)
            ->whereNull('reminder_sent_at')
            ->where('ends_at', '>', now())
            ->where('ends_at', '<=', now()->addHours(24))
            ->with('entries.user')
            ->get();

        foreach ($giveaways as $giveaway) {
            $recipientCount = 0;

            foreach ($giveaway->entries as $entry) {
                if ($entry->user && $entry->user->email) {
                    // Check if user has email notifications enabled (optional)
                    if ($entry->user->email_notifications ?? true) {
                        $entry->user->notify(new GiveawayReminderNotification($giveaway));
                        $recipientCount++;
                    }
                }
            }

            // Stamped even when nobody was eligible: the giveaway has had its
            // reminder pass, and re-walking an empty entry list every six hours
            // until it closes tells nobody anything.
            $giveaway->forceFill(['reminder_sent_at' => now()])->saveQuietly();

            Log::info("Sent {$recipientCount} reminders for giveaway: {$giveaway->title}");
        }
    }
}
