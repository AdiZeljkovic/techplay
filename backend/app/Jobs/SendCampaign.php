<?php

namespace App\Jobs;

use App\Models\MailCampaign;
use App\Models\MailCampaignRecipient;
use App\Models\User;
use App\Services\CampaignAudience;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Turn a written campaign into a list of people, and pace the sending.
 *
 * Resolving the audience here rather than when the campaign was written is the
 * whole reason the rule is stored instead of a list: somebody who unsubscribed
 * between the writing and the sending must not be written to, and that is the
 * one mistake in this system an apology does not fix.
 *
 * Pacing matters more than it looks. We send from our own mail server, which
 * arrives at Gmail with no reputation at all — a hundred messages in one second
 * from an unknown sender is the shape of a spam run, and being treated as one
 * costs far more than the minute the pause saves. The delay is put on the queue
 * rather than held in a sleep so the worker stays free for everything else the
 * site is doing.
 */
class SendCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    public int $tries = 1;

    public function __construct(public MailCampaign $campaign) {}

    public function handle(CampaignAudience $audience): void
    {
        /*
         * The status change is the lock.
         *
         * Two people pressing Send, or a queue retry landing on top of a run in
         * progress, both end here — and only one of them gets a true. Checking
         * the status in one statement and writing it in another is how a double
         * click becomes two newsletters in ninety inboxes.
         */
        if (! $this->campaign->claimForSending()) {
            Log::channel('connections')->info('Campaign send refused: already claimed', [
                'campaign' => $this->campaign->id,
            ]);

            return;
        }

        $people = $audience->resolve($this->campaign->audience ?? []);

        if ($people === []) {
            $this->campaign->forceFill([
                'status' => MailCampaign::SENT,
                'recipients_count' => 0,
                'finished_at' => now(),
            ])->save();

            return;
        }

        // Addresses that belong to an account, so the log can point at a person
        // rather than a string. One query, not one per recipient.
        $userIds = User::query()
            ->whereIn('email', array_keys($people))
            ->pluck('id', 'email')
            ->mapWithKeys(fn ($id, $email) => [mb_strtolower($email) => $id]);

        $batch = max(1, (int) $this->campaign->batch_size);
        $pause = max(0, (int) $this->campaign->pause_seconds);
        $index = 0;

        foreach ($people as $email => $source) {
            /*
             * firstOrCreate, not create.
             *
             * The unique index on (campaign_id, email) is what makes a restarted
             * send safe, and this is the half that reads it: a second run finds
             * the existing row instead of failing, and the message job below
             * skips anything already marked sent.
             */
            $recipient = MailCampaignRecipient::firstOrCreate(
                ['campaign_id' => $this->campaign->id, 'email' => $email],
                ['source' => $source, 'user_id' => $userIds[$email] ?? null],
            );

            if ($recipient->status === MailCampaignRecipient::SENT) {
                $index++;

                continue;
            }

            SendCampaignMessage::dispatch($recipient)
                ->delay(now()->addSeconds(intdiv($index, $batch) * $pause));

            $index++;
        }

        $this->campaign->forceFill(['recipients_count' => count($people)])->save();

        Log::channel('connections')->info('Campaign queued', [
            'campaign' => $this->campaign->id,
            'recipients' => count($people),
            'minutes' => round(intdiv(count($people), $batch) * $pause / 60, 1),
        ]);
    }

    public function failed(\Throwable $e): void
    {
        // Back to draft rather than stuck in `sending`, which nothing could
        // clear and which would block every later attempt.
        $this->campaign->forceFill(['status' => MailCampaign::DRAFT])->save();

        Log::channel('telegram')->error(
            "✉️ Campaign could not be queued: {$this->campaign->name}\n\n".$e->getMessage()
        );
    }
}
