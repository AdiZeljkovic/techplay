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
        // Find giveaways ending in ~24 hours (between 23-25 hours)
        $giveaways = Giveaway::where('status', 'active')
            ->where('is_public', true)
            ->whereBetween('ends_at', [
                now()->addHours(23),
                now()->addHours(25),
            ])
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

            Log::info("Sent {$recipientCount} reminder emails for giveaway: {$giveaway->title}");
        }
    }
}
